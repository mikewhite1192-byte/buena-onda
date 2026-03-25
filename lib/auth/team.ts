// lib/auth/team.ts
// Resolves the effective owner user ID for any Clerk user ID.
// If the user is a team member, returns the owner's Clerk user ID.
// Otherwise returns the user's own ID.

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function getEffectiveUserId(clerkUserId: string): Promise<string> {
  try {
    const rows = await sql`
      SELECT owner_clerk_user_id FROM team_members
      WHERE member_clerk_user_id = ${clerkUserId}
      LIMIT 1
    `
    if (rows.length > 0) return rows[0].owner_clerk_user_id
  } catch {
    // fall through to own ID
  }
  return clerkUserId
}

export async function getTeamRole(clerkUserId: string): Promise<string | null> {
  try {
    const rows = await sql`
      SELECT role FROM team_members
      WHERE member_clerk_user_id = ${clerkUserId}
      LIMIT 1
    `
    if (rows.length > 0) return rows[0].role
  } catch {
    // ignore
  }
  return null
}
