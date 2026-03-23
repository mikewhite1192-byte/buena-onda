"use client";

const T = {
  accent: "#f5a623",
  text: "#e8eaf0",
  muted: "#8b8fa8",
  faint: "#5a5e72",
  border: "rgba(255,255,255,0.06)",
  surface: "#161820",
  bg: "#0d0f14",
};

export default function LandingFooter() {
  return (
    <footer style={{ background: T.surface, borderTop: `1px solid ${T.border}`, padding: "48px 24px 32px" }}>
      <div style={{ maxWidth: 1020, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48, flexWrap: "wrap" }}>
          {/* Brand */}
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, background: "linear-gradient(135deg,#f5a623,#f76b1c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>
              Buena Onda
            </div>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, maxWidth: 260, margin: "0 0 16px" }}>
              The autonomous AI agent that launches, manages, optimizes, and reports on your Meta, Google, and TikTok ad campaigns.
            </p>
            <a href="mailto:hello@buenaonda.ai" style={{ fontSize: 12, color: T.faint, textDecoration: "none" }}>
              hello@buenaonda.ai
            </a>
          </div>

          {/* Product */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>Product</div>
            {[
              { label: "How it works", href: "#how-it-works" },
              { label: "Demo", href: "#demo" },
              { label: "Pricing", href: "#pricing" },
              { label: "Dashboard", href: "/dashboard" },
            ].map(l => (
              <a key={l.label} href={l.href} style={{ display: "block", fontSize: 13, color: T.faint, textDecoration: "none", marginBottom: 10 }}>
                {l.label}
              </a>
            ))}
          </div>

          {/* Company */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>Company</div>
            {[
              { label: "Affiliate Program", href: "/affiliates" },
              { label: "Contact", href: "mailto:hello@buenaonda.ai" },
            ].map(l => (
              <a key={l.label} href={l.href} style={{ display: "block", fontSize: 13, color: T.faint, textDecoration: "none", marginBottom: 10 }}>
                {l.label}
              </a>
            ))}
          </div>

          {/* Legal */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>Legal</div>
            {[
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
            ].map(l => (
              <a key={l.label} href={l.href} style={{ display: "block", fontSize: 13, color: T.faint, textDecoration: "none", marginBottom: 10 }}>
                {l.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 12, color: T.faint, margin: 0 }}>
            © {new Date().getFullYear()} Buena Onda. All rights reserved.
          </p>
          <p style={{ fontSize: 12, color: T.faint, margin: 0 }}>
            Not affiliated with Meta Platforms, Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}
