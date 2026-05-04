// POST /api/agent/ads/[campaignId] — approve (enable) or pause a campaign + all its ads/adsets
// Body: { action: "approve" | "pause", adAccountId: string }
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

async function metaPost(path: string, accessToken: string, body: Record<string, unknown>) {
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
  return data;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const action = body.action as "approve" | "pause";
  if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });
  const adAccountId = body.adAccountId as string | undefined;
  if (!adAccountId) return NextResponse.json({ error: "adAccountId required" }, { status: 400 });

  // Require the caller to own the ad account, then use that client's stored
  // Meta token instead of a platform-wide one. Without this, anyone could
  // pause/activate any Meta campaign by passing IDs they don't own.
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

  const newStatus = action === "approve" ? "ACTIVE" : "PAUSED";
  const { campaignId } = params;

  try {
    // 1. Set campaign status
    await metaPost(`/${campaignId}`, accessToken, { status: newStatus });

    // 2. Fetch and update all ad sets
    const adsetsRes = await metaGet<{ data: { id: string }[] }>(`/${campaignId}/adsets`, accessToken, {
      fields: "id", limit: "50",
    });
    await Promise.all((adsetsRes.data ?? []).map(as => metaPost(`/${as.id}`, accessToken, { status: newStatus })));

    // 3. Fetch and update all ads
    const adsRes = await metaGet<{ data: { id: string }[] }>(`/${campaignId}/ads`, accessToken, {
      fields: "id", limit: "50",
    });
    await Promise.all((adsRes.data ?? []).map(ad => metaPost(`/${ad.id}`, accessToken, { status: newStatus })));

    return NextResponse.json({ ok: true, campaignId, status: newStatus });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
