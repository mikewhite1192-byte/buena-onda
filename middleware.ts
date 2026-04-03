import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/demo(.*)",
  "/demo-login(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms-of-service",
  "/legal",
  "/legal/(.*)",
  "/pricing(.*)",
  "/api/meta/test",
  "/api/db/migrate",
  "/api/agent/test",
  "/api/meta/actions/test",
  "/api/cron/(.*)",
  "/api/meta/token",
  "/api/whatsapp/webhook",
  "/api/auth/facebook/callback",
  "/api/demo(.*)",
  "/affiliates(.*)",
  "/api/affiliates(.*)",
  "/api/webhooks/(.*)",
  "/api/stripe/checkout",
  // Client portal — cookie-based auth, no Clerk required
  "/portal(.*)",
  "/api/client-portal(.*)",
  // Team invite acceptance
  "/team/accept(.*)",
]);

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);

const KNOWN_HOSTS = ["buenaonda.ai", "www.buenaonda.ai"];
const OWNER_USER_IDS = (process.env.OWNER_CLERK_USER_ID ?? "").split(",").map(s => s.trim()).filter(Boolean);

export default clerkMiddleware(async (auth, req) => {
  const ref = req.nextUrl.searchParams.get("ref");
  const host = req.headers.get("host") ?? "";

  // Custom domain rewrite — if the host isn't ours or Vercel's, treat as a white-label portal domain
  const isVercel = host.endsWith(".vercel.app") || host.startsWith("localhost");
  const isOwnHost = KNOWN_HOSTS.includes(host);
  if (!isVercel && !isOwnHost) {
    const url = req.nextUrl.clone();
    // Rewrite / → /portal/dashboard, /login → /portal/login, else pass through
    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = "/portal/dashboard";
    } else if (url.pathname === "/login") {
      url.pathname = "/portal/login";
    }
    // Pass domain as query param so the portal can fetch the right branding
    url.searchParams.set("__domain", host);
    return NextResponse.rewrite(url);
  }

  // Public pages — bypass auth entirely before any Clerk check
  const path = req.nextUrl.pathname;
  if (
    path === "/legal" ||
    path.startsWith("/legal/") ||
    path === "/privacy-policy" ||
    path === "/terms-of-service" ||
    path === "/privacy" ||
    path === "/terms"
  ) {
    return NextResponse.next();
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Owner-only routes — return 404 for anyone who isn't Mike
  if (path.startsWith("/owner") || path.startsWith("/api/owner")) {
    const { userId } = await auth();
    if (!userId || !OWNER_USER_IDS.includes(userId)) {
      return new NextResponse(null, { status: 404 });
    }
  }

  // Subscription gate — only applies to /dashboard routes
  if (isDashboardRoute(req)) {
    const { sessionClaims } = await auth();

    // Allow through if this is a demo session
    const isDemo = req.nextUrl.searchParams.get("demo") === "1";

    // Allow through if coming back from Stripe checkout — set a 10-min grace cookie
    // so the user can navigate freely while the webhook fires and updates Clerk metadata
    const isCheckoutReturn = req.nextUrl.searchParams.get("checkout") === "success";
    const hasGraceCookie = req.cookies.get("bo_sub_grace")?.value === "1";

    if (!isDemo) {
      const { userId } = await auth();
      const status = (sessionClaims?.metadata as Record<string, string> | undefined)?.subscription_status;

      // Hard gate: only active/trialing subscribers (or the owner) can access dashboard
      const isOwner = !!userId && OWNER_USER_IDS.includes(userId);
      const hasAccess = status === "active" || status === "trialing";

      if (!isOwner && !hasAccess && !isCheckoutReturn && !hasGraceCookie) {
        return NextResponse.redirect(new URL("/#pricing", req.url));
      }

      // Set grace cookie on checkout return so nav links work while webhook fires
      if (isCheckoutReturn) {
        const res = NextResponse.next();
        res.cookies.set("bo_sub_grace", "1", {
          maxAge: 60 * 10, // 10 minutes
          path: "/",
          sameSite: "lax",
          httpOnly: true,
        });
        return res;
      }
    }
  }

  // If a ?ref= param is present, set a 90-day cookie and continue
  if (ref && /^[a-z0-9-]{3,30}$/.test(ref)) {
    const res = NextResponse.next();
    res.cookies.set("bo_ref", ref, {
      maxAge: 60 * 60 * 24 * 90,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
    return res;
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
