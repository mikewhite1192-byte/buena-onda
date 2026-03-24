// app/api/affiliates/login/verify/route.ts
// Validates magic link token and redirects to dashboard with email in cookie
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://buenaonda.ai'

  if (!token) return NextResponse.redirect(`${appUrl}/affiliates/dashboard?error=invalid`)

  const rows = await sql`
    SELECT email, used, expires_at FROM affiliate_login_tokens
    WHERE token = ${token}
    LIMIT 1
  `.catch(() => [])

  if (rows.length === 0) {
    return NextResponse.redirect(`${appUrl}/affiliates/dashboard?error=invalid`)
  }

  const { email, used, expires_at } = rows[0]

  if (used) {
    return NextResponse.redirect(`${appUrl}/affiliates/dashboard?error=used`)
  }

  if (new Date(expires_at) < new Date()) {
    return NextResponse.redirect(`${appUrl}/affiliates/dashboard?error=expired`)
  }

  // Mark token as used
  await sql`UPDATE affiliate_login_tokens SET used = true WHERE token = ${token}`

  // Set a secure cookie so they stay logged in
  const res = NextResponse.redirect(`${appUrl}/affiliates/dashboard`)
  res.cookies.set('affiliate_email', email, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  return res
}
