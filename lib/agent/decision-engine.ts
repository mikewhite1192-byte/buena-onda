import Anthropic from "@anthropic-ai/sdk";
import type { CampaignBrief, AdMetric } from "@/lib/db/schema";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Output types ─────────────────────────────────────────────────────────────

export type ActionType = "pause" | "scale" | "duplicate" | "flag_fatigue" | "flag_review";
export type Urgency = "immediate" | "48hrs" | "monitoring";

export interface AgentAction {
  action: ActionType;
  adset_id: string;
  reason: string;
  new_budget?: number;
  urgency: Urgency;
}

export interface DecisionResult {
  actions: AgentAction[];
  evaluated_at: string;
}

// ── Types for inputs not sourced from DB ─────────────────────────────────────

export interface AdSetMetricSnapshot {
  adset_id: string;
  adset_name: string;
  impressions: number;
  clicks: number;
  spend: number;
  leads: number;
  cpl: number | null;
  ctr: number;
  hook_rate: number;        // 3-second video views / impressions
  frequency: number;
  date: string;
}

export interface RecentAction {
  action: string;
  adset_id: string;
  reason: string;
  taken_at: string;
}

export interface DecisionEngineInput {
  brief: CampaignBrief;
  metrics: AdSetMetricSnapshot[];    // multiple ad sets, multiple snapshots each
  recent_actions: RecentAction[];
  scale_cpl: number;                 // CPL floor that triggers scaling
  scale_days: number;                // consecutive days under floor before scaling
  scale_budget: number;              // target daily budget after scaling
}

// ── System prompt (exact) ─────────────────────────────────────────────────────

function buildSystemPrompt(input: DecisionEngineInput): string {
  const { brief, metrics, recent_actions, scale_cpl, scale_days, scale_budget } = input;

  const metricsText = metrics
    .map(
      (m) =>
        `Ad Set: ${m.adset_name} (${m.adset_id})
  Date: ${m.date}
  Impressions: ${m.impressions} | Clicks: ${m.clicks} | Spend: $${m.spend.toFixed(2)} (7-day total, ~$${(m.spend / 7).toFixed(2)}/day avg)
  Leads: ${m.leads} | CPL: ${m.cpl !== null ? `$${m.cpl.toFixed(2)}` : "n/a"}
  CTR: ${(m.ctr * 100).toFixed(2)}% | Hook Rate: ${(m.hook_rate * 100).toFixed(1)}% | Frequency: ${m.frequency.toFixed(2)}`
    )
    .join("\n\n");

  const recentActionsText =
    recent_actions.length > 0
      ? recent_actions
          .map((a) => `  [${a.taken_at}] ${a.action} on ${a.adset_id}: ${a.reason}`)
          .join("\n")
      : "  None";

  return `You are an autonomous Meta ads optimization agent managing final expense insurance campaigns.

You make decisions exactly like an experienced media buyer would. You are managing a campaign for the following client:

CAMPAIGN BRIEF:
- Avatar: ${brief.avatar}
- Offer: ${brief.offer}
- Daily Budget: $${brief.daily_budget}
- CPL Cap: $${brief.cpl_cap} — pause any ad set that exceeds this for 2 consecutive checks
- Scale CPL Floor: $${scale_cpl} — scale budget when CPL stays under this for ${scale_days} consecutive days
- Scale To: $${scale_budget}/day
- Frequency Cap: ${brief.frequency_cap} — flag creative fatigue when exceeded
- Scaling Rule: never change budget more than 30% in one action

CURRENT AD SET METRICS:
${metricsText}

RECENT ACTIONS TAKEN (last 7 days):
${recentActionsText}

DECISION RULES — follow these exactly:
1. If CPL exceeds cap for 2 consecutive snapshots → pause that ad set
2. If CPL is under scale floor for ${scale_days} consecutive days → emit flag_review with urgency "monitoring"; never emit a "scale" action — budget increases must always be approved by a human first; set new_budget to the recommended amount and state it in the reason
3. Before recommending any budget increase, sum up all scale or flag_review actions in recent_actions from the last 7 days to calculate cumulative % increase already applied this week; only recommend scaling if adding the new increase keeps the cumulative total under 20% for the 7-day period; if the 20% cap is already reached, do not recommend any increase — state this in the reason
4. For every budget increase recommendation, the reason field must include: current daily budget, recommended new budget, the % this single increase represents, and the cumulative % increase applied this week (including this recommendation) — and must end with "Requires human approval before executing"
5. If frequency exceeds cap → flag creative fatigue, schedule pause in 48hrs
6. If hook rate drops below 20% → flag creative fatigue
7. If CTR drops more than 30% week over week → flag creative fatigue
8. Never pause more than 2 ad sets in one cycle — flag for human review if more need pausing
9. Never change budget more than 30% in a single action
10. Spend figures shown are 7-day cumulative totals — always compare daily avg spend (total/7) against daily budget, never the raw total

Return ONLY a valid JSON array of actions. No explanation, no markdown, just the array:
[
  {
    "action": "pause|scale|duplicate|flag_fatigue|flag_review",
    "adset_id": "string",
    "reason": "specific reason referencing the actual metrics",
    "new_budget": optional number,
    "urgency": "immediate|48hrs|monitoring"
  }
]

If no action is needed return an empty array: []`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function runDecisionEngine(input: DecisionEngineInput): Promise<DecisionResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: buildSystemPrompt(input),
      },
    ],
  });

  const block = response.content.find(
    (b): b is Anthropic.Messages.TextBlock => b.type === "text"
  );
  if (!block) {
    throw new Error("Claude returned no content");
  }

  // Strip markdown code fences if present
  const raw = block.text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let actions: AgentAction[];
  try {
    actions = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse action JSON: ${raw.slice(0, 300)}`);
  }

  if (!Array.isArray(actions)) {
    throw new Error("Response is not a JSON array");
  }

  return {
    actions,
    evaluated_at: new Date().toISOString(),
  };
}
