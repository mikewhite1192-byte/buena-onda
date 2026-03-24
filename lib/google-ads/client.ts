// lib/google-ads/client.ts
// Google Ads API client — token refresh, customer lookup, campaign metrics

const GOOGLE_ADS_API_VERSION = 'v17'
const GOOGLE_ADS_BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`

// ── Token refresh ──────────────────────────────────────────────────────────────
export async function refreshGoogleAdsToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) {
    throw new Error(`[google-ads] Token refresh failed: ${JSON.stringify(data)}`)
  }
  return data.access_token as string
}

// ── List accessible customer accounts ─────────────────────────────────────────
export async function listAccessibleCustomers(accessToken: string): Promise<string[]> {
  const res = await fetch(`${GOOGLE_ADS_BASE_URL}/customers:listAccessibleCustomers`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`[google-ads] listAccessibleCustomers failed: ${JSON.stringify(data)}`)
  }
  // Returns { resourceNames: ["customers/1234567890", ...] }
  return ((data.resourceNames ?? []) as string[]).map(r => r.replace('customers/', ''))
}

// ── Campaign metrics ───────────────────────────────────────────────────────────
export interface CampaignMetric {
  campaignId: string
  campaignName: string
  status: string
  impressions: number
  clicks: number
  costMicros: number
  conversions: number
  ctr: number
  date: string
}

export async function getCampaignMetrics(
  accessToken: string,
  customerId: string,
  managerId?: string | null
): Promise<CampaignMetric[]> {
  const cleanId = customerId.replace(/-/g, '')

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    'Content-Type': 'application/json',
  }
  if (managerId) headers['login-customer-id'] = managerId.replace(/-/g, '')

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      segments.date
    FROM campaign
    WHERE segments.date DURING LAST_7_DAYS
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 100
  `

  const res = await fetch(`${GOOGLE_ADS_BASE_URL}/customers/${cleanId}/googleAds:search`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(`[google-ads] getCampaignMetrics failed: ${JSON.stringify(data)}`)
  }

  return ((data.results ?? []) as Record<string, Record<string, string>>[]).map(row => ({
    campaignId: row.campaign?.id ?? '',
    campaignName: row.campaign?.name ?? '',
    status: row.campaign?.status ?? '',
    impressions: parseInt(row.metrics?.impressions ?? '0'),
    clicks: parseInt(row.metrics?.clicks ?? '0'),
    costMicros: parseInt(row.metrics?.costMicros ?? '0'),
    conversions: parseFloat(row.metrics?.conversions ?? '0'),
    ctr: parseFloat(row.metrics?.ctr ?? '0'),
    date: row.segments?.date ?? '',
  }))
}
