// app/api/owner/outreach/route.ts
// Sends a WhatsApp or email message to a user from Mike
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { sendWhatsAppMessage } from '@/lib/whatsapp/client'
import { Resend } from 'resend'
import { requireOwner, isErrorResponse } from '@/lib/auth/owner'

const sql = neon(process.env.DATABASE_URL!)
const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  const ownerCheck = await requireOwner()
  if (isErrorResponse(ownerCheck)) return ownerCheck
  const { clerk_user_id, message, channel } = await req.json()
  // channel: 'whatsapp' | 'email'

  if (!clerk_user_id || !message) {
    return NextResponse.json({ error: 'clerk_user_id and message required' }, { status: 400 })
  }

  // Get user's whatsapp number and email from DB
  const rows = await sql`
    SELECT us.clerk_user_id,
           ws.whatsapp_number
    FROM user_subscriptions us
    LEFT JOIN user_subscriptions ws ON ws.clerk_user_id = us.clerk_user_id
    WHERE us.clerk_user_id = ${clerk_user_id}
    LIMIT 1
  `.catch(() => [])

  if (channel === 'whatsapp') {
    const number = rows[0]?.whatsapp_number
    if (!number) return NextResponse.json({ error: 'No WhatsApp number on file' }, { status: 400 })
    const sent = await sendWhatsAppMessage(number, `Hey! Mike from Buena Onda here 👋\n\n${message}`)
    return NextResponse.json({ ok: sent })
  }

  if (channel === 'email') {
    const ownerEmail = process.env.OWNER_EMAIL ?? 'mike@buenaonda.ai'
    // Email is sent from Mike directly — reply-to goes to Mike
    await resend.emails.send({
      from: `Mike at Buena Onda <${ownerEmail}>`,
      to: clerk_user_id, // fallback — ideally we'd store email in user_subscriptions
      subject: 'Checking in from Buena Onda',
      text: message,
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
}
