// app/api/google-ads/metrics/route.ts
// Returns Google Ads metrics for the current user from DB (synced by cron)

import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [connection, metrics] = await Promise.all([
    sql`
      SELECT customer_id, updated_at
      FROM google_ads_connections
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `,
    sql`
      SELECT campaign_id, campaign_name, date_recorded, impressions, clicks, spend, conversions, cost_per_conv, ctr
      FROM google_ad_metrics
      WHERE clerk_user_id = ${userId}
      ORDER BY date_recorded DESC, spend DESC
      LIMIT 200
    `,
  ])

  return NextResponse.json({
    connected: connection.length > 0,
    customer_id: connection[0]?.customer_id ?? null,
    last_synced: connection[0]?.updated_at ?? null,
    metrics,
  })
}
