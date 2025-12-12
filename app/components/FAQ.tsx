const faqs = [
  { q: "Do I need GHL or HubSpot already?", a: "No. If you do, we’ll optimize them. If not, we’ll guide setup from zero." },
  { q: "Is everything included in one plan?", a: "Yes — Business AI, GHL Systems AI, HubSpot Ops AI, Meta Ads AI, Google & SEO AI, and Finance AI." },
  { q: "Can I cancel anytime?", a: "Absolutely. No contracts, no hidden fees." },
  { q: "Is this a course?", a: "No — it’s a daily-use AI tool that helps you run your business better every day." },
];

export default function FAQ() {
  return (
    <section className="container py-16">
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Questions?</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {faqs.map((f) => (
          <details key={f.q} className="rounded-2xl border bg-white p-5 shadow-soft">
            <summary className="cursor-pointer font-medium">{f.q}</summary>
            <p className="mt-2 text-onda-slate/75">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
