const TIKTOK_BASE = 'https://business-api.tiktok.com/open_api/v1.3'

export async function exchangeTikTokCode(authCode: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch(`${TIKTOK_BASE}/oauth2/access_token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.TIKTOK_APP_ID,
      secret: process.env.TIKTOK_APP_SECRET,
      auth_code: authCode,
      grant_type: 'authorization_code',
    }),
  })
  const data = await res.json()
  if (data.code !== 0) throw new Error(data.message ?? 'TikTok token exchange failed')
  return data.data
}

export async function refreshTikTokToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch(`${TIKTOK_BASE}/oauth2/refresh_token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.TIKTOK_APP_ID,
      secret: process.env.TIKTOK_APP_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  const data = await res.json()
  if (data.code !== 0) throw new Error(data.message ?? 'TikTok token refresh failed')
  return data.data
}

export async function listTikTokAdvertisers(accessToken: string): Promise<{ advertiser_id: string; advertiser_name: string }[]> {
  const url = new URL(`${TIKTOK_BASE}/oauth2/advertiser/get/`)
  url.searchParams.set('app_id', process.env.TIKTOK_APP_ID!)
  url.searchParams.set('secret', process.env.TIKTOK_APP_SECRET!)
  const res = await fetch(url.toString(), {
    headers: { 'Access-Token': accessToken },
  })
  const data = await res.json()
  if (data.code !== 0) throw new Error(data.message ?? 'Failed to list advertisers')
  return data.data?.list ?? []
}

export interface TikTokCampaignMetric {
  campaignId: string
  campaignName: string
  status: string
  impressions: number
  clicks: number
  spend: number
  conversions: number
  cpa: number | null
  ctr: number
  videoPlayActions: number
}

export async function getTikTokCampaignMetrics(accessToken: string, advertiserId: string): Promise<TikTokCampaignMetric[]> {
  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

  const url = new URL(`${TIKTOK_BASE}/report/integrated/get/`)
  url.searchParams.set('advertiser_id', advertiserId)
  url.searchParams.set('report_type', 'BASIC')
  url.searchParams.set('data_level', 'AUCTION_CAMPAIGN')
  url.searchParams.set('dimensions', JSON.stringify(['campaign_id']))
  url.searchParams.set('metrics', JSON.stringify(['campaign_name', 'objective_type', 'spend', 'impressions', 'clicks', 'ctr', 'conversion', 'cost_per_conversion', 'video_play_actions']))
  url.searchParams.set('start_date', sevenDaysAgo)
  url.searchParams.set('end_date', today)
  url.searchParams.set('page_size', '100')

  const res = await fetch(url.toString(), {
    headers: { 'Access-Token': accessToken },
  })
  const data = await res.json()
  if (data.code !== 0) throw new Error(data.message ?? 'Failed to fetch TikTok metrics')

  return (data.data?.list ?? []).map((item: Record<string, unknown>) => {
    const metrics = item.metrics as Record<string, string>
    const dims = item.dimensions as Record<string, string>
    const spend = parseFloat(metrics.spend ?? '0')
    const conversions = parseFloat(metrics.conversion ?? '0')
    return {
      campaignId: dims.campaign_id,
      campaignName: metrics.campaign_name ?? '',
      status: '',
      impressions: parseInt(metrics.impressions ?? '0'),
      clicks: parseInt(metrics.clicks ?? '0'),
      spend,
      conversions,
      cpa: conversions > 0 ? spend / conversions : null,
      ctr: parseFloat(metrics.ctr ?? '0') / 100,
      videoPlayActions: parseInt(metrics.video_play_actions ?? '0'),
    }
  })
}

export async function pauseTikTokCampaign(accessToken: string, advertiserId: string, campaignId: string): Promise<void> {
  const res = await fetch(`${TIKTOK_BASE}/campaign/status/update/`, {
    method: 'POST',
    headers: { 'Access-Token': accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      advertiser_id: advertiserId,
      campaign_ids: [campaignId],
      operation_status: 'DISABLE',
    }),
  })
  const data = await res.json()
  if (data.code !== 0) throw new Error(data.message ?? 'Failed to pause TikTok campaign')
}

export async function enableTikTokCampaign(accessToken: string, advertiserId: string, campaignId: string): Promise<void> {
  const res = await fetch(`${TIKTOK_BASE}/campaign/status/update/`, {
    method: 'POST',
    headers: { 'Access-Token': accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      advertiser_id: advertiserId,
      campaign_ids: [campaignId],
      operation_status: 'ENABLE',
    }),
  })
  const data = await res.json()
  if (data.code !== 0) throw new Error(data.message ?? 'Failed to enable TikTok campaign')
}
