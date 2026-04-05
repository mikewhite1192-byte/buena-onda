import LandingNav from "../components/landing/LandingNav";
import LandingFooter from "../components/landing/LandingFooter";

export const metadata = {
  title: "Contact — Buena Onda",
  description: "Get in touch with the Buena Onda team.",
};

export default function ContactPage() {
  return (
    <div className="landing-dark min-h-screen bg-[#0d0f14] text-[#e8eaf0]">
      <LandingNav />

      <main className="max-w-xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-12">
          <div className="inline-block px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[11px] text-amber-400 font-semibold uppercase tracking-wide mb-5">
            Contact
          </div>
          <h1 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-tight mb-3">
            Get in touch
          </h1>
          <p className="text-[15px] text-[#8b8fa8] leading-relaxed">
            Questions about the platform, pricing, or your account — reach us directly.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { label: "Email", value: "hello@buenaonda.ai", href: "mailto:hello@buenaonda.ai" },
            { label: "Phone", value: "(619) 888-6686", href: "tel:+16198886686" },
          ].map(({ label, value, href }) => (
            <a
              key={label}
              href={href}
              className="flex items-center justify-between px-6 py-5 bg-[#161820] border border-white/[0.06] rounded-xl no-underline hover:border-amber-500/20 transition-all duration-200 cursor-pointer group"
            >
              <div>
                <div className="text-[11px] font-bold text-[#5a5e72] uppercase tracking-wider mb-1">{label}</div>
                <div className="text-[15px] text-amber-400 font-semibold group-hover:text-amber-300 transition-colors">{value}</div>
              </div>
              <span className="text-[#5a5e72] text-lg group-hover:text-amber-400 transition-colors">→</span>
            </a>
          ))}
          <div className="flex items-center justify-between px-6 py-5 bg-[#161820] border border-white/[0.06] rounded-xl">
            <div>
              <div className="text-[11px] font-bold text-[#5a5e72] uppercase tracking-wider mb-1">Location</div>
              <div className="text-[15px] text-amber-400 font-semibold">Warren, MI · United States</div>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
