import LandingNav from "./components/landing/LandingNav";
import LandingHero from "./components/landing/LandingHero";
import LandingHowItWorks from "./components/landing/LandingHowItWorks";
import LandingDemo from "./components/landing/LandingDemo";
import LandingPricing from "./components/landing/LandingPricing";
import LandingFAQ from "./components/landing/LandingFAQ";
import LandingFooter from "./components/landing/LandingFooter";

export default function Page() {
  return (
    <div style={{ background: "#0d0f14", minHeight: "100vh", fontFamily: "'DM Mono', 'Fira Mono', monospace", color: "#e8eaf0" }}>
      <LandingNav />
      <LandingHero />
      <LandingHowItWorks />
      <LandingDemo />
      <LandingPricing />
      <LandingFAQ />
      <LandingFooter />
    </div>
  );
}
