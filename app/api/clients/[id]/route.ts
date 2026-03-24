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
  const { name, meta_ad_account_id, meta_page_id, vertical, whatsapp_number, notes, status, cpl_target, roas_target, monthly_budget, website_url, google_customer_id, tiktok_advertiser_id, shopify_domain } = body;

  const rows = await sql`
    UPDATE clients SET
      name                = COALESCE(${name ?? null}, name),
      meta_ad_account_id  = COALESCE(${meta_ad_account_id ?? null}, meta_ad_account_id),
      meta_page_id        = COALESCE(${meta_page_id ?? null}, meta_page_id),
      vertical            = COALESCE(${vertical ?? null}, vertical),
      whatsapp_number     = COALESCE(${whatsapp_number ?? null}, whatsapp_number),
      notes               = COALESCE(${notes ?? null}, notes),
      status              = COALESCE(${status ?? null}, status),
      website_url         = COALESCE(${website_url ?? null}, website_url),
      google_customer_id   = CASE WHEN ${google_customer_id ?? null} IS NOT NULL THEN ${google_customer_id ?? null} ELSE google_customer_id END,
      tiktok_advertiser_id = CASE WHEN ${tiktok_advertiser_id ?? null} IS NOT NULL THEN ${tiktok_advertiser_id ?? null} ELSE tiktok_advertiser_id END,
      shopify_domain       = CASE WHEN ${shopify_domain ?? null} IS NOT NULL THEN ${shopify_domain ?? null} ELSE shopify_domain END,
      cpl_target           = CASE WHEN ${cpl_target ?? null}::decimal IS NOT NULL THEN ${cpl_target ?? null}::decimal ELSE cpl_target END,
      roas_target          = CASE WHEN ${roas_target ?? null}::decimal IS NOT NULL THEN ${roas_target ?? null}::decimal ELSE roas_target END,
      monthly_budget       = CASE WHEN ${monthly_budget ?? null}::decimal IS NOT NULL THEN ${monthly_budget ?? null}::decimal ELSE monthly_budget END
    WHERE id = ${id} AND owner_id = ${userId}
    RETURNING id, name, meta_ad_account_id, meta_page_id, vertical, status, whatsapp_number, notes, created_at, cpl_target, roas_target, monthly_budget, website_url, google_customer_id, tiktok_advertiser_id, shopify_domain
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
