// app/api/client-portal/login/verify/route.ts
// Validates magic link token and sets client_portal_id cookie
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://buenaonda.ai'

  if (!token) return NextResponse.redirect(`${appUrl}/portal/login?error=invalid`)

  const rows = await sql`
    SELECT t.client_id, t.used, t.expires_at
    FROM client_login_tokens t
    WHERE t.token = ${token}
    LIMIT 1
  `.catch(() => [])

  if (rows.length === 0) return NextResponse.redirect(`${appUrl}/portal/login?error=invalid`)

  const { client_id, used, expires_at } = rows[0]

  if (used) return NextResponse.redirect(`${appUrl}/portal/login?error=used`)
  if (new Date(expires_at) < new Date()) return NextResponse.redirect(`${appUrl}/portal/login?error=expired`)

  await sql`UPDATE client_login_tokens SET used = true WHERE token = ${token}`

  const res = NextResponse.redirect(`${appUrl}/portal/dashboard`)
  res.cookies.set('client_portal_id', client_id, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return res
}
