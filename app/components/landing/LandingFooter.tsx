"use client";

export default function LandingFooter() {
  return (
    <footer className="bg-[#0a0c10] border-t border-white/[0.06] py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="font-extrabold text-lg bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-3">
              Buena Onda
            </div>
            <p className="text-sm text-[#8b8fa8] leading-relaxed max-w-[260px] mb-4">
              The autonomous AI agent that launches, manages, optimizes, and reports on your Meta, Google, and TikTok ad campaigns.
            </p>
            <a href="mailto:hello@buenaonda.ai" className="block text-xs text-[#5a5e72] no-underline hover:text-amber-400 transition-colors mb-1">
              hello@buenaonda.ai
            </a>
            <a href="tel:+16198886686" className="block text-xs text-[#5a5e72] no-underline hover:text-amber-400 transition-colors mb-1">
              (619) 888-6686
            </a>
            <span className="text-xs text-[#5a5e72]">Warren, MI · United States</span>
          </div>

          {/* Product */}
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-[#8b8fa8] mb-4">Product</div>
            {[
              { label: "How it works", href: "/#how-it-works" },
              { label: "Demo", href: "/#demo" },
              { label: "Pricing", href: "/#pricing" },
              { label: "Dashboard", href: "/dashboard" },
            ].map((l) => (
              <a key={l.label} href={l.href} className="block text-sm text-[#5a5e72] no-underline hover:text-[#e8eaf0] transition-colors duration-200 py-1 cursor-pointer">
                {l.label}
              </a>
            ))}
          </div>

          {/* Company */}
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-[#8b8fa8] mb-4">Company</div>
            {[
              { label: "About", href: "/about" },
              { label: "Affiliate Program", href: "/affiliates" },
              { label: "Contact", href: "/contact" },
            ].map((l) => (
              <a key={l.label} href={l.href} className="block text-sm text-[#5a5e72] no-underline hover:text-[#e8eaf0] transition-colors duration-200 py-1 cursor-pointer">
                {l.label}
              </a>
            ))}
          </div>

          {/* Legal */}
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-[#8b8fa8] mb-4">Legal</div>
            {[
              { label: "Privacy Policy", href: "/privacy-policy" },
              { label: "Terms of Service", href: "/terms-of-service" },
            ].map((l) => (
              <a key={l.label} href={l.href} className="block text-sm text-[#5a5e72] no-underline hover:text-[#e8eaf0] transition-colors duration-200 py-1 cursor-pointer">
                {l.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-6 text-center">
          <p className="text-xs text-[#5a5e72] m-0">
            © {new Date().getFullYear()} Buena Onda. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
