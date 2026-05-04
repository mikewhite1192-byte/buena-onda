// POST /api/affiliates/click — increment total_clicks for an affiliate code
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { rateLimit, callerKey } from "@/lib/rate-limit";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ ok: false });

    // Cap counter inflation: at most 1 click per IP per affiliate code per
    // 10 minutes. Stops a single attacker from juicing a competitor's number
    // (or their own milestone-trigger threshold) into the millions.
    const limit = await rateLimit("affiliate-click", `${callerKey(req)}:${code}`, 1, 600);
    if (!limit.ok) return NextResponse.json({ ok: true, throttled: true });

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
