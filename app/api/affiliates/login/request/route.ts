// app/api/affiliates/login/request/route.ts
// Generates a magic link token and emails it to the affiliate
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

const sql = neon(process.env.DATABASE_URL!)
const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email?.trim()) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://buenaonda.ai'

  // Check affiliate exists
  const rows = await sql`
    SELECT name, affiliate_code FROM affiliate_applications
    WHERE email = ${email.trim().toLowerCase()} AND status = 'active'
    LIMIT 1
  `
  if (rows.length === 0) {
    // Don't reveal whether email exists — always show success
    return NextResponse.json({ ok: true })
  }

  // Create token table if needed
  await sql`
    CREATE TABLE IF NOT EXISTS affiliate_login_tokens (
      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      email      TEXT        NOT NULL,
      token      TEXT        UNIQUE NOT NULL,
      used       BOOLEAN     NOT NULL DEFAULT false,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_affiliate_tokens_token ON affiliate_login_tokens(token)`

  // Delete old tokens for this email
  await sql`DELETE FROM affiliate_login_tokens WHERE email = ${email.trim().toLowerCase()}`

  // Generate token
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min

  await sql`
    INSERT INTO affiliate_login_tokens (email, token, expires_at)
    VALUES (${email.trim().toLowerCase()}, ${token}, ${expiresAt})
  `

  const loginUrl = `${appUrl}/affiliates/login/verify?token=${token}`
  const name = rows[0].name?.split(' ')[0] ?? 'there'

  await resend.emails.send({
    from: 'Buena Onda <hello@buenaonda.ai>',
    to: email.trim(),
    subject: 'Your Buena Onda affiliate login link',
    html: `
      <div style="font-family: monospace; max-width: 480px; margin: 0 auto; background: #0d0f14; color: #e8eaf0; padding: 40px 32px; border-radius: 12px;">
        <div style="font-size: 20px; font-weight: 800; color: #f5a623; margin-bottom: 24px;">Buena Onda</div>
        <div style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Hey ${name} 👋</div>
        <p style="font-size: 13px; color: #8b8fa8; line-height: 1.7; margin: 0 0 28px;">
          Click the button below to access your affiliate dashboard. This link expires in 30 minutes.
        </p>
        <a href="${loginUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f5a623, #f76b1c); color: #0d0f14; font-weight: 800; font-size: 14px; text-decoration: none; border-radius: 8px;">
          View My Dashboard →
        </a>
        <p style="font-size: 11px; color: #5a5e72; margin-top: 28px; line-height: 1.6;">
          If you didn't request this, you can safely ignore it.<br/>
          Link expires in 30 minutes and can only be used once.
        </p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
