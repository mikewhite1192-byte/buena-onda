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
  title: "Contact — Buena Onda",
  description: "Get in touch with the Buena Onda team.",
};

export default function ContactPage() {
  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'DM Mono', 'Fira Mono', monospace", color: T.text }}>
      <LandingNav />

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "120px 24px 80px" }}>
        <div style={{ marginBottom: 48 }}>
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
            Contact
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-1.5px" }}>
            Get in touch
          </h1>
          <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.8, margin: 0 }}>
            Questions about the platform, pricing, or your account — reach us directly.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Email", value: "hello@buenaonda.ai", href: "mailto:hello@buenaonda.ai" },
            { label: "Phone", value: "(619) 888-6686", href: "tel:+16198886686" },
          ].map(({ label, value, href }) => (
            <a key={label} href={href} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px",
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              textDecoration: "none",
              transition: "border-color 0.15s",
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.faint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 15, color: T.accent, fontWeight: 600 }}>{value}</div>
              </div>
              <span style={{ color: T.faint, fontSize: 18 }}>→</span>
            </a>
          ))}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.faint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Location</div>
              <div style={{ fontSize: 15, color: T.accent, fontWeight: 600 }}>Warren, MI · United States</div>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
