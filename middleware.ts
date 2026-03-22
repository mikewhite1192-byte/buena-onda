import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/privacy-policy", "/terms-of-service", "/api/meta/test", "/api/db/migrate", "/api/agent/test", "/api/meta/actions/test", "/api/cron/agent-loop", "/api/meta/token", "/api/whatsapp/webhook", "/api/auth/facebook/callback", "/api/cron/refresh-meta-tokens", "/affiliates(.*)", "/api/affiliates(.*)", "/api/webhooks/clerk"]);

export default clerkMiddleware(async (auth, req) => {
  const ref = req.nextUrl.searchParams.get("ref");

  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // If a ?ref= param is present, set a 90-day cookie and continue
  if (ref && /^[a-z0-9-]{3,30}$/.test(ref)) {
    const res = NextResponse.next();
    res.cookies.set("bo_ref", ref, {
      maxAge: 60 * 60 * 24 * 90, // 90 days
      path: "/",
      sameSite: "lax",
      httpOnly: false, // needs to be readable by Clerk webhook context
    });
    return res;
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
