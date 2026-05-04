// app/api/google-ads/campaigns/[campaignId]/route.ts
// PATCH: pause, enable, or scale (update budget) a Google Ads campaign

export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { refreshGoogleAdsToken } from '@/lib/google-ads/client'
import { pauseCampaign, enableCampaign, updateCampaignBudget } from '@/lib/google-ads/campaigns'
import { decryptToken } from '@/lib/crypto/tokens'

const sql = neon(process.env.DATABASE_URL!)

export async function PATCH(
  req: Request,
  { params }: { params: { campaignId: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, new_daily_budget } = await req.json() as {
    action: 'pause' | 'enable' | 'scale'
    new_daily_budget?: number
  }

  const conn = await sql`
    SELECT refresh_token, customer_id, manager_id FROM google_ads_connections
    WHERE clerk_user_id = ${userId} LIMIT 1
  `
  if (conn.length === 0 || !conn[0].customer_id) {
    return NextResponse.json({ error: 'Google Ads not connected' }, { status: 400 })
  }

  const customerId = conn[0].customer_id as string
  const managerId = conn[0].manager_id as string | null
  const campaignResourceName = `customers/${customerId.replace(/-/g, '')}/campaigns/${params.campaignId}`

  try {
    const accessToken = await refreshGoogleAdsToken(decryptToken(conn[0].refresh_token as string))

    if (action === 'pause') {
      await pauseCampaign(accessToken, customerId, campaignResourceName, managerId)
    } else if (action === 'enable') {
      await enableCampaign(accessToken, customerId, campaignResourceName, managerId)
    } else if (action === 'scale' && new_daily_budget) {
      // Look up budget resource name from DB
      const brief = await sql`
        SELECT google_budget_resource_name FROM campaign_briefs
        WHERE google_campaign_resource_name = ${campaignResourceName}
          AND platform = 'google'
        LIMIT 1
      `
      if (brief.length === 0 || !brief[0].google_budget_resource_name) {
        return NextResponse.json({ error: 'Campaign brief not found' }, { status: 404 })
      }
      await updateCampaignBudget(
        accessToken, customerId,
        brief[0].google_budget_resource_name as string,
        new_daily_budget,
        managerId
      )
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Log agent action
    await sql`
      INSERT INTO agent_actions (campaign_brief_id, action_type, details, triggered_by)
      SELECT id, ${action}, ${JSON.stringify({ campaign_id: params.campaignId, new_daily_budget })}, 'user'
      FROM campaign_briefs
      WHERE google_campaign_resource_name = ${campaignResourceName}
      LIMIT 1
    `

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[google-ads/campaigns PATCH]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
