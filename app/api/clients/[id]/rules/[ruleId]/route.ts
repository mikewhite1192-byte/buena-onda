// app/api/clients/[id]/rules/[ruleId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; ruleId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await sql`
      UPDATE client_rules
      SET is_active = false
      WHERE id = ${params.ruleId} AND client_id = ${params.id} AND owner_id = ${userId}
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
