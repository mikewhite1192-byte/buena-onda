// app/api/agent/metrics/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { isDemoAccount, getDemoSummary } from "@/lib/demo-data";
import { ownsAdAccount } from "@/lib/auth/owner-of";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const adAccountId = searchParams.get("ad_account_id");
  const days = parseInt(searchParams.get("days") ?? "30");

  // Demo mode
  const normalizedAccount = adAccountId?.startsWith("act_") ? adAccountId : adAccountId ? `act_${adAccountId}` : null;
  if (isDemoAccount(normalizedAccount)) {
    return NextResponse.json(getDemoSummary(normalizedAccount!));
  }

  // Tenant-scope every query through clients.owner_id; reject explicit
  // ad_account_id values that don't belong to the caller.
  if (adAccountId && !(await ownsAdAccount(userId, adAccountId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
      SELECT DISTINCT ON (m.ad_set_id)
        m.spend, m.leads, m.cpl, m.ctr, m.frequency, m.impressions
      FROM ad_metrics m
      JOIN clients c ON c.meta_ad_account_id = m.ad_account_id
      WHERE c.owner_id = ${userId}
        AND m.date_recorded >= NOW() - INTERVAL '1 day' * ${days}
        AND (${adAccountId}::text IS NULL OR m.ad_account_id = ${adAccountId})
      ORDER BY m.ad_set_id, m.date_recorded DESC
    ) latest
  `;

  const prev = await sql`
    SELECT
      COALESCE(SUM(spend), 0)::numeric(10,2)    AS total_spend,
      COALESCE(SUM(leads), 0)::int              AS total_leads,
      COALESCE(AVG(cpl), 0)::numeric(10,2)      AS avg_cpl
    FROM (
      SELECT DISTINCT ON (m.ad_set_id)
        m.spend, m.leads, m.cpl
      FROM ad_metrics m
      JOIN clients c ON c.meta_ad_account_id = m.ad_account_id
      WHERE c.owner_id = ${userId}
        AND m.date_recorded >= NOW() - INTERVAL '1 day' * ${days * 2}
        AND m.date_recorded < NOW() - INTERVAL '1 day' * ${days}
        AND (${adAccountId}::text IS NULL OR m.ad_account_id = ${adAccountId})
      ORDER BY m.ad_set_id, m.date_recorded DESC
    ) prev_latest
  `;

  // Active briefs count — scoped via the brief's client.
  const briefs = await sql`
    SELECT COUNT(*)::int AS count
    FROM campaign_briefs cb
    JOIN clients c ON c.id = cb.client_id
    WHERE cb.status = 'active' AND c.owner_id = ${userId}
  `;

  return NextResponse.json({
    current: summary[0],
    previous: prev[0],
    active_briefs: (briefs[0] as { count: number }).count,
  });
}
