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

  if (error) return NextResponse.redirect(`${BASE_URL}/dashboard/clients?error=facebook_denied`);
  if (!code || !state) return NextResponse.redirect(`${BASE_URL}/dashboard/clients?error=invalid_callback`);

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

    // Auto-discover ad account if client doesn't have one
    const acctRes = await fetch(
      `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_status&access_token=${longToken}&limit=10`
    );
    const acctData = await acctRes.json();
    const activeAccounts = (acctData.data ?? []).filter((a: { account_status: number }) => a.account_status === 1);

    // Save token to DB; auto-fill ad account if only one active and field is empty
    if (activeAccounts.length === 1) {
      await sql`
        UPDATE clients SET
          meta_access_token = ${longToken},
          meta_token_expires_at = ${expiresAt.toISOString()},
          meta_ad_account_id = COALESCE(NULLIF(meta_ad_account_id, ''), ${activeAccounts[0].id})
        WHERE id = ${clientId}
      `;
    } else {
      await sql`
        UPDATE clients SET
          meta_access_token = ${longToken},
          meta_token_expires_at = ${expiresAt.toISOString()}
        WHERE id = ${clientId}
      `;
    }

    return NextResponse.redirect(`${BASE_URL}/dashboard/clients?connected=${clientId}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[facebook/callback]", msg);
    return NextResponse.redirect(`${BASE_URL}/dashboard/clients?error=${encodeURIComponent(msg)}`);
  }
}
