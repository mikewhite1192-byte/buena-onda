// app/api/agent/metrics/adsets/route.ts
// Fetches ad set metrics within a campaign from Meta Insights API.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ALL_API_FIELDS } from "@/lib/meta/metric-definitions";
import { isDemoAccount, getDemoAdSets } from "@/lib/demo-data";

const META_BASE_URL = "https://graph.facebook.com/v21.0";

type MetaActionRow = { action_type: string; value: string };

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId");
  const adAccountId = searchParams.get("ad_account_id");
  const today = new Date().toISOString().split("T")[0];
  const startDate = searchParams.get("startDate") ?? new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const endDate = searchParams.get("endDate") ?? today;

  if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 });

  // Demo mode
  const normalizedAccount = adAccountId?.startsWith("act_") ? adAccountId : adAccountId ? `act_${adAccountId}` : null;
  if (isDemoAccount(normalizedAccount) || campaignId.startsWith("demo_")) {
    return NextResponse.json({ ad_sets: getDemoAdSets(campaignId) });
  }

  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "Missing META_ACCESS_TOKEN" }, { status: 500 });

  const timeRange = JSON.stringify({ since: startDate, until: endDate });

  const url = new URL(`${META_BASE_URL}/${campaignId}/insights`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("level", "adset");
  url.searchParams.set("fields", ["adset_id", "adset_name", ...ALL_API_FIELDS].join(","));
  url.searchParams.set("time_range", timeRange);
  url.searchParams.set("limit", "50");

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();

  if (!res.ok || data.error) {
    return NextResponse.json(
      { error: data.error?.message ?? `Meta API error ${res.status}` },
      { status: 500 }
    );
  }

  const adSets = (data.data ?? []).map((row: Record<string, unknown>) => {
    const actions = row.actions as MetaActionRow[] | undefined;
    const spend = parseFloat((row.spend as string) ?? "0");
    const leads = parseInt(actions?.find((a) => a.action_type === "lead")?.value ?? "0", 10);
    const impressions = parseInt((row.impressions as string) ?? "0", 10);
    const clicks = parseInt((row.clicks as string) ?? "0", 10);
    const ctr = parseFloat((row.ctr as string) ?? "0") / 100;
    const frequency = parseFloat((row.frequency as string) ?? "0");
    const cpl = leads > 0 ? spend / leads : 0;

    return {
      ad_set_id: row.adset_id as string,
      ad_set_name: (row.adset_name as string) ?? null,
      ad_status: null as string | null,
      campaign_id: campaignId,
      spend: Number(spend.toFixed(2)),
      leads,
      cpl: Number(cpl.toFixed(2)),
      ctr,
      frequency: Number(frequency.toFixed(2)),
      impressions,
      clicks,
      date_recorded: new Date().toISOString(),
      raw_metrics: row,
    };
  });

  return NextResponse.json({ ad_sets: adSets });
}
