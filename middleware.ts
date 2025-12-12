// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/dev-reset',
  '/api/clerk-check',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const a = await auth();              // ← await here
  const { userId } = a;

  if (!userId) {
    // Prefer Clerk helper when available; fallback to manual redirect.
    return a.redirectToSignIn?.({ returnBackUrl: req.url })
      ?? NextResponse.redirect(new URL('/sign-in', req.url));
  }
});

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
