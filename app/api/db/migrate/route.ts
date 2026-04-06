export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { MIGRATION_SQL } from "@/lib/db/schema";
import { requireOwner, isErrorResponse } from "@/lib/auth/owner";

export async function GET() {
  const ownerCheck = await requireOwner();
  if (isErrorResponse(ownerCheck)) return ownerCheck;
  try {
    const sql = getDb();
    // Strip SQL comments then split into individual statements
    const cleaned = MIGRATION_SQL
      .replace(/--[^\n]*/g, "")  // remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, ""); // remove block comments
    const statements = cleaned
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const errors: string[] = [];
    for (const stmt of statements) {
      try {
        await sql.unsafe(stmt);
      } catch (err) {
        const msg = (err as Error).message;
        // Skip "already exists" errors — they're expected with IF NOT EXISTS
        if (!msg.includes("already exists") && !msg.includes("duplicate")) {
          errors.push(`${msg} [${stmt.slice(0, 60)}...]`);
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ ok: true, message: "Migration completed with some skipped statements", errors });
    }
    return NextResponse.json({ ok: true, message: "Tables created successfully" });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
