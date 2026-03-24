// app/api/google-ads/customer/route.ts
// PATCH: update the customer_id for the current user's Google Ads connection

import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { customer_id } = await req.json()
  if (!customer_id) return NextResponse.json({ error: 'customer_id required' }, { status: 400 })

  const clean = String(customer_id).replace(/-/g, '')

  await sql`
    UPDATE google_ads_connections
    SET customer_id = ${clean}, updated_at = NOW()
    WHERE clerk_user_id = ${userId}
  `

  return NextResponse.json({ ok: true })
}
