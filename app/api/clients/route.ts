// app/api/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await sql`
    SELECT id, name, meta_ad_account_id, vertical, status,
           whatsapp_number, notes, created_at
    FROM clients
    WHERE owner_id = ${userId}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ clients: rows });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  console.log("[POST /api/clients] userId:", userId);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, meta_ad_account_id, vertical, whatsapp_number, notes, status } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO clients (owner_id, name, meta_ad_account_id, vertical, whatsapp_number, notes, status)
    VALUES (
      ${userId},
      ${name.trim()},
      ${meta_ad_account_id ?? null},
      ${vertical ?? "leads"},
      ${whatsapp_number ?? null},
      ${notes ?? null},
      ${status ?? "active"}
    )
    RETURNING id, name, meta_ad_account_id, vertical, status, whatsapp_number, notes, created_at
  `;

  return NextResponse.json({ client: rows[0] }, { status: 201 });
}
