// app/api/env-check/route.ts — owner-only debug endpoint
export const dynamic = "force-dynamic";
import { requireOwner, isErrorResponse } from "@/lib/auth/owner";

export async function GET() {
  const ownerCheck = await requireOwner();
  if (isErrorResponse(ownerCheck)) return ownerCheck;
  return Response.json({
    hasPK: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hasSK: !!process.env.CLERK_SECRET_KEY,
    pkPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 9) ?? null,
    skPrefix: process.env.CLERK_SECRET_KEY?.slice(0, 6) ?? null,
  });
}
