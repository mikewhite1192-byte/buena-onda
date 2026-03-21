// GET /api/agent/ads?adAccountId=act_xxx
// Returns campaigns (PAUSED + ACTIVE) with their ads and copy for the Ads Manager tab
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const META_BASE = "https://graph.facebook.com/v21.0";

function token() {
  const t = process.env.META_ACCESS_TOKEN;
  if (!t) throw new Error("Missing META_ACCESS_TOKEN");
  return t;
}

async function metaGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${META_BASE}${path}`);
  url.searchParams.set("access_token", token());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message ?? "Meta API error");
  return data as T;
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adAccountId = req.nextUrl.searchParams.get("adAccountId");
  if (!adAccountId) return NextResponse.json({ error: "adAccountId required" }, { status: 400 });

  const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

  try {
    // Fetch campaigns (PAUSED + ACTIVE)
    const campaigns = await metaGet<{ data: RawCampaign[] }>(`/${accountId}/campaigns`, {
      fields: "id,name,status,objective,daily_budget,created_time",
      filtering: JSON.stringify([{ field: "effective_status", operator: "IN", value: ["PAUSED", "ACTIVE"] }]),
      limit: "50",
    });

    if (!campaigns.data?.length) return NextResponse.json({ campaigns: [] });

    // For each campaign, fetch ads with creative details in parallel
    const enriched = await Promise.all(
      campaigns.data.map(async (campaign) => {
        try {
          const adsRes = await metaGet<{ data: RawAd[] }>(`/${campaign.id}/ads`, {
            fields: "id,name,status,creative{body,title,image_url,thumbnail_url,object_story_spec}",
            limit: "10",
          });

          const adsetsRes = await metaGet<{ data: RawAdSet[] }>(`/${campaign.id}/adsets`, {
            fields: "id,name,status,daily_budget,targeting",
            limit: "10",
          });

          const ads = (adsRes.data ?? []).map(ad => ({
            id: ad.id,
            name: ad.name,
            status: ad.status,
            body: ad.creative?.body ?? ad.creative?.object_story_spec?.link_data?.message ?? null,
            headline: ad.creative?.title ?? ad.creative?.object_story_spec?.link_data?.name ?? null,
            image_url: ad.creative?.image_url ?? ad.creative?.thumbnail_url ?? null,
          }));

          const adsets = (adsetsRes.data ?? []).map(as => ({
            id: as.id,
            name: as.name,
            status: as.status,
            daily_budget: as.daily_budget ? Math.round(parseInt(as.daily_budget) / 100) : null,
            targeting: summarizeTargeting(as.targeting),
          }));

          return {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            objective: campaign.objective ?? "LEADS",
            daily_budget: campaign.daily_budget ? Math.round(parseInt(campaign.daily_budget) / 100) : null,
            created_time: campaign.created_time,
            ads,
            adsets,
          };
        } catch {
          return {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            objective: campaign.objective ?? "LEADS",
            daily_budget: campaign.daily_budget ? Math.round(parseInt(campaign.daily_budget) / 100) : null,
            created_time: campaign.created_time,
            ads: [],
            adsets: [],
          };
        }
      })
    );

    return NextResponse.json({ campaigns: enriched });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function summarizeTargeting(targeting: RawTargeting | null | undefined): string {
  if (!targeting) return "Broad";
  const parts: string[] = [];

  const locs = targeting.geo_locations;
  if (locs?.countries?.length) parts.push(locs.countries.join(", "));
  else if (locs?.regions?.length) parts.push(locs.regions.map((r: { name: string }) => r.name).join(", "));
  else if (locs?.cities?.length) parts.push(locs.cities.map((c: { name: string }) => c.name).join(", "));

  const ageMin = targeting.age_min;
  const ageMax = targeting.age_max;
  if (ageMin || ageMax) parts.push(`Ages ${ageMin ?? 18}–${ageMax ?? 65}`);

  const interests = targeting.flexible_spec?.[0]?.interests;
  if (interests?.length) parts.push(interests.slice(0, 2).map((i: { name: string }) => i.name).join(", "));

  return parts.join(" · ") || "Broad";
}

// Raw Meta API types
interface RawCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  created_time?: string;
}

interface RawAdSet {
  id: string;
  name: string;
  status: string;
  daily_budget?: string;
  targeting?: RawTargeting;
}

interface RawTargeting {
  age_min?: number;
  age_max?: number;
  geo_locations?: {
    countries?: string[];
    regions?: { name: string }[];
    cities?: { name: string }[];
  };
  flexible_spec?: { interests?: { name: string }[] }[];
}

interface RawAd {
  id: string;
  name: string;
  status: string;
  creative?: {
    body?: string;
    title?: string;
    image_url?: string;
    thumbnail_url?: string;
    object_story_spec?: {
      link_data?: { message?: string; name?: string };
    };
  };
}
