const META_BASE_URL = "https://graph.facebook.com/v21.0";

function getAccessToken(): string {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("Missing META_ACCESS_TOKEN");
  return token;
}

function getAdAccountId(): string {
  const id = process.env.META_AD_ACCOUNT_ID;
  if (!id) throw new Error("Missing META_AD_ACCOUNT_ID");
  return id.startsWith("act_") ? id : `act_${id}`;
}

async function metaFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${META_BASE_URL}${path}`);
  url.searchParams.set("access_token", getAccessToken());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(
      data.error?.message ?? `Meta API error: ${res.status}`
    );
  }

  return data as T;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  created_time: string;
}

export interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  campaign_id: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  end_time?: string;
}

export interface MetaInsight {
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  impressions: string;
  clicks: string;
  spend: string;
  ctr: string;
  cpc?: string;
  cpp?: string;
  reach: string;
  date_start: string;
  date_stop: string;
}

export interface MetaPaged<T> {
  data: T[];
  paging?: { cursors?: { before: string; after: string }; next?: string };
}

// ── Campaigns ──────────────────────────────────────────────────────────────

export function getCampaigns(adAccountId?: string): Promise<MetaPaged<MetaCampaign>> {
  const acct = adAccountId ?? getAdAccountId();
  return metaFetch<MetaPaged<MetaCampaign>>(`/${acct}/campaigns`, {
    fields: "id,name,status,objective,created_time",
    limit: "100",
  });
}

// ── Ad Sets ────────────────────────────────────────────────────────────────

export function getAdSets(adAccountId?: string): Promise<MetaPaged<MetaAdSet>> {
  const acct = adAccountId ?? getAdAccountId();
  return metaFetch<MetaPaged<MetaAdSet>>(`/${acct}/adsets`, {
    fields: "id,name,status,campaign_id,daily_budget,lifetime_budget,start_time,end_time",
    limit: "100",
  });
}

// ── Insights ───────────────────────────────────────────────────────────────

export type InsightsDatePreset =
  | "today"
  | "yesterday"
  | "last_7d"
  | "last_14d"
  | "last_30d"
  | "last_month"
  | "this_month"
  | "this_year";

export function getInsights(
  level: "account" | "campaign" | "adset" | "ad" = "campaign",
  datePreset: InsightsDatePreset = "last_30d",
  adAccountId?: string
): Promise<MetaPaged<MetaInsight>> {
  const acct = adAccountId ?? getAdAccountId();
  return metaFetch<MetaPaged<MetaInsight>>(`/${acct}/insights`, {
    level,
    date_preset: datePreset,
    fields: "campaign_id,campaign_name,adset_id,adset_name,impressions,clicks,spend,ctr,cpc,cpp,reach",
    limit: "100",
  });
}

// ── Connection test ────────────────────────────────────────────────────────

export async function testConnection(): Promise<{ ok: true; adAccountId: string; campaignCount: number }> {
  const acct = getAdAccountId();
  const result = await getCampaigns(acct);
  return { ok: true, adAccountId: acct, campaignCount: result.data.length };
}
