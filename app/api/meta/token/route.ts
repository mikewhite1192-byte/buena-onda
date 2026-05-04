import { NextResponse } from "next/server";
import { requireOwner, isErrorResponse } from "@/lib/auth/owner";

// GET /api/meta/token
// Exchanges the current META_ACCESS_TOKEN for a long-lived token (60 days).
// Owner-only — the response contains a long-lived Meta access token.
// Call this once whenever you refresh your token — paste the result back into .env.local.

export async function GET() {
  const ownerCheck = await requireOwner();
  if (isErrorResponse(ownerCheck)) return ownerCheck;

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const shortToken = process.env.META_ACCESS_TOKEN;

  if (!appId || !appSecret || !shortToken) {
    return NextResponse.json(
      { ok: false, error: "Missing META_APP_ID, META_APP_SECRET, or META_ACCESS_TOKEN" },
      { status: 500 }
    );
  }

  const url = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", shortToken);

  console.log("[meta/token] Exchanging short-lived token for long-lived token...");

  const res = await fetch(url.toString());
  const data = await res.json();

  console.log("[meta/token] Raw response:", JSON.stringify(data, null, 2));

  if (data.error) {
    return NextResponse.json(
      { ok: false, error: data.error.message, raw: data },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    access_token: data.access_token,
    token_type: data.token_type,
    expires_in_seconds: data.expires_in,
    expires_in_days: data.expires_in ? Math.floor(data.expires_in / 86400) : null,
    instruction: "Copy the access_token value above and paste it into .env.local as META_ACCESS_TOKEN, then restart the dev server.",
  });
}
