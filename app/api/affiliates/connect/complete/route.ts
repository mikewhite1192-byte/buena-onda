// app/api/affiliates/connect/complete/route.ts
// Called after Stripe Connect onboarding — verifies and marks affiliate as onboarded
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import Stripe from "stripe";

const sql = neon(process.env.DATABASE_URL!);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const rows = await sql`
    SELECT stripe_account_id FROM affiliate_applications
    WHERE email = ${email} AND status = 'active'
    LIMIT 1
  `;

  if (rows.length === 0 || !rows[0].stripe_account_id) {
    return NextResponse.json({ error: "No Stripe account found" }, { status: 404 });
  }

  const { stripe_account_id } = rows[0];

  // Verify with Stripe that charges are enabled
  const account = await stripe.accounts.retrieve(stripe_account_id);
  const onboarded = account.charges_enabled && account.payouts_enabled;

  if (onboarded) {
    await sql`
      UPDATE affiliate_applications
      SET stripe_onboarded = TRUE
      WHERE email = ${email}
    `;
  }

  return NextResponse.json({ onboarded });
}
