const quotes = [
  { name: "Agency Owner", text: "Finally a place to start without 500 tabs. The tracks keep me moving." },
  { name: "Solo Founder", text: "Business 101 gave me clarity on my offer and price in one afternoon." },
  { name: "Contractor → SaaS", text: "Meta + SEO tracks = leads in the pipeline while I’m still building." },
];

export default function Testimonials() {
  return (
    <section className="container py-16">
      <h2 className="text-3xl font-bold">What builders say</h2>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {quotes.map((q, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 p-6">
            <div className="text-lg font-semibold">“{q.text}”</div>
            <div className="text-slate-500 mt-3">— {q.name}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
