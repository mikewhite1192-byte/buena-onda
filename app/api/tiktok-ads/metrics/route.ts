export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const advertiserIdFilter = searchParams.get('advertiser_id')

  const metrics = advertiserIdFilter
    ? await sql`
        SELECT campaign_id, campaign_name, campaign_status, date_recorded, impressions, clicks, spend, conversions, cpa, ctr, video_play_actions
        FROM tiktok_ad_metrics
        WHERE clerk_user_id = ${userId} AND advertiser_id = ${advertiserIdFilter}
        ORDER BY date_recorded DESC, spend DESC LIMIT 200
      `
    : await sql`
        SELECT campaign_id, campaign_name, campaign_status, date_recorded, impressions, clicks, spend, conversions, cpa, ctr, video_play_actions
        FROM tiktok_ad_metrics
        WHERE clerk_user_id = ${userId}
        ORDER BY date_recorded DESC, spend DESC LIMIT 200
      `;

  return NextResponse.json({
    connected: true,
    metrics,
  })
}
