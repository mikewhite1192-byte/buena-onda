import LandingNav from "./components/landing/LandingNav";
import LandingHero from "./components/landing/LandingHero";
import LandingHowItWorks from "./components/landing/LandingHowItWorks";
import LandingDemo from "./components/landing/LandingDemo";
import LandingPricing from "./components/landing/LandingPricing";
import LandingFAQ from "./components/landing/LandingFAQ";
import LandingFooter from "./components/landing/LandingFooter";

export default function Page() {
  return (
    <div className="landing-dark min-h-screen bg-[#0d0f14] text-[#e8eaf0] relative">
      {/* Grain texture overlay */}
      <div className="grain-overlay" />
      {/* Grid lines background */}
      <div className="grid-bg" />
      <div className="relative z-[1]">
        <LandingNav />
        <LandingHero />
        <LandingHowItWorks />
        <LandingDemo />
        <LandingPricing />
        <LandingFAQ />
        <LandingFooter />
      </div>
    </div>
  );
}
