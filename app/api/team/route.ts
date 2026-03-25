// app/api/team/route.ts
// GET  — list team members + pending invites
// POST — create invite (sends email)
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'
import crypto from 'crypto'

const sql = neon(process.env.DATABASE_URL!)
const resend = new Resend(process.env.RESEND_API_KEY!)

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Ensure tables exist
  await sql`
    CREATE TABLE IF NOT EXISTS team_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_clerk_user_id TEXT NOT NULL,
      member_clerk_user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      name TEXT,
      email TEXT,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(owner_clerk_user_id, member_clerk_user_id)
    )
  `.catch(() => {})

  await sql`
    CREATE TABLE IF NOT EXISTS team_invites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_clerk_user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      accepted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `.catch(() => {})

  const [members, invites] = await Promise.all([
    sql`
      SELECT id, member_clerk_user_id, role, name, email, joined_at
      FROM team_members
      WHERE owner_clerk_user_id = ${userId}
      ORDER BY joined_at ASC
    `.catch(() => []),
    sql`
      SELECT id, email, role, created_at, expires_at, accepted_at
      FROM team_invites
      WHERE owner_clerk_user_id = ${userId}
        AND accepted_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
    `.catch(() => []),
  ])

  return NextResponse.json({ members, invites })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, role } = await req.json()
  if (!email || !role) return NextResponse.json({ error: 'email and role required' }, { status: 400 })
  if (!['admin', 'manager', 'viewer'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://buenaonda.ai'
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  // Delete any existing pending invite for this email from this owner
  await sql`
    DELETE FROM team_invites
    WHERE owner_clerk_user_id = ${userId} AND email = ${email} AND accepted_at IS NULL
  `.catch(() => {})

  await sql`
    INSERT INTO team_invites (owner_clerk_user_id, email, role, token, expires_at)
    VALUES (${userId}, ${email}, ${role}, ${token}, ${expiresAt.toISOString()})
  `

  const inviteUrl = `${appUrl}/team/accept?token=${token}`
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)

  await resend.emails.send({
    from: 'Buena Onda <noreply@buenaonda.ai>',
    to: email,
    subject: "You've been invited to Buena Onda",
    html: `
      <div style="background:#0d0f14;padding:40px 24px;font-family:monospace;max-width:520px;margin:0 auto;border-radius:12px;">
        <div style="margin-bottom:28px;">
          <div style="display:inline-block;background:linear-gradient(135deg,#f5a623,#f76b1c);border-radius:8px;padding:6px 12px;font-size:14px;font-weight:900;color:#fff;letter-spacing:-0.3px;">
            Buena Onda
          </div>
        </div>
        <h2 style="color:#e8eaf0;font-size:20px;margin:0 0 12px;font-weight:700;">You're invited</h2>
        <p style="color:#8b8fa8;font-size:14px;line-height:1.6;margin:0 0 24px;">
          You've been invited to join a Buena Onda workspace as a <strong style="color:#f5a623;">${roleLabel}</strong>.
          Click the button below to accept and set up your account.
        </p>
        <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#f5a623,#f76b1c);color:#0d0f14;font-weight:800;font-size:14px;padding:12px 28px;border-radius:9px;text-decoration:none;letter-spacing:-0.2px;">
          Accept Invitation →
        </a>
        <p style="color:#5a5e72;font-size:12px;margin:24px 0 0;">
          This invite expires in 7 days. If you didn't expect this email, you can ignore it.
        </p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
