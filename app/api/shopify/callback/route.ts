// app/api/shopify/callback/route.ts
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { exchangeShopifyCode, getShopInfo } from '@/lib/shopify/client'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const shop = searchParams.get('shop')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://buenaonda.ai'

  if (!code || !state || !shop) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?shopify=error`)
  }

  // state = userId__shop
  const [userId] = state.split('__')
  if (!userId) return NextResponse.redirect(`${appUrl}/dashboard/settings?shopify=error`)

  try {
    // Ensure table exists
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

    return NextResponse.redirect(`${appUrl}/dashboard/settings?shopify=connected`)
  } catch (err) {
    console.error('[shopify/callback]', err)
    return NextResponse.redirect(`${appUrl}/dashboard/settings?shopify=error`)
  }
}
