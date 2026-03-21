// PATCH /api/clients/[id]/creatives/[creativeId] — update creative
// DELETE /api/clients/[id]/creatives/[creativeId] — delete creative
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; creativeId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL!);
  const body = await req.json();
  const { name, format, status, hook, spend, cpl, roas, ctr, notes } = body;

  const rows = await sql`
    UPDATE creatives SET
      name    = COALESCE(${name ?? null}, name),
      format  = COALESCE(${format ?? null}, format),
      status  = COALESCE(${status ?? null}, status),
      hook    = ${hook ?? null},
      spend   = ${spend ?? null},
      cpl     = ${cpl ?? null},
      roas    = ${roas ?? null},
      ctr     = ${ctr ?? null},
      notes   = ${notes ?? null}
    WHERE id = ${params.creativeId}
      AND client_id = ${params.id}
      AND user_id = ${userId}
    RETURNING *
  `;

  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ creative: rows[0] });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; creativeId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    DELETE FROM creatives
    WHERE id = ${params.creativeId}
      AND client_id = ${params.id}
      AND user_id = ${userId}
  `;

  return NextResponse.json({ ok: true });
}
