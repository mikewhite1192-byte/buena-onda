// app/api/ad-library/route.ts
// Searches the Meta Ad Library using the client's stored user access token
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams;
  const searchTerms = q.get("q");
  const country = q.get("country") ?? "US";
  const status = q.get("status") ?? "ACTIVE"; // ACTIVE | ALL
  const pageId = q.get("page_id") ?? "";
  const clientId = q.get("clientId") ?? "";
  const limit = Math.min(parseInt(q.get("limit") ?? "20"), 50);

  if (!searchTerms && !pageId) {
    return NextResponse.json({ error: "Provide q (search terms) or page_id" }, { status: 400 });
  }

  // Get a valid Meta user token from this user's clients
  const whereClause = clientId
    ? sql`owner_id = ${userId} AND id = ${clientId} AND meta_access_token IS NOT NULL`
    : sql`owner_id = ${userId} AND meta_access_token IS NOT NULL`;

  const rows = await sql`
    SELECT meta_access_token FROM clients
    WHERE ${whereClause}
    ORDER BY meta_token_expires_at DESC NULLS LAST
    LIMIT 1
  `;

  if (rows.length === 0 || !rows[0].meta_access_token) {
    return NextResponse.json({ error: "No connected Meta account found. Connect a client via Facebook first." }, { status: 403 });
  }

  const appToken = rows[0].meta_access_token as string;

  const url = new URL("https://graph.facebook.com/v21.0/ads_archive");
  url.searchParams.set("access_token", appToken);
  url.searchParams.set("ad_reached_countries", `["${country}"]`);
  url.searchParams.set("ad_active_status", status);
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set(
    "fields",
    [
      "id",
      "page_name",
      "page_id",
      "ad_creative_bodies",
      "ad_creative_link_titles",
      "ad_creative_link_descriptions",
      "ad_creative_link_captions",
      "ad_snapshot_url",
      "ad_delivery_start_time",
      "ad_delivery_stop_time",
      "impressions",
      "spend",
      "publisher_platforms",
      "languages",
    ].join(",")
  );

  if (searchTerms) url.searchParams.set("search_terms", searchTerms);
  if (pageId) url.searchParams.set("search_page_ids", `["${pageId}"]`);

  const res = await fetch(url.toString());
  const json = await res.json();

  if (!res.ok || json.error) {
    console.error("[ad-library]", json.error);
    return NextResponse.json(
      { error: json.error?.message ?? "Meta API error" },
      { status: res.status }
    );
  }

  return NextResponse.json({ ads: json.data ?? [], paging: json.paging ?? null });
}
