// app/api/owner/stats/route.ts
// Owner-only aggregated platform stats with filters
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireOwner, isErrorResponse } from '@/lib/auth/owner'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  const ownerCheck = await requireOwner()
  if (isErrorResponse(ownerCheck)) return ownerCheck
  const { searchParams } = new URL(req.url)
  const range = searchParams.get('range') ?? '30d' // 7d | 30d | 90d | all
  const platform = searchParams.get('platform') ?? 'all'
  const vertical = searchParams.get('vertical') ?? 'all'

  const since = range === 'all' ? new Date('2020-01-01') :
    range === '90d' ? new Date(Date.now() - 90 * 86400000) :
    range === '7d'  ? new Date(Date.now() - 7  * 86400000) :
                      new Date(Date.now() - 30 * 86400000)

  const sinceStr = since.toISOString()

  // MRR — active subscriptions
  const [mrrRow] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status IN ('active','trialing')) as active_count,
      COUNT(*) FILTER (WHERE status = 'trialing') as trial_count,
      COUNT(*) FILTER (WHERE status IN ('cancelled','unpaid','incomplete_expired')) as churned_count,
      COUNT(*) as total_count
    FROM user_subscriptions
  `.catch(() => [{ active_count: 0, trial_count: 0, churned_count: 0, total_count: 0 }])

  // Signups in period
  const [signupRow] = await sql`
    SELECT COUNT(*) as new_signups
    FROM user_subscriptions
    WHERE created_at >= ${sinceStr}
  `.catch(() => [{ new_signups: 0 }])

  // Ad spend — filtered by platform/vertical
  const spendRows = await sql`
    SELECT COALESCE(SUM(m.spend), 0) as total_spend
    FROM ad_metrics m
    JOIN campaign_briefs cb ON cb.id = m.campaign_brief_id
    JOIN clients c ON c.id = cb.client_id
    WHERE m.date >= ${sinceStr}
      AND (${platform} = 'all' OR cb.platform = ${platform})
      AND (${vertical} = 'all' OR c.vertical = ${vertical})
  `.catch(() => [{ total_spend: 0 }])

  // Campaigns
  const [campRow] = await sql`
    SELECT
      COUNT(*) as total_campaigns,
      COUNT(*) FILTER (WHERE cb.status = 'active') as active_campaigns,
      COUNT(*) FILTER (WHERE cb.created_at >= ${sinceStr}) as new_campaigns
    FROM campaign_briefs cb
    JOIN clients c ON c.id = cb.client_id
    WHERE (${platform} = 'all' OR cb.platform = ${platform})
      AND (${vertical} = 'all' OR c.vertical = ${vertical})
  `.catch(() => [{ total_campaigns: 0, active_campaigns: 0, new_campaigns: 0 }])

  // Agent actions
  const [actionRow] = await sql`
    SELECT
      COUNT(*) as total_actions,
      COUNT(DISTINCT aa.action_type) as unique_action_types
    FROM agent_actions aa
    JOIN campaign_briefs cb ON cb.id = aa.campaign_brief_id
    JOIN clients c ON c.id = cb.client_id
    WHERE aa.created_at >= ${sinceStr}
      AND (${platform} = 'all' OR cb.platform = ${platform})
      AND (${vertical} = 'all' OR c.vertical = ${vertical})
  `.catch(() => [{ total_actions: 0, unique_action_types: 0 }])

  // Recommendations made vs used (from agent_actions)
  const [recRow] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE action_type LIKE '%recommend%' OR action_type = 'suggestion') as recommendations_made,
      COUNT(*) FILTER (WHERE action_type LIKE '%accept%' OR action_type = 'approved') as recommendations_used
    FROM agent_actions
    WHERE created_at >= ${sinceStr}
  `.catch(() => [{ recommendations_made: 0, recommendations_used: 0 }])

  // Ads created
  const [adsRow] = await sql`
    SELECT COUNT(*) as ads_created
    FROM agent_actions aa
    JOIN campaign_briefs cb ON cb.id = aa.campaign_brief_id
    WHERE aa.action_type ILIKE '%create%ad%' OR aa.action_type = 'ad_created'
      AND aa.created_at >= ${sinceStr}
  `.catch(() => [{ ads_created: 0 }])

  // Open tickets + feedback
  const [ticketRow] = await sql`
    SELECT COUNT(*) as open_tickets FROM support_tickets WHERE status = 'open'
  `.catch(() => [{ open_tickets: 0 }])

  const [feedbackRow] = await sql`
    SELECT COUNT(*) as open_feedback FROM feedback_submissions WHERE status = 'open'
  `.catch(() => [{ open_feedback: 0 }])

  // Affiliates
  const [affRow] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'approved') as active_affiliates,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_affiliates
    FROM affiliate_applications
  `.catch(() => [{ active_affiliates: 0, pending_affiliates: 0 }])

  const [refRow] = await sql`
    SELECT COUNT(*) as referrals_period
    FROM referrals
    WHERE created_at >= ${sinceStr}
  `.catch(() => [{ referrals_period: 0 }])

  const [payoutRow] = await sql`
    SELECT COALESCE(SUM(amount), 0) as pending_payouts
    FROM affiliate_payouts WHERE status = 'pending'
  `.catch(() => [{ pending_payouts: 0 }])

  // Ad spend by platform breakdown
  const spendByPlatform = await sql`
    SELECT cb.platform, COALESCE(SUM(m.spend), 0) as spend
    FROM ad_metrics m
    JOIN campaign_briefs cb ON cb.id = m.campaign_brief_id
    WHERE m.date >= ${sinceStr}
    GROUP BY cb.platform
    ORDER BY spend DESC
  `.catch(() => [])

  // Daily spend trend (last 30 days)
  const spendTrend = await sql`
    SELECT m.date::text, COALESCE(SUM(m.spend), 0) as spend
    FROM ad_metrics m
    JOIN campaign_briefs cb ON cb.id = m.campaign_brief_id
    JOIN clients c ON c.id = cb.client_id
    WHERE m.date >= ${sinceStr}
      AND (${platform} = 'all' OR cb.platform = ${platform})
      AND (${vertical} = 'all' OR c.vertical = ${vertical})
    GROUP BY m.date
    ORDER BY m.date ASC
  `.catch(() => [])

  return NextResponse.json({
    range,
    mrr: {
      active: Number(mrrRow.active_count),
      trialing: Number(mrrRow.trial_count),
      churned: Number(mrrRow.churned_count),
      total: Number(mrrRow.total_count),
      estimated_mrr: Number(mrrRow.active_count) * 197,
    },
    signups: Number(signupRow.new_signups),
    spend: {
      total: Number(spendRows[0]?.total_spend ?? 0),
      by_platform: spendByPlatform,
      trend: spendTrend,
    },
    campaigns: {
      total: Number(campRow.total_campaigns),
      active: Number(campRow.active_campaigns),
      new: Number(campRow.new_campaigns),
    },
    actions: {
      total: Number(actionRow.total_actions),
      recommendations_made: Number(recRow.recommendations_made),
      recommendations_used: Number(recRow.recommendations_used),
      acceptance_rate: recRow.recommendations_made > 0
        ? Math.round((recRow.recommendations_used / recRow.recommendations_made) * 100)
        : 0,
      ads_created: Number(adsRow.ads_created),
    },
    support: {
      open_tickets: Number(ticketRow.open_tickets),
      open_feedback: Number(feedbackRow.open_feedback),
    },
    affiliates: {
      active: Number(affRow.active_affiliates),
      pending: Number(affRow.pending_affiliates),
      referrals_period: Number(refRow.referrals_period),
      pending_payouts: Number(payoutRow.pending_payouts),
    },
  })
}
