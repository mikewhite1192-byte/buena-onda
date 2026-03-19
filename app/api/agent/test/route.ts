import { NextResponse } from "next/server";
import { makeDecisions } from "@/lib/agent/decision-engine";
import type { AdSetSnapshot } from "@/lib/agent/decision-engine";

const TEST_AD_SETS: AdSetSnapshot[] = [
  // ── Ad Set A: Healthy — CPL well under cap, good CTR ──────────────────────
  {
    ad_set_id: "adset_aaa111",
    ad_account_id: process.env.META_AD_ACCOUNT_ID ?? "test_account",
    campaign_id: "campaign_test",
    spend: 254.5,
    leads: 13,
    cpl: 19.58,
    ctr: 0.03,
    frequency: 1.9,
    impressions: 12100,
    current_budget: 150,
    status: "ACTIVE",
  },

  // ── Ad Set B: Over CPL cap → should be paused ─────────────────────────────
  {
    ad_set_id: "adset_bbb222",
    ad_account_id: process.env.META_AD_ACCOUNT_ID ?? "test_account",
    campaign_id: "campaign_test",
    spend: 300.0,
    leads: 5,
    cpl: 60.0,
    ctr: 0.019,
    frequency: 2.5,
    impressions: 17000,
    current_budget: 150,
    status: "ACTIVE",
  },

  // ── Ad Set C: High frequency → creative brief ────────────────────────────
  {
    ad_set_id: "adset_ccc333",
    ad_account_id: process.env.META_AD_ACCOUNT_ID ?? "test_account",
    campaign_id: "campaign_test",
    spend: 278.0,
    leads: 9,
    cpl: 30.9,
    ctr: 0.018,
    frequency: 3.9,
    impressions: 26600,
    current_budget: 150,
    status: "ACTIVE",
  },
];

export async function GET() {
  try {
    // Pass empty clientId — decision engine defaults to "leads" vertical
    const decisions = await makeDecisions(TEST_AD_SETS, "");
    return NextResponse.json({ ok: true, decisions });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
