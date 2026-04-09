// POST /api/stripe/cancel — cancel the authenticated user's subscription at period end
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
const sql = neon(process.env.DATABASE_URL!);

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subs = await sql`
    SELECT stripe_subscription_id, status FROM user_subscriptions
    WHERE clerk_user_id = ${userId} AND status IN ('active', 'trialing')
    LIMIT 1
  `;

  if (subs.length === 0) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
  }

  const subId = subs[0].stripe_subscription_id;

  // Cancel at end of billing period so user keeps access until they've paid through
  const result = await stripe.subscriptions.update(subId, {
    cancel_at_period_end: true,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub = (result as any).data ?? result;

  await sql`
    UPDATE user_subscriptions
    SET status = 'canceling', updated_at = NOW()
    WHERE clerk_user_id = ${userId}
  `;

  return NextResponse.json({
    ok: true,
    cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
    current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
  });
}
