import LandingNav from "./components/landing/LandingNav";
import LandingHero from "./components/landing/LandingHero";
import LandingHowItWorks from "./components/landing/LandingHowItWorks";
import LandingDemo from "./components/landing/LandingDemo";
import LandingPricing from "./components/landing/LandingPricing";
import LandingFAQ from "./components/landing/LandingFAQ";
import LandingFooter from "./components/landing/LandingFooter";
import ScrollReveal from "./components/landing/ScrollReveal";
import CircuitBackground from "./components/landing/CircuitBackground";

export default function Page() {
  return (
    <>
      {/* CIRCUIT BG — rendered OUTSIDE all containers, position fixed, z-0 */}
      <CircuitBackground />

      {/* PAGE — all content sits above the circuit */}
      <div className="relative min-h-screen text-[#e8eaf0]" data-scroll-content style={{ zIndex: 1, background: "transparent" }}>
        <div className="grain-overlay" />
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
    </>
  );
}
