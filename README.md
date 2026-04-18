# Buena Onda AI

> AI-powered marketing agency in a box — briefs in, live ad campaigns out. Clients get reports, owners get alerts, and the AI agent manages spend across Meta, Google, and TikTok.

**Live:** [buenaonda.ai](https://buenaonda.ai)

---

## What it does

Buena Onda AI is a full-stack SaaS that replaces the manual grind of running a small ad agency. A client submits a brief, the agent builds out Meta/Google/TikTok campaigns, performance data streams back into the dashboard, and automated reports land in the client's inbox on schedule.

- **Brief → campaign pipeline.** Clients submit creative briefs through the portal; the agent (Claude + platform SDKs) proposes campaigns, drafts creative, and launches after human review.
- **Multi-platform ad management.** First-class integrations with Meta, Google Ads, and TikTok Ads — OAuth flows, daily metric syncs, and a unified dashboard across all three.
- **Agent loop.** A cron-driven background agent ([app/api/cron/agent-loop](app/api/cron/agent-loop)) watches campaign performance and surfaces anomalies, recommendations, and budget reallocations to the owner.
- **Client portal.** White-labeled portal with live campaign metrics, creative review, and WhatsApp weekly reports.
- **Stripe billing + affiliate program.** Subscription checkout, customer billing portal, cancellation flow, referral click tracking, and automated monthly payouts.
- **Owner + employee admin.** Separate admin surfaces for business owners (alerts, client overview) and team members (brief queue, review queue).
- **Lead-gen tools.** Public scoring tools (ad account grader, ad copy scorer, ROAS calculator) at `/tools` that work as top-of-funnel lead magnets.

## Tech stack

| Area | Stack |
| ---- | ----- |
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Auth | Clerk (with custom subdomain + webhooks) |
| Database | Neon Postgres + `postgres` driver |
| Billing | Stripe (subscriptions, portal, cancellation webhooks) |
| LLM | Anthropic Claude (agent reasoning, brief expansion, creative drafting) |
| Ad platforms | Meta Graph API, Google Ads API, TikTok Ads API (OAuth + sync) |
| Commerce | Shopify Admin API (ROAS attribution) |
| Messaging | WhatsApp Cloud API (weekly client reports) |
| Email | Resend |
| 3D / motion | three.js, GSAP |
| Deploy | Vercel (serverless + cron) |

## Architecture highlights

- **Cron-driven operations.** Nine scheduled jobs in [vercel.json](vercel.json) handle Meta token refresh, Google/TikTok/Shopify daily syncs, the agent loop, owner alerts, WhatsApp weekly reports, affiliate billing + payouts, and a nightly demo reset for the public demo environment.
- **Webhook hardening.** Stripe, Clerk, and WhatsApp webhooks all pass through an idempotency layer ([lib/webhook-idempotency.ts](lib/webhook-idempotency.ts)) so retries never double-charge or double-provision.
- **OAuth CSRF protection.** Meta, Google Ads, Slack, TikTok, and Shopify OAuth flows use signed state tokens ([lib/oauth-state.ts](lib/oauth-state.ts)) to defend against callback replay and CSRF.
- **Role-based surfaces.** Distinct portals for clients ([app/portal/](app/portal/)), employees ([app/employee/](app/employee/)), and owners ([app/owner/](app/owner/)), with middleware-enforced access per route.
- **Demo mode.** Full demo environment at `/demo` with seeded data that resets nightly via cron — useful for sales calls and public tool embeds.
- **Mobile-responsive dashboard.** 24-fix mobile audit shipped (see commit history); animated dashboards gracefully degrade on small screens.

## Running locally

```bash
npm install                         # or pnpm install
# create .env.local with keys for: Clerk, Neon (DATABASE_URL), Stripe,
# Anthropic, Resend, Meta, Google Ads, TikTok, Shopify, WhatsApp
npm run dev
```

## License

All rights reserved. This repo is public for portfolio review; it is not open source and is not licensed for reuse.
