import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import getDb from "@/lib/db";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    avatar,
    offer,
    daily_budget,
    cpl_cap,
    scaling_rules,
    frequency_cap,
    creative_asset_ids,
    ad_account_id,
  } = body;

  if (!avatar || !offer || !daily_budget || !cpl_cap) {
    return NextResponse.json(
      { error: "Missing required fields: avatar, offer, daily_budget, cpl_cap" },
      { status: 400 }
    );
  }

  try {
    const sql = getDb();

    const [client] = await sql`
      INSERT INTO clients (clerk_user_id)
      VALUES (${userId})
      ON CONFLICT (clerk_user_id) DO UPDATE SET clerk_user_id = EXCLUDED.clerk_user_id
      RETURNING id
    `;

    const assetIds: string[] =
      typeof creative_asset_ids === "string"
        ? creative_asset_ids.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(creative_asset_ids)
        ? creative_asset_ids
        : [];

    const scalingRules =
      typeof scaling_rules === "string"
        ? (() => { try { return JSON.parse(scaling_rules); } catch { return {}; } })()
        : scaling_rules ?? {};

    const accountId: string | null =
      typeof ad_account_id === "string" && ad_account_id.trim()
        ? ad_account_id.trim()
        : null;

    const [brief] = await sql`
      INSERT INTO campaign_briefs (
        client_id,
        avatar,
        offer,
        daily_budget,
        cpl_cap,
        scaling_rules,
        frequency_cap,
        creative_asset_ids,
        ad_account_id
      ) VALUES (
        ${client.id},
        ${avatar},
        ${offer},
        ${daily_budget},
        ${cpl_cap},
        ${JSON.stringify(scalingRules)},
        ${frequency_cap ?? 3},
        ${sql.array(assetIds)},
        ${accountId}
      )
      RETURNING *
    `;

    return NextResponse.json({ ok: true, brief }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getDb();

    const briefs = await sql`
      SELECT cb.*
      FROM campaign_briefs cb
      JOIN clients c ON c.id = cb.client_id
      WHERE c.clerk_user_id = ${userId}
      ORDER BY cb.created_at DESC
    `;

    return NextResponse.json({ briefs });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
