// app/api/slack/callback/route.ts
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { exchangeSlackCode, sendSlackMessage } from '@/lib/slack/client'
import { verifyOAuthState } from '@/lib/oauth-state'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://buenaonda.ai'

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?slack=error`)
  }

  // Verify HMAC-signed state (CSRF protection + replay prevention)
  let userId: string
  try {
    const stateData = verifyOAuthState(state)
    userId = stateData.userId as string
  } catch (err) {
    console.error('[slack/callback] Invalid OAuth state:', err instanceof Error ? err.message : err)
    return NextResponse.redirect(`${appUrl}/dashboard/settings?slack=error&reason=invalid_state`)
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS slack_connections (
        id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_user_id    TEXT        UNIQUE NOT NULL,
        team_id          TEXT        NOT NULL,
        team_name        TEXT,
        access_token     TEXT        NOT NULL,
        webhook_url      TEXT,
        webhook_channel  TEXT,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS idx_slack_conn_user ON slack_connections(clerk_user_id)`

    const tokenData = await exchangeSlackCode(code)

    const webhookUrl = tokenData.incoming_webhook?.url ?? null
    const webhookChannel = tokenData.incoming_webhook?.channel ?? null

    await sql`
      INSERT INTO slack_connections (clerk_user_id, team_id, team_name, access_token, webhook_url, webhook_channel, updated_at)
      VALUES (${userId}, ${tokenData.team.id}, ${tokenData.team.name}, ${tokenData.access_token}, ${webhookUrl}, ${webhookChannel}, now())
      ON CONFLICT (clerk_user_id) DO UPDATE SET
        team_id         = EXCLUDED.team_id,
        team_name       = EXCLUDED.team_name,
        access_token    = EXCLUDED.access_token,
        webhook_url     = EXCLUDED.webhook_url,
        webhook_channel = EXCLUDED.webhook_channel,
        updated_at      = now()
    `

    // Send a welcome message
    if (webhookUrl) {
      await sendSlackMessage(
        webhookUrl,
        `✅ *Buena Onda connected!*\nYour AI ad agent will now send alerts and weekly performance reports to this channel.`
      ).catch(() => { /* non-fatal */ })
    }

    return NextResponse.redirect(`${appUrl}/dashboard/settings?slack=connected`)
  } catch (err) {
    console.error('[slack/callback]', err)
    return NextResponse.redirect(`${appUrl}/dashboard/settings?slack=error`)
  }
}
