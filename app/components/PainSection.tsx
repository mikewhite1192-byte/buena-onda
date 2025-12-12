export default function PainSection() {
  const pains = [
    "GHL automations break and you don’t know why.",
    "HubSpot lifecycle & properties are a mess.",
    "Meta ads aren’t delivering or scaling.",
    "Google/SEO feels confusing and slow.",
    "Your funnel isn’t clear end-to-end.",
    "Finances feel like guesswork.",
  ];

  return (
    <section className="container py-16">
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-onda-slate">
        You’re building a business… but you’re buried in systems.
      </h2>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pains.map((p) => (
          <div
            key={p}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
          >
            <p className="text-onda-slate/80">{p}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <a
          href="/products"
          className="inline-block rounded-xl bg-onda-teal px-5 py-3 text-white"
        >
          Meet your AI Business Stack →
        </a>
      </div>
    </section>
  );
}
