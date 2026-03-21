// app/api/agent/actions/budget-changes/route.ts
// Returns campaign IDs that had a budget increase in the last 7 days
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Table may not exist yet on first load
    const rows = await sql`
      SELECT campaign_id, MAX(changed_at) as last_changed
      FROM campaign_budget_changes
      WHERE client_id IN (SELECT id FROM clients WHERE owner_id = ${userId})
        AND changed_at > now() - interval '7 days'
      GROUP BY campaign_id
    `;
    return NextResponse.json({ recentlyIncreased: rows.map(r => r.campaign_id as string) });
  } catch {
    return NextResponse.json({ recentlyIncreased: [] });
  }
}
