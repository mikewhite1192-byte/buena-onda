import { ALL_API_FIELDS } from "@/lib/meta/metric-definitions";

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

// ── Shared fetch helpers ─────────────────────────────────────────────────────

async function metaGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${META_BASE_URL}${path}`);
  url.searchParams.set("access_token", getAccessToken());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();

  if (!res.ok || data.error) {
    const msg = data.error?.message ?? `Meta API error: ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

async function metaPost<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  const url = new URL(`${META_BASE_URL}${path}`);
  url.searchParams.set("access_token", getAccessToken());

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();

  if (!res.ok || data.error) {
    const msg = data.error?.message ?? `Meta API error: ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

// ── Result type ──────────────────────────────────────────────────────────────

export type MetaResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function ok<T>(data: T): MetaResult<T> {
  return { ok: true, data };
}

function fail(err: unknown): MetaResult<never> {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("[meta/actions]", msg);
  return { ok: false, error: msg };
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AdSetMetrics {
  adset_id: string;
  adset_name: string;
  status: string;
  daily_budget: number;        // cents
  impressions: number;
  clicks: number;
  spend: number;               // dollars
  leads: number;
  cpl: number | null;          // dollars
  ctr: number;                 // 0–1
  frequency: number;
  hook_rate: number | null;    // 3-sec video views / impressions (null if no video data)
  date_start: string;
  date_stop: string;
  raw_metrics: Record<string, unknown>;
}

// Raw shapes from the Graph API
interface RawAdSet {
  id: string;
  name: string;
  status: string;
  daily_budget?: string;
}

interface RawInsight extends Record<string, unknown> {
  adset_id: string;
  adset_name: string;
  impressions: string;
  clicks: string;
  spend: string;
  actions?: { action_type: string; value: string }[];
  ctr: string;
  frequency: string;
  video_play_actions?: { action_type: string; value: string }[];
  date_start: string;
  date_stop: string;
}

interface MetaPaged<T> {
  data: T[];
}

// ── getAdSetMetrics ──────────────────────────────────────────────────────────

export async function getAdSetMetrics(
  adsetId: string,
  days?: number,
  sinceDate?: string,
  untilDate?: string
): Promise<MetaResult<AdSetMetrics>> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const until = untilDate ?? today;
    const since = sinceDate ?? (days
      ? new Date(Date.now() - days * 86400000).toISOString().split("T")[0]
      : "2024-01-01");
    const timeRange = JSON.stringify({ since, until });

    const [adsetRes, insightsRes] = await Promise.all([
      metaGet<RawAdSet>(`/${adsetId}`, {
        fields: "id,name,status,daily_budget",
      }),
      metaGet<MetaPaged<RawInsight>>(`/${adsetId}/insights`, {
        fields: ["adset_id", "adset_name", ...ALL_API_FIELDS].join(","),
        time_range: timeRange,
        level: "adset",
      }),
    ]);

    const insights = insightsRes.data ?? [];
    const spend = insights.reduce((sum, r) => sum + parseFloat(r.spend ?? '0'), 0);
    const impressions = insights.reduce((sum, r) => sum + parseInt(r.impressions ?? '0', 10), 0);
    const clicks = insights.reduce((sum, r) => sum + parseInt(r.clicks ?? '0', 10), 0);
    const leads = insights.reduce((sum, r) => sum + parseInt(r.actions?.find(a => a.action_type === 'lead')?.value ?? '0', 10), 0);
    const avgCtr = insights.length > 0 ? insights.reduce((sum, r) => sum + parseFloat(r.ctr ?? '0'), 0) / insights.length : 0;
    const avgFrequency = insights.length > 0 ? insights.reduce((sum, r) => sum + parseFloat(r.frequency ?? '0'), 0) / insights.length : 0;
    const insight = insights[0];

    const cpl = leads > 0 ? spend / leads : null;

    // Hook rate = 3-sec video views / impressions
    const threeSecViews = insight
      ? parseInt(
          insight.video_play_actions?.find(
            (a) => a.action_type === "video_view"
          )?.value ?? "0",
          10
        )
      : 0;
    const hook_rate = impressions > 0 && threeSecViews > 0
      ? threeSecViews / impressions
      : null;

    return ok<AdSetMetrics>({
      adset_id: adsetRes.id,
      adset_name: adsetRes.name,
      status: adsetRes.status,
      daily_budget: adsetRes.daily_budget ? parseInt(adsetRes.daily_budget, 10) : 0,
      impressions,
      clicks,
      spend,
      leads,
      cpl,
      ctr: avgCtr / 100, // Meta returns CTR as percent
      frequency: avgFrequency,
      hook_rate,
      date_start: insight?.date_start ?? "",
      date_stop: insight?.date_stop ?? "",
      raw_metrics: insight ?? {},
    });
  } catch (err) {
    console.error("[getAdSetMetrics] Error for adset", adsetId, ":", err instanceof Error ? err.message : err);
    return fail(err);
  }
}

// ── pauseAdSet ───────────────────────────────────────────────────────────────

export async function pauseAdSet(
  adsetId: string
): Promise<MetaResult<{ adset_id: string; status: "PAUSED" }>> {
  try {
    await metaPost(`/${adsetId}`, { status: "PAUSED" });
    return ok({ adset_id: adsetId, status: "PAUSED" as const });
  } catch (err) {
    return fail(err);
  }
}

// ── scaleAdSet ───────────────────────────────────────────────────────────────

export async function scaleAdSet(
  adsetId: string,
  newBudgetCents: number
): Promise<MetaResult<{ adset_id: string; daily_budget_cents: number }>> {
  try {
    await metaPost(`/${adsetId}`, { daily_budget: newBudgetCents });
    return ok({ adset_id: adsetId, daily_budget_cents: newBudgetCents });
  } catch (err) {
    return fail(err);
  }
}

// ── duplicateAdSet ───────────────────────────────────────────────────────────

export async function duplicateAdSet(
  adsetId: string,
  newBudgetCents: number,
  adAccountId?: string
): Promise<MetaResult<{ new_adset_id: string; daily_budget_cents: number }>> {
  try {
    const acct = adAccountId ?? getAdAccountId();
    const res = await metaPost<{ copied_adset_id: string }>(
      `/${acct}/adsets`,
      {
        copy_adset_id: adsetId,
        status_option: "PAUSED",       // start paused so it can be reviewed before going live
        daily_budget: newBudgetCents,
      }
    );
    return ok({ new_adset_id: res.copied_adset_id, daily_budget_cents: newBudgetCents });
  } catch (err) {
    return fail(err);
  }
}
