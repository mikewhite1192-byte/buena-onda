// POST /api/stripe/portal — create Stripe customer portal session
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});
const sql = neon(process.env.DATABASE_URL!);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://buenaonda.ai";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Stripe customer ID from subscription record
    const rows = await sql`
      SELECT stripe_customer_id FROM user_subscriptions
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (rows.length === 0 || !rows[0].stripe_customer_id) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: rows[0].stripe_customer_id as string,
      return_url: `${BASE_URL}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe-portal] Error:", err);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
