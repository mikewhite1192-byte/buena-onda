// app/api/branding/route.ts
// GET  — returns the owner's branding config + plan access flag
// PATCH — saves branding config (requires active subscription)
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

const sql = neon(process.env.DATABASE_URL!)

async function hasActivePlan(userId: string): Promise<boolean> {
  const rows = await sql`
    SELECT status FROM user_subscriptions
    WHERE clerk_user_id = ${userId}
    LIMIT 1
  `.catch(() => [])
  if (rows.length === 0) return false
  return ['active', 'trialing'].includes(rows[0].status)
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS workspace_branding (
      id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_clerk_user_id  TEXT        UNIQUE NOT NULL,
      agency_name          TEXT,
      logo_url             TEXT,
      primary_color        TEXT        NOT NULL DEFAULT '#f5a623',
      custom_domain        TEXT,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `.catch(() => {})
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureTable()

  const rows = await sql`
    SELECT agency_name, logo_url, primary_color, custom_domain
    FROM workspace_branding
    WHERE owner_clerk_user_id = ${userId}
    LIMIT 1
  `.catch(() => [])

  const hasAccess = await hasActivePlan(userId)

  return NextResponse.json({
    branding: rows[0] ?? { agency_name: null, logo_url: null, primary_color: '#f5a623', custom_domain: null },
    hasAccess,
  })
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Plan gate — $197 plan required
  const hasAccess = await hasActivePlan(userId)
  if (!hasAccess) return NextResponse.json({ error: 'upgrade_required' }, { status: 403 })

  await ensureTable()

  const { agency_name, logo_url, primary_color, custom_domain } = await req.json()

  // Validate hex color
  const color = /^#[0-9a-fA-F]{6}$/.test(primary_color ?? '') ? primary_color : '#f5a623'

  // Check if custom domain is new (to trigger notification)
  const existing = await sql`
    SELECT custom_domain FROM workspace_branding WHERE owner_clerk_user_id = ${userId} LIMIT 1
  `.catch(() => [])
  const previousDomain = existing[0]?.custom_domain ?? null
  const domainChanged = custom_domain && custom_domain !== previousDomain

  await sql`
    INSERT INTO workspace_branding (owner_clerk_user_id, agency_name, logo_url, primary_color, custom_domain, updated_at)
    VALUES (${userId}, ${agency_name ?? null}, ${logo_url ?? null}, ${color}, ${custom_domain ?? null}, NOW())
    ON CONFLICT (owner_clerk_user_id) DO UPDATE SET
      agency_name   = EXCLUDED.agency_name,
      logo_url      = EXCLUDED.logo_url,
      primary_color = EXCLUDED.primary_color,
      custom_domain = EXCLUDED.custom_domain,
      updated_at    = NOW()
  `

  // Notify Mike when a new custom domain is submitted
  if (domainChanged) {
    const ownerEmail = process.env.OWNER_EMAIL ?? 'mike@buenaonda.ai'
    await resend.emails.send({
      from: 'Buena Onda <noreply@buenaonda.ai>',
      to: ownerEmail,
      subject: `🌐 New custom domain: ${custom_domain}`,
      html: `
        <div style="font-family:monospace;background:#0d0f14;padding:32px 24px;border-radius:12px;max-width:480px;">
          <h2 style="color:#e8eaf0;margin:0 0 12px;">New custom domain submitted</h2>
          <p style="color:#8b8fa8;font-size:14px;margin:0 0 20px;">An agency has configured a custom portal domain and is waiting for activation.</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr><td style="color:#8b8fa8;padding:6px 0;">Agency</td><td style="color:#e8eaf0;">${agency_name ?? '—'}</td></tr>
            <tr><td style="color:#8b8fa8;padding:6px 0;">Domain</td><td style="color:#f5a623;font-weight:700;">${custom_domain}</td></tr>
            <tr><td style="color:#8b8fa8;padding:6px 0;">User ID</td><td style="color:#5a5e72;font-size:11px;">${userId}</td></tr>
          </table>
          <div style="margin-top:24px;padding:16px;background:rgba(245,166,35,0.08);border:1px solid rgba(245,166,35,0.2);border-radius:8px;">
            <div style="color:#f5a623;font-size:12px;font-weight:700;margin-bottom:8px;">ACTION REQUIRED</div>
            <div style="color:#8b8fa8;font-size:13px;line-height:1.6;">
              1. Add <strong style="color:#e8eaf0;">${custom_domain}</strong> to Vercel → Project → Domains<br/>
              2. Reply to the agency confirming it's live (within 24 hours)
            </div>
          </div>
        </div>
      `,
    }).catch(() => {}) // don't fail the save if email fails
  }

  return NextResponse.json({ ok: true })
}
