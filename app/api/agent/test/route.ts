import { NextResponse } from "next/server";
import { runDecisionEngine } from "@/lib/agent/decision-engine";
import type { DecisionEngineInput } from "@/lib/agent/decision-engine";
import type { CampaignBrief } from "@/lib/db/schema";

const DUMMY_BRIEF: CampaignBrief = {
  id: "test-brief-001",
  client_id: null,
  offer: "Free benefits review → enroll in final expense life insurance coverage starting at $12/mo",
  avatar:
    "Seniors 60–80 on fixed income, worried about leaving burial costs to their family, looking for affordable guaranteed coverage with no medical exam",
  daily_budget: "150.00",
  cpl_cap: "35.00",
  scaling_rules: {
    increase_budget_if_cpl_below: 22,
    decrease_budget_if_cpl_above: 30,
    pause_if_cpl_above: 35,
    scale_multiplier: 1.3,
  },
  frequency_cap: 3,
  creative_asset_ids: ["120213001111", "120213002222", "120213003333"],
  ad_account_id: null,
  status: "active",
  created_at: new Date(),
  updated_at: new Date(),
};

const TEST_INPUT: DecisionEngineInput = {
  brief: DUMMY_BRIEF,

  // 3 ad sets: one healthy, one over CPL cap for 2 days, one with high frequency
  metrics: [
    // ── Ad Set A: Healthy — CPL well under cap, good CTR ──────────────────
    {
      adset_id: "adset_aaa111",
      adset_name: "Senior Women 65-75 | Burial Concern | Feed",
      impressions: 6200,
      clicks: 186,
      spend: 130.0,
      leads: 7,
      cpl: 18.57,
      ctr: 0.03,
      hook_rate: 0.34,
      frequency: 1.8,
      date: "2026-03-17",
    },
    {
      adset_id: "adset_aaa111",
      adset_name: "Senior Women 65-75 | Burial Concern | Feed",
      impressions: 5900,
      clicks: 177,
      spend: 124.5,
      leads: 6,
      cpl: 20.75,
      ctr: 0.03,
      hook_rate: 0.31,
      frequency: 2.0,
      date: "2026-03-18",
    },

    // ── Ad Set B: Over CPL cap for 2 consecutive days → should be paused ──
    {
      adset_id: "adset_bbb222",
      adset_name: "Senior Men 70-80 | Fixed Income | Feed",
      impressions: 8100,
      clicks: 170,
      spend: 148.0,
      leads: 3,
      cpl: 49.33,
      ctr: 0.021,
      hook_rate: 0.22,
      frequency: 2.4,
      date: "2026-03-17",
    },
    {
      adset_id: "adset_bbb222",
      adset_name: "Senior Men 70-80 | Fixed Income | Feed",
      impressions: 8900,
      clicks: 160,
      spend: 152.0,
      leads: 2,
      cpl: 76.0,
      ctr: 0.018,
      hook_rate: 0.19,
      frequency: 2.7,
      date: "2026-03-18",
    },

    // ── Ad Set C: High frequency, declining CTR → creative fatigue ─────────
    {
      adset_id: "adset_ccc333",
      adset_name: "Broad 60+ | Retirement Worry | Reels",
      impressions: 12400,
      clicks: 248,
      spend: 140.0,
      leads: 5,
      cpl: 28.0,
      ctr: 0.02,
      hook_rate: 0.26,
      frequency: 3.8,
      date: "2026-03-17",
    },
    {
      adset_id: "adset_ccc333",
      adset_name: "Broad 60+ | Retirement Worry | Reels",
      impressions: 14200,
      clicks: 227,
      spend: 138.0,
      leads: 4,
      cpl: 34.5,
      ctr: 0.016,
      hook_rate: 0.17,
      frequency: 4.6,
      date: "2026-03-18",
    },
  ],

  recent_actions: [
    {
      action: "scale",
      adset_id: "adset_aaa111",
      reason: "CPL held below $22 for 3 consecutive days",
      taken_at: "2026-03-15T10:00:00Z",
    },
  ],

  scale_cpl: 22,
  scale_days: 3,
  scale_budget: 195,
};

export async function GET() {
  try {
    const result = await runDecisionEngine(TEST_INPUT);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
