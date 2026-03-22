// app/api/agent/metrics/ads/route.ts
// Fetches individual ad metrics within an ad set directly from Meta Insights API.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ALL_API_FIELDS } from "@/lib/meta/metric-definitions";

const META_BASE_URL = "https://graph.facebook.com/v21.0";

type MetaActionRow = { action_type: string; value: string };

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const adSetId = searchParams.get("adSetId");
  const today = new Date().toISOString().split("T")[0];
  const startDate = searchParams.get("startDate") ?? new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const endDate = searchParams.get("endDate") ?? today;

  if (!adSetId) return NextResponse.json({ error: "adSetId required" }, { status: 400 });

  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "Missing META_ACCESS_TOKEN" }, { status: 500 });

  const timeRange = JSON.stringify({ since: startDate, until: endDate });

  const url = new URL(`${META_BASE_URL}/${adSetId}/insights`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("level", "ad");
  url.searchParams.set("fields", ["ad_id", "ad_name", ...ALL_API_FIELDS].join(","));
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

  const ads = (data.data ?? []).map((row: Record<string, unknown>) => {
    const actions = row.actions as MetaActionRow[] | undefined;
    const actionValues = row.action_values as MetaActionRow[] | undefined;
    const roasArr = row.purchase_roas as MetaActionRow[] | undefined;
    const spend = parseFloat((row.spend as string) ?? "0");
    const leads = parseInt(actions?.find((a) => a.action_type === "lead")?.value ?? "0", 10);
    const purchases = parseInt(actions?.find((a) => a.action_type === "purchase")?.value ?? "0", 10);
    const purchaseValue = parseFloat(actionValues?.find((a) => a.action_type === "purchase")?.value ?? "0");
    const roas = parseFloat(roasArr?.find((r) => r.action_type === "omni_purchase")?.value ?? "0");
    const impressions = parseInt((row.impressions as string) ?? "0", 10);
    const clicks = parseInt((row.clicks as string) ?? "0", 10);
    const ctr = parseFloat((row.ctr as string) ?? "0") / 100;
    const frequency = parseFloat((row.frequency as string) ?? "0");
    const cpl = leads > 0 ? spend / leads : 0;
    const costPerPurchase = purchases > 0 ? spend / purchases : 0;

    return {
      ad_id: row.ad_id as string,
      ad_name: (row.ad_name as string) ?? null,
      ad_status: null as string | null,
      spend: Number(spend.toFixed(2)),
      leads,
      cpl: Number(cpl.toFixed(2)),
      purchases,
      purchase_value: Number(purchaseValue.toFixed(2)),
      roas: Number(roas.toFixed(2)),
      cost_per_purchase: Number(costPerPurchase.toFixed(2)),
      ctr,
      frequency: Number(frequency.toFixed(2)),
      impressions,
      clicks,
      raw_metrics: row,
    };
  });

  return NextResponse.json({ ads });
}
