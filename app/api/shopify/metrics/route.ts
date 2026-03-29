// app/api/shopify/metrics/route.ts
// Returns Shopify store metrics synced by cron
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const metrics = await sql`
      SELECT date_recorded, orders, revenue, avg_order_value, sessions
      FROM shopify_metrics
      WHERE clerk_user_id = ${userId}
      ORDER BY date_recorded DESC
      LIMIT 90
    `;

    return NextResponse.json({
      connected: true,
      metrics,
    })
  } catch {
    return NextResponse.json({ connected: true, metrics: [] })
  }
}
