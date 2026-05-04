// app/api/agent/metrics/[adSetId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ adSetId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { adSetId } = await params;
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  // Verify the caller owns the ad account this ad set rolls up to. Without
  // this, anyone could read any tenant's per-ad-set spend by guessing the ID.
  const ownsRows = await sql`
    SELECT 1
    FROM ad_metrics m
    JOIN clients c ON c.meta_ad_account_id = m.ad_account_id
    WHERE m.ad_set_id = ${adSetId} AND c.owner_id = ${userId}
    LIMIT 1
  `;
  if (ownsRows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // All metric snapshots for this ad set in window
  const metrics = await sql`
    SELECT
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
    WHERE ad_set_id = ${adSetId}
      AND date_recorded >= NOW() - INTERVAL '1 day' * ${days}
    ORDER BY date_recorded ASC
  `;

  // All agent actions on this ad set
  const actions = await sql`
    SELECT
      id,
      action_type,
      action_details,
      status,
      created_at,
      resolved_at
    FROM agent_actions
    WHERE ad_set_id = ${adSetId}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  // Summary stats for this ad set
  const summary = await sql`
    SELECT
      COALESCE(SUM(spend), 0)::numeric(10,2)     AS total_spend,
      COALESCE(SUM(leads), 0)::int               AS total_leads,
      COALESCE(AVG(cpl), 0)::numeric(10,2)       AS avg_cpl,
      COALESCE(MIN(cpl), 0)::numeric(10,2)       AS best_cpl,
      COALESCE(MAX(cpl), 0)::numeric(10,2)       AS worst_cpl,
      COALESCE(AVG(ctr), 0)::numeric(10,4)       AS avg_ctr,
      COALESCE(AVG(frequency), 0)::numeric(10,2) AS avg_frequency,
      COALESCE(MAX(frequency), 0)::numeric(10,2) AS peak_frequency,
      COUNT(*)::int                               AS data_points
    FROM ad_metrics
    WHERE ad_set_id = ${adSetId}
      AND date_recorded >= NOW() - INTERVAL '1 day' * ${days}
  `;

  if (!metrics.length) {
    return NextResponse.json({ error: "Ad set not found" }, { status: 404 });
  }

  return NextResponse.json({
    ad_set_id: adSetId,
    summary: summary[0],
    metrics,
    actions,
  });
}
