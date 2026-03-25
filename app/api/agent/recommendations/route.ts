import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = new URL(req.url).searchParams.get("status") ?? "all";

  const rows = await sql`
    SELECT
      aa.id,
      aa.action_type,
      aa.details,
      aa.status,
      aa.created_at,
      cb.id AS brief_id,
      cb.daily_budget,
      cb.offer,
      c.name AS client_name,
      c.id AS client_id
    FROM agent_actions aa
    JOIN campaign_briefs cb ON cb.id = aa.campaign_brief_id
    JOIN clients c ON c.id = cb.client_id
    WHERE c.owner_id = ${userId}
      AND aa.triggered_by = 'agent'
      ${status !== "all" ? sql`AND aa.status = ${status}` : sql``}
    ORDER BY aa.created_at DESC
    LIMIT 100
  `;

  return NextResponse.json({ recommendations: rows });
}
