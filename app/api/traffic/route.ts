// POST /api/traffic — public endpoint for tracking page views
// Called from middleware on every public page load
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  try {
    const { path, referrer, userAgent, visitorId } = await req.json();
    if (!path || typeof path !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Don't track bots
    const ua = (userAgent || "").toLowerCase();
    if (ua.includes("bot") || ua.includes("crawler") || ua.includes("spider")) {
      return NextResponse.json({ ok: true });
    }

    await sql`
      INSERT INTO site_traffic (path, referrer, user_agent, visitor_id, created_at)
      VALUES (${path.slice(0, 500)}, ${(referrer || "").slice(0, 1000) || null}, ${(userAgent || "").slice(0, 500) || null}, ${visitorId || null}, NOW())
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[traffic] Error:", err);
    return NextResponse.json({ ok: true }); // don't fail page loads
  }
}
