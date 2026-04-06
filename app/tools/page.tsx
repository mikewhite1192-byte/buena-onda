import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free Ad Tools | Buena Onda",
  description:
    "Grade your ad accounts, score your copy, and calculate ROAS -- all free, no login required.",
  openGraph: {
    title: "Free Ad Tools | Buena Onda",
    description:
      "Grade your ad accounts, score your copy, and calculate ROAS -- all free, no login required.",
    url: "https://buenaonda.ai/tools",
    siteName: "Buena Onda",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Ad Tools | Buena Onda",
    description:
      "Grade your ad accounts, score your copy, and calculate ROAS -- all free, no login required.",
  },
};

const tools = [
  {
    href: "/tools/ad-account-grader",
    title: "Ad Account Grader",
    description:
      "Score your Meta, Google, or TikTok ad account health in 60 seconds. Get actionable fixes to improve ROAS.",
    badge: "A+",
  },
  {
    href: "/tools/ad-copy-scorer",
    title: "Ad Copy Scorer",
    description:
      "Paste your ad copy and get an AI-powered score on clarity, hook strength, CTA effectiveness, and emotional pull.",
    badge: "9.2",
  },
  {
    href: "/tools/roas-calculator",
    title: "ROAS Calculator",
    description:
      "Calculate your Return on Ad Spend, break-even point, and profit margin across campaigns.",
    badge: "4.2x",
  },
];

export default function ToolsIndexPage() {
  return (
    <main
      style={{ background: "#080808", color: "#e8eaf0", minHeight: "100vh" }}
    >
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
        <div className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#f5a623]">
          Free Tools
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Ad Performance Tools
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[#8b8fa8]">
          No login required. Grade your accounts, score your copy, and calculate
          your ROAS in seconds.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-2xl border border-[#1e2030] bg-[#0d0f14] p-6 transition hover:border-[#f5a623]/40"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#f5a623] bg-[#161820] text-sm font-bold text-[#f5a623]">
                {tool.badge}
              </div>
              <h2 className="text-lg font-bold text-[#e8eaf0] group-hover:text-[#f5a623] transition">
                {tool.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#8b8fa8]">
                {tool.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#f5a623]">
                Try it free <span className="transition group-hover:translate-x-1">&#8594;</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
