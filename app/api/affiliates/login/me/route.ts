// app/api/affiliates/login/me/route.ts
// Returns the logged-in affiliate email from cookie
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const email = req.cookies.get('affiliate_email')?.value ?? null
  return NextResponse.json({ email })
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('affiliate_email', '', { maxAge: 0, path: '/' })
  return res
}
