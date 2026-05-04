export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createOAuthState } from '@/lib/oauth-state'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appId = process.env.TIKTOK_APP_ID
  if (!appId) return NextResponse.json({ error: 'TikTok app not configured' }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId') ?? ''

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://buenaonda.ai'}/api/tiktok-ads/callback`

  // HMAC-signed state. Plaintext `userId__clientId` let an attacker who
  // tricks a victim into completing the callback forge an arbitrary userId
  // and have the resulting OAuth tokens stored against that userId.
  const state = createOAuthState({ userId, clientId: clientId || null })

  const url = new URL('https://business-api.tiktok.com/portal/auth')
  url.searchParams.set('app_id', appId)
  url.searchParams.set('state', state)
  url.searchParams.set('redirect_uri', redirectUri)

  return NextResponse.redirect(url.toString())
}
