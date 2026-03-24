export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdSetMetrics } from "@/lib/meta/actions";
import { pauseAdSet, scaleAdSet } from "@/lib/meta/actions";
import { makeDecisions } from "@/lib/agent/decision-engine";
import type { Decision, AdSetSnapshot } from "@/lib/agent/decision-engine";
import { runLearningEngine } from "@/lib/agent/learning-engine";
import { fetchAdInsightsForFatigue } from "@/lib/meta/insights";
import { runFatigueDetection } from "@/lib/agent/fatigue-detector";
import type { CampaignBrief } from "@/lib/db/schema";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { refreshGoogleAdsToken } from "@/lib/google-ads/client";
import { pauseCampaign, enableCampaign, updateCampaignBudget } from "@/lib/google-ads/campaigns";

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
      // 2a. Fetch metrics for each creative asset (ad set) in the brief
      const adSetSnapshots: AdSetSnapshot[] = [];

      for (const adsetId of brief.creative_asset_ids) {
        const result = await getAdSetMetrics(adsetId, 365);
        if (!result.ok) {
          console.warn(`[agent-loop] getAdSetMetrics failed for ${adsetId}: ${result.error}`);
          continue;
        }

        const m = result.data;
        adSetSnapshots.push({
          ad_set_id: m.adset_id,
          ad_account_id: brief.ad_account_id ?? process.env.META_AD_ACCOUNT_ID ?? '',
          campaign_id: '',
          spend: m.spend,
          leads: m.leads,
          cpl: m.cpl ?? 0,
          ctr: m.ctr,
          frequency: m.frequency,
          impressions: m.impressions,
          current_budget: parseFloat(brief.daily_budget),
          status: 'ACTIVE',
        });

        // Persist snapshot to ad_metrics for history + dashboard queries
        try {
          console.log('[ad_metrics] Attempting INSERT for', m.adset_id);
          await sql`
            INSERT INTO ad_metrics (
              campaign_brief_id,
              ad_set_id,
              ad_set_name,
              ad_account_id,
              date,
              date_recorded,
              impressions,
              clicks,
              spend,
              leads,
              cpl,
              ctr,
              frequency,
              ad_status,
              raw_metrics,
              metric_date,
              fetched_at
            ) VALUES (
              ${brief.id},
              ${m.adset_id},
              ${m.adset_name ?? null},
              ${brief.ad_account_id ?? process.env.META_AD_ACCOUNT_ID ?? null},
              NOW()::date,
              NOW(),
              ${m.impressions},
              ${m.clicks ?? 0},
              ${m.spend},
              ${m.leads},
              ${m.cpl ?? null},
              ${m.ctr ?? null},
              ${m.frequency ?? null},
              ${m.status ?? null},
              ${JSON.stringify(m.raw_metrics ?? {})},
              ${new Date().toISOString().split("T")[0]},
              NOW()
            )
            ON CONFLICT DO NOTHING
          `;
          console.log('[ad_metrics] INSERT success for', m.adset_id);
        } catch (insertErr) {
          console.error(`[agent-loop] ad_metrics INSERT FAILED for ${m.adset_id}:`, insertErr);
        }
      }

      briefSummary.adsets_evaluated = adSetSnapshots.length;

      if (adSetSnapshots.length === 0) {
        briefSummary.error = "No ad set metrics returned from Meta";
        summary.push(briefSummary);
        continue;
      }

      // 2b. Run the decision engine
      const decisions = await makeDecisions(adSetSnapshots, brief.client_id ?? '');

      // 2c. Execute each action + log to DB
      for (const decision of decisions) {
        if (decision.action === 'none') continue;

        const metaResult = await executeAction(decision, brief);

        // Log to agent_actions table regardless of meta result
        await sql`
          INSERT INTO agent_actions (campaign_brief_id, action_type, details, triggered_by)
          VALUES (
            ${brief.id},
            ${decision.action},
            ${JSON.stringify({
              adset_id: decision.ad_set_id,
              reason: decision.reason,
              new_budget: decision.params?.new_budget ?? null,
              meta_result: metaResult,
            })},
            'agent'
          )
        `;

        briefSummary.actions_taken.push({
          adset_id: decision.ad_set_id,
          action: decision.action,
          reason: decision.reason,
          meta_result: metaResult,
        });

        // Notify client owner via WhatsApp if they have a number set
        if (brief.client_id) {
          sql`
            SELECT us.whatsapp_number, c.name AS client_name
            FROM clients c
            JOIN user_subscriptions us ON us.clerk_user_id = c.owner_id
            WHERE c.id = ${brief.client_id}
              AND us.whatsapp_number IS NOT NULL
            LIMIT 1
          `.then(rows => {
            if (rows.length > 0) {
              const { whatsapp_number, client_name } = rows[0];
              const emoji = decision.action === 'pause' ? '⏸️' : decision.action === 'scale' ? '📈' : '🔍';
              const msg = `${emoji} *Agent Action — ${client_name}*\n\n*${decision.action.toUpperCase()}* on ad set ${decision.ad_set_id}\n*Reason:* ${decision.reason}\n*Result:* ${metaResult}\n\n_Reply to ask questions or give instructions._`;
              sendWhatsAppMessage(whatsapp_number, msg).catch(err =>
                console.error('[agent-loop] WhatsApp notify error:', err)
              );
            }
          }).catch(() => { /* non-fatal */ });
        }
      }
    } catch (err) {
      briefSummary.error = (err as Error).message;
      console.error(`[agent-loop] Error processing brief ${brief.id}:`, err);
    }

    summary.push(briefSummary);
  }

  // ── Google Ads Campaign Management ────────────────────────────────────────
  let google_actions_taken = 0;
  try {
    const googleConnections = await sql`
      SELECT clerk_user_id, refresh_token, customer_id, manager_id
      FROM google_ads_connections
      WHERE refresh_token IS NOT NULL AND customer_id IS NOT NULL
    `;

    for (const conn of googleConnections) {
      try {
        const accessToken = await refreshGoogleAdsToken(conn.refresh_token as string);

        // Get last 7 days of metrics aggregated by campaign
        const metrics = await sql`
          SELECT campaign_id, campaign_name,
            SUM(spend) AS total_spend,
            SUM(conversions) AS total_conversions,
            AVG(ctr) AS avg_ctr,
            MAX(date_recorded) AS last_date
          FROM google_ad_metrics
          WHERE clerk_user_id = ${conn.clerk_user_id}
            AND date_recorded >= NOW() - INTERVAL '7 days'
          GROUP BY campaign_id, campaign_name
        `;

        // Get user's campaign briefs for thresholds
        const googleBriefs = await sql`
          SELECT cb.*, c.cpl_target, c.roas_target
          FROM campaign_briefs cb
          LEFT JOIN clients c ON c.id = cb.client_id
          WHERE cb.platform = 'google'
            AND cb.google_customer_id = ${conn.customer_id}
            AND cb.status = 'active'
        `;

        for (const metric of metrics) {
          const spend = parseFloat(metric.total_spend as string ?? '0');
          const conversions = parseFloat(metric.total_conversions as string ?? '0');
          const cpa = conversions > 0 ? spend / conversions : null;

          // Match to brief for thresholds
          const brief = googleBriefs.find(b => b.google_campaign_resource_name?.includes(metric.campaign_id as string));
          const cpaCap = brief?.cpl_cap ? parseFloat(brief.cpl_cap as string) : null;
          const dailyBudget = brief?.daily_budget ? parseFloat(brief.daily_budget as string) : null;
          const campaignResourceName = `customers/${(conn.customer_id as string).replace(/-/g, '')}/campaigns/${metric.campaign_id}`;
          const budgetResourceName = brief?.google_budget_resource_name as string | undefined;

          if (cpaCap && cpa && conversions >= 3) {
            if (cpa > cpaCap * 1.3) {
              // Pause — CPA 30% over cap with enough data
              await pauseCampaign(accessToken, conn.customer_id as string, campaignResourceName, conn.manager_id as string | null);
              if (brief) {
                await sql`INSERT INTO agent_actions (campaign_brief_id, action_type, details, triggered_by)
                  VALUES (${brief.id}, 'pause', ${JSON.stringify({ campaign_id: metric.campaign_id, reason: `Google Ads CPA $${cpa?.toFixed(2)} exceeds cap $${cpaCap} by 30%`, platform: 'google' })}, 'agent')`;
              }
              google_actions_taken++;
            } else if (cpa < cpaCap * 0.7 && conversions >= 5 && dailyBudget && budgetResourceName) {
              // Scale — CPA 30% under cap with 5+ conversions
              const newBudget = dailyBudget * 1.2;
              await updateCampaignBudget(accessToken, conn.customer_id as string, budgetResourceName, newBudget, conn.manager_id as string | null);
              if (brief) {
                await sql`INSERT INTO agent_actions (campaign_brief_id, action_type, details, triggered_by)
                  VALUES (${brief.id}, 'scale', ${JSON.stringify({ campaign_id: metric.campaign_id, reason: `Google Ads CPA $${cpa?.toFixed(2)} well under cap $${cpaCap}`, new_budget: newBudget, platform: 'google' })}, 'agent')`;
              }
              google_actions_taken++;
            }
          }
        }
      } catch (err) {
        console.error(`[agent-loop] Google Ads processing error for user ${conn.clerk_user_id}:`, err);
      }
    }
  } catch (err) {
    console.error('[agent-loop] Google Ads section error:', err);
  }
  // ── End Google Ads Campaign Management ────────────────────────────────────

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

  // ── Learning Engine ────────────────────────────────────────────────────────
  try {
    await runLearningEngine();
    console.log('[AgentLoop] Learning engine complete.');
  } catch (err) {
    // Non-fatal — schema may not be migrated yet
    console.error('[agent-loop] Learning engine error:', err);
  }
  // ── End Learning Engine ────────────────────────────────────────────────────

  return NextResponse.json({
    ok: true,
    startedAt,
    completedAt: new Date().toISOString(),
    briefs_processed: briefs.length,
    fatigue_flagged,
    google_actions_taken,
    summary,
  });
}

// ── Action executor ───────────────────────────────────────────────────────────

async function executeAction(decision: Decision, brief: CampaignBrief): Promise<string> {
  const { action: type, ad_set_id: adset_id, params } = decision;
  const new_budget = params?.new_budget as number | undefined;

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

    case "creative_brief":
    case "flag_review":
      // No Meta API call — these are informational flags logged to DB only
      return `flagged (${type})`;

    default:
      return "unknown action type — skipped";
  }
}
