import LandingNav from "../components/landing/LandingNav";
import LandingFooter from "../components/landing/LandingFooter";

const T = {
  accent: "#f5a623",
  accentBg: "rgba(245,166,35,0.08)",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  border: "rgba(255,255,255,0.06)",
  surface: "#161820",
  bg: "#0d0f14",
};

export const metadata = {
  title: "About — Buena Onda",
  description: "Buena Onda is an autonomous AI-powered ad management platform built to help small businesses and agencies run smarter Meta, Google, and TikTok Ads campaigns with Shopify, Slack, and WhatsApp integrations.",
};

export default function AboutPage() {
  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'DM Mono', 'Fira Mono', monospace", color: T.text }}>
      <LandingNav />

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "120px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <div style={{
            display: "inline-block",
            padding: "4px 14px",
            background: T.accentBg,
            border: `1px solid rgba(245,166,35,0.2)`,
            borderRadius: 20,
            fontSize: 11,
            color: T.accent,
            fontWeight: 600,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            marginBottom: 20,
          }}>
            Company
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-2px", lineHeight: 1.1 }}>
            About Buena Onda
          </h1>
          <p style={{ fontSize: 17, color: T.muted, lineHeight: 1.8, maxWidth: 620, margin: 0 }}>
            Buena Onda is an autonomous AI ad management platform that launches, optimizes, and reports on Meta, Google, and TikTok Ads campaigns — with Shopify, Slack, and WhatsApp integrations built in — so business owners can focus on their work, not their ad accounts.
          </p>
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${T.border}`, marginBottom: 48 }} />

        {/* Founder */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 24 }}>
            Founder
          </h2>
          <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
            <img
              src="/brand/mike-white.jpg"
              alt="Michael White, Founder of Buena Onda"
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                objectFit: "cover",
                border: `2px solid ${T.border}`,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>Michael White</div>
              <div style={{ fontSize: 13, color: T.accent, marginBottom: 14 }}>Founder &amp; CEO</div>
              <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.8, margin: 0 }}>
                Former sales professional who got tired of manually chasing leads and managing ad campaigns. Built Buena Onda to give agencies the same autonomous AI ad management that used to require a full media buying team.
              </p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${T.border}`, marginBottom: 48 }} />

        {/* Mission */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 }}>
            What We&apos;ve Built
          </h2>
          <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.9, marginBottom: 16 }}>
            Most small businesses and agencies waste thousands of dollars on ad spend because they don&apos;t have the time or expertise to manage campaigns properly. Buena Onda solves that with an AI agent that acts like a senior media buyer — monitoring performance 24/7, pausing underperformers, scaling winners, and delivering clear reports.
          </p>
          <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.9 }}>
            We integrate directly with Meta Ads, Google Ads, and TikTok Ads to create campaigns, manage budgets, retrieve performance metrics, and automatically optimize ad sets on behalf of our subscribers. We also connect to Shopify to correlate ad spend with revenue, and deliver real-time alerts and reports through Slack and WhatsApp. Every action the AI takes is logged and visible in the client dashboard.
          </p>
        </section>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${T.border}`, marginBottom: 48 }} />

        {/* Platform Integrations */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 24 }}>
            Our Integrations
          </h2>

          {/* Meta Ads */}
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 12 }}>Meta Ads</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {[
              "Create and manage Facebook and Instagram ad campaigns on behalf of subscribers",
              "Monitor campaign performance metrics including CPL, ROAS, CTR, and frequency",
              "Automatically pause underperforming ad sets and scale winners based on real-time data",
              "Detect creative fatigue and flag ads for replacement",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, marginTop: 7, flexShrink: 0 }} />
                <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>

          {/* Google Ads */}
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 12 }}>Google Ads</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {[
              "Create and manage Google Search and Performance Max campaigns on behalf of subscribers",
              "Retrieve campaign performance data (impressions, clicks, conversions, cost-per-lead)",
              "Automatically pause underperforming ad groups and scale top performers based on ROAS thresholds",
              "Generate weekly performance reports surfaced in the subscriber dashboard",
              "Adjust budgets and bids programmatically based on real-time performance signals",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, marginTop: 7, flexShrink: 0 }} />
                <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>

          {/* TikTok Ads */}
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 12 }}>TikTok Ads</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {[
              "Monitor TikTok ad campaign performance and sync metrics daily",
              "Surface TikTok performance alongside Meta and Google in a unified dashboard",
              "Provide AI-powered optimization recommendations based on cross-platform data",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, marginTop: 7, flexShrink: 0 }} />
                <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>

          {/* Shopify */}
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 12 }}>Shopify</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {[
              "Connect Shopify stores to correlate ad spend with actual revenue and purchases",
              "Track ROAS across ad platforms using real order data instead of pixel estimates",
              "Sync order and revenue metrics daily to power AI optimization decisions",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, marginTop: 7, flexShrink: 0 }} />
                <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>

          {/* Slack & WhatsApp */}
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 12 }}>Slack and WhatsApp</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Deliver campaign alerts, performance summaries, and AI recommendations to Slack channels",
              "Conversational AI assistant via WhatsApp — ask about performance, give instructions, or submit rules",
              "Control campaigns from your phone: pause, scale, or audit without logging into a dashboard",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, marginTop: 7, flexShrink: 0 }} />
                <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${T.border}`, marginBottom: 48 }} />

        {/* Business Info */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 24 }}>
            Business Information
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {[
              { label: "Business Name", value: "Buena Onda" },
              { label: "State of Registration", value: "Michigan, USA" },
              { label: "Location", value: "Warren, MI" },
              { label: "Founded", value: "2026" },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: "16px 20px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.faint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 14, color: T.text, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${T.border}`, marginBottom: 48 }} />

        {/* Contact */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 24 }}>
            Contact
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: T.faint, minWidth: 60 }}>Email</span>
              <a href="mailto:hello@buenaonda.ai" style={{ fontSize: 14, color: T.accent, textDecoration: "none" }}>hello@buenaonda.ai</a>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: T.faint, minWidth: 60 }}>Phone</span>
              <a href="tel:+16198886686" style={{ fontSize: 14, color: T.accent, textDecoration: "none" }}>(619) 888-6686</a>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: T.faint, minWidth: 60 }}>Location</span>
              <span style={{ fontSize: 14, color: T.muted }}>Warren, MI · United States</span>
            </div>
          </div>
        </section>

        {/* Business Registration */}
        <section>
          <div style={{
            padding: "20px 24px",
            background: T.accentBg,
            border: `1px solid rgba(245,166,35,0.2)`,
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>Business Registration Certificate</div>
            <div style={{ fontSize: 12, color: T.muted }}>State of Michigan — Notarized, Macomb County</div>
          </div>
        </section>

      </main>

      <LandingFooter />
    </div>
  );
}
