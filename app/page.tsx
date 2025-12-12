import Hero from "./components/Hero";
import TrackGrid from "./components/TrackGrid";
import PainSection from "./components/PainSection";
import StopJuggling from "./components/StopJuggling";
import RevenueFlywheel from "./components/RevenueFlywheel";
import DemoCTA from "./components/DemoCTA";
import FAQ from "./components/FAQ";
import ClosingCTA from "./components/ClosingCTA";

export default function Page() {
  return (
    <>
      <Hero />
      <TrackGrid />
      <PainSection />
      <StopJuggling />
      <RevenueFlywheel />
      <DemoCTA />
      <FAQ />
      <ClosingCTA />
    </>
  );
}
