import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdSetMetrics } from "@/lib/meta/actions";
import { pauseAdSet, scaleAdSet, duplicateAdSet } from "@/lib/meta/actions";
import { runDecisionEngine } from "@/lib/agent/decision-engine";
import { fetchAdInsightsForFatigue } from "@/lib/meta/insights";
import { runFatigueDetection } from "@/lib/agent/fatigue-detector";
import type { CampaignBrief } from "@/lib/db/schema";
import type { AgentAction, AdSetMetricSnapshot, RecentAction } from "@/lib/agent/decision-engine";

// Vercel cron jobs call with a secret in the Authorization header.
// Set CRON_SECRET in env to secure this endpoint.
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured — allow (dev only)
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

interface BriefRow extends CampaignBrief {
  scale_cpl: number | null;
  scale_days: number | null;
  scale_budget: number | null;
  ad_account_id: string | null;
}

interface LoopSummaryItem {
  brief_id: string;
  adsets_evaluated: number;
  actions_taken: ActionLog[];
  error?: string;
}

interface ActionLog {
  adset_id: string;
  action: string;
  reason: string;
  meta_result: string;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  const summary: LoopSummaryItem[] = [];
  const startedAt = new Date().toISOString();

  // ── 1. Pull all active campaign briefs ────────────────────────────────────
  let briefs: BriefRow[];
  try {
    briefs = await sql<BriefRow[]>`
      SELECT
        cb.*,
        (cb.scaling_rules->>'increase_budget_if_cpl_below')::numeric  AS scale_cpl,
        (cb.scaling_rules->>'scale_days')::numeric                     AS scale_days,
        (cb.scaling_rules->>'scale_to_budget')::numeric                AS scale_budget
      FROM campaign_briefs cb
      WHERE cb.status = 'active'
    `;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `DB error fetching briefs: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  if (briefs.length === 0) {
    return NextResponse.json({ ok: true, message: "No active briefs", summary: [], startedAt });
  }

  // ── 2. Process each brief ─────────────────────────────────────────────────
  for (const brief of briefs) {
    const briefSummary: LoopSummaryItem = {
      brief_id: brief.id,
      adsets_evaluated: 0,
      actions_taken: [],
    };

    try {
      // 2a. Fetch recent agent actions for this brief (last 7 days)
      const recentRows = await sql<{ action_type: string; details: Record<string, unknown>; created_at: Date }[]>`
        SELECT action_type, details, created_at
        FROM agent_actions
        WHERE campaign_brief_id = ${brief.id}
          AND created_at > now() - interval '7 days'
        ORDER BY created_at DESC
        LIMIT 50
      `;

      const recentActions: RecentAction[] = recentRows.map((r) => ({
        action: r.action_type,
        adset_id: String(r.details.adset_id ?? ""),
        reason: String(r.details.reason ?? ""),
        taken_at: r.created_at.toISOString(),
      }));

      // 2b. Fetch metrics for each creative asset (ad set) in the brief
      const metricSnapshots: AdSetMetricSnapshot[] = [];

      for (const adsetId of brief.creative_asset_ids) {
        const result = await getAdSetMetrics(adsetId);
        if (!result.ok) {
          console.warn(`[agent-loop] getAdSetMetrics failed for ${adsetId}: ${result.error}`);
          continue;
        }

        const m = result.data;
        metricSnapshots.push({
          adset_id: m.adset_id,
          adset_name: m.adset_name,
          impressions: m.impressions,
          clicks: m.clicks,
          spend: m.spend,
          leads: m.leads,
          cpl: m.cpl,
          ctr: m.ctr,
          hook_rate: m.hook_rate ?? 0,
          frequency: m.frequency,
          date: m.date_stop || new Date().toISOString().slice(0, 10),
        });
      }

      briefSummary.adsets_evaluated = metricSnapshots.length;

      if (metricSnapshots.length === 0) {
        briefSummary.error = "No ad set metrics returned from Meta";
        summary.push(briefSummary);
        continue;
      }

      // 2c. Run the decision engine
      const decisionResult = await runDecisionEngine({
        brief,
        metrics: metricSnapshots,
        recent_actions: recentActions,
        scale_cpl: brief.scale_cpl ?? parseFloat(brief.cpl_cap) * 0.6,
        scale_days: brief.scale_days ?? 3,
        scale_budget: brief.scale_budget ?? parseFloat(brief.daily_budget) * 1.3,
      });

      // 2d. Execute each action + log to DB
      // Resolve the ad account ID — brief's value takes priority over env var
      const adAccountId = brief.ad_account_id ?? process.env.META_AD_ACCOUNT_ID;

      for (const agentAction of decisionResult.actions) {
        const metaResult = await executeAction(agentAction, brief, adAccountId);

        // Log to agent_actions table regardless of meta result
        await sql`
          INSERT INTO agent_actions (campaign_brief_id, action_type, details, triggered_by)
          VALUES (
            ${brief.id},
            ${agentAction.action},
            ${JSON.stringify({
              adset_id: agentAction.adset_id,
              reason: agentAction.reason,
              urgency: agentAction.urgency,
              new_budget: agentAction.new_budget ?? null,
              meta_result: metaResult,
            })},
            'agent'
          )
        `;

        briefSummary.actions_taken.push({
          adset_id: agentAction.adset_id,
          action: agentAction.action,
          reason: agentAction.reason,
          meta_result: metaResult,
        });
      }
    } catch (err) {
      briefSummary.error = (err as Error).message;
      console.error(`[agent-loop] Error processing brief ${brief.id}:`, err);
    }

    summary.push(briefSummary);
  }

  // ── Creative Fatigue Detection ─────────────────────────────────────────────
  console.log('[agent-loop] Running creative fatigue detection...')
  let fatigue_flagged = 0;
  try {
    const adInsights = await fetchAdInsightsForFatigue()
    console.log(`[agent-loop] Fetched insights for ${adInsights.length} active ads`)

    const fatigueResults = await runFatigueDetection(adInsights)
    const flagged = fatigueResults.filter(r => r.fatigued)
    fatigue_flagged = flagged.length;

    if (flagged.length > 0) {
      console.log(`[agent-loop] ⚠️  ${flagged.length} fatigued creative(s) detected and logged`)
      flagged.forEach(r => {
        console.log(`  → ${r.ad_name} | reason: ${r.trigger_reason} | freq: ${r.frequency.toFixed(2)} | CTR drop: ${(r.ctr_drop_pct * 100).toFixed(1)}%`)
      })
    } else {
      console.log('[agent-loop] ✅ No creative fatigue detected')
    }
  } catch (err) {
    // Non-fatal — log and continue, don't break the loop
    console.error('[agent-loop] Fatigue detection error:', err)
  }
  // ── End Fatigue Detection ──────────────────────────────────────────────────

  return NextResponse.json({
    ok: true,
    startedAt,
    completedAt: new Date().toISOString(),
    briefs_processed: briefs.length,
    fatigue_flagged,
    summary,
  });
}

// ── Action executor ───────────────────────────────────────────────────────────

async function executeAction(action: AgentAction, brief: CampaignBrief, adAccountId?: string): Promise<string> {
  const { action: type, adset_id, new_budget, urgency } = action;

  // Deferred actions are logged but not executed yet
  if (urgency === "48hrs" || urgency === "monitoring") {
    return `deferred (${urgency})`;
  }

  switch (type) {
    case "pause": {
      const res = await pauseAdSet(adset_id);
      return res.ok ? "paused" : `pause failed: ${res.error}`;
    }

    case "scale": {
      if (!new_budget) return "skipped — no new_budget provided";
      // Meta expects budget in cents
      const budgetCents = Math.round(new_budget * 100);
      const currentCents = Math.round(parseFloat(brief.daily_budget) * 100);
      // Guard: never change more than 30%
      const maxCents = Math.round(currentCents * 1.3);
      const safeCents = Math.min(budgetCents, maxCents);
      const res = await scaleAdSet(adset_id, safeCents);
      return res.ok ? `scaled to $${(safeCents / 100).toFixed(2)}/day` : `scale failed: ${res.error}`;
    }

    case "duplicate": {
      const budgetCents = new_budget
        ? Math.round(new_budget * 100)
        : Math.round(parseFloat(brief.daily_budget) * 100);
      const res = await duplicateAdSet(adset_id, budgetCents, adAccountId);
      return res.ok ? `duplicated → ${res.data.new_adset_id}` : `duplicate failed: ${res.error}`;
    }

    case "flag_fatigue":
    case "flag_review":
      // No Meta API call — these are informational flags logged to DB only
      return `flagged (${type})`;

    default:
      return "unknown action type — skipped";
  }
}
