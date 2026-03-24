// lib/google-ads/campaigns.ts
// Google Ads campaign creation, management, and budget operations

const GOOGLE_ADS_API_VERSION = 'v17'
const BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`

type Headers = Record<string, string>

function buildHeaders(accessToken: string, developToken: string, managerId?: string | null): Headers {
  const h: Headers = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': developToken,
    'Content-Type': 'application/json',
  }
  if (managerId) h['login-customer-id'] = managerId.replace(/-/g, '')
  return h
}

async function mutate(
  endpoint: string,
  headers: Headers,
  operations: unknown[]
): Promise<Record<string, unknown>> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ operations }),
  })
  const data = await res.json() as Record<string, unknown>
  if (!res.ok) throw new Error(`[google-ads] ${endpoint} failed: ${JSON.stringify(data)}`)
  return data
}

// ── Create campaign budget ─────────────────────────────────────────────────────
export async function createCampaignBudget(
  accessToken: string,
  customerId: string,
  dailyBudgetUsd: number,
  name: string,
  managerId?: string | null
): Promise<string> {
  const cleanId = customerId.replace(/-/g, '')
  const headers = buildHeaders(accessToken, process.env.GOOGLE_ADS_DEVELOPER_TOKEN!, managerId)
  const amountMicros = Math.round(dailyBudgetUsd * 1_000_000)

  const data = await mutate(
    `${BASE}/customers/${cleanId}/campaignBudgets:mutate`,
    headers,
    [{ create: { name, amountMicros, deliveryMethod: 'STANDARD' } }]
  )

  const results = data.results as Array<{ resourceName: string }>
  return results[0].resourceName
}

// ── Create campaign ────────────────────────────────────────────────────────────
export type CampaignType = 'SEARCH' | 'DISPLAY' | 'PERFORMANCE_MAX' | 'SHOPPING'
export type BiddingStrategy = 'MANUAL_CPC' | 'TARGET_CPA' | 'TARGET_ROAS' | 'MAXIMIZE_CONVERSIONS' | 'MAXIMIZE_CONVERSION_VALUE'

export interface CreateCampaignParams {
  name: string
  type: CampaignType
  budgetResourceName: string
  biddingStrategy: BiddingStrategy
  targetCpaMicros?: number   // for TARGET_CPA
  targetRoas?: number        // for TARGET_ROAS (e.g. 2.0 = 200% ROAS)
  startImmediately?: boolean
}

export async function createCampaign(
  accessToken: string,
  customerId: string,
  params: CreateCampaignParams,
  managerId?: string | null
): Promise<string> {
  const cleanId = customerId.replace(/-/g, '')
  const headers = buildHeaders(accessToken, process.env.GOOGLE_ADS_DEVELOPER_TOKEN!, managerId)

  const campaignBody: Record<string, unknown> = {
    name: params.name,
    advertisingChannelType: params.type,
    status: 'PAUSED', // always start paused — user enables manually
    campaignBudget: params.budgetResourceName,
  }

  // Bidding strategy
  switch (params.biddingStrategy) {
    case 'MANUAL_CPC':
      campaignBody.manualCpc = { enhancedCpcEnabled: false }
      break
    case 'TARGET_CPA':
      campaignBody.targetCpa = { targetCpaMicros: params.targetCpaMicros ?? 10_000_000 }
      break
    case 'TARGET_ROAS':
      campaignBody.targetRoas = { targetRoas: params.targetRoas ?? 2.0 }
      break
    case 'MAXIMIZE_CONVERSIONS':
      campaignBody.maximizeConversions = {}
      break
    case 'MAXIMIZE_CONVERSION_VALUE':
      campaignBody.maximizeConversionValue = {}
      break
  }

  // Network settings for Search
  if (params.type === 'SEARCH') {
    campaignBody.networkSettings = {
      targetGoogleSearch: true,
      targetSearchNetwork: true,
      targetContentNetwork: false,
    }
  }

  const data = await mutate(
    `${BASE}/customers/${cleanId}/campaigns:mutate`,
    headers,
    [{ create: campaignBody }]
  )

  const results = data.results as Array<{ resourceName: string }>
  return results[0].resourceName
}

// ── Create ad group ────────────────────────────────────────────────────────────
export async function createAdGroup(
  accessToken: string,
  customerId: string,
  campaignResourceName: string,
  name: string,
  cpcBidUsd: number = 1.0,
  managerId?: string | null
): Promise<string> {
  const cleanId = customerId.replace(/-/g, '')
  const headers = buildHeaders(accessToken, process.env.GOOGLE_ADS_DEVELOPER_TOKEN!, managerId)

  const data = await mutate(
    `${BASE}/customers/${cleanId}/adGroups:mutate`,
    headers,
    [{
      create: {
        name,
        campaign: campaignResourceName,
        status: 'ENABLED',
        type: 'SEARCH_STANDARD',
        cpcBidMicros: Math.round(cpcBidUsd * 1_000_000),
      }
    }]
  )

  const results = data.results as Array<{ resourceName: string }>
  return results[0].resourceName
}

// ── Create responsive search ad ────────────────────────────────────────────────
export interface RSAParams {
  headlines: string[]    // 3-15 headlines, max 30 chars each
  descriptions: string[] // 2-4 descriptions, max 90 chars each
  finalUrl: string
}

export async function createResponsiveSearchAd(
  accessToken: string,
  customerId: string,
  adGroupResourceName: string,
  params: RSAParams,
  managerId?: string | null
): Promise<string> {
  const cleanId = customerId.replace(/-/g, '')
  const headers = buildHeaders(accessToken, process.env.GOOGLE_ADS_DEVELOPER_TOKEN!, managerId)

  const data = await mutate(
    `${BASE}/customers/${cleanId}/adGroupAds:mutate`,
    headers,
    [{
      create: {
        adGroup: adGroupResourceName,
        status: 'PAUSED',
        ad: {
          responsiveSearchAd: {
            headlines: params.headlines.slice(0, 15).map(text => ({ text: text.slice(0, 30) })),
            descriptions: params.descriptions.slice(0, 4).map(text => ({ text: text.slice(0, 90) })),
          },
          finalUrls: [params.finalUrl],
        },
      }
    }]
  )

  const results = data.results as Array<{ resourceName: string }>
  return results[0].resourceName
}

// ── Create keywords ────────────────────────────────────────────────────────────
export type MatchType = 'BROAD' | 'PHRASE' | 'EXACT'

export async function createKeywords(
  accessToken: string,
  customerId: string,
  adGroupResourceName: string,
  keywords: Array<{ text: string; matchType: MatchType }>,
  managerId?: string | null
): Promise<void> {
  const cleanId = customerId.replace(/-/g, '')
  const headers = buildHeaders(accessToken, process.env.GOOGLE_ADS_DEVELOPER_TOKEN!, managerId)

  const operations = keywords.map(kw => ({
    create: {
      adGroup: adGroupResourceName,
      status: 'ENABLED',
      keyword: {
        text: kw.text,
        matchType: kw.matchType,
      },
    }
  }))

  await mutate(`${BASE}/customers/${cleanId}/adGroupCriteria:mutate`, headers, operations)
}

// ── Pause campaign ─────────────────────────────────────────────────────────────
export async function pauseCampaign(
  accessToken: string,
  customerId: string,
  campaignResourceName: string,
  managerId?: string | null
): Promise<void> {
  const cleanId = customerId.replace(/-/g, '')
  const headers = buildHeaders(accessToken, process.env.GOOGLE_ADS_DEVELOPER_TOKEN!, managerId)

  await mutate(
    `${BASE}/customers/${cleanId}/campaigns:mutate`,
    headers,
    [{
      updateMask: 'status',
      update: { resourceName: campaignResourceName, status: 'PAUSED' }
    }]
  )
}

// ── Enable campaign ────────────────────────────────────────────────────────────
export async function enableCampaign(
  accessToken: string,
  customerId: string,
  campaignResourceName: string,
  managerId?: string | null
): Promise<void> {
  const cleanId = customerId.replace(/-/g, '')
  const headers = buildHeaders(accessToken, process.env.GOOGLE_ADS_DEVELOPER_TOKEN!, managerId)

  await mutate(
    `${BASE}/customers/${cleanId}/campaigns:mutate`,
    headers,
    [{
      updateMask: 'status',
      update: { resourceName: campaignResourceName, status: 'ENABLED' }
    }]
  )
}

// ── Update campaign budget ─────────────────────────────────────────────────────
export async function updateCampaignBudget(
  accessToken: string,
  customerId: string,
  budgetResourceName: string,
  newDailyBudgetUsd: number,
  managerId?: string | null
): Promise<void> {
  const cleanId = customerId.replace(/-/g, '')
  const headers = buildHeaders(accessToken, process.env.GOOGLE_ADS_DEVELOPER_TOKEN!, managerId)
  const amountMicros = Math.round(newDailyBudgetUsd * 1_000_000)

  await mutate(
    `${BASE}/customers/${cleanId}/campaignBudgets:mutate`,
    headers,
    [{
      updateMask: 'amount_micros',
      update: { resourceName: budgetResourceName, amountMicros }
    }]
  )
}
