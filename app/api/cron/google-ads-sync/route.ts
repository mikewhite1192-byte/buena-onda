// app/api/cron/google-ads-sync/route.ts
// Daily cron — refreshes Google Ads tokens and syncs campaign metrics for all connected users

export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { refreshGoogleAdsToken, getCampaignMetrics } from '@/lib/google-ads/client'
import { decryptToken, encryptToken } from '@/lib/crypto/tokens'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const connections = await sql`
    SELECT clerk_user_id, refresh_token, customer_id, manager_id
    FROM google_ads_connections
  `

  let synced = 0
  let errors = 0

  for (const conn of connections) {
    if (!conn.refresh_token || !conn.customer_id) {
      console.log(`[google-ads-sync] Skipping user ${conn.clerk_user_id} — missing refresh_token or customer_id`)
      continue
    }
    try {
      // Refresh access token (decrypt the stored refresh_token first; legacy
      // plaintext rows pass through unchanged).
      const refreshToken = decryptToken(conn.refresh_token as string)
      const accessToken = await refreshGoogleAdsToken(refreshToken)
      await sql`
        UPDATE google_ads_connections
        SET access_token = ${encryptToken(accessToken)}, updated_at = NOW()
        WHERE clerk_user_id = ${conn.clerk_user_id}
      `

      // Fetch last 7 days of campaign metrics
      const metrics = await getCampaignMetrics(
        accessToken,
        conn.customer_id as string,
        conn.manager_id as string | null
      )

      if (metrics.length === 0) {
        synced++
        continue
      }

      // Aggregate by campaign across dates → one row per campaign per day
      const today = new Date().toISOString().split('T')[0]

      // Group by campaignId, sum metrics across the 7-day window into a single today row
      const byCampaign = new Map<string, { name: string; impressions: number; clicks: number; costMicros: number; conversions: number }>()
      for (const m of metrics) {
        const existing = byCampaign.get(m.campaignId)
        if (!existing) {
          byCampaign.set(m.campaignId, {
            name: m.campaignName,
            impressions: m.impressions,
            clicks: m.clicks,
            costMicros: m.costMicros,
            conversions: m.conversions,
          })
        } else {
          existing.impressions += m.impressions
          existing.clicks += m.clicks
          existing.costMicros += m.costMicros
          existing.conversions += m.conversions
        }
      }

      for (const [campaignId, m] of byCampaign) {
        const spend = m.costMicros / 1_000_000
        const ctr = m.impressions > 0 ? m.clicks / m.impressions : 0
        const costPerConv = m.conversions > 0 ? spend / m.conversions : null

        await sql`
          INSERT INTO google_ad_metrics (
            clerk_user_id, customer_id, campaign_id, campaign_name,
            date_recorded, impressions, clicks, spend, conversions, cost_per_conv, ctr
          ) VALUES (
            ${conn.clerk_user_id}, ${conn.customer_id}, ${campaignId}, ${m.name},
            ${today}, ${m.impressions}, ${m.clicks}, ${spend}, ${m.conversions}, ${costPerConv}, ${ctr}
          )
          ON CONFLICT (clerk_user_id, campaign_id, date_recorded) DO UPDATE SET
            campaign_name = ${m.name},
            impressions   = ${m.impressions},
            clicks        = ${m.clicks},
            spend         = ${spend},
            conversions   = ${m.conversions},
            cost_per_conv = ${costPerConv},
            ctr           = ${ctr}
        `
      }

      synced++
    } catch (err) {
      console.error(`[google-ads-sync] Error for user ${conn.clerk_user_id}:`, err)
      errors++
    }
  }

  // Don't echo per-user metadata in the response — anyone who sees the
  // cron output (logs, monitor) gets a tenant census otherwise.
  return NextResponse.json({ synced, errors, total: connections.length })
}
