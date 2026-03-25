// app/api/client-portal/branding/route.ts
// Returns branding for the current client's owner — used by the portal to white-label
// Also supports ?domain= lookup for custom domain routing
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

const DEFAULT_BRANDING = {
  agency_name: 'Buena Onda',
  logo_url: null,
  primary_color: '#f5a623',
  custom_domain: null,
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const domain = searchParams.get('domain')

  // Custom domain lookup — no auth needed, used by portal on custom domains
  if (domain) {
    const rows = await sql`
      SELECT agency_name, logo_url, primary_color, custom_domain, owner_clerk_user_id
      FROM workspace_branding
      WHERE custom_domain = ${domain}
      LIMIT 1
    `.catch(() => [])

    if (rows.length === 0) return NextResponse.json({ branding: DEFAULT_BRANDING, ownerId: null })
    return NextResponse.json({ branding: rows[0], ownerId: rows[0].owner_clerk_user_id })
  }

  // Cookie-based lookup — client is logged in, get their owner's branding
  const clientId = req.cookies.get('client_portal_id')?.value ?? null
  if (!clientId) return NextResponse.json({ branding: DEFAULT_BRANDING })

  const rows = await sql`
    SELECT wb.agency_name, wb.logo_url, wb.primary_color, wb.custom_domain
    FROM clients c
    LEFT JOIN workspace_branding wb ON wb.owner_clerk_user_id = c.owner_id
    WHERE c.id = ${clientId}
    LIMIT 1
  `.catch(() => [])

  if (rows.length === 0) return NextResponse.json({ branding: DEFAULT_BRANDING })

  return NextResponse.json({
    branding: {
      agency_name: rows[0].agency_name ?? DEFAULT_BRANDING.agency_name,
      logo_url: rows[0].logo_url ?? null,
      primary_color: rows[0].primary_color ?? DEFAULT_BRANDING.primary_color,
      custom_domain: rows[0].custom_domain ?? null,
    }
  })
}
