// app/api/review/campaigns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS pending_campaigns (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id text NOT NULL,
      client_id text NOT NULL,
      client_name text NOT NULL,
      campaign_name text NOT NULL,
      objective text NOT NULL DEFAULT 'OUTCOME_LEADS',
      daily_budget numeric NOT NULL DEFAULT 0,
      targeting_summary text NOT NULL DEFAULT '',
      ad_copy text NOT NULL DEFAULT '',
      creative_description text NOT NULL DEFAULT '',
      special_ad_category text,
      status text NOT NULL DEFAULT 'pending',
      notes text,
      meta_payload jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    await ensureTable();
    const rows = status && status !== "all"
      ? await sql`
          SELECT pc.*, c.name as client_name
          FROM pending_campaigns pc
          LEFT JOIN clients c ON c.id::text = pc.client_id AND c.owner_id = ${userId}
          WHERE pc.owner_id = ${userId} AND pc.status = ${status}
          ORDER BY pc.created_at DESC
        `
      : await sql`
          SELECT pc.*, c.name as client_name
          FROM pending_campaigns pc
          LEFT JOIN clients c ON c.id::text = pc.client_id AND c.owner_id = ${userId}
          WHERE pc.owner_id = ${userId}
          ORDER BY pc.created_at DESC
        `;
    return NextResponse.json({ campaigns: rows });
  } catch {
    return NextResponse.json({ campaigns: [] });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureTable();
    const body = await req.json();
    const {
      client_id,
      client_name,
      campaign_name,
      objective = "OUTCOME_LEADS",
      daily_budget = 0,
      targeting_summary = "",
      ad_copy = "",
      creative_description = "",
      special_ad_category = null,
      meta_payload = null,
    } = body;

    if (!client_id || !campaign_name) {
      return NextResponse.json({ error: "client_id and campaign_name required" }, { status: 400 });
    }

    // Resolve client_name if not provided
    let resolvedClientName = client_name;
    if (!resolvedClientName) {
      const [client] = await sql`SELECT name FROM clients WHERE id = ${client_id} AND owner_id = ${userId} LIMIT 1`;
      resolvedClientName = client?.name ?? "Unknown Client";
    }

    const [row] = await sql`
      INSERT INTO pending_campaigns
        (owner_id, client_id, client_name, campaign_name, objective, daily_budget, targeting_summary, ad_copy, creative_description, special_ad_category, meta_payload)
      VALUES
        (${userId}, ${client_id}, ${resolvedClientName}, ${campaign_name}, ${objective}, ${daily_budget}, ${targeting_summary}, ${ad_copy}, ${creative_description}, ${special_ad_category}, ${meta_payload ? JSON.stringify(meta_payload) : null})
      RETURNING *
    `;

    return NextResponse.json({ campaign: row }, { status: 201 });
  } catch (err) {
    console.error("POST /api/review/campaigns error:", err);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
