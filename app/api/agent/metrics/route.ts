// app/api/agent/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { ownsAdAccount } from "@/lib/auth/owner-of";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "7");
  const adAccountId = searchParams.get("ad_account_id");

  // Always tenant-scope. Without an ad_account_id we restrict to accounts
  // owned by the caller; with one, we verify ownership before returning rows.
  if (adAccountId && !(await ownsAdAccount(userId, adAccountId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Latest metric snapshot per ad set within the window — joined to clients
  // so a missing ad_account_id filter still scopes to the caller's accounts.
  const adSets = await sql`
    SELECT DISTINCT ON (m.ad_set_id)
      m.ad_set_id,
      m.ad_set_name,
      m.ad_status,
      m.campaign_id,
      m.spend::numeric(10,2),
      m.leads,
      m.cpl::numeric(10,2),
      m.ctr::numeric(10,4),
      m.frequency::numeric(10,2),
      m.impressions,
      m.date_recorded
    FROM ad_metrics m
    JOIN clients c ON c.meta_ad_account_id = m.ad_account_id
    WHERE c.owner_id = ${userId}
      AND m.date_recorded >= NOW() - INTERVAL '1 day' * ${days}
      AND (${adAccountId}::text IS NULL OR m.ad_account_id = ${adAccountId})
    ORDER BY m.ad_set_id, m.date_recorded DESC
  `;

  const trends = await sql`
    SELECT
      m.ad_set_id,
      DATE(m.date_recorded) AS day,
      SUM(m.spend)::numeric(10,2) AS spend,
      SUM(m.leads)::int AS leads,
      AVG(m.cpl)::numeric(10,2) AS cpl
    FROM ad_metrics m
    JOIN clients c ON c.meta_ad_account_id = m.ad_account_id
    WHERE c.owner_id = ${userId}
      AND m.date_recorded >= NOW() - INTERVAL '1 day' * ${days}
      AND (${adAccountId}::text IS NULL OR m.ad_account_id = ${adAccountId})
    GROUP BY m.ad_set_id, DATE(m.date_recorded)
    ORDER BY m.ad_set_id, day ASC
  `;

  // Group trends by ad_set_id
  const trendMap: Record<string, unknown[]> = {};
  for (const row of trends) {
    const r = row as { ad_set_id: string };
    if (!trendMap[r.ad_set_id]) trendMap[r.ad_set_id] = [];
    trendMap[r.ad_set_id].push(row);
  }

  return NextResponse.json({
    ad_sets: adSets,
    trends: trendMap,
  });
}
