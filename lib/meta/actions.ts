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

// ── pauseCampaign ────────────────────────────────────────────────────────────

export async function pauseCampaign(
  campaignId: string
): Promise<MetaResult<{ campaign_id: string; status: "PAUSED" }>> {
  try {
    await metaPost(`/${campaignId}`, { status: "PAUSED" });
    return ok({ campaign_id: campaignId, status: "PAUSED" as const });
  } catch (err) {
    return fail(err);
  }
}

// ── enableCampaign ───────────────────────────────────────────────────────────

export async function enableCampaign(
  campaignId: string
): Promise<MetaResult<{ campaign_id: string; status: "ACTIVE" }>> {
  try {
    await metaPost(`/${campaignId}`, { status: "ACTIVE" });
    return ok({ campaign_id: campaignId, status: "ACTIVE" as const });
  } catch (err) {
    return fail(err);
  }
}

// ── scaleCampaignBudget ──────────────────────────────────────────────────────

export async function scaleCampaignBudget(
  campaignId: string,
  newDailyBudgetCents: number
): Promise<MetaResult<{ campaign_id: string; daily_budget_cents: number }>> {
  try {
    await metaPost(`/${campaignId}`, { daily_budget: newDailyBudgetCents });
    return ok({ campaign_id: campaignId, daily_budget_cents: newDailyBudgetCents });
  } catch (err) {
    return fail(err);
  }
}

// ── pauseAd ──────────────────────────────────────────────────────────────────

export async function pauseAd(
  adId: string
): Promise<MetaResult<{ ad_id: string; status: "PAUSED" }>> {
  try {
    await metaPost(`/${adId}`, { status: "PAUSED" });
    return ok({ ad_id: adId, status: "PAUSED" as const });
  } catch (err) {
    return fail(err);
  }
}

// ── enableAd ─────────────────────────────────────────────────────────────────

export async function enableAd(
  adId: string
): Promise<MetaResult<{ ad_id: string; status: "ACTIVE" }>> {
  try {
    await metaPost(`/${adId}`, { status: "ACTIVE" });
    return ok({ ad_id: adId, status: "ACTIVE" as const });
  } catch (err) {
    return fail(err);
  }
}

// ── deleteAd ─────────────────────────────────────────────────────────────────

export async function deleteAd(
  adId: string
): Promise<MetaResult<{ ad_id: string; deleted: true }>> {
  try {
    const url = new URL(`${META_BASE_URL}/${adId}`);
    url.searchParams.set("access_token", getAccessToken());
    const res = await fetch(url.toString(), { method: "DELETE", cache: "no-store" });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message ?? `Meta API error: ${res.status}`);
    return ok({ ad_id: adId, deleted: true as const });
  } catch (err) {
    return fail(err);
  }
}

// ── createMetaCampaign ───────────────────────────────────────────────────────

export interface GeoKey {
  key: string;  // Meta region/city key
  name: string;
  type: "region" | "city" | "country";
}

export interface CampaignCreationParams {
  adAccountId: string;
  pageId: string;
  campaignName: string;
  adSetName: string;
  adName: string;
  objective: "OUTCOME_LEADS" | "OUTCOME_TRAFFIC" | "OUTCOME_SALES";
  optimizationGoal: "LEAD_GENERATION" | "LINK_CLICKS" | "OFFSITE_CONVERSIONS";
  billingEvent: "IMPRESSIONS" | "LINK_CLICKS";
  dailyBudgetCents: number;
  countries?: string[];       // ISO 2-letter codes e.g. ["US"]
  regionKeys?: GeoKey[];      // Meta region keys for state-level targeting
  ageMin?: number;            // omit for special ad category campaigns
  ageMax?: number;
  imageHash?: string;
  imageUrl?: string;
  primaryText: string;
  headline: string;
  description?: string;
  ctaType: string;
  destinationUrl?: string;    // required for traffic/conversion ads
  leadFormId?: string;        // required for lead gen instant form ads
  specialAdCategories?: string[];  // e.g. ["FINANCIAL_PRODUCTS_SERVICES"]
}

export interface CampaignCreationResult {
  campaign_id: string;
  adset_id: string;
  ad_creative_id: string;
  ad_id: string;
  image_hash: string;
}

export async function createMetaCampaign(
  params: CampaignCreationParams
): Promise<MetaResult<CampaignCreationResult>> {
  try {
    const acct = params.adAccountId.startsWith("act_") ? params.adAccountId : `act_${params.adAccountId}`;

    // 1. Upload image if URL provided (no hash supplied)
    let imageHash = params.imageHash;
    if (!imageHash && params.imageUrl) {
      const imgRes = await metaPost<{ images: Record<string, { hash: string }> }>(
        `/${acct}/adimages`,
        { url: params.imageUrl }
      );
      const entries = Object.entries(imgRes.images ?? {});
      if (entries.length === 0) throw new Error("Image upload returned no hash");
      imageHash = entries[0][1].hash;
    }
    if (!imageHash) throw new Error("No image hash or image URL provided");

    // 2. Create campaign
    const campaign = await metaPost<{ id: string }>(`/${acct}/campaigns`, {
      name: params.campaignName,
      objective: params.objective,
      status: "PAUSED",
      special_ad_categories: params.specialAdCategories ?? [],
    });

    // 3. Build targeting — special ad categories restrict age/gender targeting
    const hasSpecialCategory = (params.specialAdCategories ?? []).length > 0;
    const geoLocations = params.regionKeys?.length
      ? { regions: params.regionKeys.map(r => ({ key: r.key })) }
      : { countries: params.countries ?? ["US"] };
    const targeting: Record<string, unknown> = { geo_locations: geoLocations };
    if (!hasSpecialCategory) {
      targeting.age_min = params.ageMin ?? 25;
      targeting.age_max = params.ageMax ?? 65;
    }

    // 3. Create ad set
    const adSet = await metaPost<{ id: string }>(`/${acct}/adsets`, {
      name: params.adSetName,
      campaign_id: campaign.id,
      daily_budget: params.dailyBudgetCents,
      billing_event: params.billingEvent,
      optimization_goal: params.optimizationGoal,
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      targeting,
      status: "PAUSED",
      start_time: new Date(Date.now() + 86400000).toISOString(),
    });

    // 4. Create ad creative — lead form vs. traffic/conversion
    const isLeadAd = !!params.leadFormId;
    const linkData: Record<string, unknown> = {
      image_hash: imageHash,
      message: params.primaryText,
      name: params.headline,
      description: params.description ?? "",
      call_to_action: isLeadAd
        ? { type: params.ctaType || "SIGN_UP", value: { lead_gen_form_id: params.leadFormId } }
        : { type: params.ctaType || "LEARN_MORE", value: { link: params.destinationUrl } },
    };
    if (!isLeadAd && params.destinationUrl) linkData.link = params.destinationUrl;

    const creative = await metaPost<{ id: string }>(`/${acct}/adcreatives`, {
      name: params.adName,
      object_story_spec: {
        page_id: params.pageId,
        link_data: linkData,
      },
    });

    // 5. Create ad
    const ad = await metaPost<{ id: string }>(`/${acct}/ads`, {
      name: params.adName,
      adset_id: adSet.id,
      creative: { creative_id: creative.id },
      status: "PAUSED",
    });

    return ok({
      campaign_id: campaign.id,
      adset_id: adSet.id,
      ad_creative_id: creative.id,
      ad_id: ad.id,
      image_hash: imageHash,
    });
  } catch (err) {
    return fail(err);
  }
}

// ── listLeadForms ─────────────────────────────────────────────────────────────

export interface LeadForm {
  id: string;
  name: string;
  status: string;
}

export async function listLeadForms(
  pageId: string
): Promise<MetaResult<LeadForm[]>> {
  try {
    const data = await metaGet<{ data: LeadForm[] }>(`/${pageId}/leadgen_forms`, {
      fields: "id,name,status",
      limit: "50",
    });
    return ok(data.data ?? []);
  } catch (err) {
    return fail(err);
  }
}

// ── resolveGeoLocations ───────────────────────────────────────────────────────
// Converts location name strings to Meta geo keys. 2-letter strings → countries;
// anything longer → searches Meta's geo API for matching regions.

export async function resolveGeoLocations(
  locations: string[]
): Promise<{ countries: string[]; regionKeys: GeoKey[] }> {
  const countries: string[] = [];
  const regionKeys: GeoKey[] = [];

  await Promise.all(
    locations.map(async (loc) => {
      const trimmed = loc.trim();
      if (trimmed.length === 2) {
        countries.push(trimmed.toUpperCase());
        return;
      }
      try {
        const data = await metaGet<{ data: Array<{ key: string; name: string; type: string; country_code: string }> }>(
          "/search",
          {
            type: "adgeolocation",
            q: trimmed,
            location_types: JSON.stringify(["region", "city"]),
            limit: "1",
          }
        );
        const match = data.data?.[0];
        if (match) {
          regionKeys.push({ key: match.key, name: match.name, type: match.type as GeoKey["type"] });
        } else {
          // Fall back to treating as a country code
          countries.push(trimmed.toUpperCase());
        }
      } catch {
        countries.push(trimmed.toUpperCase());
      }
    })
  );

  return { countries, regionKeys };
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
