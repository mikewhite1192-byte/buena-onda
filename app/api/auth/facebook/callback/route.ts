import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const APP_ID = process.env.META_APP_ID!;
const APP_SECRET = process.env.META_APP_SECRET!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://buenaonda.ai";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    const desc = req.nextUrl.searchParams.get("error_description") ?? error;
    return NextResponse.redirect(`${BASE_URL}/dashboard/clients?error=${encodeURIComponent(desc)}`);
  }
  if (!code || !state) {
    const allParams = [...req.nextUrl.searchParams.entries()].map(([k,v]) => `${k}=${v}`).join(" | ");
    return NextResponse.redirect(`${BASE_URL}/dashboard/clients?error=${encodeURIComponent("no_code: " + (allParams || "no_params"))}`);
  }

  let clientId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    clientId = decoded.clientId;
    if (!clientId) throw new Error("No clientId");
  } catch {
    return NextResponse.redirect(`${BASE_URL}/dashboard/clients?error=invalid_state`);
  }

  const redirectUri = `${BASE_URL}/api/auth/facebook/callback`;

  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error(tokenData.error?.message ?? "No access token");

    // Exchange for long-lived token (60 days)
    const llRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
    );
    const llData = await llRes.json();
    if (!llData.access_token) throw new Error(llData.error?.message ?? "No long-lived token");

    const longToken = llData.access_token as string;
    const expiresIn = (llData.expires_in as number) ?? 5184000; // default 60 days
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Auto-discover ad accounts and pages
    const [acctRes, pagesRes] = await Promise.all([
      fetch(`https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_status&access_token=${longToken}&limit=25`),
      fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${longToken}&limit=25`),
    ]);
    const [acctData, pagesData] = await Promise.all([acctRes.json(), pagesRes.json()]);

    const allAccounts = acctData.data ?? [];
    const activeAccounts = allAccounts.filter((a: { account_status: number }) => a.account_status === 1);
    const pages = pagesData.data ?? [];

    console.log("[facebook/callback] ad accounts:", JSON.stringify(allAccounts));
    console.log("[facebook/callback] active ad accounts:", JSON.stringify(activeAccounts));
    console.log("[facebook/callback] pages:", JSON.stringify(pages.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }))));

    // Auto-fill page ID if only one page
    const autoPageId = pages.length === 1 ? pages[0].id : null;

    // Save token + auto-fill ad account only when there's exactly one
    if (activeAccounts.length === 1) {
      await sql`
        UPDATE clients SET
          meta_access_token = ${longToken},
          meta_token_expires_at = ${expiresAt.toISOString()},
          meta_ad_account_id = COALESCE(NULLIF(meta_ad_account_id, ''), ${activeAccounts[0].id}),
          meta_page_id = COALESCE(NULLIF(meta_page_id, ''), ${autoPageId})
        WHERE id = ${clientId}
      `;
    } else {
      await sql`
        UPDATE clients SET
          meta_access_token = ${longToken},
          meta_token_expires_at = ${expiresAt.toISOString()},
          meta_page_id = COALESCE(NULLIF(meta_page_id, ''), ${autoPageId})
        WHERE id = ${clientId}
      `;
    }

    // If multiple ad accounts, send them back so user can pick
    if (activeAccounts.length > 1) {
      const encoded = Buffer.from(JSON.stringify(activeAccounts)).toString("base64url");
      return NextResponse.redirect(`${BASE_URL}/dashboard/clients?connected=${clientId}&accounts=${encoded}`);
    }

    return NextResponse.redirect(`${BASE_URL}/dashboard/clients?connected=${clientId}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[facebook/callback]", msg);
    return NextResponse.redirect(`${BASE_URL}/dashboard/clients?error=${encodeURIComponent(msg)}`);
  }
}
