// app/api/agent/actions/scale-budget/route.ts — Increase campaign daily budget by 20%
// Enforces Meta's 7-day rule: only one increase per campaign per 7 days
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { isDemoAccount } from "@/lib/demo-data";
import { logAction } from "@/lib/action-log";
import { decryptToken } from "@/lib/crypto/tokens";

const sql = neon(process.env.DATABASE_URL!);
const META_BASE = "https://graph.facebook.com/v21.0";

// Ensure tracking table exists (runs fast after first call)
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS campaign_budget_changes (
      id serial PRIMARY KEY,
      campaign_id text NOT NULL,
      client_id text NOT NULL,
      old_budget numeric,
      new_budget numeric,
      pct int,
      changed_at timestamptz DEFAULT now()
    )
  `;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId, clientId, campaignName, pct = 20 } = await req.json();
  if (!campaignId || !clientId) return NextResponse.json({ error: "campaignId and clientId required" }, { status: 400 });

  // Fetch client
  const [client] = await sql`SELECT meta_access_token, meta_ad_account_id, name FROM clients WHERE id = ${clientId} AND owner_id = ${userId} LIMIT 1`;
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Demo — simulate success (still enforce 7-day rule for realism)
  if (isDemoAccount(client.meta_ad_account_id as string)) {
    await ensureTable();
    const recent = await sql`
      SELECT changed_at FROM campaign_budget_changes
      WHERE campaign_id = ${campaignId} AND changed_at > now() - interval '7 days'
      ORDER BY changed_at DESC LIMIT 1
    `;
    if (recent[0]) {
      const nextAllowed = new Date(recent[0].changed_at as string);
      nextAllowed.setDate(nextAllowed.getDate() + 7);
      return NextResponse.json({ error: `Budget can only be increased once every 7 days. Next allowed: ${nextAllowed.toLocaleDateString()}` }, { status: 429 });
    }
    await sql`INSERT INTO campaign_budget_changes (campaign_id, client_id, pct) VALUES (${campaignId}, ${clientId}, ${pct})`;
    await logAction({ ownerId: userId, clientId, clientName: client.name as string, actionType: "scale_budget", description: `Increased budget 20% on "${campaignName ?? campaignId}"`, campaignId, campaignName: campaignName ?? undefined });
    return NextResponse.json({ success: true, campaignId, budgetIncreased: pct, demo: true });
  }

  const token = client.meta_access_token
    ? decryptToken(client.meta_access_token as string)
    : (process.env.META_ACCESS_TOKEN ?? "");
  if (!token) return NextResponse.json({ error: "No access token" }, { status: 400 });

  // Enforce 7-day rule
  await ensureTable();
  const recent = await sql`
    SELECT changed_at FROM campaign_budget_changes
    WHERE campaign_id = ${campaignId} AND changed_at > now() - interval '7 days'
    ORDER BY changed_at DESC LIMIT 1
  `;
  if (recent[0]) {
    const nextAllowed = new Date(recent[0].changed_at as string);
    nextAllowed.setDate(nextAllowed.getDate() + 7);
    return NextResponse.json({ error: `Budget can only be increased once every 7 days. Next allowed: ${nextAllowed.toLocaleDateString()}` }, { status: 429 });
  }

  // Fetch current campaign budget
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

  // Record the change
  await sql`INSERT INTO campaign_budget_changes (campaign_id, client_id, old_budget, new_budget, pct) VALUES (${campaignId}, ${clientId}, ${currentBudget / 100}, ${newBudget / 100}, ${pct})`;
  await logAction({ ownerId: userId, clientId, clientName: client.name as string, actionType: "scale_budget", description: `Increased budget 20% on "${campaignName ?? campaignId}" ($${(currentBudget/100).toFixed(0)} → $${(newBudget/100).toFixed(0)}/day)`, campaignId, campaignName: campaignName ?? undefined, metaBefore: { daily_budget: currentBudget / 100 }, metaAfter: { daily_budget: newBudget / 100 } });
  return NextResponse.json({ success: true, campaignId, oldBudget: currentBudget / 100, newBudget: newBudget / 100, pct });
}
