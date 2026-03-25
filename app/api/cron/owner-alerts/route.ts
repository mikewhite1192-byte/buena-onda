// app/api/cron/owner-alerts/route.ts
// Daily 8am UTC — sends Mike a WhatsApp digest + at-risk user alerts
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { sendWhatsAppMessage } from '@/lib/whatsapp/client'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ownerPhone = process.env.OWNER_WHATSAPP_NUMBER
  if (!ownerPhone) return NextResponse.json({ error: 'OWNER_WHATSAPP_NUMBER not set' }, { status: 500 })

  const now = new Date()
  const yesterday = new Date(now.getTime() - 86400000).toISOString()
  const last30 = new Date(now.getTime() - 30 * 86400000).toISOString()

  // New signups in last 24h
  const signups = await sql`
    SELECT COUNT(*) as count FROM user_subscriptions WHERE created_at >= ${yesterday}
  `.catch(() => [{ count: 0 }])

  // Active vs trial counts
  const subs = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'active') as active,
      COUNT(*) FILTER (WHERE status = 'trialing') as trialing,
      COUNT(*) FILTER (WHERE status IN ('cancelled','unpaid')) as churned_30d,
      COUNT(*) as total
    FROM user_subscriptions
  `.catch(() => [{ active: 0, trialing: 0, churned_30d: 0, total: 0 }])

  // Total ad spend last 30 days
  const spend = await sql`
    SELECT COALESCE(SUM(spend), 0) as total FROM ad_metrics WHERE date >= ${last30}
  `.catch(() => [{ total: 0 }])

  // Agent actions last 24h
  const actions = await sql`
    SELECT COUNT(*) as count FROM agent_actions WHERE created_at >= ${yesterday}
  `.catch(() => [{ count: 0 }])

  // Open tickets + feedback
  const tickets = await sql`
    SELECT COUNT(*) as count FROM support_tickets WHERE status = 'open'
  `.catch(() => [{ count: 0 }])
  const feedback = await sql`
    SELECT COUNT(*) as count FROM feedback_submissions WHERE status = 'open'
  `.catch(() => [{ count: 0 }])

  // At-risk users
  const atRisk = await sql`
    SELECT us.clerk_user_id, us.status, us.current_period_end,
           COUNT(DISTINCT c.id) as clients,
           COUNT(DISTINCT cb.id) as campaigns,
           MAX(aa.created_at) as last_action
    FROM user_subscriptions us
    LEFT JOIN clients c ON c.owner_id = us.clerk_user_id
    LEFT JOIN campaign_briefs cb ON cb.client_id = c.id
    LEFT JOIN agent_actions aa ON aa.campaign_brief_id = cb.id
    WHERE us.status IN ('active','trialing')
    GROUP BY us.clerk_user_id, us.status, us.current_period_end
  `.catch(() => [])

  const risks = atRisk.filter((u: Record<string, unknown>) => {
    const daysSinceAction = u.last_action
      ? (now.getTime() - new Date(u.last_action as string).getTime()) / 86400000
      : 999
    const trialExpiring = u.status === 'trialing' && u.current_period_end &&
      (new Date(u.current_period_end as string).getTime() - now.getTime()) / 86400000 <= 7
    return Number(u.clients) === 0 || Number(u.campaigns) === 0 || daysSinceAction > 14 || trialExpiring
  })

  const estMrr = Number(subs[0].active) * 197

  const lines = [
    `☀️ *Buena Onda Daily — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}*`,
    ``,
    `💰 Est. MRR: *$${estMrr.toLocaleString()}*`,
    `👥 Active: *${subs[0].active}* | Trial: *${subs[0].trialing}*`,
    `🆕 New signups (24h): *${signups[0].count}*`,
    `📊 Ad spend (30d): *$${Number(spend[0].total).toLocaleString('en-US', { maximumFractionDigits: 0 })}*`,
    `🤖 Agent actions (24h): *${actions[0].count}*`,
    ``,
    `🎫 Open tickets: *${tickets[0].count}* | Feedback: *${feedback[0].count}*`,
    ``,
  ]

  if (risks.length > 0) {
    lines.push(`⚠️ *${risks.length} at-risk user${risks.length > 1 ? 's' : ''}*`)
    risks.slice(0, 5).forEach((u: Record<string, unknown>) => {
      const flags = []
      if (Number(u.clients) === 0) flags.push('no clients')
      if (Number(u.campaigns) === 0 && Number(u.clients) > 0) flags.push('no campaigns')
      const daysSince = u.last_action
        ? Math.round((now.getTime() - new Date(u.last_action as string).getTime()) / 86400000)
        : null
      if (daysSince && daysSince > 14) flags.push(`${daysSince}d inactive`)
      if (u.status === 'trialing') flags.push('trial expiring')
      lines.push(`• ${(u.clerk_user_id as string).slice(0, 12)}… — ${flags.join(', ')}`)
    })
    lines.push(``)
    lines.push(`View all: https://buenaonda.ai/owner`)
  } else {
    lines.push(`✅ No at-risk users today`)
  }

  const message = lines.join('\n')
  await sendWhatsAppMessage(ownerPhone, message)

  return NextResponse.json({ ok: true, at_risk: risks.length })
}
