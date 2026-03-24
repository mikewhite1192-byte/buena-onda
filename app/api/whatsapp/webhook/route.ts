// app/api/whatsapp/webhook/route.ts
// Handles WhatsApp webhook verification (GET) and incoming messages (POST)

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { handleIncomingMessage } from '@/lib/whatsapp/conversation'

// ── GET — Webhook verification ────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[whatsapp] Webhook verified')
    return new Response(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// ── POST — Incoming messages ───────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Meta sends a test payload on setup — handle gracefully
    if (!body?.entry?.[0]?.changes?.[0]?.value?.messages) {
      return NextResponse.json({ ok: true })
    }

    const value = body.entry[0].changes[0].value
    const messages = value.messages

    for (const msg of messages) {
      // Only handle text messages for now
      if (msg.type !== 'text') {
        console.log(`[whatsapp] Skipping non-text message type: ${msg.type}`)
        continue
      }

      const from = msg.from        // sender's WhatsApp number
      const text = msg.text.body   // message content

      // Handle async — don't await so Meta doesn't timeout
      handleIncomingMessage(from, text).catch(err => {
        console.error('[whatsapp] handleIncomingMessage error:', err)
      })
    }

    // Always return 200 immediately — Meta will retry if it doesn't get this
    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[whatsapp] Webhook POST error:', err)
    return NextResponse.json({ ok: true }) // Still return 200 to prevent Meta retries
  }
}
