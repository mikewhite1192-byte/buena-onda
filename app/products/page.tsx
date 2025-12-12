export const metadata = { title: "The AI Business Stack" };

type Tool = {
  id: string;
  name: string;
  role: string;
  summary: string;
  outcomes: string[];
  steps: string[];
};

const tools: Tool[] = [
  {
    id: "business-ai",
    name: "Business AI",
    role: "Business strategy & funnel clarity",
    summary:
      "Define your offer, messaging, funnel, and next steps with calm, precise guidance.",
    outcomes: ["Clear offer & promise", "Messaging that resonates", "Minimal funnel", "Weekly cadence"],
    steps: ["Pick a niche & problem", "Draft the offer", "Choose channel & funnel", "Ship & measure"],
  },
  {
    id: "ghl-systems-ai",
    name: "GHL Systems AI",
    role: "Pipelines, automations, troubleshooting",
    summary:
      "Hands-on help to build, fix, and optimize GoHighLevel. Pipelines, workflows, forms, snapshots.",
    outcomes: ["Clean pipelines", "Working automations", "Lead capture", "Reporting basics"],
    steps: ["Accounts & domains", "Pipelines & stages", "Forms & automations", "Inbox & reporting"],
  },
  {
    id: "hubspot-ops-ai",
    name: "HubSpot Ops AI",
    role: "Lifecycle, sequences, RevOps",
    summary:
      "Organize properties, lifecycle stages, sequences, and dashboards for smooth operations.",
    outcomes: ["Lifecycle clarity", "Sequences", "Attribution basics", "Team dashboards"],
    steps: ["Objects & properties", "Lifecycle setup", "Sequences & routing", "Reporting & QA"],
  },
  {
    id: "meta-ads-ai",
    name: "Meta Ads AI",
    role: "Setup, diagnostics, creative & scale",
    summary:
      "From Business settings and CAPI to creative frameworks and scale rules — get unstuck fast.",
    outcomes: ["Clean setup", "Creative system", "Testing plan", "Scale rules"],
    steps: ["Business settings", "Pixels & CAPI", "Campaign templates", "Budget & scale"],
  },
  {
    id: "google-seo-ai",
    name: "Google & SEO AI",
    role: "Keywords, ads, GBP, SEO content",
    summary:
      "Run Google Ads, master GBP, and ship an SEO plan that compounds.",
    outcomes: ["Keyword plan", "GBP ranking", "Ad hygiene", "Content cadence"],
    steps: ["Keyword/intent map", "GBP optimization", "Search campaigns", "Content SOP"],
  },
  {
    id: "finance-ai",
    name: "Finance AI",
    role: "Cashflow, budgets, forecasting",
    summary:
      "Stay on top of money with simple, smart guidance — profit targets, buckets, and monthly close.",
    outcomes: ["Budget & runway", "Simple bookkeeping", "Profit targets", "Forecast habits"],
    steps: ["Cash map", "Buckets & accounts", "Monthly close", "Basic index allocation"],
  },
];

export default function Page() {
  return (
    <main className="container py-20">
      <header className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-extrabold">The AI Business Stack</h1>
        <p className="mt-4 text-onda-slate/80">
          One subscription. Six daily tools. Clarity and momentum across strategy, 
          systems, ads, SEO, and finance.
        </p>
      </header>

      <div className="mt-12 space-y-12">
        {tools.map((t) => (
          <section key={t.id} id={t.id} className="scroll-mt-24">
            <div className="rounded-2xl border bg-white shadow-soft p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-semibold">{t.name}</h2>
                  <div className="text-sm text-onda-teal/80">{t.role}</div>
                  <p className="mt-3 text-onda-slate/80">{t.summary}</p>
                </div>
                <a href="/start" className="hidden md:inline-block rounded-xl px-4 py-2 bg-onda-teal text-white">
                  Get started
                </a>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="font-medium">You’ll be able to:</h3>
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
                    {t.outcomes.map((o) => <li key={o}>{o}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium">How it works:</h3>
                  <ol className="mt-2 list-decimal pl-5 space-y-1 text-sm">
                    {t.steps.map((s) => <li key={s}>{s}</li>)}
                  </ol>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
