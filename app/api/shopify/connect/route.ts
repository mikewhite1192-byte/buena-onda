// app/api/shopify/connect/route.ts
// Redirects user to Shopify OAuth — requires ?shop=mystore.myshopify.com
export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createOAuthState } from '@/lib/oauth-state'

const SCOPES = 'read_orders,read_products,read_customers,read_analytics,read_marketing_events'
const SHOP_PATTERN = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopifyClientId = process.env.SHOPIFY_CLIENT_ID
  if (!shopifyClientId) return NextResponse.json({ error: 'Shopify not configured' }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const shop = searchParams.get('shop')
  if (!shop) return NextResponse.json({ error: 'shop param required (e.g. mystore.myshopify.com)' }, { status: 400 })

  // Validate shop domain — without this, ?shop=evil.com would proxy the
  // OAuth flow through an attacker-controlled domain.
  if (!SHOP_PATTERN.test(shop)) {
    return NextResponse.json({ error: 'shop must match *.myshopify.com' }, { status: 400 })
  }

  const clientId = searchParams.get('clientId') ?? ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://buenaonda.ai'
  const redirectUri = `${appUrl}/api/shopify/callback`

  // HMAC-signed state. Plaintext `userId__shop` would let an attacker
  // complete OAuth and forge a victim's userId in the state, attaching
  // the tokens to the victim's account.
  const state = createOAuthState({ userId, shop, clientId: clientId || null })

  const url = new URL(`https://${shop}/admin/oauth/authorize`)
  url.searchParams.set('client_id', shopifyClientId)
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)

  return NextResponse.redirect(url.toString())
}
