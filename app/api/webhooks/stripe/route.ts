// app/api/webhooks/stripe/route.ts
// Handles Stripe subscription lifecycle — gates dashboard access
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";
import { clerkClient } from "@clerk/nextjs/server";
import { markWebhookProcessed } from "@/lib/webhook-idempotency";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  // Idempotency: skip if already processed (Stripe retries on 5xx)
  const isNew = await markWebhookProcessed("stripe", event.id);
  if (!isNew) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    // Return 200 so Stripe doesn't retry — log the error and investigate
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const email = session.customer_details?.email ?? null;
  let clerkUserId = session.metadata?.clerk_user_id ?? null;

  // Retrieve subscription for status and plan details
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const status = sub.status; // 'trialing' | 'active'
  const planName = sub.items.data[0]?.price?.nickname ?? sub.items.data[0]?.price?.id ?? "unknown";
  

  // Find Clerk user by ID (passed in metadata) or fall back to email lookup
  if (!clerkUserId && email) {
    const clerk = await clerkClient();
    const result = await clerk.users.getUserList({ emailAddress: [email] });
    clerkUserId = result.data[0]?.id ?? null;
  }

  if (!clerkUserId) {
    console.error("Stripe webhook: could not find Clerk user for session", session.id);
    return;
  }

  // Upsert subscription record
  await sql`
    INSERT INTO user_subscriptions (clerk_user_id, stripe_customer_id, stripe_subscription_id, status, plan_name, current_period_end)
    VALUES (${clerkUserId}, ${customerId}, ${subscriptionId}, ${status}, ${planName}, null)
    ON CONFLICT (clerk_user_id) DO UPDATE SET
      stripe_customer_id     = EXCLUDED.stripe_customer_id,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      status                 = EXCLUDED.status,
      plan_name              = EXCLUDED.plan_name,
      current_period_end     = EXCLUDED.current_period_end,
      updated_at             = NOW()
  `;

  // Update Clerk publicMetadata so middleware can gate without a DB call
  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { subscription_status: status },
  });

  // Wire subscription to affiliate record if they came through a referral
  if (email) {
    await sql`
      UPDATE affiliate_applications
      SET stripe_customer_id = ${customerId}, stripe_subscription_id = ${subscriptionId}
      WHERE email = ${email}
    `;
  }

  // ── Activate referral if this user was referred by an affiliate ──
  // Look up the referral by referred_user_id (set during Clerk user.created webhook)
  const planAmount = getPlanAmount(planName);
  const referralRows = await sql`
    UPDATE referrals
    SET status = 'active', plan = ${planName}, plan_amount = ${planAmount}
    WHERE referred_user_id = ${clerkUserId} AND status = 'signed_up'
    RETURNING affiliate_code
  `;

  if (referralRows.length > 0) {
    console.log(`[stripe webhook] Activated referral for affiliate: ${referralRows[0].affiliate_code}`);
  }
}

function getPlanAmount(planName: string): number {
  const lower = (planName || "").toLowerCase();
  if (lower.includes("starter")) return 97;
  if (lower.includes("agency")) return 1499;
  // Default to growth/pro
  return 179;
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;
  const status = sub.status;
  

  const rows = await sql`
    UPDATE user_subscriptions
    SET status = ${status}, current_period_end = null, updated_at = NOW()
    WHERE stripe_customer_id = ${customerId}
    RETURNING clerk_user_id
  `;

  if (rows.length === 0) return;
  const clerkUserId = rows[0].clerk_user_id;

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { subscription_status: status },
  });
}

// Fires whenever Stripe successfully bills the customer (first non-trial month, recurring renewals).
// Records a commission row for the referring affiliate based on the actual amount captured.
// 50% rate on the referral's first paid invoice; 40% on every subsequent paid invoice.
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const amountPaidCents = invoice.amount_paid ?? 0;
  if (amountPaidCents <= 0) return; // skip $0 invoices (trial-end, fully discounted, etc.)

  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  // Map Stripe customer → Clerk user → referral row.
  const referralRows = await sql`
    SELECT r.id, r.affiliate_code
    FROM referrals r
    JOIN user_subscriptions us ON us.clerk_user_id = r.referred_user_id
    WHERE us.stripe_customer_id = ${customerId}
      AND r.status = 'active'
    LIMIT 1
  `;
  if (referralRows.length === 0) return; // not a referred customer

  const { id: referralId, affiliate_code } = referralRows[0];

  // First paid invoice for this referral gets the 50% rate; everything after gets 40%.
  const priorRows = await sql`
    SELECT 1 FROM referral_commissions WHERE referral_id = ${referralId} LIMIT 1
  `;
  const isFirstPaidInvoice = priorRows.length === 0;
  const rate = isFirstPaidInvoice ? 0.5 : 0.4;

  const invoiceAmount = amountPaidCents / 100;
  const commissionAmount = Math.round(invoiceAmount * rate * 100) / 100;
  const paidAt = invoice.status_transitions?.paid_at
    ? new Date(invoice.status_transitions.paid_at * 1000)
    : new Date();

  // UNIQUE(stripe_invoice_id) makes this idempotent against Stripe retries.
  await sql`
    INSERT INTO referral_commissions (
      referral_id, affiliate_code, stripe_invoice_id,
      invoice_amount, commission_rate, commission_amount, invoice_paid_at
    )
    VALUES (
      ${referralId}, ${affiliate_code}, ${invoice.id},
      ${invoiceAmount}, ${rate}, ${commissionAmount}, ${paidAt.toISOString()}
    )
    ON CONFLICT (stripe_invoice_id) DO NOTHING
  `;
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;

  const rows = await sql`
    UPDATE user_subscriptions
    SET status = 'cancelled', updated_at = NOW()
    WHERE stripe_customer_id = ${customerId}
    RETURNING clerk_user_id
  `;

  if (rows.length === 0) return;
  const clerkUserId = rows[0].clerk_user_id;

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { subscription_status: "cancelled" },
  });

  // Deactivate the referral so affiliate dashboard reflects churn
  await sql`
    UPDATE referrals SET status = 'churned'
    WHERE referred_user_id = ${clerkUserId} AND status = 'active'
  `;
}
