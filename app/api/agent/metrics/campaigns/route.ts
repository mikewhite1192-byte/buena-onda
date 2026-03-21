// app/api/agent/metrics/campaigns/route.ts
// Fetches campaign-level metrics from Meta Insights API.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ALL_API_FIELDS } from "@/lib/meta/metric-definitions";
import getDb from "@/lib/db";
import { isDemoAccount, getDemoCampaigns } from "@/lib/demo-data";

const META_BASE_URL = "https://graph.facebook.com/v21.0";

type MetaActionRow = { action_type: string; value: string };

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const today = new Date().toISOString().split("T")[0];
  const startDate = searchParams.get("startDate") ?? new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const endDate = searchParams.get("endDate") ?? today;
  const adAccountIdParam = searchParams.get("ad_account_id");
  const clientId = searchParams.get("client_id");

  // Demo mode — return static data instantly
  const normalizedParam = adAccountIdParam?.startsWith("act_") ? adAccountIdParam : adAccountIdParam ? `act_${adAccountIdParam}` : null;
  if (isDemoAccount(normalizedParam)) {
    return NextResponse.json({ campaigns: getDemoCampaigns(normalizedParam!) });
  }

  // Resolve token — use client's stored token if available, fall back to env var
  let token = process.env.META_ACCESS_TOKEN ?? "";
  if (clientId) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`SELECT meta_access_token FROM clients WHERE id = ${clientId} LIMIT 1`;
    if (rows[0]?.meta_access_token) token = rows[0].meta_access_token as string;
  }
  if (!token) return NextResponse.json({ error: "Missing META_ACCESS_TOKEN" }, { status: 500 });

  // Resolve which ad account(s) to query
  let accountIds: string[] = [];
  if (adAccountIdParam) {
    accountIds = [adAccountIdParam.startsWith("act_") ? adAccountIdParam : `act_${adAccountIdParam}`];
  } else {
    const sql = getDb();
    const rows = await sql`
      SELECT DISTINCT ad_account_id FROM campaign_briefs
      WHERE status = 'active' AND ad_account_id IS NOT NULL
    `;
    accountIds = rows.map((r) => {
      const id = r.ad_account_id as string;
      return id.startsWith("act_") ? id : `act_${id}`;
    });
    if (accountIds.length === 0 && process.env.META_AD_ACCOUNT_ID) {
      const envId = process.env.META_AD_ACCOUNT_ID;
      accountIds = [envId.startsWith("act_") ? envId : `act_${envId}`];
    }
  }

  if (accountIds.length === 0) return NextResponse.json({ campaigns: [] });

  const timeRange = JSON.stringify({ since: startDate, until: endDate });
  const allRows: Record<string, unknown>[] = [];

  for (const accountId of accountIds) {
    const url = new URL(`${META_BASE_URL}/${accountId}/insights`);
    url.searchParams.set("access_token", token);
    url.searchParams.set("level", "campaign");
    url.searchParams.set("fields", ["campaign_id", "campaign_name", ...ALL_API_FIELDS].join(","));
    url.searchParams.set("time_range", timeRange);
    url.searchParams.set("limit", "50");

    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();
    if (res.ok && !data.error) {
      allRows.push(...(data.data ?? []));
    } else {
      console.error("[campaigns] Meta API error for", accountId, data.error);
      return NextResponse.json({ campaigns: [], error: data.error?.message ?? `Meta API error ${res.status}` });
    }
  }

  const campaigns = allRows.map((row) => {
    const actions = row.actions as MetaActionRow[] | undefined;
    const spend = parseFloat((row.spend as string) ?? "0");
    const leads = parseInt(actions?.find((a) => a.action_type === "lead")?.value ?? "0", 10);
    const impressions = parseInt((row.impressions as string) ?? "0", 10);
    const clicks = parseInt((row.clicks as string) ?? "0", 10);
    const ctr = parseFloat((row.ctr as string) ?? "0") / 100;
    const frequency = parseFloat((row.frequency as string) ?? "0");
    const cpl = leads > 0 ? spend / leads : 0;

    return {
      campaign_id: row.campaign_id as string,
      campaign_name: (row.campaign_name as string) ?? null,
      spend: Number(spend.toFixed(2)),
      leads,
      cpl: Number(cpl.toFixed(2)),
      ctr,
      frequency: Number(frequency.toFixed(2)),
      impressions,
      clicks,
      raw_metrics: row,
    };
  });

  return NextResponse.json({ campaigns });
}
