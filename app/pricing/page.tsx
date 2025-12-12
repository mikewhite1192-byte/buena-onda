// app/pricing/page.tsx
import PricingTable from "../components/PricingTable";

export const metadata = {
  title: "Pricing — Buena Onda AI",
  description:
    "Simple pricing. All AI experts on every plan. Free trial, Pro $19/mo, Unlimited $49/mo.",
};

export default function PricingPage() {
  return (
    <main className="bg-onda-bg min-h-screen">
      <section className="container px-4 py-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold text-onda-slate">
            Simple pricing, all experts included.
          </h1>
          <p className="mt-4 text-onda-slate/80">
            Choose a plan that fits your flow. Upgrade or cancel anytime.
          </p>
        </div>

        <div className="mt-10">
          <PricingTable />
        </div>

        <p className="mt-10 text-xs text-onda-slate/60">
          Prices in USD. Taxes may apply. Unlimited plan has fair-use protections.
        </p>
      </section>
    </main>
  );
}
