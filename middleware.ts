import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/privacy-policy", "/terms-of-service", "/api/meta/test", "/api/db/migrate", "/api/agent/test", "/api/meta/actions/test", "/api/cron/agent-loop", "/api/meta/token", "/api/whatsapp/webhook"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
