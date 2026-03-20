// app/api/agent/metrics/live/route.ts
// Fetches real-time metrics directly from Meta for the selected date range.
// Used by the campaigns dashboard — bypasses ad_metrics DB cache.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import getDb from "@/lib/db";
import { getAdSetMetrics } from "@/lib/meta/actions";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const today = new Date().toISOString().split("T")[0];
  const startDate = searchParams.get("startDate") ?? new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const endDate = searchParams.get("endDate") ?? today;
  const adAccountId = searchParams.get("ad_account_id");

  const sql = getDb();

  // Get active ad set IDs from campaign briefs
  const briefs = await sql`
    SELECT creative_asset_ids, ad_account_id
    FROM campaign_briefs
    WHERE status = 'active'
      AND (${adAccountId}::text IS NULL OR ad_account_id = ${adAccountId})
  `;

  const adSetIds = [...new Set(briefs.flatMap((b) => b.creative_asset_ids as string[]))];

  const activeBriefs = await sql`
    SELECT COUNT(*)::int AS count FROM campaign_briefs WHERE status = 'active'
  `;
  const activeBriefsCount = (activeBriefs[0] as { count: number }).count;

  if (adSetIds.length === 0) {
    return NextResponse.json({
      current: { total_spend: 0, total_leads: 0, avg_cpl: 0, avg_ctr: 0, avg_frequency: 0, total_impressions: 0, active_ad_sets: 0 },
      previous: null,
      active_briefs: activeBriefsCount,
      ad_sets: [],
      trends: {},
    });
  }

  // Fetch current period from Meta in parallel
  const results = await Promise.allSettled(
    adSetIds.map((id) => getAdSetMetrics(id, undefined, startDate, endDate))
  );

  const adSets = [];
  for (const r of results) {
    if (r.status === "fulfilled" && r.value.ok) {
      const m = r.value.data;
      adSets.push({
        ad_set_id: m.adset_id,
        ad_set_name: m.adset_name,
        ad_status: m.status,
        campaign_id: "",
        spend: Number(m.spend.toFixed(2)),
        leads: m.leads,
        cpl: m.cpl != null ? Number(m.cpl.toFixed(2)) : 0,
        ctr: m.ctr,
        frequency: m.frequency,
        impressions: m.impressions,
        date_recorded: new Date().toISOString(),
        raw_metrics: m.raw_metrics,
      });
    }
  }

  // Compute summary
  const totalSpend = adSets.reduce((s, a) => s + a.spend, 0);
  const totalLeads = adSets.reduce((s, a) => s + a.leads, 0);
  const totalImpressions = adSets.reduce((s, a) => s + a.impressions, 0);
  const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const avgCtr = adSets.length > 0 ? adSets.reduce((s, a) => s + a.ctr, 0) / adSets.length : 0;
  const avgFrequency = adSets.length > 0 ? adSets.reduce((s, a) => s + a.frequency, 0) / adSets.length : 0;

  return NextResponse.json({
    current: {
      total_spend: Number(totalSpend.toFixed(2)),
      total_leads: totalLeads,
      avg_cpl: Number(avgCpl.toFixed(2)),
      avg_ctr: avgCtr,
      avg_frequency: Number(avgFrequency.toFixed(2)),
      total_impressions: totalImpressions,
      active_ad_sets: adSets.length,
    },
    previous: null,
    active_briefs: activeBriefsCount,
    ad_sets: adSets,
    trends: {},
  });
}
