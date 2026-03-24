// app/api/shopify/connect/route.ts
// Redirects user to Shopify OAuth — requires ?shop=mystore.myshopify.com
export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const SCOPES = 'read_orders,read_products,read_customers,read_analytics,read_marketing_events'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopifyClientId = process.env.SHOPIFY_CLIENT_ID
  if (!shopifyClientId) return NextResponse.json({ error: 'Shopify not configured' }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const shop = searchParams.get('shop')
  if (!shop) return NextResponse.json({ error: 'shop param required (e.g. mystore.myshopify.com)' }, { status: 400 })

  const clientId = searchParams.get('clientId') ?? ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://buenaonda.ai'
  const redirectUri = `${appUrl}/api/shopify/callback`
  const state = clientId ? `${userId}__${shop}__${clientId}` : `${userId}__${shop}`

  const url = new URL(`https://${shop}/admin/oauth/authorize`)
  url.searchParams.set('client_id', shopifyClientId)
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)

  return NextResponse.redirect(url.toString())
}
