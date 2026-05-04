// POST /api/reports — create a shareable report token
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

function randomToken() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    CREATE TABLE IF NOT EXISTS reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      client_id UUID,
      client_name TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      snapshot JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  const body = await req.json();
  const { client_id, client_name, start_date, end_date, snapshot } = body;

  if (!client_name || !start_date || !end_date || !snapshot) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify the caller owns this client before minting a public share token
  // — otherwise the public /reports/[token] endpoint becomes a way to leak
  // another tenant's metrics.
  if (client_id) {
    const owns = await sql`
      SELECT 1 FROM clients WHERE id = ${client_id} AND owner_id = ${userId} LIMIT 1
    `;
    if (owns.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
  }

  const token = randomToken();

  await sql`
    INSERT INTO reports (user_id, client_id, client_name, token, start_date, end_date, snapshot)
    VALUES (${userId}, ${client_id ?? null}, ${client_name}, ${token}, ${start_date}, ${end_date}, ${JSON.stringify(snapshot)})
  `;

  return NextResponse.json({ token });
}
