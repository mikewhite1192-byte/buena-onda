// app/api/client-portal/data/route.ts
// Returns campaigns + metrics for the logged-in client (read-only)
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  const clientId = req.cookies.get('client_portal_id')?.value ?? null
  if (!clientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get client record to find owner
  const clients = await sql`
    SELECT id, name, vertical, owner_id FROM clients WHERE id = ${clientId} LIMIT 1
  `.catch(() => [])

  if (clients.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const client = clients[0]

  // Get campaigns for this client
  const campaigns = await sql`
    SELECT id, avatar, offer, daily_budget, status, platform, created_at, ad_account_id
    FROM campaign_briefs
    WHERE client_id = ${clientId}
    ORDER BY created_at DESC
  `.catch(() => [])

  // Get last 30 days of metrics across all campaigns for this client
  const campaignIds = campaigns.map((c: Record<string, string>) => c.id)

  let metrics: unknown[] = []
  if (campaignIds.length > 0) {
    metrics = await sql`
      SELECT
        date,
        SUM(spend) as spend,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks,
        SUM(leads) as leads,
        AVG(cpl) as cpl,
        AVG(ctr) as ctr
      FROM ad_metrics
      WHERE campaign_brief_id = ANY(${campaignIds}::uuid[])
        AND date >= NOW() - INTERVAL '30 days'
      GROUP BY date
      ORDER BY date DESC
    `.catch(() => [])
  }

  // Summary totals (last 30 days)
  const summary = (metrics as Array<{ spend: string; impressions: number; clicks: number; leads: number }>).reduce(
    (acc, row) => ({
      spend: acc.spend + parseFloat(row.spend ?? '0'),
      impressions: acc.impressions + (row.impressions ?? 0),
      clicks: acc.clicks + (row.clicks ?? 0),
      leads: acc.leads + (row.leads ?? 0),
    }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0 }
  )

  return NextResponse.json({
    client,
    campaigns,
    metrics,
    summary,
  })
}
