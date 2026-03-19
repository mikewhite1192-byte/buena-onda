// app/api/clients/[id]/route.ts
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
  const body = await req.json();
  const { name, meta_ad_account_id, vertical, whatsapp_number, notes, status } = body;

  const rows = await sql`
    UPDATE clients SET
      name               = COALESCE(${name ?? null}, name),
      meta_ad_account_id = COALESCE(${meta_ad_account_id ?? null}, meta_ad_account_id),
      vertical           = COALESCE(${vertical ?? null}, vertical),
      whatsapp_number    = COALESCE(${whatsapp_number ?? null}, whatsapp_number),
      notes              = COALESCE(${notes ?? null}, notes),
      status             = COALESCE(${status ?? null}, status)
    WHERE id = ${id} AND owner_id = ${userId}
    RETURNING id, name, meta_ad_account_id, vertical, status, whatsapp_number, notes, created_at
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ client: rows[0] });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const rows = await sql`
    DELETE FROM clients WHERE id = ${id} AND owner_id = ${userId} RETURNING id
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
