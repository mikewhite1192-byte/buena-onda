import Link from "next/link";
import { notFound } from "next/navigation";

const products = {
  "architect-business": {
    name: "Buena Onda | The Architect (Business & Marketing)",
    description:
      "Your personal business architect for turning ideas into organized, scalable systems — one decision at a time.",
  },
  "strategist-meta": {
    name: "Buena Onda | The Strategist (Meta Ads Specialist)",
    description:
      "Your AI Meta Ads expert — built to help agencies and business owners master Meta Business Suite, Ads Manager & Conversion API.",
  },
  "navigator-google": {
    name: "Buena Onda | The Navigator (Google Specialist)",
    description:
      "Your Google marketing specialist — a built-in strategist for Google Ads, Google Business Profile (GBP), and SEO.",
  },
  "integrator-hubspot": {
    name: "Buena Onda | The Integrator (HubSpot Specialist)",
    description:
      "Your CRM and RevOps expert — helping you master HubSpot automation, pipelines, lifecycle tracking, and integrations.",
  },
  "financier-wealth": {
    name: "Buena Onda | The Financier (Wealth Specialist)",
    description:
      "Your AI finance strategist — helping entrepreneurs and individuals master money, investing, and wealth with clarity and confidence.",
  },
} as const;


export default function ProductPage({ params }: { params: { slug: keyof typeof products } }) {
  const product = products[params.slug];
  if (!product) return notFound();
  return (
    <section className="container py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <Link href="/playground" className="rounded-xl bg-onda-teal text-white px-4 py-2 shadow-soft">Try demo</Link>
      </div>
      <p className="text-slate-600 mt-2">{product.description}</p>
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="border border-slate-200 rounded-2xl p-6">
          <div className="font-semibold">What it’s great at</div>
          <ul className="list-disc pl-6 mt-3 text-slate-600">
            <li>Fast, accurate answers in its domain</li>
            <li>Actionable templates and examples</li>
            <li>Guardrails for tone and scope</li>
          </ul>
        </div>
        <div className="border border-slate-200 rounded-2xl p-6">
          <div className="font-semibold">What you get</div>
          <ul className="list-disc pl-6 mt-3 text-slate-600">
            <li>Playground access</li>
            <li>Saved chats (Pro)</li>
            <li>Integrations (Pro)</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
