type KPI = { label: string; value: string; sub: string };
type Step = { title: string; blurb: string; link: string; tag: string };

const kpis: KPI[] = [
  { label: "Leads captured", value: "+37%", sub: "from forms & funnels" },
  { label: "Calls booked",   value: "×2.1", sub: "from automated follow-ups" },
  { label: "CPA on Meta",    value: "-28%", sub: "after diagnostics & tests" },
  { label: "Pipeline value", value: "+$42k", sub: "added this month" },
];

const steps: Step[] = [
  {
    title: "Clarify the offer & funnel",
    blurb: "Message → lead magnet → CTA. Ship a minimal funnel that actually converts.",
    link: "/products#business-ai",
    tag: "Business AI",
  },
  {
    title: "Capture & route every lead",
    blurb: "Forms, webhooks, and automations that never drop a contact.",
    link: "/products#ghl-systems-ai",
    tag: "GHL Systems AI",
  },
  {
    title: "Produce & scale paid traffic",
    blurb: "Fix setup, test creatives, and scale with rules that protect ROAS.",
    link: "/products#meta-ads-ai",
    tag: "Meta Ads AI",
  },
  {
    title: "Compounding discovery",
    blurb: "Keyword map, GBP, and content cadence that brings steady intent traffic.",
    link: "/products#google-seo-ai",
    tag: "Google & SEO AI",
  },
  {
    title: "Operate & report clearly",
    blurb: "Lifecycle, sequences, and dashboards that show where money moves.",
    link: "/products#hubspot-ops-ai",
    tag: "HubSpot Ops AI",
  },
  {
    title: "Keep more profit",
    blurb: "Cash map, budgets, and targets so growth ≠ chaos.",
    link: "/products#finance-ai",
    tag: "Finance AI",
  },
];

export default function RevenueFlywheel() {
  return (
    <section className="container py-16">
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
        From pipeline to profit — made practical.
      </h2>
      <p className="mt-2 text-onda-slate/75">
        Every tool in the AI Business Stack ties to a revenue lever. Here’s how value shows up.
      </p>

      {/* KPI bar */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border bg-white p-5 shadow-soft">
            <div className="text-3xl font-extrabold text-onda-teal">{k.value}</div>
            <div className="mt-1 font-medium">{k.label}</div>
            <div className="text-sm text-onda-slate/60">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Pipeline → Profit steps */}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {steps.map((s) => (
          <a
            key={s.title}
            href={s.link}
            className="rounded-2xl border bg-white p-6 shadow-soft hover:shadow-lg transition"
          >
            <div className="text-sm text-onda-teal/90 font-medium">{s.tag}</div>
            <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-onda-slate/75 text-sm">{s.blurb}</p>
            <div className="mt-4 text-onda-teal font-medium">See how →</div>
          </a>
        ))}
      </div>

      {/* Soft CTA */}
      <div className="mt-10">
        <a href="/start" className="inline-block rounded-xl bg-onda-teal px-5 py-3 text-white">
          Start free — connect your first revenue lever
        </a>
      </div>
    </section>
  );
}
