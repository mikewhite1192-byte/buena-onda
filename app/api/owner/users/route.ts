// app/api/owner/users/route.ts
// Returns all users with activity data + at-risk flags
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'all' // all | at_risk | trial | active | churned

  const users = await sql`
    SELECT
      us.clerk_user_id,
      us.status,
      us.plan_name,
      us.created_at as subscribed_at,
      us.current_period_end,
      COUNT(DISTINCT c.id) as client_count,
      COUNT(DISTINCT cb.id) as campaign_count,
      COUNT(DISTINCT aa.id) as action_count,
      COALESCE(SUM(m.spend), 0) as total_spend,
      MAX(aa.created_at) as last_action_at,
      MAX(m.date) as last_metric_date
    FROM user_subscriptions us
    LEFT JOIN clients c ON c.owner_id = us.clerk_user_id
    LEFT JOIN campaign_briefs cb ON cb.client_id = c.id
    LEFT JOIN agent_actions aa ON aa.campaign_brief_id = cb.id
    LEFT JOIN ad_metrics m ON m.campaign_brief_id = cb.id
    GROUP BY us.clerk_user_id, us.status, us.plan_name, us.created_at, us.current_period_end
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
