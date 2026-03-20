import { ALL_API_FIELDS } from "@/lib/meta/metric-definitions";

const META_BASE_URL = "https://graph.facebook.com/v21.0";

function getAccessToken(token?: string): string {
  const t = token ?? process.env.META_ACCESS_TOKEN;
  if (!t) throw new Error("Missing META_ACCESS_TOKEN");
  return t;
}

function getAdAccountId(): string {
  const id = process.env.META_AD_ACCOUNT_ID;
  if (!id) throw new Error("Missing META_AD_ACCOUNT_ID");
  return id.startsWith("act_") ? id : `act_${id}`;
}

// ── Shared fetch helpers ─────────────────────────────────────────────────────

async function metaGet<T>(path: string, params: Record<string, string> = {}, token?: string): Promise<T> {
  const url = new URL(`${META_BASE_URL}${path}`);
  url.searchParams.set("access_token", getAccessToken(token));
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

async function metaPost<T>(path: string, body: Record<string, unknown> = {}, token?: string): Promise<T> {
  const url = new URL(`${META_BASE_URL}${path}`);
  url.searchParams.set("access_token", getAccessToken(token));

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
  untilDate?: string,
  token?: string,
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
      }, token),
      metaGet<MetaPaged<RawInsight>>(`/${adsetId}/insights`, {
        fields: ["adset_id", "adset_name", ...ALL_API_FIELDS].join(","),
        time_range: timeRange,
        level: "adset",
      }, token),
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
  adsetId: string,
  token?: string,
): Promise<MetaResult<{ adset_id: string; status: "PAUSED" }>> {
  try {
    await metaPost(`/${adsetId}`, { status: "PAUSED" }, token);
    return ok({ adset_id: adsetId, status: "PAUSED" as const });
  } catch (err) {
    return fail(err);
  }
}

// ── scaleAdSet ───────────────────────────────────────────────────────────────

export async function scaleAdSet(
  adsetId: string,
  newBudgetCents: number,
  token?: string,
): Promise<MetaResult<{ adset_id: string; daily_budget_cents: number }>> {
  try {
    await metaPost(`/${adsetId}`, { daily_budget: newBudgetCents }, token);
    return ok({ adset_id: adsetId, daily_budget_cents: newBudgetCents });
  } catch (err) {
    return fail(err);
  }
}

// ── pauseCampaign ────────────────────────────────────────────────────────────

export async function pauseCampaign(
  campaignId: string,
  token?: string,
): Promise<MetaResult<{ campaign_id: string; status: "PAUSED" }>> {
  try {
    await metaPost(`/${campaignId}`, { status: "PAUSED" }, token);
    return ok({ campaign_id: campaignId, status: "PAUSED" as const });
  } catch (err) {
    return fail(err);
  }
}

// ── enableCampaign ───────────────────────────────────────────────────────────

export async function enableCampaign(
  campaignId: string,
  token?: string,
): Promise<MetaResult<{ campaign_id: string; status: "ACTIVE" }>> {
  try {
    await metaPost(`/${campaignId}`, { status: "ACTIVE" }, token);
    return ok({ campaign_id: campaignId, status: "ACTIVE" as const });
  } catch (err) {
    return fail(err);
  }
}

// ── scaleCampaignBudget ──────────────────────────────────────────────────────

export async function scaleCampaignBudget(
  campaignId: string,
  newDailyBudgetCents: number,
  token?: string,
): Promise<MetaResult<{ campaign_id: string; daily_budget_cents: number }>> {
  try {
    await metaPost(`/${campaignId}`, { daily_budget: newDailyBudgetCents }, token);
    return ok({ campaign_id: campaignId, daily_budget_cents: newDailyBudgetCents });
  } catch (err) {
    return fail(err);
  }
}

// ── pauseAd ──────────────────────────────────────────────────────────────────

export async function pauseAd(
  adId: string,
  token?: string,
): Promise<MetaResult<{ ad_id: string; status: "PAUSED" }>> {
  try {
    await metaPost(`/${adId}`, { status: "PAUSED" }, token);
    return ok({ ad_id: adId, status: "PAUSED" as const });
  } catch (err) {
    return fail(err);
  }
}

// ── enableAd ─────────────────────────────────────────────────────────────────

export async function enableAd(
  adId: string,
  token?: string,
): Promise<MetaResult<{ ad_id: string; status: "ACTIVE" }>> {
  try {
    await metaPost(`/${adId}`, { status: "ACTIVE" }, token);
    return ok({ ad_id: adId, status: "ACTIVE" as const });
  } catch (err) {
    return fail(err);
  }
}

// ── deleteAd ─────────────────────────────────────────────────────────────────

export async function deleteAd(
  adId: string,
  token?: string,
): Promise<MetaResult<{ ad_id: string; deleted: true }>> {
  try {
    const url = new URL(`${META_BASE_URL}/${adId}`);
    url.searchParams.set("access_token", getAccessToken(token));
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
  pixelId?: string;
  campaignName: string;
  adSetName: string;
  adName: string;
  objective: "OUTCOME_LEADS" | "OUTCOME_TRAFFIC" | "OUTCOME_SALES";
  optimizationGoal: "LEAD_GENERATION" | "LINK_CLICKS" | "OFFSITE_CONVERSIONS";
  billingEvent: "IMPRESSIONS" | "LINK_CLICKS";
  dailyBudgetCents: number;
  countries?: string[];
  regionKeys?: GeoKey[];
  ageMin?: number;
  ageMax?: number;
  imageHash?: string;
  imageUrl?: string;
  videoId?: string;           // pre-uploaded video ID
  videoUrl?: string;          // public URL — we upload it and get a video_id
  primaryText: string;
  headline: string;
  description?: string;
  ctaType: string;
  destinationUrl?: string;
  leadFormId?: string;
  specialAdCategories?: string[];
  token?: string;
}

export interface CampaignCreationResult {
  campaign_id: string;
  adset_id: string;
  ad_creative_id: string;
  ad_id: string;
  image_hash?: string;
  video_id?: string;
}

export async function createMetaCampaign(
  params: CampaignCreationParams
): Promise<MetaResult<CampaignCreationResult>> {
  try {
    const acct = params.adAccountId.startsWith("act_") ? params.adAccountId : `act_${params.adAccountId}`;
    const token = params.token;

    // 1. Resolve creative — image (hash or URL) or video (id or URL)
    const isVideoCreative = !!(params.videoId || params.videoUrl);
    let imageHash = params.imageHash;
    let videoId = params.videoId;

    if (isVideoCreative && !videoId && params.videoUrl) {
      const vidRes = await metaPost<{ id: string }>(`/${acct}/advideos`, {
        file_url: params.videoUrl,
        name: params.adName,
      }, token);
      videoId = vidRes.id;
    } else if (!imageHash && params.imageUrl) {
      const imgRes = await metaPost<{ images: Record<string, { hash: string }> }>(
        `/${acct}/adimages`,
        { url: params.imageUrl },
        token,
      );
      const entries = Object.entries(imgRes.images ?? {});
      if (entries.length === 0) throw new Error("Image upload returned no hash");
      imageHash = entries[0][1].hash;
    }

    if (!imageHash && !videoId) throw new Error("No image or video creative provided");

    // 2. Create campaign
    const campaign = await metaPost<{ id: string }>(`/${acct}/campaigns`, {
      name: params.campaignName,
      objective: params.objective,
      status: "PAUSED",
      special_ad_categories: params.specialAdCategories ?? [],
      is_adset_budget_sharing_enabled: false,
    }, token);

    // 3. Build targeting — special ad categories restrict age/gender targeting
    const hasSpecialCategory = (params.specialAdCategories ?? []).length > 0;
    const geoLocations = params.regionKeys?.length
      ? { regions: params.regionKeys.map(r => ({ key: r.key })) }
      : { countries: params.countries ?? ["US"] };
    const targeting: Record<string, unknown> = {
      geo_locations: geoLocations,
      publisher_platforms: ["facebook"],
      facebook_positions: ["feed", "right_hand_column", "marketplace"],
    };
    if (!hasSpecialCategory) {
      targeting.age_min = params.ageMin ?? 25;
      targeting.age_max = params.ageMax ?? 65;
    }

    // 3. Create ad set
    const adSetBody: Record<string, unknown> = {
      name: params.adSetName,
      campaign_id: campaign.id,
      daily_budget: params.dailyBudgetCents,
      billing_event: params.billingEvent,
      optimization_goal: params.optimizationGoal,
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      targeting,
      status: "PAUSED",
    };
    // promoted_object varies by optimization goal
    if (params.optimizationGoal === "LEAD_GENERATION") {
      // Instant form leads — page_id only
      adSetBody.promoted_object = { page_id: params.pageId };
    } else if (params.optimizationGoal === "OFFSITE_CONVERSIONS" && params.pixelId) {
      // URL-based leads or sales — pixel + event type
      adSetBody.promoted_object = { pixel_id: params.pixelId, custom_event_type: "LEAD" };
    }
    const adSet = await metaPost<{ id: string }>(`/${acct}/adsets`, adSetBody, token);

    // 4. Create ad creative — video vs image, lead form vs. traffic/conversion
    const isLeadAd = !!params.leadFormId;
    const ctaValue = isLeadAd
      ? { lead_gen_form_id: params.leadFormId }
      : { link: params.destinationUrl };
    const callToAction = { type: params.ctaType || (isLeadAd ? "SIGN_UP" : "LEARN_MORE"), value: ctaValue };

    let objectStorySpec: Record<string, unknown>;
    if (videoId) {
      objectStorySpec = {
        page_id: params.pageId,
        video_data: {
          video_id: videoId,
          message: params.primaryText,
          title: params.headline,
          call_to_action: callToAction,
        },
      };
    } else {
      const linkData: Record<string, unknown> = {
        image_hash: imageHash,
        message: params.primaryText,
        name: params.headline,
        description: params.description ?? "",
        call_to_action: callToAction,
        // link is required by Meta even for lead gen ads; use destination URL or page URL as fallback
        link: params.destinationUrl ?? `https://www.facebook.com/${params.pageId}`,
      };
      objectStorySpec = { page_id: params.pageId, link_data: linkData };
    }

    const creative = await metaPost<{ id: string }>(`/${acct}/adcreatives`, {
      name: params.adName,
      object_story_spec: objectStorySpec,
    }, token);

    // 5. Create ad
    const ad = await metaPost<{ id: string }>(`/${acct}/ads`, {
      name: params.adName,
      adset_id: adSet.id,
      creative: { creative_id: creative.id },
      status: "PAUSED",
    }, token);

    return ok({
      campaign_id: campaign.id,
      adset_id: adSet.id,
      ad_creative_id: creative.id,
      ad_id: ad.id,
      image_hash: imageHash,
      video_id: videoId,
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
  pageId: string,
  token?: string,
): Promise<MetaResult<LeadForm[]>> {
  try {
    const data = await metaGet<{ data: LeadForm[] }>(`/${pageId}/leadgen_forms`, {
      fields: "id,name,status",
      limit: "50",
    }, token);
    return ok(data.data ?? []);
  } catch (err) {
    return fail(err);
  }
}

// ── resolveGeoLocations ───────────────────────────────────────────────────────
// Converts location name strings to Meta geo keys. 2-letter strings → countries;
// anything longer → searches Meta's geo API for matching regions.

export async function resolveGeoLocations(
  locations: string[],
  token?: string,
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
          },
          token,
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
  adAccountId?: string,
  token?: string,
): Promise<MetaResult<{ new_adset_id: string; daily_budget_cents: number }>> {
  try {
    const acct = adAccountId ?? getAdAccountId();
    const res = await metaPost<{ copied_adset_id: string }>(
      `/${acct}/adsets`,
      {
        copy_adset_id: adsetId,
        status_option: "PAUSED",       // start paused so it can be reviewed before going live
        daily_budget: newBudgetCents,
      },
      token,
    );
    return ok({ new_adset_id: res.copied_adset_id, daily_budget_cents: newBudgetCents });
  } catch (err) {
    return fail(err);
  }
}
