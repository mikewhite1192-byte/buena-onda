import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const APP_ID = process.env.META_APP_ID!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://buenaonda.ai";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "Missing clientId" }, { status: 400 });

  // Verify client belongs to this user
  const rows = await sql`SELECT id FROM clients WHERE id = ${clientId} AND owner_id = ${userId} LIMIT 1`;
  if (rows.length === 0) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const state = Buffer.from(JSON.stringify({ clientId, nonce: crypto.randomUUID() })).toString("base64url");
  const redirectUri = `${BASE_URL}/api/auth/facebook/callback`;

  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", APP_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "ads_management,ads_read,business_management,catalog_management,pages_manage_ads,pages_read_engagement,pages_show_list");
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");

  return NextResponse.redirect(url.toString());
}
