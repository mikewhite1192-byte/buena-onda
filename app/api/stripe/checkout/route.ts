import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://buenaonda.ai";

export async function POST(req: NextRequest) {
  try {
    const { priceId, planName } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    // Grab Clerk user ID if logged in — passed to webhook for fast user lookup
    const { userId } = await auth();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 14 },
      // {CHECKOUT_SESSION_ID} is replaced by Stripe with the real session ID
      success_url: `${BASE_URL}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(planName ?? "")}`,
      cancel_url: `${BASE_URL}/#pricing`,
      allow_promotion_codes: true,
      // Collect billing address + auto-calculate sales tax. Required for
      // SaaS sales-tax compliance in the ~20 US states that tax SaaS, and
      // to avoid the seller absorbing tax that should pass through.
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      billing_address_collection: "required",
      ...(userId && { metadata: { clerk_user_id: userId } }),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
