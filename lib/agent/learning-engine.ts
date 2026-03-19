// lib/agent/learning-engine.ts
// Runs after each agent loop cycle.
// Analyzes action outcomes, detects patterns per vertical,
// updates active rules in agent_learnings.

import Anthropic from "@anthropic-ai/sdk";
import { neon } from "@neondatabase/serverless";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const sql = neon(process.env.DATABASE_URL!);

// ─── Types ────────────────────────────────────────────────────────────────────

type Vertical = "leads" | "ecomm";

interface ActionWithOutcome {
  id: number;
  ad_set_id: string;
  action_type: string;
  action_details: Record<string, unknown>;
  cpl_before: number | null;
  cpl_after: number | null;
  ctr_before: number | null;
  ctr_after: number | null;
  frequency_before: number | null;
  frequency_after: number | null;
  spend_before: number | null;
  spend_after: number | null;
  status: string;
  vertical: Vertical;
  created_at: string;
}

interface ActiveRule {
  id: number;
  rule_key: string;
  rule_value: number;
  vertical: Vertical;
  confidence_score: number;
  times_observed: number;
  pattern_description: string;
}

interface LearningOutput {
  rule_key: string;
  rule_value: number;
  pattern_type: string;
  pattern_description: string;
  action_recommendation: string;
  confidence_score: number;
  times_observed: number;
  supporting_data: Record<string, unknown>;
}

// ─── Default Rules (fallback when no learnings exist) ─────────────────────────

const DEFAULT_RULES: Record<Vertical, Record<string, number>> = {
  leads: {
    cpl_cap: 30,
    scale_floor_cpl: 20,
    frequency_cap: 3.0,
    ctr_drop_threshold: 0.3,
    max_weekly_budget_increase: 0.2,
    min_leads_before_scale: 5,
  },
  ecomm: {
    cpl_cap: 50, // cost per purchase
    scale_floor_cpl: 30,
    frequency_cap: 4.0,
    ctr_drop_threshold: 0.25,
    max_weekly_budget_increase: 0.2,
    min_leads_before_scale: 10,
  },
};

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export async function runLearningEngine(): Promise<void> {
  console.log("[LearningEngine] Starting...");

  // Process each vertical independently
  await Promise.all([
    processVertical("leads"),
    processVertical("ecomm"),
  ]);

  console.log("[LearningEngine] Done.");
}

async function processVertical(vertical: Vertical): Promise<void> {
  console.log(`[LearningEngine] Analyzing vertical: ${vertical}`);

  const [actions, activeRules] = await Promise.all([
    fetchActionsWithOutcomes(vertical),
    fetchActiveRules(vertical),
  ]);

  if (actions.length < 5) {
    console.log(`[LearningEngine] Not enough data for ${vertical}, skipping.`);
    return;
  }

  const newLearnings = await analyzeWithClaude(vertical, actions, activeRules);

  if (newLearnings.length === 0) {
    console.log(`[LearningEngine] No new learnings for ${vertical}.`);
    return;
  }

  await persistLearnings(vertical, newLearnings, activeRules);
  console.log(
    `[LearningEngine] Wrote ${newLearnings.length} learnings for ${vertical}.`
  );
}

// ─── Fetch Data ───────────────────────────────────────────────────────────────

async function fetchActionsWithOutcomes(
  vertical: Vertical
): Promise<ActionWithOutcome[]> {
  // Join agent_actions with ad_metrics (before/after) and clients (vertical)
  const rows = await sql`
    SELECT
      aa.id,
      aa.ad_set_id,
      aa.action_type,
      aa.action_details,
      aa.status,
      aa.created_at,
      c.vertical,
      -- metrics snapshot before action
      m_before.cpl   AS cpl_before,
      m_before.ctr   AS ctr_before,
      m_before.frequency AS frequency_before,
      m_before.spend AS spend_before,
      -- metrics snapshot 24-48h after action
      m_after.cpl    AS cpl_after,
      m_after.ctr    AS ctr_after,
      m_after.frequency AS frequency_after,
      m_after.spend  AS spend_after
    FROM agent_actions aa
    JOIN clients c ON c.meta_ad_account_id = aa.ad_account_id
    -- closest metric row before the action
    LEFT JOIN LATERAL (
      SELECT cpl, ctr, frequency, spend
      FROM ad_metrics
      WHERE ad_set_id = aa.ad_set_id
        AND date_recorded <= aa.created_at
      ORDER BY date_recorded DESC
      LIMIT 1
    ) m_before ON true
    -- closest metric row 24-48h after the action
    LEFT JOIN LATERAL (
      SELECT cpl, ctr, frequency, spend
      FROM ad_metrics
      WHERE ad_set_id = aa.ad_set_id
        AND date_recorded >= aa.created_at + INTERVAL '24 hours'
        AND date_recorded <= aa.created_at + INTERVAL '48 hours'
      ORDER BY date_recorded ASC
      LIMIT 1
    ) m_after ON true
    WHERE c.vertical = ${vertical}
      AND aa.created_at > NOW() - INTERVAL '30 days'
      AND aa.status IN ('executed', 'approved')
      AND m_before.cpl IS NOT NULL
    ORDER BY aa.created_at DESC
    LIMIT 300
  `;

  return rows as ActionWithOutcome[];
}

async function fetchActiveRules(vertical: Vertical): Promise<ActiveRule[]> {
  const rows = await sql`
    SELECT id, rule_key, rule_value, vertical, confidence_score,
           times_observed, pattern_description
    FROM agent_learnings
    WHERE vertical = ${vertical}
      AND is_active_rule = true
      AND rule_key IS NOT NULL
    ORDER BY confidence_score DESC
  `;
  return rows as ActiveRule[];
}

// ─── Claude Analysis ──────────────────────────────────────────────────────────

async function analyzeWithClaude(
  vertical: Vertical,
  actions: ActionWithOutcome[],
  activeRules: ActiveRule[]
): Promise<LearningOutput[]> {
  const currentRules = buildCurrentRulesMap(vertical, activeRules);
  const outcomesByActionType = groupOutcomesByActionType(actions);

  const prompt = `
VERTICAL: ${vertical}

CURRENT ACTIVE RULES:
${JSON.stringify(currentRules, null, 2)}

ACTION OUTCOMES (grouped by action type):
${JSON.stringify(outcomesByActionType, null, 2)}

Analyze these outcomes and determine if any rules should be adjusted for the ${vertical} vertical.

For each rule you think should change, provide the new recommended value based on what's actually working.
Only suggest changes you can back up with at least 3 data points and a clear directional trend.
If current rules are performing well, return an empty array.

For context on this vertical:
${
  vertical === "leads"
    ? "This is final expense life insurance lead generation. CPL is cost per lead form submission. Lower CPL = better. Typical good CPL is $15-$25."
    : "This is ecommerce. CPL here means cost per purchase/conversion. ROAS matters more than raw CPL."
}
`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    system: `You are the learning engine for Buena Onda, an AI agent that manages Meta ad campaigns.

Your job: look at what actions the agent took and what happened to CPL/CTR afterward. Find patterns. Recommend rule adjustments per vertical.

Respond ONLY with a valid JSON array. No markdown, no preamble.

Each object must have:
{
  "rule_key": string,           // must match a key from CURRENT ACTIVE RULES or DEFAULT_RULES
  "rule_value": number,         // the new recommended value
  "pattern_type": string,       // "threshold_adjustment" | "scaling_signal" | "fatigue_signal" | "budget_pattern"
  "pattern_description": string, // 1-2 sentences on what you observed
  "action_recommendation": string, // what the agent should do with this
  "confidence_score": number,   // 0.0-1.0
  "times_observed": number,     // data points supporting this
  "supporting_data": object     // key stats
}

Valid rule_keys: cpl_cap, scale_floor_cpl, frequency_cap, ctr_drop_threshold, max_weekly_budget_increase, min_leads_before_scale

Only include changes where confidence_score >= 0.5 and times_observed >= 3.
Return [] if nothing qualifies.`,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error("[LearningEngine] Parse error:", raw);
    return [];
  }
}

// ─── Persist Learnings ────────────────────────────────────────────────────────

async function persistLearnings(
  vertical: Vertical,
  newLearnings: LearningOutput[],
  activeRules: ActiveRule[]
): Promise<void> {
  for (const learning of newLearnings) {
    // Find existing active rule for this key in this vertical
    const existing = activeRules.find((r) => r.rule_key === learning.rule_key);

    // If value hasn't meaningfully changed (< 5%), skip
    if (existing) {
      const changePct =
        Math.abs(existing.rule_value - learning.rule_value) /
        existing.rule_value;
      if (changePct < 0.05) {
        console.log(
          `[LearningEngine] ${vertical}/${learning.rule_key} change < 5%, skipping.`
        );
        continue;
      }
    }

    // Insert new active rule
    const inserted = await sql`
      INSERT INTO agent_learnings (
        vertical,
        pattern_type,
        pattern_description,
        action_recommendation,
        confidence_score,
        times_observed,
        supporting_data,
        rule_key,
        rule_value,
        is_active_rule
      ) VALUES (
        ${vertical},
        ${learning.pattern_type},
        ${learning.pattern_description},
        ${learning.action_recommendation},
        ${learning.confidence_score},
        ${learning.times_observed},
        ${JSON.stringify(learning.supporting_data)},
        ${learning.rule_key},
        ${learning.rule_value},
        true
      )
      RETURNING id
    `;

    const newId = (inserted[0] as { id: number }).id;

    // Deactivate the old rule and link it to the new one
    if (existing) {
      await sql`
        UPDATE agent_learnings
        SET is_active_rule = false,
            superseded_by = ${newId}
        WHERE id = ${existing.id}
      `;

      console.log(
        `[LearningEngine] ${vertical}/${learning.rule_key}: ${existing.rule_value} → ${learning.rule_value} (confidence: ${learning.confidence_score})`
      );
    } else {
      console.log(
        `[LearningEngine] ${vertical}/${learning.rule_key}: new rule = ${learning.rule_value}`
      );
    }
  }
}

// ─── Rule Loader (used by decision engine at runtime) ─────────────────────────

export async function loadRulesForVertical(
  vertical: Vertical
): Promise<Record<string, number>> {
  const activeRules = await fetchActiveRules(vertical);

  // Start with defaults, overlay with learned rules
  const rules = { ...DEFAULT_RULES[vertical] };

  for (const rule of activeRules) {
    rules[rule.rule_key] = Number(rule.rule_value);
  }

  return rules;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCurrentRulesMap(
  vertical: Vertical,
  activeRules: ActiveRule[]
): Record<string, number> {
  const rules = { ...DEFAULT_RULES[vertical] };
  for (const rule of activeRules) {
    rules[rule.rule_key] = Number(rule.rule_value);
  }
  return rules;
}

function groupOutcomesByActionType(
  actions: ActionWithOutcome[]
): Record<string, unknown> {
  const groups: Record<
    string,
    {
      count: number;
      avg_cpl_before: number;
      avg_cpl_after: number;
      avg_cpl_delta: number;
      avg_ctr_delta: number;
      avg_frequency_before: number;
      positive_outcomes: number;
      negative_outcomes: number;
    }
  > = {};

  for (const a of actions) {
    if (a.cpl_before === null || a.cpl_after === null) continue;

    const key = a.action_type;
    if (!groups[key]) {
      groups[key] = {
        count: 0,
        avg_cpl_before: 0,
        avg_cpl_after: 0,
        avg_cpl_delta: 0,
        avg_ctr_delta: 0,
        avg_frequency_before: 0,
        positive_outcomes: 0,
        negative_outcomes: 0,
      };
    }

    const g = groups[key];
    g.count++;
    g.avg_cpl_before += a.cpl_before;
    g.avg_cpl_after += a.cpl_after;
    g.avg_cpl_delta += a.cpl_after - a.cpl_before;
    g.avg_ctr_delta += (a.ctr_after ?? 0) - (a.ctr_before ?? 0);
    g.avg_frequency_before += a.frequency_before ?? 0;

    if (a.cpl_after < a.cpl_before) g.positive_outcomes++;
    else g.negative_outcomes++;
  }

  // Convert sums to averages
  for (const key of Object.keys(groups)) {
    const g = groups[key];
    const n = g.count;
    g.avg_cpl_before = round(g.avg_cpl_before / n, 2);
    g.avg_cpl_after = round(g.avg_cpl_after / n, 2);
    g.avg_cpl_delta = round(g.avg_cpl_delta / n, 2);
    g.avg_ctr_delta = round(g.avg_ctr_delta / n, 4);
    g.avg_frequency_before = round(g.avg_frequency_before / n, 2);
  }

  return groups;
}

function round(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}
