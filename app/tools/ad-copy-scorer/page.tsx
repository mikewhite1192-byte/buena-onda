import { Metadata } from "next";
import LandingNav from "../../components/landing/LandingNav";
import LandingFooter from "../../components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Ad Copy Scorer — Free Tool | Buena Onda",
  description:
    "Paste your ad copy and get an AI-powered score on clarity, hook strength, CTA effectiveness, and emotional pull.",
  openGraph: {
    title: "Ad Copy Scorer — Free Tool | Buena Onda",
    description:
      "Paste your ad copy and get an AI-powered score on clarity, hook strength, CTA effectiveness, and emotional pull.",
    url: "https://buenaonda.ai/tools/ad-copy-scorer",
    siteName: "Buena Onda",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ad Copy Scorer — Free Tool | Buena Onda",
    description:
      "Paste your ad copy and get an AI-powered score on clarity, hook strength, CTA effectiveness, and emotional pull.",
  },
};

export default function AdCopyScorerPage() {
  return (
    <div className="relative min-h-screen text-[#e8eaf0]" style={{ zIndex: 1, background: "#080808" }}>
      <div className="grain-overlay" />
      <div className="grid-bg" />
      <LandingNav />
      <main className="mx-auto max-w-3xl px-4 pt-32 pb-24 sm:px-6">
        <div className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#f5a623]">
          Free Tool
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Ad Copy Scorer
        </h1>
        <p className="mt-4 text-lg text-[#8b8fa8]">
          Paste your ad headline, primary text, and CTA. Our AI scores each
          element on clarity, hook strength, emotional pull, and conversion
          potential.
        </p>

        <div className="mt-12 rounded-2xl border border-[#1e2030] bg-[#0d0f14] p-8 text-center text-[#8b8fa8]">
          <p className="text-lg font-medium text-[#e8eaf0]">Coming soon</p>
          <p className="mt-2 text-sm">
            This tool is under development. Join the waitlist to get early
            access.
          </p>
          <a
            href="/waitlist"
            className="mt-6 inline-block rounded-xl bg-[#f5a623] px-6 py-3 text-sm font-semibold text-[#0d0f14] no-underline hover:bg-[#e09510] transition"
          >
            Join the waitlist
          </a>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
