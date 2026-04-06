// GET /api/owner/traffic — owner-only traffic analytics
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { requireOwner, isErrorResponse } from "@/lib/auth/owner";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  const ownerCheck = await requireOwner();
  if (isErrorResponse(ownerCheck)) return ownerCheck;

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "7d";

  const since = range === "all" ? new Date("2020-01-01") :
    range === "90d" ? new Date(Date.now() - 90 * 86400000) :
    range === "30d" ? new Date(Date.now() - 30 * 86400000) :
    new Date(Date.now() - 7 * 86400000);

  const sinceStr = since.toISOString();

  // Total views + unique visitors
  const [totals] = await sql`
    SELECT
      COUNT(*) as total_views,
      COUNT(DISTINCT visitor_id) as unique_visitors
    FROM site_traffic
    WHERE created_at >= ${sinceStr}
  `.catch(() => [{ total_views: 0, unique_visitors: 0 }]);

  // Views by day
  const dailyViews = await sql`
    SELECT
      created_at::date::text as date,
      COUNT(*) as views,
      COUNT(DISTINCT visitor_id) as visitors
    FROM site_traffic
    WHERE created_at >= ${sinceStr}
    GROUP BY created_at::date
    ORDER BY created_at::date ASC
  `.catch(() => []);

  // Top pages
  const topPages = await sql`
    SELECT
      path,
      COUNT(*) as views,
      COUNT(DISTINCT visitor_id) as visitors
    FROM site_traffic
    WHERE created_at >= ${sinceStr}
    GROUP BY path
    ORDER BY views DESC
    LIMIT 20
  `.catch(() => []);

  // Top referrers
  const topReferrers = await sql`
    SELECT
      COALESCE(referrer, 'Direct') as referrer,
      COUNT(*) as views
    FROM site_traffic
    WHERE created_at >= ${sinceStr}
    GROUP BY referrer
    ORDER BY views DESC
    LIMIT 15
  `.catch(() => []);

  // Views today vs yesterday
  const [today] = await sql`
    SELECT COUNT(*) as views FROM site_traffic
    WHERE created_at >= CURRENT_DATE
  `.catch(() => [{ views: 0 }]);

  const [yesterday] = await sql`
    SELECT COUNT(*) as views FROM site_traffic
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE
  `.catch(() => [{ views: 0 }]);

  return NextResponse.json({
    range,
    total_views: Number(totals.total_views),
    unique_visitors: Number(totals.unique_visitors),
    today: Number(today.views),
    yesterday: Number(yesterday.views),
    daily: dailyViews,
    top_pages: topPages,
    top_referrers: topReferrers,
  });
}
