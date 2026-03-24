// lib/slack/client.ts

export interface SlackTokenResponse {
  ok: boolean
  access_token: string
  token_type: string
  scope: string
  bot_user_id: string
  app_id: string
  team: { id: string; name: string }
  authed_user: { id: string }
  incoming_webhook?: {
    channel: string
    channel_id: string
    url: string
  }
}

export async function exchangeSlackCode(code: string): Promise<SlackTokenResponse> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://buenaonda.ai'
  const res = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code,
      redirect_uri: `${appUrl}/api/slack/callback`,
    }),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(`Slack token exchange failed: ${data.error}`)
  return data
}

export async function sendSlackMessage(
  webhookUrl: string,
  text: string,
  blocks?: object[]
): Promise<void> {
  const body: Record<string, unknown> = { text }
  if (blocks) body.blocks = blocks

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Slack message failed: ${t}`)
  }
}

export async function sendSlackAlert(
  webhookUrl: string,
  title: string,
  body: string,
  color: 'good' | 'warning' | 'danger' = 'good'
): Promise<void> {
  const emoji = color === 'good' ? '✅' : color === 'warning' ? '⚠️' : '🚨'
  await sendSlackMessage(webhookUrl, `${emoji} *${title}*\n${body}`)
}
