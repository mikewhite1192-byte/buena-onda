// app/api/cron/demo-reset/route.ts
// Resets demo account data daily so it stays fresh.
// Called by Vercel cron — also secured by CRON_SECRET.

import { NextRequest, NextResponse } from "next/server";
import { createClerkClient } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { DEMO_CLIENTS_CONFIG } from "@/lib/demo-data";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const sql = neon(process.env.DATABASE_URL!);

const DEMO_EMAIL = "demo@buenaonda.ai";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await clerk.users.getUserList({ emailAddress: [DEMO_EMAIL] });
  if (existing.totalCount === 0) {
    return NextResponse.json({ error: "Demo user not found. Run /api/demo/setup first." }, { status: 404 });
  }

  const userId = existing.data[0].id;

  // Wipe and reseed demo clients
  await sql`DELETE FROM clients WHERE owner_id = ${userId} AND meta_ad_account_id LIKE 'act_demo%'`;

  for (const config of DEMO_CLIENTS_CONFIG) {
    await sql`
      INSERT INTO clients (owner_id, name, meta_ad_account_id, vertical, status, notes)
      VALUES (${userId}, ${config.name}, ${config.meta_ad_account_id}, ${config.vertical}, 'active', ${config.notes})
    `;
  }

  // Also wipe any agent history/actions so the demo stays clean
  await sql`DELETE FROM agent_actions WHERE owner_id = ${userId}`.catch(() => {});

  return NextResponse.json({ ok: true, reset: DEMO_CLIENTS_CONFIG.length });
}
