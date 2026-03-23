// app/api/affiliates/connect/route.ts
// Initiates Stripe Connect Express onboarding for an affiliate
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import Stripe from "stripe";

const sql = neon(process.env.DATABASE_URL!);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const rows = await sql`
    SELECT id, name, affiliate_code, stripe_account_id, stripe_onboarded
    FROM affiliate_applications
    WHERE email = ${email} AND status = 'active'
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
  }

  const affiliate = rows[0];

  // If already fully onboarded, return success
  if (affiliate.stripe_onboarded) {
    return NextResponse.json({ already_connected: true });
  }

  // Create Stripe Express account if not yet created
  let stripeAccountId = affiliate.stripe_account_id;
  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email,
      capabilities: { transfers: { requested: true } },
      business_type: "individual",
    });
    stripeAccountId = account.id;

    await sql`
      UPDATE affiliate_applications
      SET stripe_account_id = ${stripeAccountId}
      WHERE email = ${email}
    `;
  }

  // Create account link for onboarding
  const origin = req.headers.get("origin") || "https://buenaonda.ai";
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${origin}/affiliates/dashboard?email=${encodeURIComponent(email)}&connect=retry`,
    return_url: `${origin}/affiliates/dashboard?email=${encodeURIComponent(email)}&connect=success`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
