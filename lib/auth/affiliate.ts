// lib/auth/affiliate.ts
// Cookie-based auth for affiliate-portal routes. The cookie is set by
// /api/affiliates/login/verify on magic-link click and by /api/affiliates
// when a brand-new affiliate signs up.
import { NextRequest, NextResponse } from "next/server";

const COOKIE = "affiliate_email";

/**
 * Returns the affiliate email if the cookie is present and (when a target email
 * is supplied) matches it case-insensitively. Returns a 401/403 NextResponse
 * otherwise. Use this on every affiliate-portal endpoint that exposes
 * earnings, payouts, or payout-destination changes.
 */
export function requireAffiliate(
  req: NextRequest,
  targetEmail?: string,
): { email: string } | NextResponse {
  const cookieEmail = req.cookies.get(COOKIE)?.value?.trim().toLowerCase();
  if (!cookieEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (targetEmail && cookieEmail !== targetEmail.trim().toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { email: cookieEmail };
}

export function isErrorResponse(
  result: { email: string } | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}

export const AFFILIATE_COOKIE = COOKIE;
