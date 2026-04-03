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
  const { name, meta_ad_account_id, meta_page_id, vertical, whatsapp_number, notes, status, cpl_target, roas_target, monthly_budget, website_url, google_customer_id, tiktok_advertiser_id, shopify_domain, contact_email } = body;

  const rows = await sql`
    UPDATE clients SET
      name                = COALESCE(${name ?? null}::text, name),
      meta_ad_account_id  = COALESCE(${meta_ad_account_id ?? null}::text, meta_ad_account_id),
      meta_page_id        = COALESCE(${meta_page_id ?? null}::text, meta_page_id),
      vertical            = COALESCE(${vertical ?? null}::text, vertical),
      whatsapp_number     = COALESCE(${whatsapp_number ?? null}::text, whatsapp_number),
      notes               = COALESCE(${notes ?? null}::text, notes),
      status              = COALESCE(${status ?? null}::text, status),
      website_url         = COALESCE(${website_url ?? null}::text, website_url),
      contact_email        = COALESCE(${contact_email ?? null}::text, contact_email),
      google_customer_id   = COALESCE(${google_customer_id ?? null}::text, google_customer_id),
      tiktok_advertiser_id = COALESCE(${tiktok_advertiser_id ?? null}::text, tiktok_advertiser_id),
      shopify_domain       = COALESCE(${shopify_domain ?? null}::text, shopify_domain),
      cpl_target           = COALESCE(${cpl_target ?? null}::decimal, cpl_target),
      roas_target          = COALESCE(${roas_target ?? null}::decimal, roas_target),
      monthly_budget       = COALESCE(${monthly_budget ?? null}::decimal, monthly_budget)
    WHERE id = ${id} AND owner_id = ${userId}
    RETURNING id, name, meta_ad_account_id, meta_page_id, vertical, status, whatsapp_number, notes, created_at, cpl_target, roas_target, monthly_budget, website_url, contact_email, google_customer_id, tiktok_advertiser_id, shopify_domain
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
