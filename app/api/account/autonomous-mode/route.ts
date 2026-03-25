import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await sql`SELECT autonomous_mode FROM user_subscriptions WHERE clerk_user_id = ${userId} LIMIT 1`;
  return NextResponse.json({ autonomous_mode: rows[0]?.autonomous_mode ?? false });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { autonomous_mode } = await req.json() as { autonomous_mode: boolean };

  await sql`
    INSERT INTO user_subscriptions (clerk_user_id, stripe_customer_id, stripe_subscription_id, status, autonomous_mode)
    VALUES (${userId}, '', '', 'active', ${autonomous_mode})
    ON CONFLICT (clerk_user_id) DO UPDATE SET autonomous_mode = ${autonomous_mode}, updated_at = NOW()
  `;

  return NextResponse.json({ ok: true, autonomous_mode });
}
