// POST /api/affiliates/click — increment total_clicks for an affiliate code
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ ok: false });

    await sql`
      UPDATE affiliate_applications
      SET total_clicks = total_clicks + 1
      WHERE affiliate_code = ${code} AND status = 'active'
    `;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
