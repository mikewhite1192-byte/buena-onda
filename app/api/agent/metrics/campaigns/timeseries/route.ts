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

  // Resolve token
  let token = process.env.META_ACCESS_TOKEN ?? "";
  if (clientId) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`SELECT meta_access_token FROM clients WHERE id = ${clientId} LIMIT 1`;
    if (rows[0]?.meta_access_token) token = rows[0].meta_access_token as string;
  }
  if (!token) return NextResponse.json({ error: "Missing META_ACCESS_TOKEN" }, { status: 500 });
  if (!normalizedAccount) return NextResponse.json({ error: "ad_account_id required" }, { status: 400 });

  // Fetch daily breakdown from Meta
  const timeRange = JSON.stringify({ since: startDate, until: endDate });
  const url = new URL(`${META_BASE_URL}/${normalizedAccount}/insights`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("level", "account");
  url.searchParams.set("fields", "spend,actions,action_values,impressions,clicks");
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
      const spend         = Number(parseFloat((row.spend as string) ?? "0").toFixed(2));
      const leads         = parseInt(actions?.find(a => a.action_type === "lead")?.value ?? "0", 10);
      const purchases     = parseInt(actions?.find(a => a.action_type === "purchase")?.value ?? "0", 10);
      const purchaseValue = parseFloat(actionValues?.find(a => a.action_type === "purchase")?.value ?? "0");
      const impressions   = parseInt((row.impressions as string) ?? "0", 10);
      const clicks        = parseInt((row.clicks as string) ?? "0", 10);
      const cpl           = leads > 0 ? Number((spend / leads).toFixed(2)) : 0;
      const cpa           = purchases > 0 ? Number((spend / purchases).toFixed(2)) : 0;
      const roas          = spend > 0 ? Number((purchaseValue / spend).toFixed(2)) : 0;
      return { date: row.date_start as string, spend, leads, cpl, impressions, clicks, purchases, purchase_value: purchaseValue, cpa, roas };
    });

    return NextResponse.json({ timeseries });
  } catch (err) {
    console.error("[timeseries] error:", err);
    return NextResponse.json({ error: "Failed to fetch timeseries" }, { status: 500 });
  }
}
