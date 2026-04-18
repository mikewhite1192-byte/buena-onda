// lib/site.ts

// ————————————————————————————————
// TYPES
// ————————————————————————————————
export type Product = {
  id: string;
  title: string;
  blurb: string;
  accent: string;
};

export type Plan = {
  name: string;
  price: string;            // display only
  monthlyCents: number;     // for Stripe later
  tagline: string;
  bullets: string[];
  limit: { messages: number | "unlimited"; trialDays?: number };
  featured?: boolean;
  cta: { label: string; href: string };
  stripePriceId?: string;   // optional until billing setup
};

// ————————————————————————————————
// PRODUCT LINEUP (homepage + product pages)
// ————————————————————————————————
export const lineup: Product[] = [
  {
    id: "architect",
    title: "The Architect",
    blurb: "Business & Marketing — structure, offers, messaging, and scalable systems.",
    accent: "onda-teal",
  },
  {
    id: "integrator",
    title: "The Integrator",
    blurb: "HubSpot operations — objects, automation, integrations, and clean RevOps.",
    accent: "onda-slate",
  },
  {
    id: "strategist",
    title: "The Strategist",
    blurb: "Meta Ads — offers, hooks, creatives, testing cycles, and scaling frameworks.",
    accent: "onda-coral",
  },
  {
    id: "navigator",
    title: "The Navigator",
    blurb: "Google SEO / GBP / Ads — visibility, local dominance, and smart search strategy.",
    accent: "onda-teal",
  },
  {
    id: "financier",
    title: "The Financier",
    blurb: "Wealth & Money — cashflow, pricing, profit, debt, and long-term planning.",
    accent: "onda-teal-dark",
  },
];

// ————————————————————————————————
// PRICING TABLE
// ————————————————————————————————
export const pricing: Plan[] = [
  {
    name: "Free",
    price: "$0",
    monthlyCents: 0,
    tagline: "7-day trial • No card required",
    bullets: ["150 messages", "All AI specialists included"],
    limit: { messages: 150, trialDays: 7 },
    cta: { label: "Start Free", href: "/signup?plan=free" },
  },
  {
    name: "Pro",
    price: "$19/mo",
    monthlyCents: 1900,
    tagline: "For builders putting systems in motion",
    bullets: ["200 messages / 30 days", "All AI specialists included"],
    limit: { messages: 200 },
    cta: { label: "Get Pro", href: "/signup?plan=pro" },
  },
  {
    name: "Unlimited",
    price: "$49/mo",
    monthlyCents: 4900,
    tagline: "For power users & agency operators",
    bullets: ["Unlimited messages", "All AI specialists included"],
    limit: { messages: "unlimited" },
    featured: true,
    cta: { label: "Go Unlimited", href: "/signup?plan=unlimited" },
  },
];
