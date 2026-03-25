// app/api/team/members/[id]/route.ts
// DELETE — remove a team member (owner only)
// PATCH  — update a team member's role (owner only)
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const result = await sql`
    DELETE FROM team_members
    WHERE id = ${id} AND owner_clerk_user_id = ${userId}
    RETURNING id
  `

  if (result.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { role } = await req.json()
  if (!['admin', 'manager', 'viewer'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const result = await sql`
    UPDATE team_members SET role = ${role}
    WHERE id = ${id} AND owner_clerk_user_id = ${userId}
    RETURNING id
  `

  if (result.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
