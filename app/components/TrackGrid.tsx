// app/components/TrackGrid.tsx
type Track = { id: string; title: string; tag: string; blurb: string };

const tracks: Track[] = [
  { id: "business-ai",     title: "Business AI",     tag: "Offer • Messaging • Funnels", blurb: "Structure your offer, messaging, and funnel with clear, step-by-step guidance." },
  { id: "ghl-systems-ai",  title: "GHL Systems AI",  tag: "Pipelines • Automations",     blurb: "Build and troubleshoot pipelines, automations, and snapshots in GoHighLevel." },
  { id: "hubspot-ops-ai",  title: "HubSpot Ops AI",  tag: "Lifecycle • Sequences • RevOps", blurb: "Organize CRM, lifecycle stages, sequences, and reporting with confidence." },
  { id: "meta-ads-ai",     title: "Meta Ads AI",     tag: "Setup • Diagnostics • Scaling", blurb: "Fix setup, test creatives, and scale campaigns with proven frameworks." },
  { id: "google-seo-ai",   title: "Google & SEO AI", tag: "Keywords • Ads • GBP • Content", blurb: "Plan keywords, optimize GBP, run ads, and ship SEO content that compounds." },
  { id: "finance-ai",      title: "Finance AI",      tag: "Cashflow • Budget • Forecasts", blurb: "Get clarity on money, targets, and growth — simple, smart, and actionable." },
];

export default function TrackGrid() {
  return (
    <section className="container pt-6 pb-16">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">The AI Business Stack</h2>
          <p className="text-slate-600 mt-2">Six daily-use tools for modern entrepreneurs — all included.</p>
        </div>
        <a href="/products" className="hidden md:inline-block rounded-xl px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-white/70 transition">
          View all →
        </a>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.map((t) => (
          <a
            key={t.id}
            href={`/products#${t.id}`} // anchor into the single products page
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-soft hover:shadow-lg hover:-translate-y-0.5 transition"
          >
            <div className="text-xs uppercase tracking-wide text-slate-500">{t.tag}</div>
            <div className="mt-1 text-lg font-semibold">{t.title}</div>
            <p className="mt-2 text-slate-600 text-sm">{t.blurb}</p>
            <div className="mt-4 inline-flex items-center gap-2 text-onda-teal font-medium">
              Open <span aria-hidden>→</span>
            </div>
            <div className="mt-5 h-1 rounded-full bg-slate-100 group-hover:bg-onda-teal/30 transition" />
          </a>
        ))}
      </div>
    </section>
  );
}
