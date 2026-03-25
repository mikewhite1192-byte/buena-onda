// app/api/branding/route.ts
// GET  — returns the owner's branding config
// PATCH — saves branding config
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

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

  return NextResponse.json({
    branding: rows[0] ?? { agency_name: null, logo_url: null, primary_color: '#f5a623', custom_domain: null }
  })
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureTable()

  const { agency_name, logo_url, primary_color, custom_domain } = await req.json()

  // Validate hex color
  const color = /^#[0-9a-fA-F]{6}$/.test(primary_color ?? '') ? primary_color : '#f5a623'

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

  return NextResponse.json({ ok: true })
}
