// app/api/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { getEffectiveUserId } from "@/lib/auth/team";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const effectiveUserId = await getEffectiveUserId(userId);

  // The columns this query reads are added by the migration script. Running
  // ALTER TABLE on every dashboard load took an ACCESS EXCLUSIVE lock that
  // briefly blocked all writers — bad at scale, irrelevant for correctness
  // since the schema migration already adds them.
  const rows = await sql`
    SELECT id, name, meta_ad_account_id, meta_page_id, vertical, status,
           whatsapp_number, notes, created_at,
           cpl_target, roas_target, monthly_budget, website_url, contact_email,
           google_customer_id, tiktok_advertiser_id, shopify_domain,
           CASE WHEN (meta_access_token IS NOT NULL AND meta_token_expires_at > NOW()) OR meta_ad_account_id LIKE 'act_demo%' THEN true ELSE false END as meta_connected,
           meta_token_expires_at
    FROM clients
    WHERE owner_id = ${effectiveUserId}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ clients: rows });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const effectiveUserId = await getEffectiveUserId(userId);

  const body = await req.json();
  const { name, meta_ad_account_id, meta_page_id, vertical, whatsapp_number, notes, status, website_url } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO clients (owner_id, name, meta_ad_account_id, meta_page_id, vertical, whatsapp_number, notes, status, website_url)
    VALUES (
      ${effectiveUserId},
      ${name.trim()},
      ${meta_ad_account_id ?? null},
      ${meta_page_id ?? null},
      ${vertical ?? "leads"},
      ${whatsapp_number ?? null},
      ${notes ?? null},
      ${status ?? "active"},
      ${website_url ?? null}
    )
    RETURNING id, name, meta_ad_account_id, meta_page_id, vertical, status, whatsapp_number, notes, created_at, website_url
  `;

  return NextResponse.json({ client: rows[0] }, { status: 201 });
}
