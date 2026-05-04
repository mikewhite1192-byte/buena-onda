// GET /api/agent/creatives?adAccountId=act_xxx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Returns all ads with creative details + performance metrics
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ownsAdAccount } from "@/lib/auth/owner-of";
import { neon } from "@neondatabase/serverless";
import { decryptToken } from "@/lib/crypto/tokens";

const sql = neon(process.env.DATABASE_URL!);

const META_BASE = "https://graph.facebook.com/v21.0";

async function metaGet<T>(path: string, accessToken: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${META_BASE}${path}`);
  url.searchParams.set("access_token", accessToken);
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
  const startDate = req.nextUrl.searchParams.get("startDate") ?? daysAgo(30);
  const endDate = req.nextUrl.searchParams.get("endDate") ?? today();

  if (!adAccountId) return NextResponse.json({ error: "adAccountId required" }, { status: 400 });

  if (!(await ownsAdAccount(userId, adAccountId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const tokenRows = await sql`
    SELECT meta_access_token FROM clients
    WHERE owner_id = ${userId} AND meta_ad_account_id = ${adAccountId}
    LIMIT 1
  `;
  const stored = tokenRows[0]?.meta_access_token as string | undefined;
  if (!stored) {
    return NextResponse.json({ error: "Client has no Meta token" }, { status: 400 });
  }
  const accessToken = decryptToken(stored);

  const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

  try {
    // 1. Fetch all ads (ACTIVE + PAUSED) with creative details
    const adsRes = await metaGet<{ data: RawAd[]; paging?: { next?: string } }>(`/${accountId}/ads`, accessToken, {
      fields: "id,name,status,creative{body,title,image_url,thumbnail_url,object_story_spec},adset{name},campaign{name}",
      filtering: JSON.stringify([{ field: "effective_status", operator: "IN", value: ["ACTIVE", "PAUSED"] }]),
      limit: "100",
    });

    const ads = adsRes.data ?? [];
    if (ads.length === 0) return NextResponse.json({ creatives: [] });

    // 2. Fetch insights for all ads in bulk
    const insightsRes = await metaGet<{ data: RawInsight[] }>(`/${accountId}/insights`, accessToken, {
      fields: "ad_id,spend,impressions,clicks,ctr,frequency,actions,action_values,outbound_clicks",
      level: "ad",
      time_range: JSON.stringify({ since: startDate, until: endDate }),
      limit: "500",
    });

    const insightMap: Record<string, RawInsight> = {};
    for (const row of insightsRes.data ?? []) {
      insightMap[row.ad_id] = row;
    }

    // 3. Merge ads + insights
    const creatives = ads.map(ad => {
      const ins = insightMap[ad.id];
      const spend = parseFloat(ins?.spend ?? "0");
      const impressions = parseInt(ins?.impressions ?? "0", 10);
      const clicks = parseInt(ins?.clicks ?? "0", 10);
      const ctr = parseFloat(ins?.ctr ?? "0");
      const frequency = parseFloat(ins?.frequency ?? "0");

      const actions = ins?.actions ?? [];
      const leads = parseInt(actions.find(a => a.action_type === "lead")?.value ?? "0", 10);
      const purchases = parseInt(actions.find(a => a.action_type === "purchase")?.value ?? "0", 10);

      const actionValues = ins?.action_values ?? [];
      const purchaseValue = parseFloat(actionValues.find(a => a.action_type === "purchase")?.value ?? "0");
      const roas = spend > 0 && purchaseValue > 0 ? purchaseValue / spend : null;
      const cpl = spend > 0 && leads > 0 ? spend / leads : null;

      const creative = ad.creative;
      const body = creative?.body ?? creative?.object_story_spec?.link_data?.message ?? null;
      const headline = creative?.title ?? creative?.object_story_spec?.link_data?.name ?? null;
      const thumbnail_url = creative?.thumbnail_url ?? creative?.image_url ?? null;

      // Detect format from object_story_spec or name
      let format = "IMAGE";
      if (creative?.object_story_spec?.video_data) format = "VIDEO";
      else if (creative?.object_story_spec?.link_data?.child_attachments?.length) format = "CAROUSEL";
      else if (ad.name?.toLowerCase().includes("video") || ad.name?.toLowerCase().includes("reel")) format = "VIDEO";
      else if (ad.name?.toLowerCase().includes("carousel")) format = "CAROUSEL";
      else if (ad.name?.toLowerCase().includes("story")) format = "STORY";

      return {
        id: ad.id,
        name: ad.name,
        status: ad.status as "ACTIVE" | "PAUSED",
        spend,
        impressions,
        clicks,
        ctr,
        cpl,
        roas,
        purchases,
        leads,
        frequency,
        thumbnail_url,
        body,
        headline,
        format,
        campaign_name: ad.campaign?.name ?? null,
        adset_name: ad.adset?.name ?? null,
      };
    });

    return NextResponse.json({ creatives });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function today() { return new Date().toISOString().split("T")[0]; }
function daysAgo(n: number) { return new Date(Date.now() - n * 86400000).toISOString().split("T")[0]; }

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
      link_data?: { message?: string; name?: string; child_attachments?: unknown[] };
      video_data?: unknown;
    };
  };
  adset?: { name: string };
  campaign?: { name: string };
}

interface RawInsight {
  ad_id: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  frequency?: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
}
