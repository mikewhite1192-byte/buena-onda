// app/api/agent/actions/scale-budget/route.ts — Increase campaign daily budget by 20%
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { isDemoAccount } from "@/lib/demo-data";

const sql = neon(process.env.DATABASE_URL!);
const META_BASE = "https://graph.facebook.com/v21.0";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId, clientId, pct = 20 } = await req.json();
  if (!campaignId || !clientId) return NextResponse.json({ error: "campaignId and clientId required" }, { status: 400 });

  // Fetch client token
  const [client] = await sql`SELECT meta_access_token, meta_ad_account_id FROM clients WHERE id = ${clientId} AND owner_id = ${userId} LIMIT 1`;
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Demo — simulate success
  if (isDemoAccount(client.meta_ad_account_id as string)) {
    return NextResponse.json({ success: true, campaignId, budgetIncreased: pct, demo: true });
  }

  const token = (client.meta_access_token as string) ?? process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "No access token" }, { status: 400 });

  // Fetch current campaign to get daily_budget
  const getRes = await fetch(`${META_BASE}/${campaignId}?fields=daily_budget,name&access_token=${token}`);
  const getCampaign = await getRes.json();
  if (!getRes.ok || getCampaign.error) {
    return NextResponse.json({ error: getCampaign.error?.message ?? "Could not fetch campaign" }, { status: 500 });
  }

  const currentBudget = parseInt(getCampaign.daily_budget ?? "0", 10); // cents
  if (!currentBudget) {
    return NextResponse.json({ error: "Campaign has no daily_budget (may be using ad set budgets)" }, { status: 400 });
  }

  const newBudget = Math.round(currentBudget * (1 + pct / 100));

  const updateRes = await fetch(`${META_BASE}/${campaignId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ daily_budget: newBudget, access_token: token }),
  });
  const updateData = await updateRes.json();

  if (!updateRes.ok || updateData.error) {
    return NextResponse.json({ error: updateData.error?.message ?? "Meta API error" }, { status: 500 });
  }

  return NextResponse.json({ success: true, campaignId, oldBudget: currentBudget / 100, newBudget: newBudget / 100, pct });
}
