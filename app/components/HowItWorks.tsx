const steps = [
  { t: "Pick a track", d: "Start with Business 101 or jump into HubSpot, Meta, Google, SEO, or Finance." },
  { t: "Answer 3–5 questions", d: "Your AI configures a plan, templates, and first actions to ship today." },
  { t: "Execute & iterate", d: "Your AI drafts assets, checks work, and keeps momentum with daily nudges." },
];

export default function HowItWorks() {
  return (
    <section className="bg-slate-50 py-16">
      <div className="container">
        <h2 className="text-3xl font-bold">How it works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-sm text-slate-500">Step {i + 1}</div>
              <div className="text-lg font-semibold mt-1">{s.t}</div>
              <p className="text-slate-600 mt-2">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
