// app/api/shopify/callback/route.ts
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { exchangeShopifyCode, getShopInfo } from '@/lib/shopify/client'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // userId__shop or userId__shop__clientId
  const shop = searchParams.get('shop')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://buenaonda.ai'

  if (!code || !state || !shop) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?shopify=error`)
  }

  const parts = state.split('__')
  const userId = parts[0]
  const clientId = parts[2] ?? null // present when connecting from client card
  const redirectBase = clientId ? `${appUrl}/dashboard/clients` : `${appUrl}/dashboard/settings`

  if (!userId) return NextResponse.redirect(`${appUrl}/dashboard/settings?shopify=error`)

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS shopify_connections (
        id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_user_id    TEXT        UNIQUE NOT NULL,
        shop             TEXT        NOT NULL,
        shop_name        TEXT,
        access_token     TEXT        NOT NULL,
        scope            TEXT,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS idx_shopify_conn_user ON shopify_connections(clerk_user_id)`

    const tokenData = await exchangeShopifyCode(shop, code)

    let shopName = shop
    try {
      const shopInfo = await getShopInfo(shop, tokenData.access_token)
      shopName = shopInfo.name
    } catch { /* ok */ }

    await sql`
      INSERT INTO shopify_connections (clerk_user_id, shop, shop_name, access_token, scope, updated_at)
      VALUES (${userId}, ${shop}, ${shopName}, ${tokenData.access_token}, ${tokenData.scope}, now())
      ON CONFLICT (clerk_user_id) DO UPDATE SET
        shop         = EXCLUDED.shop,
        shop_name    = EXCLUDED.shop_name,
        access_token = EXCLUDED.access_token,
        scope        = EXCLUDED.scope,
        updated_at   = now()
    `

    // Link shop domain to the specific client
    if (clientId) {
      await sql`
        UPDATE clients SET shopify_domain = ${shop}
        WHERE id = ${clientId} AND owner_id = ${userId}
      `
      return NextResponse.redirect(`${redirectBase}?shopify_connected=${clientId}`)
    }

    return NextResponse.redirect(`${redirectBase}?shopify=connected`)
  } catch (err) {
    console.error('[shopify/callback]', err)
    return NextResponse.redirect(`${redirectBase}?shopify=error`)
  }
}
