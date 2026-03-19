// app/api/agent/presets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name, columns, is_default } = await req.json();

  if (is_default) {
    await sql`UPDATE user_metric_presets SET is_default = false WHERE owner_id = ${userId}`;
  }

  const result = await sql`
    UPDATE user_metric_presets
    SET
      name       = COALESCE(${name ?? null}, name),
      columns    = COALESCE(${columns ? JSON.stringify(columns) : null}::jsonb, columns),
      is_default = COALESCE(${is_default ?? null}, is_default)
    WHERE id = ${id} AND owner_id = ${userId}
    RETURNING *
  `;

  if (!result.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ preset: result[0] });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await sql`DELETE FROM user_metric_presets WHERE id = ${id} AND owner_id = ${userId}`;
  return NextResponse.json({ ok: true });
}
