// app/api/cron/affiliate-payouts/route.ts
// Runs monthly (1st of month). For each affiliate, sums unpaid referral_commissions
// (one row per Stripe invoice that actually got paid), creates a payout record,
// and transfers funds via Stripe Connect.
//
// Commissions are recorded in real time by the Stripe webhook on invoice.paid —
// 50% on the referral's first paid invoice, 40% on every subsequent one — using
// the actual amount Stripe captured. That means cancellations, prorations, and
// failed payments never produce phantom payouts.
//
// Only transfers to affiliates who have completed Stripe Connect onboarding.
// Pending payouts are created for un-onboarded affiliates so the dashboard reflects them.

import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import Stripe from "stripe";

const sql = neon(process.env.DATABASE_URL!);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });

interface CommissionRow {
  id: string;
  commission_amount: string;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 1);   // 1st of current month (exclusive)
  const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth() - 1, 1); // 1st of previous month

  const affiliates = await sql`
    SELECT id, affiliate_code, name, email, stripe_account_id, stripe_onboarded
    FROM affiliate_applications
    WHERE status = 'active'
  `;

  const results: { code: string; amount: number; action: string }[] = [];

  for (const aff of affiliates) {
    const code = aff.affiliate_code;

    // Idempotency — skip if a payout already exists for this period.
    const existingPayout = await sql`
      SELECT id FROM affiliate_payouts
      WHERE affiliate_code = ${code}
        AND period_start = ${periodStart.toISOString().split("T")[0]}
        AND period_end = ${periodEnd.toISOString().split("T")[0]}
      LIMIT 1
    `;
    if (existingPayout.length > 0) {
      results.push({ code, amount: 0, action: "already_exists" });
      continue;
    }

    // Pull unpaid commissions whose underlying invoice was paid before the period close.
    // (Late-arriving invoices from prior periods are picked up here too — they were never paid out.)
    const commissions = (await sql`
      SELECT id, commission_amount
      FROM referral_commissions
      WHERE affiliate_code = ${code}
        AND paid_to_affiliate = FALSE
        AND invoice_paid_at < ${periodEnd.toISOString()}
    `) as CommissionRow[];

    if (commissions.length === 0) {
      results.push({ code, amount: 0, action: "no_unpaid_commissions" });
      continue;
    }

    const total = commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0);
    const totalRounded = Math.round(total * 100) / 100;

    if (totalRounded <= 0) {
      results.push({ code, amount: 0, action: "zero_commission" });
      continue;
    }

    const payoutRows = await sql`
      INSERT INTO affiliate_payouts (affiliate_code, amount, period_start, period_end, status)
      VALUES (
        ${code}, ${totalRounded},
        ${periodStart.toISOString().split("T")[0]},
        ${periodEnd.toISOString().split("T")[0]},
        'pending'
      )
      RETURNING id
    `;
    const payoutId = payoutRows[0].id;

    // Link commissions to the payout up-front so the books are consistent
    // even if the transfer fails — the rows are still "owed".
    const commissionIds = commissions.map((c) => c.id);
    await sql`
      UPDATE referral_commissions SET payout_id = ${payoutId}
      WHERE id = ANY(${commissionIds}::uuid[])
    `;

    if (aff.stripe_onboarded && aff.stripe_account_id) {
      try {
        const transfer = await stripe.transfers.create({
          amount: Math.round(totalRounded * 100), // cents
          currency: "usd",
          destination: aff.stripe_account_id,
          description: `BuenaOnda affiliate commission ${periodStart.toISOString().split("T")[0]} to ${periodEnd.toISOString().split("T")[0]}`,
        });

        await sql`
          UPDATE affiliate_payouts
          SET status = 'paid', stripe_transfer_id = ${transfer.id}, paid_at = NOW()
          WHERE id = ${payoutId}
        `;
        await sql`
          UPDATE referral_commissions
          SET paid_to_affiliate = TRUE
          WHERE id = ANY(${commissionIds}::uuid[])
        `;

        results.push({ code, amount: totalRounded, action: "paid" });
      } catch (err) {
        console.error(`[affiliate-payouts] Transfer failed for ${code}:`, err);
        results.push({ code, amount: totalRounded, action: "transfer_failed" });
      }
    } else {
      results.push({ code, amount: totalRounded, action: "pending_no_stripe" });
    }
  }

  return NextResponse.json({ ok: true, period: { start: periodStart, end: periodEnd }, results });
}
