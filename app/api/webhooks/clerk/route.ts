// app/api/webhooks/clerk/route.ts
// Handles Clerk "user.created" webhook — records referral if bo_ref cookie was set
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

interface ClerkUserCreatedEvent {
  type: string;
  data: {
    id: string;
    email_addresses: { email_address: string }[];
    unsafe_metadata?: Record<string, unknown>;
    public_metadata?: Record<string, unknown>;
  };
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "No webhook secret" }, { status: 500 });
  }

  // Verify signature
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();

  let event: ClerkUserCreatedEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserCreatedEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "user.created") {
    return NextResponse.json({ ok: true });
  }

  const userId = event.data.id;
  const email = event.data.email_addresses?.[0]?.email_address ?? null;

  // Clerk passes unsafe_metadata through the signup flow — we'll store bo_ref there
  // via the JS SDK on sign-up, OR fall back to checking public_metadata
  const ref =
    (event.data.unsafe_metadata?.bo_ref as string) ??
    (event.data.public_metadata?.bo_ref as string) ??
    null;

  if (!ref) {
    return NextResponse.json({ ok: true, recorded: false });
  }

  // Validate the affiliate code exists and is active
  const affiliate = await sql`
    SELECT affiliate_code FROM affiliate_applications
    WHERE affiliate_code = ${ref} AND status = 'active'
    LIMIT 1
  `;

  if (affiliate.length === 0) {
    return NextResponse.json({ ok: true, recorded: false, reason: "unknown code" });
  }

  // Idempotent — don't double-insert
  const existing = await sql`
    SELECT id FROM referrals WHERE referred_user_id = ${userId} LIMIT 1
  `;
  if (existing.length > 0) {
    return NextResponse.json({ ok: true, recorded: false, reason: "already recorded" });
  }

  await sql`
    INSERT INTO referrals (affiliate_code, referred_email, referred_user_id, status)
    VALUES (${ref}, ${email}, ${userId}, 'signed_up')
  `;

  return NextResponse.json({ ok: true, recorded: true });
}
