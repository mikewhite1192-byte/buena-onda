// GET /api/reports/[token] — public, no auth required
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const sql = neon(process.env.DATABASE_URL!);

  const rows = await sql`
    SELECT client_name, start_date, end_date, snapshot, created_at
    FROM reports
    WHERE token = ${params.token}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
