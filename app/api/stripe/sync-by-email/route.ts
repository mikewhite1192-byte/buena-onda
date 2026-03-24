// Syncs the logged-in user's Stripe subscription by looking up their email.
// Used when checkout completed before account creation (no session_id available).
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
const sql = neon(process.env.DATABASE_URL!);

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return NextResponse.json({ error: "No email on account" }, { status: 400 });

  // Already synced?
  const existing = await sql`SELECT status FROM user_subscriptions WHERE clerk_user_id = ${userId} LIMIT 1`;
  if (existing.length > 0) {
    return NextResponse.json({ status: existing[0].status, synced: false, message: "Already linked" });
  }

  // Look up Stripe customer by email
  const customers = await stripe.customers.list({ email, limit: 1 });
  if (customers.data.length === 0) {
    return NextResponse.json({ error: "No Stripe customer found for this email" }, { status: 404 });
  }

  const customer = customers.data[0];
  const subscriptions = await stripe.subscriptions.list({ customer: customer.id, limit: 1, status: "all" });
  if (subscriptions.data.length === 0) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  const sub = subscriptions.data[0];
  const status = sub.status;
  const planName = sub.items.data[0]?.price?.nickname ?? sub.items.data[0]?.price?.id ?? "unknown";

  await sql`
    INSERT INTO user_subscriptions (clerk_user_id, stripe_customer_id, stripe_subscription_id, status, plan_name, current_period_end)
    VALUES (${userId}, ${customer.id}, ${sub.id}, ${status}, ${planName}, null)
    ON CONFLICT (clerk_user_id) DO UPDATE SET
      stripe_customer_id     = EXCLUDED.stripe_customer_id,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      status                 = EXCLUDED.status,
      plan_name              = EXCLUDED.plan_name,
      updated_at             = NOW()
  `;

  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { subscription_status: status },
  });

  return NextResponse.json({ status, synced: true });
}
