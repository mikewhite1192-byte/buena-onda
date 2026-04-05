import LandingNav from "../components/landing/LandingNav";
import LandingFooter from "../components/landing/LandingFooter";

export const metadata = {
  title: "About — Buena Onda",
  description: "Buena Onda is an autonomous AI-powered ad management platform built to help small businesses and agencies run smarter Meta, Google, and TikTok Ads campaigns with Shopify, Slack, and WhatsApp integrations.",
};

export default function AboutPage() {
  return (
    <div className="landing-dark min-h-screen bg-[#0d0f14] text-[#e8eaf0]">
      <LandingNav />

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">

        {/* Header */}
        <div className="mb-14">
          <div className="inline-block px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[11px] text-amber-400 font-semibold uppercase tracking-wide mb-5">
            Company
          </div>
          <h1 className="text-[clamp(32px,5vw,52px)] font-extrabold tracking-tight leading-tight mb-4">
            About Buena Onda
          </h1>
          <p className="text-[17px] text-[#8b8fa8] leading-relaxed max-w-xl">
            Buena Onda is an autonomous AI ad management platform that launches, optimizes, and reports on Meta, Google, and TikTok Ads campaigns — with Shopify, Slack, and WhatsApp integrations built in — so business owners can focus on their work, not their ad accounts.
          </p>
        </div>

        <div className="border-t border-white/[0.06] mb-12" />

        {/* Founder */}
        <section className="mb-12">
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-6">Founder</h2>
          <div className="flex gap-7 items-start flex-wrap">
            <img
              src="/brand/mike-white.jpg"
              alt="Michael White, Founder of Buena Onda"
              className="w-[120px] h-[120px] rounded-full object-cover border-2 border-white/[0.06] flex-shrink-0"
            />
            <div className="flex-1 min-w-[240px]">
              <div className="text-lg font-bold text-[#e8eaf0] mb-1">Michael White</div>
              <div className="text-sm text-amber-400 mb-3">Founder &amp; CEO</div>
              <p className="text-sm text-[#8b8fa8] leading-relaxed">
                Former sales professional who got tired of manually chasing leads and managing ad campaigns. Built Buena Onda to give agencies the same autonomous AI ad management that used to require a full media buying team.
              </p>
            </div>
          </div>
        </section>

        <div className="border-t border-white/[0.06] mb-12" />

        {/* Mission */}
        <section className="mb-12">
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4">What We&apos;ve Built</h2>
          <p className="text-[15px] text-[#8b8fa8] leading-[1.9] mb-4">
            Most small businesses and agencies waste thousands of dollars on ad spend because they don&apos;t have the time or expertise to manage campaigns properly. Buena Onda solves that with an AI agent that acts like a senior media buyer — monitoring performance 24/7, pausing underperformers, scaling winners, and delivering clear reports.
          </p>
          <p className="text-[15px] text-[#8b8fa8] leading-[1.9]">
            We integrate directly with Meta Ads, Google Ads, and TikTok Ads to create campaigns, manage budgets, retrieve performance metrics, and automatically optimize ad sets on behalf of our subscribers. We also connect to Shopify to correlate ad spend with revenue, and deliver real-time alerts and reports through Slack and WhatsApp. Every action the AI takes is logged and visible in the client dashboard.
          </p>
        </section>

        <div className="border-t border-white/[0.06] mb-12" />

        {/* Platform Integrations */}
        <section className="mb-12">
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-6">Our Integrations</h2>

          {[
            { name: "Meta Ads", items: [
              "Create and manage Facebook and Instagram ad campaigns on behalf of subscribers",
              "Monitor campaign performance metrics including CPL, ROAS, CTR, and frequency",
              "Automatically pause underperforming ad sets and scale winners based on real-time data",
              "Detect creative fatigue and flag ads for replacement",
            ]},
            { name: "Google Ads", items: [
              "Create and manage Google Search and Performance Max campaigns on behalf of subscribers",
              "Retrieve campaign performance data (impressions, clicks, conversions, cost-per-lead)",
              "Automatically pause underperforming ad groups and scale top performers based on ROAS thresholds",
              "Generate weekly performance reports surfaced in the subscriber dashboard",
              "Adjust budgets and bids programmatically based on real-time performance signals",
            ]},
            { name: "TikTok Ads", items: [
              "Monitor TikTok ad campaign performance and sync metrics daily",
              "Surface TikTok performance alongside Meta and Google in a unified dashboard",
              "Provide AI-powered optimization recommendations based on cross-platform data",
            ]},
            { name: "Shopify", items: [
              "Connect Shopify stores to correlate ad spend with actual revenue and purchases",
              "Track ROAS across ad platforms using real order data instead of pixel estimates",
              "Sync order and revenue metrics daily to power AI optimization decisions",
            ]},
            { name: "Slack and WhatsApp", items: [
              "Deliver campaign alerts, performance summaries, and AI recommendations to Slack channels",
              "Conversational AI assistant via WhatsApp — ask about performance, give instructions, or submit rules",
              "Control campaigns from your phone: pause, scale, or audit without logging into a dashboard",
            ]},
          ].map((platform) => (
            <div key={platform.name} className="mb-7">
              <h3 className="text-[15px] font-bold text-[#e8eaf0] mb-3">{platform.name}</h3>
              <div className="flex flex-col gap-2.5">
                {platform.items.map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                    <p className="text-sm text-[#8b8fa8] leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <div className="border-t border-white/[0.06] mb-12" />

        {/* Business Info */}
        <section className="mb-12">
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-6">Business Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Business Name", value: "Buena Onda" },
              { label: "State of Registration", value: "Michigan, USA" },
              { label: "Location", value: "Warren, MI" },
              { label: "Founded", value: "2026" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#161820] border border-white/[0.06] rounded-xl px-5 py-4">
                <div className="text-[11px] font-bold text-[#5a5e72] uppercase tracking-wider mb-1.5">{label}</div>
                <div className="text-sm font-semibold text-[#e8eaf0]">{value}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="border-t border-white/[0.06] mb-12" />

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-6">Contact</h2>
          <div className="flex flex-col gap-3.5">
            <div className="flex gap-3 items-center">
              <span className="text-sm text-[#5a5e72] min-w-[60px]">Email</span>
              <a href="mailto:hello@buenaonda.ai" className="text-sm text-amber-400 no-underline hover:text-amber-300 transition-colors">hello@buenaonda.ai</a>
            </div>
            <div className="flex gap-3 items-center">
              <span className="text-sm text-[#5a5e72] min-w-[60px]">Phone</span>
              <a href="tel:+16198886686" className="text-sm text-amber-400 no-underline hover:text-amber-300 transition-colors">(619) 888-6686</a>
            </div>
            <div className="flex gap-3 items-center">
              <span className="text-sm text-[#5a5e72] min-w-[60px]">Location</span>
              <span className="text-sm text-[#8b8fa8]">Warren, MI · United States</span>
            </div>
          </div>
        </section>

        {/* Business Registration */}
        <section>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-6 py-5">
            <div className="text-sm font-bold text-[#e8eaf0] mb-1">Business Registration Certificate</div>
            <div className="text-xs text-[#8b8fa8]">State of Michigan — Notarized, Macomb County</div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
