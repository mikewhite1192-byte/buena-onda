export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { refreshTikTokToken, getTikTokCampaignMetrics } from '@/lib/tiktok-ads/client'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const connections = await sql`SELECT clerk_user_id, access_token, refresh_token, advertiser_id, token_expires_at FROM tiktok_ads_connections`

  let synced = 0
  let errors = 0

  for (const conn of connections) {
    if (!conn.advertiser_id) continue
    try {
      // Refresh token if expiring within 1 hour
      let accessToken = conn.access_token as string
      const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at as string) : null
      if (conn.refresh_token && expiresAt && expiresAt.getTime() - Date.now() < 3600000) {
        const refreshed = await refreshTikTokToken(conn.refresh_token as string)
        accessToken = refreshed.access_token
        const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
        await sql`
          UPDATE tiktok_ads_connections SET
            access_token = ${accessToken},
            refresh_token = ${refreshed.refresh_token ?? conn.refresh_token},
            token_expires_at = ${newExpiry},
            updated_at = NOW()
          WHERE clerk_user_id = ${conn.clerk_user_id}
        `
      }

      const metrics = await getTikTokCampaignMetrics(accessToken, conn.advertiser_id as string)
      const today = new Date().toISOString().split('T')[0]

      for (const m of metrics) {
        await sql`
          INSERT INTO tiktok_ad_metrics (
            clerk_user_id, advertiser_id, campaign_id, campaign_name, campaign_status,
            date_recorded, impressions, clicks, spend, conversions, cpa, ctr, video_play_actions
          ) VALUES (
            ${conn.clerk_user_id}, ${conn.advertiser_id}, ${m.campaignId}, ${m.campaignName}, ${m.status},
            ${today}, ${m.impressions}, ${m.clicks}, ${m.spend}, ${m.conversions}, ${m.cpa ?? null}, ${m.ctr}, ${m.videoPlayActions}
          )
          ON CONFLICT (clerk_user_id, campaign_id, date_recorded) DO UPDATE SET
            campaign_name       = ${m.campaignName},
            impressions         = ${m.impressions},
            clicks              = ${m.clicks},
            spend               = ${m.spend},
            conversions         = ${m.conversions},
            cpa                 = ${m.cpa ?? null},
            ctr                 = ${m.ctr},
            video_play_actions  = ${m.videoPlayActions}
        `
      }

      synced++
    } catch (err) {
      console.error(`[tiktok-ads-sync] Error for user ${conn.clerk_user_id}:`, err)
      errors++
    }
  }

  return NextResponse.json({ ok: true, synced, errors, total: connections.length })
}
