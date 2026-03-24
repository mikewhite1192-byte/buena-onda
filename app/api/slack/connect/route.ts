// app/api/slack/connect/route.ts
export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = process.env.SLACK_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'Slack not configured' }, { status: 500 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://buenaonda.ai'
  const redirectUri = `${appUrl}/api/slack/callback`

  const url = new URL('https://slack.com/oauth/v2/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('scope', 'incoming-webhook,chat:write,channels:read')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', userId)

  return NextResponse.redirect(url.toString())
}
