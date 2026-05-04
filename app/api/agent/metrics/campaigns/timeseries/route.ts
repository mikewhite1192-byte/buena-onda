// app/api/agent/metrics/campaigns/timeseries/route.ts
// Returns daily breakdown of campaign metrics for charting.
// Uses Meta Insights API with time_increment=1 for real accounts.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isDemoAccount, getDemoTimeseries } from "@/lib/demo-data";

const META_BASE_URL = "https://graph.facebook.com/v21.0";

type MetaActionRow = { action_type: string; value: string };

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const today   = new Date().toISOString().split("T")[0];
  const startDate = searchParams.get("startDate") ?? new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const endDate   = searchParams.get("endDate")   ?? today;
  const adAccountIdParam = searchParams.get("ad_account_id");
  const clientId         = searchParams.get("client_id");

  const normalizedAccount = adAccountIdParam?.startsWith("act_") ? adAccountIdParam : adAccountIdParam ? `act_${adAccountIdParam}` : null;

  // Demo mode — return synthetic daily data
  if (isDemoAccount(normalizedAccount)) {
    const timeseries = getDemoTimeseries(normalizedAccount!, startDate, endDate);
    return NextResponse.json({ timeseries });
  }

  // Resolve token (stored encrypted; legacy plaintext rows pass through).
  let token = process.env.META_ACCESS_TOKEN ?? "";
  if (clientId) {
    const { neon } = await import("@neondatabase/serverless");
    const { decryptToken } = await import("@/lib/crypto/tokens");
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`SELECT meta_access_token FROM clients WHERE id = ${clientId} AND owner_id = ${userId} LIMIT 1`;
    if (rows[0]?.meta_access_token) token = decryptToken(rows[0].meta_access_token as string);
  }
  if (!token) return NextResponse.json({ error: "Missing META_ACCESS_TOKEN" }, { status: 500 });
  if (!normalizedAccount) return NextResponse.json({ error: "ad_account_id required" }, { status: 400 });

  // Fetch daily breakdown from Meta
  const timeRange = JSON.stringify({ since: startDate, until: endDate });
  const url = new URL(`${META_BASE_URL}/${normalizedAccount}/insights`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("level", "account");
  url.searchParams.set("fields", "spend,impressions,reach,frequency,clicks,unique_clicks,ctr,cpm,cpc,actions,action_values,outbound_clicks");
  url.searchParams.set("time_range", timeRange);
  url.searchParams.set("time_increment", "1");
  url.searchParams.set("limit", "400");

  try {
    const res  = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json({ error: data.error?.message ?? `Meta API error ${res.status}` }, { status: 500 });
    }

    const timeseries = (data.data ?? []).map((row: Record<string, unknown>) => {
      const actions       = row.actions as MetaActionRow[] | undefined;
      const actionValues  = row.action_values as MetaActionRow[] | undefined;
      const outbound      = row.outbound_clicks as MetaActionRow[] | undefined;
      const spend         = Number(parseFloat((row.spend as string) ?? "0").toFixed(2));
      const impressions   = parseInt((row.impressions as string) ?? "0", 10);
      const reach         = parseInt((row.reach as string) ?? "0", 10);
      const frequency     = Number(parseFloat((row.frequency as string) ?? "0").toFixed(2));
      const clicks        = parseInt((row.clicks as string) ?? "0", 10);
      const uniqueClicks  = parseInt((row.unique_clicks as string) ?? "0", 10);
      const ctr           = Number(parseFloat((row.ctr as string) ?? "0").toFixed(4));
      const cpm           = Number(parseFloat((row.cpm as string) ?? "0").toFixed(2));
      const cpc           = Number(parseFloat((row.cpc as string) ?? "0").toFixed(2));
      const linkClicks    = parseInt(actions?.find(a => a.action_type === "link_click")?.value ?? "0", 10);
      const outboundClicks = parseInt(outbound?.find(a => a.action_type === "outbound_click")?.value ?? "0", 10);
      const leads         = parseInt(actions?.find(a => a.action_type === "lead")?.value ?? "0", 10);
      const purchases     = parseInt(actions?.find(a => a.action_type === "purchase")?.value ?? "0", 10);
      const addsToCart    = parseInt(actions?.find(a => a.action_type === "add_to_cart")?.value ?? "0", 10);
      const checkouts     = parseInt(actions?.find(a => a.action_type === "initiate_checkout")?.value ?? "0", 10);
      const purchaseValue = parseFloat(actionValues?.find(a => a.action_type === "purchase")?.value ?? "0");
      const cpl           = leads > 0 ? Number((spend / leads).toFixed(2)) : 0;
      const cpa           = purchases > 0 ? Number((spend / purchases).toFixed(2)) : 0;
      const roas          = spend > 0 && purchaseValue > 0 ? Number((purchaseValue / spend).toFixed(2)) : 0;
      return {
        date: row.date_start as string, spend, leads, cpl,
        impressions, reach, frequency, clicks, link_clicks: linkClicks,
        unique_clicks: uniqueClicks, outbound_clicks: outboundClicks,
        ctr, cpm, cpc, purchases, purchase_value: purchaseValue,
        adds_to_cart: addsToCart, checkouts, cpa, roas,
      };
    });

    return NextResponse.json({ timeseries });
  } catch (err) {
    console.error("[timeseries] error:", err);
    return NextResponse.json({ error: "Failed to fetch timeseries" }, { status: 500 });
  }
}
