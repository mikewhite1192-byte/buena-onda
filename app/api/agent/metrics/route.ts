// app/api/agent/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "7");

  // Latest metric snapshot per ad set within the window
  const adSets = await sql`
    SELECT DISTINCT ON (ad_set_id)
      ad_set_id,
      campaign_id,
      spend::numeric(10,2),
      leads,
      cpl::numeric(10,2),
      ctr::numeric(10,4),
      frequency::numeric(10,2),
      impressions,
      date_recorded
    FROM ad_metrics
    WHERE date_recorded >= NOW() - INTERVAL '1 day' * ${days}
    ORDER BY ad_set_id, date_recorded DESC
  `;

  // 7-day trend per ad set (daily spend + leads)
  const trends = await sql`
    SELECT
      ad_set_id,
      DATE(date_recorded) AS day,
      SUM(spend)::numeric(10,2) AS spend,
      SUM(leads)::int AS leads,
      AVG(cpl)::numeric(10,2) AS cpl
    FROM ad_metrics
    WHERE date_recorded >= NOW() - INTERVAL '1 day' * ${days}
    GROUP BY ad_set_id, DATE(date_recorded)
    ORDER BY ad_set_id, day ASC
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
