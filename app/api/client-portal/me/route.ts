// app/api/client-portal/me/route.ts
// GET — returns client info from cookie session
// DELETE — clears session (logout)
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  const clientId = req.cookies.get('client_portal_id')?.value ?? null
  if (!clientId) return NextResponse.json({ client: null })

  const rows = await sql`
    SELECT id, name, vertical, status, website_url, contact_email
    FROM clients WHERE id = ${clientId} LIMIT 1
  `.catch(() => [])

  if (rows.length === 0) return NextResponse.json({ client: null })
  return NextResponse.json({ client: rows[0] })
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('client_portal_id', '', { maxAge: 0, path: '/' })
  return res
}
