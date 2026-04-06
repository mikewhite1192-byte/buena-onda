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
    <>
      {/* BLOBS — rendered OUTSIDE all containers, position fixed, z-0 */}
      <AnimatedBlobs />

      {/* PAGE — all content sits above blobs */}
      <div className="relative min-h-screen text-[#e8eaf0]" data-scroll-content style={{ zIndex: 1, background: "transparent" }}>
        <div className="grain-overlay" />
        <div className="grid-bg" />
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
