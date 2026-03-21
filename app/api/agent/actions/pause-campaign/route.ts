// app/api/agent/actions/pause-campaign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { isDemoAccount } from "@/lib/demo-data";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId, clientId } = await req.json();
  if (!campaignId || !clientId) return NextResponse.json({ error: "campaignId and clientId required" }, { status: 400 });

  // Fetch client token
  const [client] = await sql`SELECT meta_access_token, meta_ad_account_id FROM clients WHERE id = ${clientId} AND owner_id = ${userId} LIMIT 1`;
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Demo — simulate success
  if (isDemoAccount(client.meta_ad_account_id as string)) {
    return NextResponse.json({ success: true, campaignId, status: "PAUSED", demo: true });
  }

  const token = (client.meta_access_token as string) ?? process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "No access token" }, { status: 400 });

  const res = await fetch(`https://graph.facebook.com/v21.0/${campaignId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "PAUSED", access_token: token }),
  });
  const data = await res.json();

  if (!res.ok || data.error) {
    return NextResponse.json({ error: data.error?.message ?? "Meta API error" }, { status: 500 });
  }

  return NextResponse.json({ success: true, campaignId, status: "PAUSED" });
}
