// lib/auth/owner.ts
// Owner-only route protection — verifies Clerk auth + OWNER_CLERK_USER_ID match
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const OWNER_IDS = (process.env.OWNER_CLERK_USER_ID ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Verifies the request is from the platform owner.
 * Returns userId if authorized, or a 401/403 NextResponse if not.
 */
export async function requireOwner(): Promise<
  { userId: string } | NextResponse
> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Fail closed if OWNER_CLERK_USER_ID isn't set in env — without this guard,
  // a missing env var on a redeploy would silently open the entire admin
  // surface to every signed-in user.
  if (OWNER_IDS.length === 0) {
    console.error("[requireOwner] OWNER_CLERK_USER_ID is not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }
  if (!OWNER_IDS.includes(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { userId };
}

/** Type guard — returns true if requireOwner() returned an error response */
export function isErrorResponse(
  result: { userId: string } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
