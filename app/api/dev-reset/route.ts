// app/api/dev-reset/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function clearAllCookies() {
  const jar = cookies();
  for (const c of jar.getAll()) {
    jar.delete(c.name);
  }
}

export async function GET() {
  await clearAllCookies();
  return NextResponse.json({ ok: true, cleared: true });
}

export async function POST() {
  await clearAllCookies();
  return NextResponse.json({ ok: true, cleared: true });
}
