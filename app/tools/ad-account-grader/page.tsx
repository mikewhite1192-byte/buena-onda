import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ad Account Grader — Free Tool | Buena Onda",
  description:
    "Score your Meta, Google, or TikTok ad account health in 60 seconds. Get actionable fixes to improve ROAS.",
  openGraph: {
    title: "Ad Account Grader — Free Tool | Buena Onda",
    description:
      "Score your Meta, Google, or TikTok ad account health in 60 seconds. Get actionable fixes to improve ROAS.",
    url: "https://buenaonda.ai/tools/ad-account-grader",
    siteName: "Buena Onda",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ad Account Grader — Free Tool | Buena Onda",
    description:
      "Score your Meta, Google, or TikTok ad account health in 60 seconds. Get actionable fixes to improve ROAS.",
  },
};

export default function AdAccountGraderPage() {
  return (
    <main
      style={{ background: "#080808", color: "#e8eaf0", minHeight: "100vh" }}
    >
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
        <div className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#f5a623]">
          Free Tool
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Ad Account Grader
        </h1>
        <p className="mt-4 text-lg text-[#8b8fa8]">
          Answer a few questions about your ad account setup, spend, and
          performance. We will score your account health and surface the highest-impact
          fixes.
        </p>

        <div className="mt-12 rounded-2xl border border-[#1e2030] bg-[#0d0f14] p-8 text-center text-[#8b8fa8]">
          <p className="text-lg font-medium text-[#e8eaf0]">Coming soon</p>
          <p className="mt-2 text-sm">
            This tool is under development. Join the waitlist to get early
            access.
          </p>
          <a
            href="/waitlist"
            className="mt-6 inline-block rounded-xl bg-[#f5a623] px-6 py-3 text-sm font-semibold text-[#0d0f14] hover:bg-[#e09510] transition"
          >
            Join the waitlist
          </a>
        </div>
      </div>
    </main>
  );
}
