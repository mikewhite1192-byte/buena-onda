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
      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 40px;
          margin-bottom: 48px;
        }
        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }
          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1020, margin: "0 auto" }}>
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, maxWidth: 260, margin: "0 0 16px" }}>
              The autonomous AI agent that launches, manages, optimizes, and reports on your Meta, Google, and TikTok ad campaigns.
            </p>
            <a href="mailto:hello@buenaonda.ai" style={{ display: "block", fontSize: 12, color: T.faint, textDecoration: "none", marginBottom: 4 }}>
              hello@buenaonda.ai
            </a>
            <a href="tel:+16198886686" style={{ display: "block", fontSize: 12, color: T.faint, textDecoration: "none", marginBottom: 4 }}>
              (619) 888-6686
            </a>
            <span style={{ fontSize: 12, color: T.faint }}>Warren, MI · United States</span>
          </div>

          {/* Product */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>Product</div>
            {[
              { label: "How it works", href: "/#how-it-works" },
              { label: "Demo", href: "/#demo" },
              { label: "Pricing", href: "/#pricing" },
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
              { label: "About", href: "/about" },
              { label: "Affiliate Program", href: "/affiliates" },
              { label: "Contact", href: "/contact" },
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
              { label: "Privacy Policy", href: "/privacy-policy" },
              { label: "Terms of Service", href: "/terms-of-service" },
            ].map(l => (
              <a key={l.label} href={l.href} style={{ display: "block", fontSize: 13, color: T.faint, textDecoration: "none", marginBottom: 10 }}>
                {l.label}
              </a>
            ))}
          </div>
        </div>

        {/* Giant brand text */}
        <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 900, fontSize: "clamp(36px, 12vw, 180px)", letterSpacing: "clamp(2px, 0.5vw, 6px)", textAlign: "center", lineHeight: 0.9, marginTop: 40, color: "rgba(255,255,255,0.35)", userSelect: "none" }}>
          <span style={{ color: "rgba(245,166,35,0.45)" }}>BUENA</span> ONDA
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 24, alignItems: "center", marginTop: 20 }}>
          <a href="/privacy-policy" style={{ fontSize: 12, color: T.faint, textDecoration: "none" }}>Privacy Policy</a>
          <a href="/terms-of-service" style={{ fontSize: 12, color: T.faint, textDecoration: "none" }}>Terms of Service</a>
          <span style={{ fontSize: 12, color: T.faint }}>© {new Date().getFullYear()} Buena Onda.</span>
        </div>
      </div>
    </footer>
  );
}
