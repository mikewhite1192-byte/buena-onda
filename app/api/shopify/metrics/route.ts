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
    const [connection, metrics] = await Promise.all([
      sql`
        SELECT shop, shop_name, updated_at
        FROM shopify_connections
        WHERE clerk_user_id = ${userId}
        LIMIT 1
      `,
      sql`
        SELECT date_recorded, orders, revenue, avg_order_value, sessions
        FROM shopify_metrics
        WHERE clerk_user_id = ${userId}
        ORDER BY date_recorded DESC
        LIMIT 90
      `.catch(() => []),
    ])

    return NextResponse.json({
      connected: connection.length > 0,
      shop: connection[0]?.shop ?? null,
      shop_name: connection[0]?.shop_name ?? null,
      last_synced: connection[0]?.updated_at ?? null,
      metrics,
    })
  } catch {
    return NextResponse.json({ connected: false, shop: null, shop_name: null, last_synced: null, metrics: [] })
  }
}
