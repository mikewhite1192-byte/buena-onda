// app/api/cron/affiliate-payouts/route.ts
// Runs monthly (1st of month) — calculates commissions for each affiliate,
// creates payout records, and transfers funds via Stripe Connect.
//
// Commission structure:
//   50% of plan_amount for referrals active < 30 days (month 1 bonus)
//   40% of plan_amount for all other active referrals (recurring)
//
// Only transfers to affiliates who have completed Stripe Connect onboarding.
// Pending payouts are created for all affiliates regardless.

import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import Stripe from "stripe";

const sql = neon(process.env.DATABASE_URL!);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of current month
  const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth() - 1, 1); // 1st of previous month
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get all active affiliates
  const affiliates = await sql`
    SELECT id, affiliate_code, name, email, stripe_account_id, stripe_onboarded
    FROM affiliate_applications
    WHERE status = 'active'
  `;

  const results: { code: string; amount: number; action: string }[] = [];

  for (const aff of affiliates) {
    const code = aff.affiliate_code;

    // Check if payout already exists for this period (idempotent)
    const existing = await sql`
      SELECT id FROM affiliate_payouts
      WHERE affiliate_code = ${code}
        AND period_start = ${periodStart.toISOString().split("T")[0]}
        AND period_end = ${periodEnd.toISOString().split("T")[0]}
      LIMIT 1
    `;
    if (existing.length > 0) {
      results.push({ code, amount: 0, action: "already_exists" });
      continue;
    }

    // Get active referrals for this affiliate
    const referrals = await sql`
      SELECT plan_amount, created_at, months_active
      FROM referrals
      WHERE affiliate_code = ${code} AND status = 'active'
    `;

    if (referrals.length === 0) {
      results.push({ code, amount: 0, action: "no_active_referrals" });
      continue;
    }

    // Calculate commission
    let totalCommission = 0;
    for (const ref of referrals) {
      const amount = Number(ref.plan_amount);
      const isMonth1 = new Date(ref.created_at) >= thirtyDaysAgo;
      const rate = isMonth1 ? 0.5 : 0.4;
      totalCommission += amount * rate;
    }

    // Round to 2 decimal places
    totalCommission = Math.round(totalCommission * 100) / 100;

    if (totalCommission <= 0) {
      results.push({ code, amount: 0, action: "zero_commission" });
      continue;
    }

    // Increment months_active for all active referrals
    await sql`
      UPDATE referrals
      SET months_active = months_active + 1
      WHERE affiliate_code = ${code} AND status = 'active'
    `;

    // Create payout record
    const payoutRows = await sql`
      INSERT INTO affiliate_payouts (affiliate_code, amount, period_start, period_end, status)
      VALUES (${code}, ${totalCommission}, ${periodStart.toISOString().split("T")[0]}, ${periodEnd.toISOString().split("T")[0]}, 'pending')
      RETURNING id
    `;
    const payoutId = payoutRows[0].id;

    // Transfer via Stripe Connect if onboarded
    if (aff.stripe_onboarded && aff.stripe_account_id) {
      try {
        const transfer = await stripe.transfers.create({
          amount: Math.round(totalCommission * 100), // cents
          currency: "usd",
          destination: aff.stripe_account_id,
          description: `BuenaOnda affiliate commission ${periodStart.toISOString().split("T")[0]} to ${periodEnd.toISOString().split("T")[0]}`,
        });

        await sql`
          UPDATE affiliate_payouts
          SET status = 'paid', stripe_transfer_id = ${transfer.id}, paid_at = NOW()
          WHERE id = ${payoutId}
        `;

        results.push({ code, amount: totalCommission, action: "paid" });
      } catch (err) {
        console.error(`[affiliate-payouts] Transfer failed for ${code}:`, err);
        results.push({ code, amount: totalCommission, action: "transfer_failed" });
      }
    } else {
      results.push({ code, amount: totalCommission, action: "pending_no_stripe" });
    }
  }

  return NextResponse.json({ ok: true, period: { start: periodStart, end: periodEnd }, results });
}
