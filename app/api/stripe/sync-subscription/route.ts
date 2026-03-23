// app/api/stripe/sync-subscription/route.ts
// Called from the dashboard on ?checkout=success to sync subscription immediately
// in case the webhook hasn't fired yet (race condition)
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { session_id } = await req.json();
  if (!session_id) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  // Check if we already have this subscription in the DB (webhook may have fired already)
  const existing = await sql`SELECT status FROM user_subscriptions WHERE clerk_user_id = ${userId} LIMIT 1`;
  if (existing.length > 0) {
    return NextResponse.json({ status: existing[0].status, synced: false });
  }

  // Retrieve session from Stripe and sync manually
  const session = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ["subscription"],
  });

  if (session.mode !== "subscription" || !session.subscription) {
    return NextResponse.json({ error: "Not a subscription session" }, { status: 400 });
  }

  const sub = session.subscription as Stripe.Subscription;
  const customerId = session.customer as string;
  const status = sub.status;
  const planName = sub.items.data[0]?.price?.nickname ?? sub.items.data[0]?.price?.id ?? "unknown";
  

  await sql`
    INSERT INTO user_subscriptions (clerk_user_id, stripe_customer_id, stripe_subscription_id, status, plan_name, current_period_end)
    VALUES (${userId}, ${customerId}, ${sub.id}, ${status}, ${planName}, null)
    ON CONFLICT (clerk_user_id) DO UPDATE SET
      stripe_customer_id     = EXCLUDED.stripe_customer_id,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      status                 = EXCLUDED.status,
      plan_name              = EXCLUDED.plan_name,
      current_period_end     = EXCLUDED.current_period_end,
      updated_at             = NOW()
  `;

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { subscription_status: status },
  });

  return NextResponse.json({ status, synced: true });
}
