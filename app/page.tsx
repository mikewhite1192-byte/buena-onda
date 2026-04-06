import LandingNav from "./components/landing/LandingNav";
import LandingHero from "./components/landing/LandingHero";
import LandingHowItWorks from "./components/landing/LandingHowItWorks";
import LandingDemo from "./components/landing/LandingDemo";
import LandingPricing from "./components/landing/LandingPricing";
import LandingFAQ from "./components/landing/LandingFAQ";
import LandingFooter from "./components/landing/LandingFooter";
import ScrollReveal from "./components/landing/ScrollReveal";
import AnimatedBlobs from "./components/landing/AnimatedBlobs";

export default function Page() {
  return (
    <div className="landing-dark min-h-screen bg-[#080808] text-[#e8eaf0] relative">
      {/* Grain texture overlay */}
      <div className="grain-overlay" />
      {/* Grid lines background */}
      <div className="grid-bg" />

      {/* Metaball liquid blobs — fixed viewport, scroll-reactive opacity */}
      <AnimatedBlobs />

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
