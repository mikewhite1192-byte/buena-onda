import LandingNav from "./components/landing/LandingNav";
import LandingHero from "./components/landing/LandingHero";
import LandingHowItWorks from "./components/landing/LandingHowItWorks";
import LandingDemo from "./components/landing/LandingDemo";
import LandingPricing from "./components/landing/LandingPricing";
import LandingFAQ from "./components/landing/LandingFAQ";
import LandingFooter from "./components/landing/LandingFooter";
import ScrollReveal from "./components/landing/ScrollReveal";

export default function Page() {
  return (
    <div className="landing-dark min-h-screen bg-[#0d0f14] text-[#e8eaf0] relative">
      {/* Grain texture overlay */}
      <div className="grain-overlay" />
      {/* Grid lines background */}
      <div className="grid-bg" />

      {/* ── Animated gradient blobs — FIXED, full page ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <style>{`
          @keyframes blob1 { 0%, 100% { transform: translate(0, 0) scale(1); } 25% { transform: translate(-80px, 60px) scale(1.15); } 50% { transform: translate(-40px, -40px) scale(0.9); } 75% { transform: translate(60px, 30px) scale(1.1); } }
          @keyframes blob2 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(70px, -50px) scale(1.1); } 66% { transform: translate(-50px, 40px) scale(0.88); } }
          @keyframes blob3 { 0%, 100% { transform: translate(0, 0) scale(1); } 20% { transform: translate(40px, -60px) scale(1.15); } 40% { transform: translate(-60px, -20px) scale(0.9); } 60% { transform: translate(30px, 50px) scale(1.08); } 80% { transform: translate(-40px, 15px) scale(0.95); } }
        `}</style>
        {/* Primary — amber, top right */}
        <div className="absolute w-[900px] h-[900px] rounded-full opacity-[0.15]" style={{ top: "-15%", right: "-10%", background: "radial-gradient(circle, rgba(245,166,35,0.6) 0%, rgba(247,107,28,0.3) 40%, transparent 70%)", filter: "blur(120px)", animation: "blob1 12s ease-in-out infinite" }} />
        {/* Secondary — deep orange, bottom left */}
        <div className="absolute w-[700px] h-[700px] rounded-full opacity-[0.12]" style={{ bottom: "-5%", left: "-10%", background: "radial-gradient(circle, rgba(247,107,28,0.5) 0%, rgba(245,166,35,0.2) 50%, transparent 70%)", filter: "blur(100px)", animation: "blob2 15s ease-in-out infinite" }} />
        {/* Accent — warm gold, center */}
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-[0.08]" style={{ top: "35%", left: "35%", background: "radial-gradient(circle, rgba(255,200,50,0.4) 0%, transparent 60%)", filter: "blur(100px)", animation: "blob3 18s ease-in-out infinite" }} />
        {/* Cool contrast — blue, top left */}
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.06]" style={{ top: "10%", left: "5%", background: "radial-gradient(circle, rgba(100,150,255,0.5) 0%, transparent 60%)", filter: "blur(80px)", animation: "blob2 20s ease-in-out infinite reverse" }} />
      </div>

      <div className="relative z-[1]">
        <LandingNav />
        <LandingHero />
        <ScrollReveal>
          <LandingHowItWorks />
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <LandingDemo />
        </ScrollReveal>
        <ScrollReveal>
          <LandingPricing />
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <LandingFAQ />
        </ScrollReveal>
        <LandingFooter />
      </div>
    </div>
  );
}
