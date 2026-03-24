// app/api/google-ads/connect/route.ts
// Redirects user to Google OAuth to authorize Google Ads access

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/sign-in`)
  }

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId') ?? ''

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/google-ads/callback`,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/adwords',
    access_type: 'offline',
    prompt: 'consent',
    state: clientId ? `${userId}__${clientId}` : userId,
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}
