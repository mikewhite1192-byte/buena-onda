import Link from "next/link";

export const metadata = { title: "Guided Setup" };

export default function Start() {
  return (
    <main className="container py-20 max-w-2xl">
      <h1 className="text-3xl font-bold">Guided Setup</h1>
      <p className="mt-3 text-onda-slate/80">
        Tell us your goal and we'll route you to the right tool in the AI Business Stack.
      </p>

      <form className="mt-8 grid gap-4">
        <label className="block">
          <span className="text-sm font-medium">Primary goal</span>
          <select className="mt-2 w-full rounded-xl border p-3">
            <option>Clarify my offer & funnel (Business AI)</option>
            <option>Set up pipelines & automations (GHL Systems AI)</option>
            <option>Organize CRM & sequences (HubSpot Ops AI)</option>
            <option>Fix or scale ads (Meta Ads AI)</option>
            <option>Improve SEO / run Google Ads (Google & SEO AI)</option>
            <option>Get finances organized (Finance AI)</option>
          </select>
        </label>

        <Link
          href="/products"
          className="rounded-xl bg-onda-teal px-5 py-3 text-white text-center"
        >
          Continue
        </Link>
      </form>
    </main>
  );
}
