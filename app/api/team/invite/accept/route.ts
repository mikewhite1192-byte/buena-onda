// app/api/team/invite/accept/route.ts
// POST — accepts a team invite for the currently signed-in user
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  // Validate token
  const rows = await sql`
    SELECT id, owner_clerk_user_id, email, role, accepted_at, expires_at
    FROM team_invites
    WHERE token = ${token}
    LIMIT 1
  `.catch(() => [])

  if (rows.length === 0) return NextResponse.json({ error: 'Invalid invite' }, { status: 400 })

  const invite = rows[0]

  if (invite.accepted_at) return NextResponse.json({ error: 'Invite already used' }, { status: 400 })
  if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Invite expired' }, { status: 400 })
  if (invite.owner_clerk_user_id === userId) return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 })

  // Verify the joining user's primary email matches the invite — without this
  // gate, anyone with the token URL could join the workspace as any role.
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const callerEmail = user.emailAddresses[0]?.emailAddress?.trim().toLowerCase()
  const inviteEmail = (invite.email as string)?.trim().toLowerCase()
  if (!callerEmail || !inviteEmail || callerEmail !== inviteEmail) {
    return NextResponse.json({ error: 'This invite is for a different email address' }, { status: 403 })
  }

  const memberName = [user.firstName, user.lastName].filter(Boolean).join(' ') || null
  const memberEmail = user.emailAddresses[0]?.emailAddress ?? invite.email

  // Insert team member (upsert safe)
  await sql`
    INSERT INTO team_members (owner_clerk_user_id, member_clerk_user_id, role, name, email)
    VALUES (${invite.owner_clerk_user_id}, ${userId}, ${invite.role}, ${memberName}, ${memberEmail})
    ON CONFLICT (owner_clerk_user_id, member_clerk_user_id) DO UPDATE
      SET role = EXCLUDED.role, name = EXCLUDED.name, email = EXCLUDED.email
  `

  // Mark invite accepted
  await sql`
    UPDATE team_invites SET accepted_at = NOW() WHERE token = ${token}
  `

  return NextResponse.json({ ok: true })
}
