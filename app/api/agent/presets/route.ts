// app/api/agent/presets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const presets = await sql`
    SELECT * FROM user_metric_presets
    WHERE owner_id = ${userId}
    ORDER BY is_default DESC, created_at ASC
  `;

  return NextResponse.json({ presets });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, columns, is_default } = await req.json();
  if (!name || !columns?.length) {
    return NextResponse.json({ error: "name and columns required" }, { status: 400 });
  }

  if (is_default) {
    await sql`UPDATE user_metric_presets SET is_default = false WHERE owner_id = ${userId}`;
  }

  const result = await sql`
    INSERT INTO user_metric_presets (owner_id, name, columns, is_default)
    VALUES (${userId}, ${name}, ${JSON.stringify(columns)}, ${is_default ?? false})
    RETURNING *
  `;

  return NextResponse.json({ preset: result[0] }, { status: 201 });
}
