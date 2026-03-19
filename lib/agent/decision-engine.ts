// lib/agent/decision-engine.ts
// Loads active learned rules per vertical at runtime.
// Falls back to defaults if no learnings exist yet.

import { loadRulesForVertical } from "./learning-engine";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

type Vertical = "leads" | "ecomm";

export interface AdSetSnapshot {
  ad_set_id: string;
  ad_account_id: string;
  campaign_id: string;
  spend: number;
  leads: number;
  cpl: number;
  ctr: number;
  frequency: number;
  impressions: number;
  current_budget: number;
  status: string;
}

export interface Decision {
  ad_set_id: string;
  action: "scale" | "pause" | "flag_review" | "creative_brief" | "none";
  reason: string;
  params?: Record<string, unknown>;
}

// ─── Main Decision Function ───────────────────────────────────────────────────

export async function makeDecisions(
  adSets: AdSetSnapshot[],
  clientId: string
): Promise<Decision[]> {
  // Get client's vertical
  const clientRows = await sql`
    SELECT vertical FROM clients WHERE id = ${clientId} LIMIT 1
  `;
  const vertical: Vertical =
    (clientRows[0] as { vertical: Vertical })?.vertical ?? "leads";

  // Load rules — learned rules overlay defaults automatically
  const rules = await loadRulesForVertical(vertical);

  console.log(`[DecisionEngine] Loaded rules for ${vertical}:`, rules);

  const decisions: Decision[] = [];

  for (const adSet of adSets) {
    const decision = evaluateAdSet(adSet, rules);
    if (decision.action !== "none") {
      decisions.push(decision);
    }
  }

  return decisions;
}

// ─── Per-AdSet Evaluation ─────────────────────────────────────────────────────

function evaluateAdSet(
  adSet: AdSetSnapshot,
  rules: Record<string, number>
): Decision {
  const {
    cpl_cap,
    scale_floor_cpl,
    frequency_cap,
    max_weekly_budget_increase,
    min_leads_before_scale,
  } = rules;

  // 1. Pause — CPL over cap
  if (adSet.cpl > cpl_cap && adSet.leads >= 3) {
    return {
      ad_set_id: adSet.ad_set_id,
      action: "pause",
      reason: `CPL $${adSet.cpl.toFixed(2)} exceeds cap of $${cpl_cap} (vertical rule)`,
    };
  }

  // 2. Creative brief — frequency too high
  if (adSet.frequency > frequency_cap) {
    return {
      ad_set_id: adSet.ad_set_id,
      action: "creative_brief",
      reason: `Frequency ${adSet.frequency.toFixed(2)} exceeds cap of ${frequency_cap} (vertical rule)`,
      params: { trigger: "frequency", value: adSet.frequency },
    };
  }

  // 3. Creative brief — CTR dropped significantly
  // (requires historical CTR stored in action_details — handled by agent loop)
  if (adSet.ctr < 0.005 && adSet.impressions > 1000) {
    return {
      ad_set_id: adSet.ad_set_id,
      action: "creative_brief",
      reason: `CTR ${(adSet.ctr * 100).toFixed(2)}% is critically low`,
      params: { trigger: "ctr", value: adSet.ctr },
    };
  }

  // 4. Scale — CPL under floor, enough leads to be confident
  if (
    adSet.cpl < scale_floor_cpl &&
    adSet.leads >= min_leads_before_scale &&
    adSet.status === "ACTIVE"
  ) {
    const increase = Math.min(
      adSet.current_budget * max_weekly_budget_increase,
      adSet.current_budget * 0.2 // hard cap at 20% regardless of learned rule
    );
    const new_budget = adSet.current_budget + increase;

    return {
      ad_set_id: adSet.ad_set_id,
      action: "scale",
      reason: `CPL $${adSet.cpl.toFixed(2)} under floor $${scale_floor_cpl} with ${adSet.leads} leads`,
      params: {
        current_budget: adSet.current_budget,
        new_budget: parseFloat(new_budget.toFixed(2)),
        increase_pct: max_weekly_budget_increase,
      },
    };
  }

  // 5. Flag for review — borderline CPL (within 20% of cap)
  if (adSet.cpl > cpl_cap * 0.8 && adSet.cpl <= cpl_cap) {
    return {
      ad_set_id: adSet.ad_set_id,
      action: "flag_review",
      reason: `CPL $${adSet.cpl.toFixed(2)} approaching cap of $${cpl_cap}`,
    };
  }

  return {
    ad_set_id: adSet.ad_set_id,
    action: "none",
    reason: "Within acceptable range",
  };
}
