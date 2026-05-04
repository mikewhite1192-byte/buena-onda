// app/api/affiliates/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const MILESTONES = [1, 3, 10, 25, 50, 100];

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const rows = await sql`
    SELECT id, name, affiliate_code, created_at, stripe_account_id, stripe_onboarded, is_free_account, total_clicks, milestones_reached
    FROM affiliate_applications
    WHERE email = ${email} AND status = 'active'
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const affiliate = rows[0];
  const { affiliate_code } = affiliate;

  // Get all referrals
  const referrals = await sql`
    SELECT id, referred_email, status, plan, plan_amount, months_active, created_at
    FROM referrals
    WHERE affiliate_code = ${affiliate_code}
    ORDER BY created_at DESC
  `;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter((r) => r.status === "active");

  // Monthly recurring: 40% of plan_amount for each active referral
  const monthlyRecurring = activeReferrals.reduce((sum: number, r) => {
    return sum + Number(r.plan_amount) * 0.4;
  }, 0);

  // Month 1 bonus: extra 10% for referrals that became active within 30 days
  const recentActive = activeReferrals.filter(
    (r) => new Date(r.created_at) >= thirtyDaysAgo
  );
  const month1Bonus = recentActive.reduce((sum: number, r) => {
    return sum + Number(r.plan_amount) * 0.1;
  }, 0);

  const monthlyTotal = monthlyRecurring + month1Bonus;

  // Lifetime earnings — sum all payouts + estimate for unpaid active
  const payouts = await sql`
    SELECT amount, status, period_start, period_end, paid_at, created_at
    FROM affiliate_payouts
    WHERE affiliate_code = ${affiliate_code}
    ORDER BY created_at DESC
  `;

  const lifetimePaid = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum: number, p) => sum + Number(p.amount), 0);

  // Pending payout = sum of unpaid commissions accrued so far.
  // This includes commissions not yet bundled into a payout row (between cron runs)
  // plus any commissions on a payout that hasn't successfully transferred.
  const pendingRows = await sql`
    SELECT COALESCE(SUM(commission_amount), 0) AS pending
    FROM referral_commissions
    WHERE affiliate_code = ${affiliate_code} AND paid_to_affiliate = FALSE
  `;
  const pendingPayout = Number(pendingRows[0]?.pending ?? 0);

  // Milestone progress
  const nextMilestone = MILESTONES.find((m) => m > totalReferrals) ?? null;
  const prevMilestone = [...MILESTONES].reverse().find((m) => m <= totalReferrals) ?? 0;

  return NextResponse.json({
    name: affiliate.name,
    affiliate_code,
    referral_link: `https://buenaonda.ai/?ref=${affiliate_code}`,
    member_since: affiliate.created_at,
    stripe_onboarded: affiliate.stripe_onboarded,
    stripe_account_id: affiliate.stripe_account_id,
    is_free_account: affiliate.is_free_account,
    total_clicks: affiliate.total_clicks,
    milestones_reached: affiliate.milestones_reached ?? [],

    stats: {
      total_referrals: totalReferrals,
      active_referrals: activeReferrals.length,
      monthly_total: monthlyTotal,
      monthly_recurring: monthlyRecurring,
      month1_bonus: month1Bonus,
      lifetime_paid: lifetimePaid,
      pending_payout: pendingPayout,
    },

    milestones: MILESTONES.map((m) => ({
      target: m,
      reached: totalReferrals >= m,
      current_is_next: m === nextMilestone,
    })),
    next_milestone: nextMilestone,
    prev_milestone: prevMilestone,

    referrals: referrals.slice(0, 50).map((r) => ({
      id: r.id,
      email: maskEmail(r.referred_email),
      status: r.status,
      plan: r.plan,
      plan_amount: r.plan_amount,
      joined: r.created_at,
    })),

    payouts: payouts.map((p) => ({
      amount: p.amount,
      status: p.status,
      period_start: p.period_start,
      period_end: p.period_end,
      paid_at: p.paid_at,
    })),
  });
}

function maskEmail(email: string | null): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, 2)}***@${domain}`;
}
