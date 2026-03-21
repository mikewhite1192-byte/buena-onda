// app/api/demo/seed/route.ts — Creates all demo clients for the current user
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { DEMO_CLIENTS_CONFIG } from "@/lib/demo-data";

const sql = neon(process.env.DATABASE_URL!);

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Upsert each demo client (skip if already exists for this user)
  const existing = await sql`
    SELECT meta_ad_account_id FROM clients
    WHERE owner_id = ${userId} AND meta_ad_account_id LIKE 'act_demo%'
  `;
  const existingIds = new Set(existing.map((r) => r.meta_ad_account_id as string));

  const created: string[] = [];
  for (const config of DEMO_CLIENTS_CONFIG) {
    if (existingIds.has(config.meta_ad_account_id)) continue;
    await sql`
      INSERT INTO clients (owner_id, name, meta_ad_account_id, vertical, status, notes)
      VALUES (${userId}, ${config.name}, ${config.meta_ad_account_id}, ${config.vertical}, 'active', ${config.notes})
    `;
    created.push(config.name);
  }

  return NextResponse.json({ created, total: DEMO_CLIENTS_CONFIG.length });
}
