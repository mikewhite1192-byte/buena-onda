// GET /api/clients/[id]/creatives — list creatives for a client
// POST /api/clients/[id]/creatives — add creative
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureTable(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS creatives (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'image',
      status TEXT NOT NULL DEFAULT 'testing',
      hook TEXT,
      spend NUMERIC(12,2),
      cpl NUMERIC(12,2),
      roas NUMERIC(8,4),
      ctr NUMERIC(8,6),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL!);
  await ensureTable(sql);

  const rows = await sql`
    SELECT * FROM creatives
    WHERE client_id = ${params.id} AND user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ creatives: rows });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL!);
  await ensureTable(sql);

  // Verify client belongs to this user
  const client = await sql`SELECT id FROM clients WHERE id = ${params.id} AND owner_id = ${userId} LIMIT 1`;
  if (client.length === 0) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const body = await req.json();
  const { name, format, status, hook, spend, cpl, roas, ctr, notes } = body;

  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const rows = await sql`
    INSERT INTO creatives (client_id, user_id, name, format, status, hook, spend, cpl, roas, ctr, notes)
    VALUES (
      ${params.id}, ${userId}, ${name},
      ${format ?? "image"}, ${status ?? "testing"},
      ${hook ?? null}, ${spend ?? null}, ${cpl ?? null}, ${roas ?? null}, ${ctr ?? null},
      ${notes ?? null}
    )
    RETURNING *
  `;

  return NextResponse.json({ creative: rows[0] });
}
