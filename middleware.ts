import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sqlIfConfigured = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

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
  "/api/db/migrate",
  "/api/cron/(.*)",
  "/api/health",
  "/api/whatsapp/webhook",
  "/api/auth/facebook/callback",
  "/api/demo(.*)",
  "/affiliates(.*)",
  "/api/affiliates(.*)",
  "/api/webhooks/(.*)",
  "/api/stripe/checkout",
  "/api/traffic",
  "/api/og",
  // Client portal — cookie-based auth, no Clerk required
  "/portal(.*)",
  "/api/client-portal(.*)",
  // Team invite acceptance
  "/team/accept(.*)",
]);

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);

const KNOWN_HOSTS = ["buenaonda.ai", "www.buenaonda.ai"];
const OWNER_USER_IDS = (process.env.OWNER_CLERK_USER_ID ?? "").split(",").map(s => s.trim()).filter(Boolean);
const DEMO_USER_IDS = (process.env.DEMO_CLERK_USER_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean);

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
      let status = (sessionClaims?.metadata as Record<string, string> | undefined)?.subscription_status;

      // Fall back to DB when the JWT claim is missing — the Clerk session token
      // has a ~60s TTL, so right after a webhook updates publicMetadata there's
      // a window where the user's session is stale. Reading user_subscriptions
      // closes that gap without forcing a Clerk API round-trip.
      if (!status && userId && sqlIfConfigured) {
        try {
          const rows = await sqlIfConfigured`
            SELECT status FROM user_subscriptions WHERE clerk_user_id = ${userId} LIMIT 1
          `;
          status = rows[0]?.status as string | undefined;
        } catch {
          // DB hiccup — fall through to the gate below, fail closed.
        }
      }

      // Hard gate: only active/trialing subscribers (or the owner) can access dashboard
      const isOwner = !!userId && OWNER_USER_IDS.includes(userId);
      const isDemoUser = !!userId && DEMO_USER_IDS.includes(userId);
      const hasAccess = status === "active" || status === "trialing";

      if (!isOwner && !isDemoUser && !hasAccess && !isCheckoutReturn && !hasGraceCookie) {
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

  // Cookie consent: only set non-essential cookies (analytics _bv, affiliate
  // bo_ref) and only fire analytics if the visitor opted in. Strictly-necessary
  // cookies (Clerk session, auth helpers) are exempt under ePrivacy.
  const consent = req.cookies.get("bo_consent")?.value;
  const allowNonEssential = consent === "all";

  // Track page views on public pages (only with consent — analytics is non-essential).
  if (
    allowNonEssential &&
    isPublicRoute(req) &&
    !path.startsWith("/api/") &&
    !path.startsWith("/_next/") &&
    !path.match(/\.(ico|png|jpg|svg|css|js|woff2?)$/)
  ) {
    const visitorId = req.cookies.get("_bv")?.value || crypto.randomUUID();
    const referrer = req.headers.get("referer") || null;
    const userAgent = req.headers.get("user-agent") || null;

    fetch(`${req.nextUrl.origin}/api/traffic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, referrer, userAgent, visitorId }),
    }).catch(() => {});

    if (!req.cookies.get("_bv")) {
      const res = NextResponse.next();
      res.cookies.set("_bv", visitorId, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });

      if (ref && /^[a-z0-9-]{3,30}$/.test(ref)) {
        res.cookies.set("bo_ref", ref, { maxAge: 60 * 60 * 24 * 90, path: "/", sameSite: "lax", httpOnly: false });
      }
      return res;
    }
  }

  // Affiliate referral cookie — also non-essential (functional enhancement).
  // We still fire click tracking so server-side counters are accurate, but the
  // 90-day attribution cookie only lands once the visitor consents.
  if (ref && /^[a-z0-9-]{3,30}$/.test(ref)) {
    fetch(`${req.nextUrl.origin}/api/affiliates/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: ref }),
    }).catch(() => {});

    if (allowNonEssential) {
      const res = NextResponse.next();
      res.cookies.set("bo_ref", ref, {
        maxAge: 60 * 60 * 24 * 90,
        path: "/",
        sameSite: "lax",
        httpOnly: false,
      });
      return res;
    }
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
