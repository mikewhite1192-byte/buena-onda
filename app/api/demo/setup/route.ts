// app/api/demo/setup/route.ts
// Creates the shared demo Clerk user + seeds all demo clients.
// Hit this once (or whenever you need to recreate the demo account).
// Protected by CRON_SECRET so only you can run it.

import { NextRequest, NextResponse } from "next/server";
import { createClerkClient } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { DEMO_CLIENTS_CONFIG } from "@/lib/demo-data";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const sql = neon(process.env.DATABASE_URL!);

const DEMO_EMAIL    = "demo@buenaonda.ai";
const DEMO_PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD ?? "BuenaOndaDemo2026!";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Find or create the demo Clerk user
  let userId: string;
  const existing = await clerk.users.getUserList({ emailAddress: [DEMO_EMAIL] });

  if (existing.totalCount > 0) {
    userId = existing.data[0].id;
    // Ensure password is up-to-date
    await clerk.users.updateUser(userId, { password: DEMO_PASSWORD });
  } else {
    const user = await clerk.users.createUser({
      emailAddress: [DEMO_EMAIL],
      password: DEMO_PASSWORD,
      firstName: "Demo",
      lastName: "Account",
      skipPasswordChecks: true,
    });
    userId = user.id;
  }

  // 2. Wipe existing demo clients for this user
  await sql`DELETE FROM clients WHERE owner_id = ${userId} AND meta_ad_account_id LIKE 'act_demo%'`;

  // 3. Seed all 15 demo clients
  for (const config of DEMO_CLIENTS_CONFIG) {
    await sql`
      INSERT INTO clients (owner_id, name, meta_ad_account_id, vertical, status, notes)
      VALUES (${userId}, ${config.name}, ${config.meta_ad_account_id}, ${config.vertical}, 'active', ${config.notes})
    `;
  }

  return NextResponse.json({ ok: true, userId, email: DEMO_EMAIL, clients: DEMO_CLIENTS_CONFIG.length });
}
