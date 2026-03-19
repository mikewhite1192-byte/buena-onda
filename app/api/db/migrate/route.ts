export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { MIGRATION_SQL } from "@/lib/db/schema";

export async function GET() {
  try {
    const sql = getDb();
    await sql.unsafe(MIGRATION_SQL);
    return NextResponse.json({ ok: true, message: "Tables created successfully" });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
