// lib/agent/decision-engine.ts
// Claude-powered AI decisions with rule-based fallback.

import Anthropic from "@anthropic-ai/sdk";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

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

// ─── Main Decision Function (Claude-powered) ──────────────────────────────────

export async function makeDecisions(
  adSets: AdSetSnapshot[],
  clientId: string
): Promise<Decision[]> {
  if (adSets.length === 0) return [];

  const clientRows = await sql`
    SELECT vertical, name, cpl_target, roas_target FROM clients WHERE id = ${clientId} LIMIT 1
  `.catch(() => []);
  const client = (clientRows[0] ?? {}) as {
    vertical?: string;
    name?: string;
    cpl_target?: string;
    roas_target?: string;
  };
  const vertical = (client.vertical ?? "leads") as Vertical;

  // Load active learned rules for context
  const learnings = await sql`
    SELECT pattern_description, rule_key, rule_value
    FROM agent_learnings
    WHERE vertical = ${vertical} AND is_active_rule = true
    ORDER BY confidence_score DESC LIMIT 5
  `.catch(() => []);

  const system = `You are an expert performance marketing AI with deep knowledge of Meta Ads optimization for ${vertical === "leads" ? "lead generation" : "e-commerce"} campaigns.

You analyze real ad set performance data and make intelligent decisions based on:
- Statistical confidence (more data = more decisive action)
- Cost efficiency vs. client goals
- Audience saturation signals (frequency)
- Creative fatigue indicators (low CTR, high frequency)
- Budget efficiency and scaling opportunities

${client.cpl_target ? `Client CPL target: $${client.cpl_target}` : `Typical ${vertical} CPL benchmark: ${vertical === "leads" ? "$20–$60" : "$30–$80"}`}
${client.roas_target ? `Client ROAS target: ${client.roas_target}x` : ""}
${learnings.length > 0 ? `\nLearned patterns from this account:\n${(learnings as Array<{ pattern_description?: string; rule_key?: string; rule_value?: string }>).map(l => `- ${l.pattern_description ?? `${l.rule_key}: ${l.rule_value}`}`).join("\n")}` : ""}

Decision criteria:
- "pause": CPL consistently over target with enough lead volume (3+ leads), or $20+ spend with zero conversions
- "scale": CPL well below target (>25% under) with statistical confidence (5+ leads), strong CTR
- "creative_brief": Frequency >3.0 AND CTR declining, or CTR <0.5% with 1000+ impressions
- "flag_review": Borderline metrics needing a human eye (CPL within 20% of target, mixed signals)
- "none": Performing within acceptable range — leave it alone

Be decisive with sufficient data. Be cautious with limited data. Never scale without enough conversion data. Always explain your reasoning briefly and specifically.`;

  const adContext = adSets.map(a => ({
    id: a.ad_set_id,
    spend_total: `$${a.spend.toFixed(2)}`,
    leads: a.leads,
    cpl: a.cpl > 0 ? `$${a.cpl.toFixed(2)}` : "no conversions yet",
    ctr: `${(a.ctr * 100).toFixed(2)}%`,
    frequency: a.frequency.toFixed(2),
    impressions: a.impressions.toLocaleString(),
    daily_budget: `$${a.current_budget.toFixed(2)}/day`,
    status: a.status,
  }));

  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system,
      messages: [
        {
          role: "user",
          content: `Analyze these ad sets and return your decisions as a JSON array:\n\n${JSON.stringify(adContext, null, 2)}\n\nReturn ONLY a valid JSON array:\n[\n  {\n    "ad_set_id": "...",\n    "action": "pause|scale|flag_review|creative_brief|none",\n    "reason": "specific reason in one sentence",\n    "params": { "new_budget": 50.00 }  // include only for scale actions — new daily budget in dollars\n  }\n]`,
        },
      ],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      console.warn("[DecisionEngine] Claude returned no JSON array, using rule fallback");
      return fallbackDecisions(adSets, vertical);
    }
    const parsed = JSON.parse(match[0]) as Decision[];
    const valid = parsed.filter(d => d.action && d.action !== "none");
    console.log(`[DecisionEngine] Claude decisions: ${valid.length} actions on ${adSets.length} ad sets`);
    return valid;
  } catch (err) {
    console.error("[DecisionEngine] Claude error, using rule fallback:", err);
    return fallbackDecisions(adSets, vertical);
  }
}

// ─── Rule-Based Fallback ──────────────────────────────────────────────────────
// Used when Claude is unavailable. Keeps the system working under any condition.

function fallbackDecisions(adSets: AdSetSnapshot[], vertical: Vertical): Decision[] {
  const cplCap = vertical === "leads" ? 30 : 50;
  const scaleFloor = vertical === "leads" ? 20 : 30;
  const freqCap = vertical === "leads" ? 3.0 : 4.0;

  const results: Decision[] = [];
  for (const adSet of adSets) {
    if (adSet.cpl > cplCap && adSet.leads >= 3) {
      results.push({ ad_set_id: adSet.ad_set_id, action: "pause", reason: `CPL $${adSet.cpl.toFixed(2)} exceeds $${cplCap} cap (fallback rule)` });
    } else if (adSet.frequency > freqCap) {
      results.push({ ad_set_id: adSet.ad_set_id, action: "creative_brief", reason: `Frequency ${adSet.frequency.toFixed(2)} exceeds ${freqCap} (fallback rule)`, params: { trigger: "frequency", value: adSet.frequency } });
    } else if (adSet.ctr < 0.005 && adSet.impressions > 1000) {
      results.push({ ad_set_id: adSet.ad_set_id, action: "creative_brief", reason: `CTR ${(adSet.ctr * 100).toFixed(2)}% critically low with ${adSet.impressions} impressions (fallback rule)` });
    } else if (adSet.cpl < scaleFloor && adSet.leads >= 5 && adSet.status === "ACTIVE") {
      const newBudget = parseFloat((adSet.current_budget * 1.2).toFixed(2));
      results.push({ ad_set_id: adSet.ad_set_id, action: "scale", reason: `CPL $${adSet.cpl.toFixed(2)} under floor $${scaleFloor} with ${adSet.leads} leads (fallback rule)`, params: { current_budget: adSet.current_budget, new_budget: newBudget } });
    } else if (adSet.cpl > cplCap * 0.8 && adSet.cpl <= cplCap) {
      results.push({ ad_set_id: adSet.ad_set_id, action: "flag_review", reason: `CPL $${adSet.cpl.toFixed(2)} approaching cap $${cplCap} (fallback rule)` });
    }
  }
  return results;
}
