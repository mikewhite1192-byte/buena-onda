// app/api/owner/users/route.ts
// Returns all users with activity data + at-risk flags
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireOwner, isErrorResponse } from '@/lib/auth/owner'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  const ownerCheck = await requireOwner()
  if (isErrorResponse(ownerCheck)) return ownerCheck
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'all' // all | at_risk | trial | active | churned

  // Pre-aggregate each fact table separately, then join. The previous query
  // multiplied agent_actions × ad_metrics rows per campaign_brief, so a user
  // with 100 campaigns × 30 days of metrics × 50 agent_actions exploded into
  // 150k rows before GROUP BY — Vercel function would time out at ~100 users.
  const users = await sql`
    WITH
      client_counts AS (
        SELECT owner_id, COUNT(*)::int AS client_count FROM clients GROUP BY owner_id
      ),
      campaign_counts AS (
        SELECT c.owner_id, COUNT(cb.id)::int AS campaign_count
        FROM clients c LEFT JOIN campaign_briefs cb ON cb.client_id = c.id
        GROUP BY c.owner_id
      ),
      action_stats AS (
        SELECT c.owner_id,
               COUNT(aa.id)::int AS action_count,
               MAX(aa.created_at) AS last_action_at
        FROM clients c
        LEFT JOIN campaign_briefs cb ON cb.client_id = c.id
        LEFT JOIN agent_actions aa ON aa.campaign_brief_id = cb.id
        GROUP BY c.owner_id
      ),
      spend_stats AS (
        SELECT c.owner_id,
               COALESCE(SUM(m.spend), 0)::numeric(12,2) AS total_spend,
               MAX(m.date) AS last_metric_date
        FROM clients c
        LEFT JOIN campaign_briefs cb ON cb.client_id = c.id
        LEFT JOIN ad_metrics m ON m.campaign_brief_id = cb.id
        GROUP BY c.owner_id
      )
    SELECT
      us.clerk_user_id,
      us.status,
      us.plan_name,
      us.created_at AS subscribed_at,
      us.current_period_end,
      COALESCE(cc.client_count, 0)   AS client_count,
      COALESCE(camp.campaign_count, 0) AS campaign_count,
      COALESCE(act.action_count, 0)  AS action_count,
      COALESCE(sp.total_spend, 0)    AS total_spend,
      act.last_action_at,
      sp.last_metric_date
    FROM user_subscriptions us
    LEFT JOIN client_counts   cc   ON cc.owner_id   = us.clerk_user_id
    LEFT JOIN campaign_counts camp ON camp.owner_id = us.clerk_user_id
    LEFT JOIN action_stats    act  ON act.owner_id  = us.clerk_user_id
    LEFT JOIN spend_stats     sp   ON sp.owner_id   = us.clerk_user_id
    ORDER BY us.created_at DESC
  `.catch(() => [])

  // Flag at-risk users
  const now = new Date()
  const enriched = users.map((u: Record<string, unknown>) => {
    const risks: string[] = []
    const daysSinceSignup = (now.getTime() - new Date(u.subscribed_at as string).getTime()) / 86400000
    const daysSinceAction = u.last_action_at
      ? (now.getTime() - new Date(u.last_action_at as string).getTime()) / 86400000
      : 999

    if (Number(u.client_count) === 0 && daysSinceSignup > 2) risks.push('no_clients')
    if (Number(u.campaign_count) === 0 && daysSinceSignup > 3) risks.push('no_campaigns')
    if (Number(u.action_count) === 0 && daysSinceSignup > 5) risks.push('ai_unused')
    if (daysSinceAction > 14) risks.push('inactive_14d')
    if (u.status === 'trialing' && u.current_period_end) {
      const daysLeft = (new Date(u.current_period_end as string).getTime() - now.getTime()) / 86400000
      if (daysLeft <= 7 && daysLeft > 0) risks.push('trial_expiring')
    }

    return { ...u, risks, is_at_risk: risks.length > 0 } as Record<string, unknown> & { risks: string[]; is_at_risk: boolean; status: unknown }
  })

  const filtered = filter === 'at_risk' ? enriched.filter(u => u.is_at_risk) :
    filter === 'trial' ? enriched.filter(u => u.status === 'trialing') :
    filter === 'active' ? enriched.filter(u => u.status === 'active') :
    filter === 'churned' ? enriched.filter(u => ['cancelled','unpaid','incomplete_expired'].includes(u.status as string)) :
    enriched

  return NextResponse.json({ users: filtered, total: enriched.length })
}
