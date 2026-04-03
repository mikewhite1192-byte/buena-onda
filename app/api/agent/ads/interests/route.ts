// app/api/agent/ads/interests/route.ts
// Searches Meta's targeting interest suggestions.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getClientToken } from "@/lib/meta/get-client-token";

const META_BASE_URL = "https://graph.facebook.com/v21.0";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  const clientId = searchParams.get("client_id") ?? "";

  if (!query || query.length < 2) return NextResponse.json({ interests: [] });

  let token: string;
  try {
    token = clientId ? await getClientToken(clientId) : (process.env.META_ACCESS_TOKEN ?? "");
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
  if (!token) return NextResponse.json({ error: "Missing access token" }, { status: 500 });

  const url = new URL(`${META_BASE_URL}/search`);
  url.searchParams.set("type", "adinterest");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "15");
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();

  if (!res.ok || data.error) {
    return NextResponse.json({ error: data.error?.message ?? "Search failed" }, { status: 500 });
  }

  const interests = (data.data ?? []).map((i: { id: string; name: string; audience_size_lower_bound?: number; audience_size_upper_bound?: number }) => ({
    id: i.id,
    name: i.name,
    audience_size: i.audience_size_upper_bound ?? i.audience_size_lower_bound ?? null,
  }));

  return NextResponse.json({ interests });
}
