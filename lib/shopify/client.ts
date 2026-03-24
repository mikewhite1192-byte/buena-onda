// lib/shopify/client.ts
// Shopify OAuth helpers and storefront metrics

export interface ShopifyTokenResponse {
  access_token: string
  scope: string
}

export interface ShopifyOrder {
  id: number
  total_price: string
  created_at: string
  financial_status: string
}

export interface ShopifyShop {
  id: number
  name: string
  domain: string
  myshopify_domain: string
}

export async function exchangeShopifyCode(
  shop: string,
  code: string
): Promise<ShopifyTokenResponse> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      code,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Shopify token exchange failed: ${text}`)
  }
  return res.json()
}

export async function getShopInfo(shop: string, accessToken: string): Promise<ShopifyShop> {
  const res = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Failed to fetch shop info: ${res.status}`)
  const data = await res.json()
  return data.shop
}

// Fetches ALL orders via cursor pagination (no date limit)
export async function getShopifyOrders(
  shop: string,
  accessToken: string
): Promise<ShopifyOrder[]> {
  const allOrders: ShopifyOrder[] = []
  let nextUrl: string | null = `https://${shop}/admin/api/2024-01/orders.json?status=any&limit=250&fields=id,total_price,created_at,financial_status`

  while (nextUrl) {
    const pageRes: Response = await fetch(nextUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    })
    if (!pageRes.ok) throw new Error(`Failed to fetch orders: ${pageRes.status}`)

    const data = await pageRes.json()
    const page: ShopifyOrder[] = data.orders ?? []
    allOrders.push(...page)

    // Follow cursor-based pagination via Link header
    const linkHeader: string = pageRes.headers.get('Link') ?? ''
    const nextMatch: RegExpMatchArray | null = linkHeader.match(/<([^>]+)>;\s*rel="next"/)
    nextUrl = nextMatch ? nextMatch[1] : null
  }

  return allOrders
}

export async function getShopifyAnalytics(
  shop: string,
  accessToken: string,
  dateFrom: string,
  dateTo: string
): Promise<{ sessions: number; pageViews: number }> {
  // Analytics API requires Shopify Plus or specific plan — return zeros gracefully
  try {
    const url = new URL(`https://${shop}/admin/api/2024-01/reports.json`)
    url.searchParams.set('since_id', '0')
    const res = await fetch(url.toString(), {
      headers: { 'X-Shopify-Access-Token': accessToken },
    })
    if (!res.ok) return { sessions: 0, pageViews: 0 }
    return { sessions: 0, pageViews: 0 }
  } catch {
    return { sessions: 0, pageViews: 0 }
  }
}
