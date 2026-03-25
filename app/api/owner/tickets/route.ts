// app/api/owner/tickets/route.ts
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'all'

  const rows = await sql`
    SELECT id, clerk_user_id, user_email, user_name, subject, description, category, status, created_at
    FROM support_tickets
    ${status !== 'all' ? sql`WHERE status = ${status}` : sql``}
    ORDER BY created_at DESC
    LIMIT 200
  `.catch(() => [])

  return NextResponse.json({ tickets: rows })
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })

  await sql`UPDATE support_tickets SET status = ${status} WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
