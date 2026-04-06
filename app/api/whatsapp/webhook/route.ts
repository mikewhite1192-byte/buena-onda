// app/api/whatsapp/webhook/route.ts
// Handles WhatsApp webhook verification (GET) and incoming messages (POST)

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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
    // Verify Meta webhook signature (X-Hub-Signature-256)
    const signature = req.headers.get('x-hub-signature-256')
    const appSecret = process.env.META_APP_SECRET
    if (appSecret && signature) {
      const crypto = await import('crypto')
      const rawBody = await req.clone().text()
      const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')
      if (signature !== expected) {
        console.error('[whatsapp] Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const body = await req.json()

    // Meta sends a test payload on setup — handle gracefully
    if (!body?.entry?.[0]?.changes?.[0]?.value?.messages) {
      return NextResponse.json({ ok: true })
    }

    const value = body.entry[0].changes[0].value
    const messages = value.messages

    // Process all text messages — await so Vercel doesn't kill the function before reply sends
    const tasks: Promise<void>[] = []
    for (const msg of messages) {
      if (msg.type !== 'text') continue
      const from = msg.from
      const text = msg.text.body
      tasks.push(
        handleIncomingMessage(from, text).catch(err =>
          console.error('[whatsapp] handleIncomingMessage error:', err)
        )
      )
    }

    await Promise.all(tasks)

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[whatsapp] Webhook POST error:', err)
    return NextResponse.json({ ok: true })
  }
}
