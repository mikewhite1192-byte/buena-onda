// app/api/webhooks/stripe/route.ts
// Handles Stripe subscription lifecycle, affiliate commissions, refunds,
// disputes, payment failures, and Stripe Connect account state.
//
// Idempotency: claim-then-commit. The processed_webhooks row is only
// inserted AFTER the handler succeeds, so a crash mid-handler results in
// a 500 → Stripe retries → the handler runs to completion next time.
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";
import { clerkClient } from "@clerk/nextjs/server";

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

  // Skip if we already finished processing this event.
  const completed = await sql`
    SELECT 1 FROM processed_webhooks
    WHERE provider = 'stripe' AND event_id = ${event.id}
    LIMIT 1
  `;
  if (completed.length > 0) {
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
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      case "charge.dispute.created":
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    // Return 500 so Stripe retries — the processed_webhooks row was never
    // inserted, so the next attempt will re-run from scratch.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  // Mark this event finished. ON CONFLICT covers the rare case where two
  // concurrent retries both finish before either could write the row.
  await sql`
    INSERT INTO processed_webhooks (provider, event_id)
    VALUES ('stripe', ${event.id})
    ON CONFLICT (provider, event_id) DO NOTHING
  `;

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
  const planAmount = (sub.items.data[0]?.price?.unit_amount ?? 0) / 100;

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
  // Use the actual Stripe price as the recorded plan_amount; the cron uses
  // real invoice amounts for commission math, but plan_amount drives
  // dashboard projections so it's worth getting right.
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

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;
  const status = sub.status;

  const rows = await sql`
    UPDATE user_subscriptions
    SET status = ${status}, updated_at = NOW()
    WHERE stripe_customer_id = ${customerId}
      AND status != 'cancelled'
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

// The webhook endpoint is configured at API version 2024-12-18.acacia, which
// still ships `invoice.subscription` and `charge.invoice` on the event JSON.
// The Stripe SDK types are aligned to a newer API version that dropped those
// fields, so we declare the legacy shape explicitly here.
type LegacyInvoiceFields = { subscription?: string | Stripe.Subscription };
type LegacyChargeFields = { invoice?: string | Stripe.Invoice | null };

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  // Modern shape first.
  const parent = invoice.parent;
  if (parent?.type === "subscription_details" && parent.subscription_details) {
    const sd = parent.subscription_details;
    return typeof sd.subscription === "string" ? sd.subscription : sd.subscription?.id ?? null;
  }
  // Legacy shape (still present on 2024-12-18.acacia events).
  const legacy = (invoice as Stripe.Invoice & LegacyInvoiceFields).subscription;
  if (!legacy) return null;
  return typeof legacy === "string" ? legacy : legacy.id;
}

function getChargeInvoiceId(charge: Stripe.Charge): string | null {
  const legacy = (charge as Stripe.Charge & LegacyChargeFields).invoice;
  if (!legacy) return null;
  return typeof legacy === "string" ? legacy : legacy.id;
}

// Customer's card got declined. Sync the subscription status so middleware
// can drop dashboard access and downstream UI can show a "fix payment" CTA.
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscriptionUpdated(sub);
}

// Stripe refunded a charge — reverse any commission tied to that invoice so
// the affiliate doesn't get paid for revenue we returned.
async function handleChargeRefunded(charge: Stripe.Charge) {
  const invoiceId = getChargeInvoiceId(charge);
  if (!invoiceId) return;

  await sql`
    UPDATE referral_commissions
    SET refunded_at = NOW()
    WHERE stripe_invoice_id = ${invoiceId} AND refunded_at IS NULL
  `;
}

// Customer disputed a charge (chargeback). Treat like a refund for commission
// purposes — funds are clawed back from us and the affiliate cut should follow.
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
  if (!chargeId) return;

  const charge = await stripe.charges.retrieve(chargeId);
  const invoiceId = getChargeInvoiceId(charge);
  if (!invoiceId) return;

  await sql`
    UPDATE referral_commissions
    SET refunded_at = NOW()
    WHERE stripe_invoice_id = ${invoiceId} AND refunded_at IS NULL
  `;
}

// Stripe Connect account status changed (compliance review, document expiry,
// etc.). Sync stripe_onboarded so the payout cron stops attempting transfers
// to a disabled account.
async function handleAccountUpdated(account: Stripe.Account) {
  const onboarded = !!(account.charges_enabled && account.payouts_enabled);

  await sql`
    UPDATE affiliate_applications
    SET stripe_onboarded = ${onboarded}
    WHERE stripe_account_id = ${account.id}
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
