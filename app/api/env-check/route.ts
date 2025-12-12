// app/api/env-check/route.ts
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    hasPK: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hasSK: !!process.env.CLERK_SECRET_KEY,
    pkPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 9) ?? null,
    skPrefix: process.env.CLERK_SECRET_KEY?.slice(0, 6) ?? null,
  });
}
