# Buena Onda AI — Starter (Next.js + Tailwind)

Your own branded AI site/app: landing, products, pricing, playground, dashboard — plus an API stub for chat streaming.

## What’s inside

- **Next.js (App Router, TypeScript)** — marketing pages + app under one roof
- **Tailwind** — clean, airy Buena Onda styling
- **White-label chat** — `/playground` uses your **/api/chat** (no ChatGPT branding)
- **API stub** — `/api/chat` streams a demo response you can replace with your model call
- **Pages**: `/`, `/products`, `/products/[slug]`, `/pricing`, `/playground`, `/dashboard`, `/legal/*`

## Quickstart

```bash
# 1) Install deps
npm install

# 2) Dev
npm run dev

# 3) Open
http://localhost:3000
```

> If you prefer **pnpm** or **yarn**, use those instead.

## Connect your model

Replace the streaming stub in `app/api/chat/route.ts` with any provider (OpenAI, Anthropic, Groq, etc.). Example pattern:

```ts
export const runtime = 'edge';

export async function POST(req: Request) {
  const { message } = await req.json();

  // 1) Call your model here
  // const resp = await fetch("https://api.openai.com/v1/chat/completions", { ... });

  // 2) Convert their stream into a web ReadableStream and return
  // return new Response(modelReadableStream, { headers: { "Content-Type": "text/plain; charset=utf-8" }});

  return new Response("Replace me with a model call");
}
```

Keep your API keys on the **server** only — never in the client.

## Branding

- Update the brand colors in `tailwind.config.ts` (`onda.*` colors).
- Swap the logo text in `app/layout.tsx`.
- Edit landing copy in `app/page.tsx` and product blurbs in `app/products/*`.

## Recommended next steps

- **Auth**: Add Clerk or Auth.js and protect `/dashboard`.
- **Billing**: Add Stripe Checkout + webhooks; show plan/credits in dashboard.
- **Data**: Add a DB (e.g., Supabase) with tables: users, conversations, messages, credits.
- **Rate limits**: Enforce free plan limits in `/api/chat` (per-user IP or session).

## Vercel deploy

1. Create a new Vercel project and import this repo.
2. Set environment variables for your model keys (if any).
3. Deploy. Edge runtime is already enabled in `/api/chat`.

---

© Buena Onda AI — Build Smarter. Live Freer.
