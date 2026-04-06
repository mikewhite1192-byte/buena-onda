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
    // Split into individual statements so ALTER TABLE + CREATE TABLE don't conflict in batch
    const statements = MIGRATION_SQL
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

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
