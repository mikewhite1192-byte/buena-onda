export default function DemoCTA() {
  return (
    <section className="container py-16">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold">See the platform that powers your stack.</h2>
          <p className="mt-3 text-onda-slate/75">Click through a 3-minute guided view to understand how the pieces fit together.</p>
          <a href="/start" className="mt-6 inline-block rounded-xl bg-onda-teal px-5 py-3 text-white">Start the guided setup</a>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-soft">
          <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-onda-aqua/20 to-onda-teal/10" />
          <div className="mt-3 text-sm text-onda-slate/60">Product preview</div>
        </div>
      </div>
    </section>
  );
}
