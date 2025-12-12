// app/api/clerk-check/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId, sessionId } = await auth();
  return NextResponse.json({
    authenticated: Boolean(userId),
    userId: userId ?? null,
    sessionId: sessionId ?? null,
  });
}
