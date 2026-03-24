export const dynamic = 'force-dynamic'
import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { exchangeTikTokCode, listTikTokAdvertisers } from '@/lib/tiktok-ads/client'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const authCode = searchParams.get('auth_code')
  const state = searchParams.get('state') // userId or userId__clientId
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://buenaonda.ai'

  if (error || !authCode || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?tiktok_ads=error`)
  }

  const [userId, clientId] = state.split('__')
  const redirectBase = clientId ? `${appUrl}/dashboard/clients` : `${appUrl}/dashboard/settings`

  try {
    const tokens = await exchangeTikTokCode(authCode)
    const advertisers = await listTikTokAdvertisers(tokens.access_token)
    const advertiserId = advertisers[0]?.advertiser_id ?? null

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Save account-level connection
    await sql`
      INSERT INTO tiktok_ads_connections (clerk_user_id, access_token, refresh_token, advertiser_id, token_expires_at)
      VALUES (${userId}, ${tokens.access_token}, ${tokens.refresh_token ?? null}, ${advertiserId}, ${expiresAt})
      ON CONFLICT (clerk_user_id) DO UPDATE SET
        access_token     = ${tokens.access_token},
        refresh_token    = ${tokens.refresh_token ?? null},
        advertiser_id    = ${advertiserId},
        token_expires_at = ${expiresAt},
        updated_at       = NOW()
    `

    // If connecting for a specific client, link the advertiser ID
    if (clientId && advertisers.length === 1 && advertiserId) {
      await sql`
        UPDATE clients SET tiktok_advertiser_id = ${advertiserId}
        WHERE id = ${clientId} AND owner_id = ${userId}
      `
      return NextResponse.redirect(`${redirectBase}?tiktok_connected=${clientId}`)
    }

    // Multiple advertisers — send picker
    if (clientId && advertisers.length > 1) {
      const encoded = Buffer.from(JSON.stringify(advertisers)).toString('base64')
      return NextResponse.redirect(`${redirectBase}?tiktok_connected=${clientId}&advertisers=${encoded}`)
    }

    return NextResponse.redirect(`${redirectBase}?tiktok_ads=connected`)
  } catch (err) {
    console.error('[tiktok-ads/callback]', err)
    return NextResponse.redirect(`${redirectBase}?tiktok_ads=error`)
  }
}
