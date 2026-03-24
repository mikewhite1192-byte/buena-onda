// GET/PATCH the logged-in user's WhatsApp number for agent alerts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await sql`SELECT whatsapp_number FROM user_subscriptions WHERE clerk_user_id = ${userId} LIMIT 1`;
  return NextResponse.json({ whatsapp_number: rows[0]?.whatsapp_number ?? null });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { whatsapp_number } = await req.json();

  // Normalize: strip non-digits, must be 10-15 digits
  const digits = (whatsapp_number ?? "").replace(/\D/g, "");
  if (whatsapp_number && (digits.length < 10 || digits.length > 15)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const normalized = whatsapp_number ? digits : null;

  await sql`
    UPDATE user_subscriptions
    SET whatsapp_number = ${normalized}, updated_at = NOW()
    WHERE clerk_user_id = ${userId}
  `;

  return NextResponse.json({ ok: true, whatsapp_number: normalized });
}
