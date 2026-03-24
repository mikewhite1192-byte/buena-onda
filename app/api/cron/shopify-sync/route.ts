// app/api/cron/shopify-sync/route.ts
// Runs daily at 7:30 UTC — syncs Shopify order metrics for all connected stores
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getShopifyOrders } from '@/lib/shopify/client'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  // Ensure metrics table exists
  await sql`
    CREATE TABLE IF NOT EXISTS shopify_metrics (
      id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      clerk_user_id    TEXT          NOT NULL,
      shop             TEXT          NOT NULL,
      date_recorded    DATE          NOT NULL,
      orders           INTEGER       NOT NULL DEFAULT 0,
      revenue          NUMERIC(12,2) NOT NULL DEFAULT 0,
      avg_order_value  NUMERIC(10,2),
      sessions         INTEGER       NOT NULL DEFAULT 0,
      created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
      UNIQUE(clerk_user_id, shop, date_recorded)
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_shopify_metrics_user ON shopify_metrics(clerk_user_id)`

  const connections = await sql`SELECT clerk_user_id, shop, access_token FROM shopify_connections`

  const results: { shop: string; status: string; error?: string }[] = []

  for (const conn of connections) {
    try {
      // Fetch last 30 days of orders
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const sinceStr = since.toISOString()

      const orders = await getShopifyOrders(conn.shop, conn.access_token, sinceStr)

      // Group orders by day
      const byDay: Record<string, { orders: number; revenue: number }> = {}
      for (const order of orders) {
        if (order.financial_status === 'refunded') continue
        const day = order.created_at.slice(0, 10)
        if (!byDay[day]) byDay[day] = { orders: 0, revenue: 0 }
        byDay[day].orders++
        byDay[day].revenue += parseFloat(order.total_price)
      }

      for (const [day, stats] of Object.entries(byDay)) {
        const avg = stats.orders > 0 ? stats.revenue / stats.orders : 0
        await sql`
          INSERT INTO shopify_metrics (clerk_user_id, shop, date_recorded, orders, revenue, avg_order_value)
          VALUES (${conn.clerk_user_id}, ${conn.shop}, ${day}::date, ${stats.orders}, ${stats.revenue.toFixed(2)}, ${avg.toFixed(2)})
          ON CONFLICT (clerk_user_id, shop, date_recorded) DO UPDATE SET
            orders          = EXCLUDED.orders,
            revenue         = EXCLUDED.revenue,
            avg_order_value = EXCLUDED.avg_order_value
        `
      }

      // Update last synced
      await sql`UPDATE shopify_connections SET updated_at = now() WHERE clerk_user_id = ${conn.clerk_user_id}`

      results.push({ shop: conn.shop, status: 'ok' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[shopify-sync] ${conn.shop}:`, msg)
      results.push({ shop: conn.shop, status: 'error', error: msg })
    }
  }

  return NextResponse.json({ synced: results.length, results })
}
