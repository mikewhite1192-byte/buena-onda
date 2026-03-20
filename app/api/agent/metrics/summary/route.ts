// app/api/agent/metrics/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const adAccountId = searchParams.get("ad_account_id");

  // Latest snapshot per ad set, then aggregate
  const summary = await sql`
    SELECT
      COALESCE(SUM(spend), 0)::numeric(10,2)        AS total_spend,
      COALESCE(SUM(leads), 0)::int                   AS total_leads,
      COALESCE(AVG(cpl), 0)::numeric(10,2)           AS avg_cpl,
      COALESCE(AVG(ctr), 0)::numeric(10,4)           AS avg_ctr,
      COALESCE(AVG(frequency), 0)::numeric(10,2)     AS avg_frequency,
      COALESCE(SUM(impressions), 0)::int             AS total_impressions,
      COUNT(*)::int                                  AS active_ad_sets
    FROM (
      SELECT DISTINCT ON (ad_set_id)
        spend, leads, cpl, ctr, frequency, impressions
      FROM ad_metrics
      WHERE date_recorded >= NOW() - INTERVAL '7 days'
        AND (${adAccountId}::text IS NULL OR ad_account_id = ${adAccountId})
      ORDER BY ad_set_id, date_recorded DESC
    ) latest
  `;

  // Previous 7 days for trend comparison
  const prev = await sql`
    SELECT
      COALESCE(SUM(spend), 0)::numeric(10,2)    AS total_spend,
      COALESCE(SUM(leads), 0)::int              AS total_leads,
      COALESCE(AVG(cpl), 0)::numeric(10,2)      AS avg_cpl
    FROM ad_metrics
    WHERE date_recorded >= NOW() - INTERVAL '14 days'
      AND date_recorded < NOW() - INTERVAL '7 days'
      AND (${adAccountId}::text IS NULL OR ad_account_id = ${adAccountId})
  `;

  // Active briefs count
  const briefs = await sql`
    SELECT COUNT(*)::int AS count FROM campaign_briefs WHERE status = 'active'
  `;

  return NextResponse.json({
    current: summary[0],
    previous: prev[0],
    active_briefs: (briefs[0] as { count: number }).count,
  });
}
