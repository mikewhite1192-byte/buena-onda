// app/api/google-ads/campaigns/route.ts
// GET: list campaigns for current user
// POST: create a new campaign (budget → campaign → ad group → ad → keywords)

export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { refreshGoogleAdsToken } from '@/lib/google-ads/client'
import { listCampaigns } from '@/lib/google-ads/accounts'
import {
  createCampaignBudget,
  createCampaign,
  createAdGroup,
  createResponsiveSearchAd,
  createKeywords,
  type CampaignType,
  type BiddingStrategy,
  type MatchType,
} from '@/lib/google-ads/campaigns'

const sql = neon(process.env.DATABASE_URL!)

// ── GET — list campaigns ───────────────────────────────────────────────────────
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const conn = await sql`
    SELECT refresh_token, customer_id, manager_id FROM google_ads_connections
    WHERE clerk_user_id = ${userId} LIMIT 1
  `
  if (conn.length === 0 || !conn[0].customer_id) {
    return NextResponse.json({ campaigns: [], connected: false })
  }

  try {
    const accessToken = await refreshGoogleAdsToken(conn[0].refresh_token as string)
    const campaigns = await listCampaigns(accessToken, conn[0].customer_id as string, conn[0].manager_id as string | null)
    return NextResponse.json({ campaigns, connected: true })
  } catch (err) {
    console.error('[google-ads/campaigns GET]', err)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

// ── POST — create campaign ─────────────────────────────────────────────────────
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    client_id?: string
    name: string
    type: CampaignType
    daily_budget: number
    bidding_strategy: BiddingStrategy
    target_cpa?: number
    target_roas?: number
    cpc_bid?: number
    final_url: string
    headlines: string[]
    descriptions: string[]
    keywords?: Array<{ text: string; match_type: MatchType }>
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

  try {
    const accessToken = await refreshGoogleAdsToken(conn[0].refresh_token as string)

    // 1. Create budget
    const budgetResourceName = await createCampaignBudget(
      accessToken, customerId, body.daily_budget,
      `${body.name} Budget`, managerId
    )

    // 2. Create campaign
    const campaignResourceName = await createCampaign(
      accessToken, customerId,
      {
        name: body.name,
        type: body.type,
        budgetResourceName,
        biddingStrategy: body.bidding_strategy,
        targetCpaMicros: body.target_cpa ? Math.round(body.target_cpa * 1_000_000) : undefined,
        targetRoas: body.target_roas,
      },
      managerId
    )

    // 3. Create ad group
    const adGroupResourceName = await createAdGroup(
      accessToken, customerId,
      campaignResourceName,
      `${body.name} - Ad Group 1`,
      body.cpc_bid ?? 1.0,
      managerId
    )

    // 4. Create responsive search ad
    await createResponsiveSearchAd(
      accessToken, customerId, adGroupResourceName,
      {
        headlines: body.headlines,
        descriptions: body.descriptions,
        finalUrl: body.final_url,
      },
      managerId
    )

    // 5. Create keywords (Search only)
    if (body.type === 'SEARCH' && body.keywords && body.keywords.length > 0) {
      await createKeywords(
        accessToken, customerId, adGroupResourceName,
        body.keywords.map(k => ({ text: k.text, matchType: k.match_type })),
        managerId
      )
    }

    // 6. Save campaign brief to DB
    const campaignId = campaignResourceName.split('/').pop() ?? ''
    const briefRow = await sql`
      INSERT INTO campaign_briefs (
        client_id, platform, avatar, offer, daily_budget, cpl_cap,
        google_campaign_resource_name, google_budget_resource_name,
        google_ad_group_resource_name, google_customer_id, status
      ) VALUES (
        ${body.client_id ?? null},
        'google',
        ${body.name},
        ${body.final_url},
        ${body.daily_budget},
        ${body.target_cpa ?? 0},
        ${campaignResourceName},
        ${budgetResourceName},
        ${adGroupResourceName},
        ${customerId},
        'active'
      )
      RETURNING id
    `

    return NextResponse.json({
      ok: true,
      campaign_id: campaignId,
      campaign_resource_name: campaignResourceName,
      brief_id: briefRow[0].id,
    })

  } catch (err) {
    console.error('[google-ads/campaigns POST]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
