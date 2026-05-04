// PATCH /api/agent/ads/[campaignId]/copy
// Updates headline + body on a paused ad's creative
// Body: { adId: string, headline: string, body: string, adAccountId: string }
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ownsAdAccount } from "@/lib/auth/owner-of";
import { neon } from "@neondatabase/serverless";

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

async function metaPost<T>(path: string, accessToken: string, body: Record<string, unknown>): Promise<T> {
  const url = new URL(`${META_BASE}${path}`);
  url.searchParams.set("access_token", accessToken);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message ?? "Meta API error");
  return data as T;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { adId, headline, primaryText, adAccountId } = body as {
    adId: string;
    headline: string;
    primaryText: string;
    adAccountId: string;
  };

  if (!adId || !headline || !primaryText || !adAccountId) {
    return NextResponse.json({ error: "adId, headline, primaryText, and adAccountId required" }, { status: 400 });
  }

  // Require ownership of the ad account; use that client's token, never the
  // platform-wide one. Otherwise anyone could rewrite any tenant's ad copy.
  if (!(await ownsAdAccount(userId, adAccountId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const tokenRows = await sql`
    SELECT meta_access_token FROM clients
    WHERE owner_id = ${userId} AND meta_ad_account_id = ${adAccountId}
    LIMIT 1
  `;
  const accessToken = tokenRows[0]?.meta_access_token as string | undefined;
  if (!accessToken) {
    return NextResponse.json({ error: "Client has no Meta token" }, { status: 400 });
  }

  const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

  try {
    // 1. Get the current ad's creative + page info
    const adData = await metaGet<{
      creative: { id: string; object_story_spec?: ObjectStorySpec; image_hash?: string; thumbnail_url?: string };
    }>(`/${adId}`, accessToken, {
      fields: "creative{id,object_story_spec,image_hash,thumbnail_url,body,title}",
    });

    const existingCreative = adData.creative;
    const creativeId = existingCreative?.id;
    if (!creativeId) throw new Error("Could not find creative ID for this ad");

    // 2. Get page ID from existing creative or env
    const pageId = existingCreative?.object_story_spec?.page_id ?? process.env.META_PAGE_ID;
    if (!pageId) throw new Error("No page_id found — set META_PAGE_ID in environment");

    // 3. Build new object_story_spec preserving existing link/video data
    const existingSpec = existingCreative?.object_story_spec;
    let newSpec: ObjectStorySpec;

    if (existingSpec?.video_data) {
      newSpec = {
        page_id: pageId,
        video_data: {
          ...existingSpec.video_data,
          title: headline,
          message: primaryText,
        },
      };
    } else {
      const linkData = existingSpec?.link_data ?? {};
      newSpec = {
        page_id: pageId,
        link_data: {
          ...linkData,
          message: primaryText,
          name: headline,
        },
      };
    }

    // 4. Create a new ad creative with updated copy
    const newCreative = await metaPost<{ id: string }>(`/${accountId}/adcreatives`, accessToken, {
      object_story_spec: newSpec,
    });

    // 5. Update the ad to use the new creative
    await metaPost(`/${adId}`, accessToken, { creative: { creative_id: newCreative.id } });

    return NextResponse.json({ ok: true, creative_id: newCreative.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

interface ObjectStorySpec {
  page_id: string;
  link_data?: Record<string, unknown>;
  video_data?: Record<string, unknown>;
}
