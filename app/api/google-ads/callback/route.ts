// app/api/google-ads/callback/route.ts
// Handles Google OAuth callback — exchanges code for tokens, stores in DB

import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { listAccessibleCustomers } from '@/lib/google-ads/client'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')
  const error = searchParams.get('error')

  const base = process.env.NEXT_PUBLIC_BASE_URL!

  if (error || !code || !userId) {
    console.error('[google-ads] Callback error or missing params:', { error, code: !!code, userId })
    return NextResponse.redirect(`${base}/dashboard/settings?google_ads=error`)
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
        redirect_uri: `${base}/api/google-ads/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()
    if (!tokenRes.ok || !tokens.refresh_token) {
      console.error('[google-ads] Token exchange failed:', tokens)
      return NextResponse.redirect(`${base}/dashboard/settings?google_ads=error`)
    }

    // List accessible Google Ads customer accounts — pick the first one
    let customerId: string | null = null
    try {
      const customers = await listAccessibleCustomers(tokens.access_token)
      customerId = customers[0] ?? null
      console.log('[google-ads] Accessible customers:', customers)
    } catch (e) {
      console.error('[google-ads] listAccessibleCustomers error:', e)
    }

    // Upsert connection into DB
    const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString()
    await sql`
      INSERT INTO google_ads_connections (clerk_user_id, access_token, refresh_token, customer_id, token_expires_at)
      VALUES (${userId}, ${tokens.access_token}, ${tokens.refresh_token}, ${customerId}, ${expiresAt})
      ON CONFLICT (clerk_user_id) DO UPDATE SET
        access_token     = ${tokens.access_token},
        refresh_token    = ${tokens.refresh_token},
        customer_id      = COALESCE(${customerId}, google_ads_connections.customer_id),
        token_expires_at = ${expiresAt},
        updated_at       = NOW()
    `

    return NextResponse.redirect(`${base}/dashboard/settings?google_ads=connected`)

  } catch (err) {
    console.error('[google-ads] Callback error:', err)
    return NextResponse.redirect(`${base}/dashboard/settings?google_ads=error`)
  }
}
