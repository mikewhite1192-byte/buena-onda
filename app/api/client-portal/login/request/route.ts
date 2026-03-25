// app/api/client-portal/login/request/route.ts
// Owner sends a magic link to a client's email for portal access
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'
import crypto from 'crypto'

const sql = neon(process.env.DATABASE_URL!)
const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId, email } = await req.json()
  if (!clientId || !email) return NextResponse.json({ error: 'clientId and email required' }, { status: 400 })

  // Verify this client belongs to this owner
  const clients = await sql`
    SELECT id, name FROM clients WHERE id = ${clientId} AND owner_id = ${userId} LIMIT 1
  `.catch(() => [])

  if (clients.length === 0) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  const client = clients[0]

  // Save email to client record if not already set
  await sql`
    UPDATE clients SET contact_email = ${email} WHERE id = ${clientId}
  `.catch(() => {})

  // Ensure token table exists
  await sql`
    CREATE TABLE IF NOT EXISTS client_login_tokens (
      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id  UUID        NOT NULL,
      token      TEXT        NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used       BOOLEAN     NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `.catch(() => {})

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://buenaonda.ai'
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Delete old unused tokens for this client
  await sql`DELETE FROM client_login_tokens WHERE client_id = ${clientId} AND used = false`.catch(() => {})

  await sql`
    INSERT INTO client_login_tokens (client_id, token, expires_at)
    VALUES (${clientId}, ${token}, ${expiresAt.toISOString()})
  `

  const loginUrl = `${appUrl}/portal/login/verify?token=${token}`

  await resend.emails.send({
    from: 'Buena Onda <noreply@buenaonda.ai>',
    to: email,
    subject: `Your ${client.name} portal access`,
    html: `
      <div style="background:#0d0f14;padding:40px 24px;font-family:monospace;max-width:520px;margin:0 auto;border-radius:12px;">
        <div style="margin-bottom:28px;">
          <div style="display:inline-block;background:linear-gradient(135deg,#f5a623,#f76b1c);border-radius:8px;padding:6px 12px;font-size:14px;font-weight:900;color:#fff;">
            Buena Onda
          </div>
        </div>
        <h2 style="color:#e8eaf0;font-size:20px;margin:0 0 12px;font-weight:700;">Your campaign portal is ready</h2>
        <p style="color:#8b8fa8;font-size:14px;line-height:1.6;margin:0 0 24px;">
          Click below to access your <strong style="color:#e8eaf0;">${client.name}</strong> dashboard —
          view your campaign performance, metrics, and reports.
        </p>
        <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#f5a623,#f76b1c);color:#0d0f14;font-weight:800;font-size:14px;padding:12px 28px;border-radius:9px;text-decoration:none;">
          View My Dashboard →
        </a>
        <p style="color:#5a5e72;font-size:12px;margin:24px 0 0;">
          This link expires in 24 hours. If you didn't expect this email, you can ignore it.
        </p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
