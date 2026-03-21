// POST /api/agent/ads/[campaignId] — approve (enable) or pause a campaign + all its ads/adsets
// Body: { action: "approve" | "pause", adAccountId: string }
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

async function metaPost(path: string, body: Record<string, unknown>) {
  const url = new URL(`${META_BASE}${path}`);
  url.searchParams.set("access_token", token());
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

  const newStatus = action === "approve" ? "ACTIVE" : "PAUSED";
  const { campaignId } = params;

  try {
    // 1. Set campaign status
    await metaPost(`/${campaignId}`, { status: newStatus });

    // 2. Fetch and update all ad sets
    const adsetsRes = await metaGet<{ data: { id: string }[] }>(`/${campaignId}/adsets`, {
      fields: "id", limit: "50",
    });
    await Promise.all((adsetsRes.data ?? []).map(as => metaPost(`/${as.id}`, { status: newStatus })));

    // 3. Fetch and update all ads
    const adsRes = await metaGet<{ data: { id: string }[] }>(`/${campaignId}/ads`, {
      fields: "id", limit: "50",
    });
    await Promise.all((adsRes.data ?? []).map(ad => metaPost(`/${ad.id}`, { status: newStatus })));

    return NextResponse.json({ ok: true, campaignId, status: newStatus });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
