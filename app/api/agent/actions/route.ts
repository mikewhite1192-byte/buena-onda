// app/api/agent/actions/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actions = await sql`
    SELECT
      aa.id,
      aa.ad_set_id,
      aa.ad_account_id,
      aa.action_type,
      aa.action_details,
      aa.status,
      aa.created_at,
      c.vertical
    FROM agent_actions aa
    LEFT JOIN clients c ON aa.ad_account_id IS NOT NULL
      AND c.meta_ad_account_id = aa.ad_account_id
    WHERE aa.status = 'flag_review'
    ORDER BY aa.created_at DESC
    LIMIT 50
  `;

  return NextResponse.json({ actions });
}
