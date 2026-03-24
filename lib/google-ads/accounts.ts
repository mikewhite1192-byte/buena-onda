// lib/google-ads/accounts.ts
// Google Ads account management — account info, campaign list, MCC operations

const GOOGLE_ADS_API_VERSION = 'v17'
const BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`

// ── Get account info ───────────────────────────────────────────────────────────
export interface AccountInfo {
  customerId: string
  name: string
  currencyCode: string
  timeZone: string
  status: string
  testAccount: boolean
}

export async function getAccountInfo(
  accessToken: string,
  customerId: string,
  managerId?: string | null
): Promise<AccountInfo> {
  const cleanId = customerId.replace(/-/g, '')
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    'Content-Type': 'application/json',
  }
  if (managerId) headers['login-customer-id'] = managerId.replace(/-/g, '')

  const query = `
    SELECT
      customer.id,
      customer.descriptive_name,
      customer.currency_code,
      customer.time_zone,
      customer.status,
      customer.test_account
    FROM customer
    LIMIT 1
  `

  const res = await fetch(`${BASE}/customers/${cleanId}/googleAds:search`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  })

  const data = await res.json() as Record<string, unknown>
  if (!res.ok) throw new Error(`[google-ads] getAccountInfo failed: ${JSON.stringify(data)}`)

  const row = (data.results as Array<Record<string, Record<string, unknown>>>)?.[0]
  return {
    customerId: String(row?.customer?.id ?? customerId),
    name: String(row?.customer?.descriptiveName ?? ''),
    currencyCode: String(row?.customer?.currencyCode ?? 'USD'),
    timeZone: String(row?.customer?.timeZone ?? ''),
    status: String(row?.customer?.status ?? ''),
    testAccount: Boolean(row?.customer?.testAccount ?? false),
  }
}

// ── List all campaigns with status and budget ──────────────────────────────────
export interface CampaignSummary {
  resourceName: string
  campaignId: string
  name: string
  status: string
  type: string
  budgetResourceName: string
  dailyBudgetMicros: number
  biddingStrategyType: string
}

export async function listCampaigns(
  accessToken: string,
  customerId: string,
  managerId?: string | null
): Promise<CampaignSummary[]> {
  const cleanId = customerId.replace(/-/g, '')
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    'Content-Type': 'application/json',
  }
  if (managerId) headers['login-customer-id'] = managerId.replace(/-/g, '')

  const query = `
    SELECT
      campaign.resource_name,
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign.campaign_budget,
      campaign.bidding_strategy_type,
      campaign_budget.amount_micros
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    ORDER BY campaign.name
    LIMIT 200
  `

  const res = await fetch(`${BASE}/customers/${cleanId}/googleAds:search`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  })

  const data = await res.json() as Record<string, unknown>
  if (!res.ok) throw new Error(`[google-ads] listCampaigns failed: ${JSON.stringify(data)}`)

  return ((data.results ?? []) as Array<Record<string, Record<string, unknown>>>).map(row => ({
    resourceName: String(row.campaign?.resourceName ?? ''),
    campaignId: String(row.campaign?.id ?? ''),
    name: String(row.campaign?.name ?? ''),
    status: String(row.campaign?.status ?? ''),
    type: String(row.campaign?.advertisingChannelType ?? ''),
    budgetResourceName: String(row.campaign?.campaignBudget ?? ''),
    dailyBudgetMicros: Number(row.campaignBudget?.amountMicros ?? 0),
    biddingStrategyType: String(row.campaign?.biddingStrategyType ?? ''),
  }))
}

// ── List accessible manager account children ───────────────────────────────────
export interface ManagedAccount {
  customerId: string
  name: string
  currencyCode: string
  testAccount: boolean
}

export async function listManagedAccounts(
  accessToken: string,
  managerCustomerId: string
): Promise<ManagedAccount[]> {
  const cleanId = managerCustomerId.replace(/-/g, '')
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    'Content-Type': 'application/json',
    'login-customer-id': cleanId,
  }

  const query = `
    SELECT
      customer_client.client_customer,
      customer_client.descriptive_name,
      customer_client.currency_code,
      customer_client.test_account,
      customer_client.level
    FROM customer_client
    WHERE customer_client.level = 1
    ORDER BY customer_client.descriptive_name
  `

  const res = await fetch(`${BASE}/customers/${cleanId}/googleAds:search`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  })

  const data = await res.json() as Record<string, unknown>
  if (!res.ok) throw new Error(`[google-ads] listManagedAccounts failed: ${JSON.stringify(data)}`)

  return ((data.results ?? []) as Array<Record<string, Record<string, unknown>>>).map(row => ({
    customerId: String(row.customerClient?.clientCustomer ?? '').replace('customers/', ''),
    name: String(row.customerClient?.descriptiveName ?? ''),
    currencyCode: String(row.customerClient?.currencyCode ?? 'USD'),
    testAccount: Boolean(row.customerClient?.testAccount ?? false),
  }))
}
