import Anthropic from '@anthropic-ai/sdk'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Thresholds ────────────────────────────────────────────────────────────────
const FREQUENCY_THRESHOLD = 3.0
const CTR_DROP_THRESHOLD = 0.30  // 30% week-over-week drop

export interface AdInsights {
  ad_id: string
  ad_name: string
  ad_set_id: string
  campaign_id: string
  frequency: number
  ctr: number           // this week (0–1 scale, e.g. 0.015 = 1.5%)
  ctr_previous: number  // last week
  spend: number
  impressions: number
  clicks: number
}

export interface FatigueResult {
  fatigued: boolean
  ad_id: string
  ad_name: string
  trigger_reason: 'frequency' | 'ctr_drop' | 'both' | null
  frequency: number
  ctr_current: number
  ctr_previous: number
  ctr_drop_pct: number
  replacement_brief?: string
}

// ─── Core detection logic ──────────────────────────────────────────────────────
export function detectFatigue(ad: AdInsights): Omit<FatigueResult, 'replacement_brief'> {
  const frequencyTriggered = ad.frequency > FREQUENCY_THRESHOLD

  const ctrDropPct = ad.ctr_previous > 0
    ? (ad.ctr_previous - ad.ctr) / ad.ctr_previous
    : 0
  const ctrTriggered = ctrDropPct > CTR_DROP_THRESHOLD

  let trigger_reason: FatigueResult['trigger_reason'] = null
  if (frequencyTriggered && ctrTriggered) trigger_reason = 'both'
  else if (frequencyTriggered) trigger_reason = 'frequency'
  else if (ctrTriggered) trigger_reason = 'ctr_drop'

  return {
    fatigued: trigger_reason !== null,
    ad_id: ad.ad_id,
    ad_name: ad.ad_name,
    trigger_reason,
    frequency: ad.frequency,
    ctr_current: ad.ctr,
    ctr_previous: ad.ctr_previous,
    ctr_drop_pct: ctrDropPct,
  }
}

// ─── Claude generates a replacement creative brief ─────────────────────────────
async function generateReplacementBrief(ad: AdInsights, reason: string): Promise<string> {
  const prompt = `You are the AI brain of Buena Onda, an autonomous Meta ads management system for final expense life insurance agents.

The following ad has been flagged for creative fatigue:

Ad Name: ${ad.ad_name}
Ad ID: ${ad.ad_id}
Ad Set ID: ${ad.ad_set_id}
Campaign ID: ${ad.campaign_id}
Frequency (7d): ${ad.frequency.toFixed(2)} (threshold: ${FREQUENCY_THRESHOLD})
CTR This Week: ${(ad.ctr * 100).toFixed(2)}%
CTR Last Week: ${(ad.ctr_previous * 100).toFixed(2)}%
Fatigue Reason: ${reason}

Generate a replacement creative brief. The audience is seniors 55-75 considering final expense life insurance.
Dark humor and emotional family hooks perform well. iPhone-style raw video outperforms polished production.

Return ONLY a JSON object with these fields:
{
  "hook": "Opening line or visual concept (first 3 seconds)",
  "angle": "Core emotional angle (e.g. 'family guilt', 'funeral cost shock', 'dark humor relief')",
  "script_outline": "3-4 sentence outline of the ad script",
  "visual_direction": "Shot style, setting, tone",
  "cta": "Call to action text",
  "why_this_will_work": "1-2 sentences on why this replaces the fatigued creative"
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content.find(b => b.type === 'text')?.text ?? '{}'
  return text.replace(/```json|```/g, '').trim()
}

// ─── Log fatigue to DB ─────────────────────────────────────────────────────────
async function logFatigue(result: FatigueResult): Promise<void> {
  // Skip if already flagged and unactioned within last 7 days
  const existing = await sql`
    SELECT id FROM creative_fatigue_log
    WHERE ad_id = ${result.ad_id}
      AND status = 'flagged'
      AND detected_at > NOW() - INTERVAL '7 days'
    LIMIT 1
  `
  if (existing.length > 0) {
    console.log(`[fatigue] Ad ${result.ad_id} already flagged this week, skipping`)
    return
  }

  await sql`
    INSERT INTO creative_fatigue_log (
      ad_id, ad_name, ad_set_id, campaign_id,
      trigger_reason, frequency,
      ctr_current, ctr_previous, ctr_drop_pct,
      replacement_brief, status
    ) VALUES (
      ${result.ad_id}, ${result.ad_name}, '', '',
      ${result.trigger_reason}, ${result.frequency},
      ${result.ctr_current}, ${result.ctr_previous}, ${result.ctr_drop_pct},
      ${result.replacement_brief ?? null}, 'flagged'
    )
  `
  console.log(`[fatigue] Logged fatigue for ad ${result.ad_id} — reason: ${result.trigger_reason}`)
}

// ─── Main export: run fatigue check on a list of ads ──────────────────────────
export async function runFatigueDetection(ads: AdInsights[]): Promise<FatigueResult[]> {
  const results: FatigueResult[] = []

  for (const ad of ads) {
    const detection = detectFatigue(ad)

    if (!detection.fatigued) {
      results.push({ ...detection, replacement_brief: undefined })
      continue
    }

    console.log(`[fatigue] 🚨 Fatigue detected: ${ad.ad_name} (${detection.trigger_reason})`)

    // Generate replacement brief via Claude
    const replacement_brief = await generateReplacementBrief(ad, detection.trigger_reason!)

    const fullResult: FatigueResult = { ...detection, replacement_brief }
    await logFatigue(fullResult)
    results.push(fullResult)
  }

  const flaggedCount = results.filter(r => r.fatigued).length
  console.log(`[fatigue] Scan complete — ${flaggedCount}/${ads.length} ads flagged`)

  return results
}
