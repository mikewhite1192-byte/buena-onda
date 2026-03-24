export const dynamic = 'force-dynamic'
import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { exchangeTikTokCode, listTikTokAdvertisers } from '@/lib/tiktok-ads/client'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const authCode = searchParams.get('auth_code')
  const state = searchParams.get('state') // userId
  const error = searchParams.get('error')

  const redirectBase = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://buenaonda.ai'}/dashboard/settings`

  if (error || !authCode || !state) {
    return NextResponse.redirect(`${redirectBase}?tiktok_ads=error`)
  }

  try {
    const tokens = await exchangeTikTokCode(authCode)
    const advertisers = await listTikTokAdvertisers(tokens.access_token)
    const advertiserId = advertisers[0]?.advertiser_id ?? null

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await sql`
      INSERT INTO tiktok_ads_connections (clerk_user_id, access_token, refresh_token, advertiser_id, token_expires_at)
      VALUES (${state}, ${tokens.access_token}, ${tokens.refresh_token ?? null}, ${advertiserId}, ${expiresAt})
      ON CONFLICT (clerk_user_id) DO UPDATE SET
        access_token     = ${tokens.access_token},
        refresh_token    = ${tokens.refresh_token ?? null},
        advertiser_id    = ${advertiserId},
        token_expires_at = ${expiresAt},
        updated_at       = NOW()
    `

    return NextResponse.redirect(`${redirectBase}?tiktok_ads=connected`)
  } catch (err) {
    console.error('[tiktok-ads/callback]', err)
    return NextResponse.redirect(`${redirectBase}?tiktok_ads=error`)
  }
}
