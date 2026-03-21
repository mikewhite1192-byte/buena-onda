// app/api/clients/[id]/rules/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS client_rules (
      id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id    text        NOT NULL,
      client_id   text        NOT NULL,
      rule_text   text        NOT NULL,
      category    text        NOT NULL DEFAULT 'general',
      is_active   boolean     NOT NULL DEFAULT true,
      source      text        NOT NULL DEFAULT 'chat',
      created_at  timestamptz NOT NULL DEFAULT now()
    )
  `;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureTable();
    const rows = await sql`
      SELECT * FROM client_rules
      WHERE owner_id = ${userId} AND client_id = ${params.id} AND is_active = true
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ rules: rows });
  } catch {
    return NextResponse.json({ rules: [] });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rule_text, category = "general", source = "manual" } = await req.json();
  if (!rule_text?.trim()) return NextResponse.json({ error: "rule_text required" }, { status: 400 });

  try {
    await ensureTable();
    const [row] = await sql`
      INSERT INTO client_rules (owner_id, client_id, rule_text, category, source)
      VALUES (${userId}, ${params.id}, ${rule_text.trim()}, ${category}, ${source})
      RETURNING *
    `;
    return NextResponse.json({ rule: row }, { status: 201 });
  } catch (err) {
    console.error("POST /api/clients/[id]/rules error:", err);
    return NextResponse.json({ error: "Failed to save rule" }, { status: 500 });
  }
}
