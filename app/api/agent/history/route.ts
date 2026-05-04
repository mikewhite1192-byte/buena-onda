// app/api/agent/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 50;
  const offset = (page - 1) * limit;
  const filter = searchParams.get("status"); // 'all' | 'executed' | 'approved' | 'rejected' | 'flag_review'
  const actionType = searchParams.get("action_type"); // 'scale' | 'pause' | 'creative_brief' | 'flag_review'

  // Tenant-scope through clients.owner_id; the previous LEFT JOIN exposed
  // every tenant's history to every signed-in user.
  const actions = await sql`
    SELECT
      aa.id,
      aa.ad_set_id,
      aa.ad_account_id,
      aa.action_type,
      aa.action_details,
      aa.status,
      aa.created_at,
      aa.resolved_at,
      aa.resolved_by,
      c.vertical
    FROM agent_actions aa
    JOIN clients c ON c.meta_ad_account_id = aa.ad_account_id
    WHERE c.owner_id = ${userId}
      AND (${filter ?? "all"} = 'all' OR aa.status = ${filter ?? "all"})
      AND (${actionType ?? "all"} = 'all' OR aa.action_type = ${actionType ?? "all"})
    ORDER BY aa.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const countResult = await sql`
    SELECT COUNT(*) as total
    FROM agent_actions aa
    JOIN clients c ON c.meta_ad_account_id = aa.ad_account_id
    WHERE c.owner_id = ${userId}
      AND (${filter ?? "all"} = 'all' OR aa.status = ${filter ?? "all"})
      AND (${actionType ?? "all"} = 'all' OR aa.action_type = ${actionType ?? "all"})
  `;

  const total = parseInt((countResult[0] as { total: string }).total);

  return NextResponse.json({
    actions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}
