// lib/meta/insights.ts
// Fetches 7-day and 14-day ad-level insights for fatigue detection
// Drop this into lib/meta/ alongside your existing client.ts

import { AdInsights } from '../agent/fatigue-detector'

const BASE = 'https://graph.facebook.com/v19.0'

function getToken() {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) throw new Error('META_ACCESS_TOKEN not set')
  return token
}

function getAdAccountId() {
  const id = process.env.META_AD_ACCOUNT_ID
  if (!id) throw new Error('META_AD_ACCOUNT_ID not set')
  return id
}

interface MetaInsightRow {
  ad_id: string
  ad_name: string
  adset_id: string
  campaign_id: string
  frequency: string
  ctr: string
  spend: string
  impressions: string
  clicks: string
  date_start: string
  date_stop: string
}

async function fetchInsightsForWindow(
  since: string,
  until: string
): Promise<MetaInsightRow[]> {
  const token = getToken()
  const adAccountId = getAdAccountId()

  const params = new URLSearchParams({
    access_token: token,
    level: 'ad',
    fields: 'ad_id,ad_name,adset_id,campaign_id,frequency,ctr,spend,impressions,clicks',
    time_range: JSON.stringify({ since, until }),
    limit: '500',
  })

  const url = `${BASE}/${adAccountId}/insights?${params}`
  const res = await fetch(url)
  const json = await res.json()

  if (json.error) {
    throw new Error(`Meta Insights API error: ${json.error.message}`)
  }

  return json.data ?? []
}

function dateString(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

// Fetches this week (0–6 days ago) and last week (7–13 days ago)
// Returns merged AdInsights ready for fatigue detection
export async function fetchAdInsightsForFatigue(): Promise<AdInsights[]> {
  const today = dateString(0)
  const day7 = dateString(7)
  const day14 = dateString(14)

  const [thisWeek, lastWeek] = await Promise.all([
    fetchInsightsForWindow(day7, today),
    fetchInsightsForWindow(day14, day7),
  ])

  // Build lookup for last week by ad_id
  const lastWeekMap = new Map<string, MetaInsightRow>()
  for (const row of lastWeek) {
    lastWeekMap.set(row.ad_id, row)
  }

  const ads: AdInsights[] = []

  for (const row of thisWeek) {
    const prev = lastWeekMap.get(row.ad_id)
    const ctr_previous = prev ? parseFloat(prev.ctr) / 100 : 0  // Meta returns CTR as percentage

    ads.push({
      ad_id: row.ad_id,
      ad_name: row.ad_name,
      ad_set_id: row.adset_id,
      campaign_id: row.campaign_id,
      frequency: parseFloat(row.frequency),
      ctr: parseFloat(row.ctr) / 100,  // normalize to 0–1
      ctr_previous,
      spend: parseFloat(row.spend),
      impressions: parseInt(row.impressions),
      clicks: parseInt(row.clicks),
    })
  }

  return ads
}
