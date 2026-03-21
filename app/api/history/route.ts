// app/api/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("client_id");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);

  try {
    const rows = clientId
      ? await sql`
          SELECT * FROM action_log
          WHERE owner_id = ${userId} AND client_id = ${clientId}
          ORDER BY created_at DESC LIMIT ${limit}
        `
      : await sql`
          SELECT * FROM action_log
          WHERE owner_id = ${userId}
          ORDER BY created_at DESC LIMIT ${limit}
        `;
    return NextResponse.json({ actions: rows });
  } catch {
    // Table doesn't exist yet
    return NextResponse.json({ actions: [] });
  }
}
