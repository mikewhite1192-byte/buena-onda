"use client";

import { useState } from "react";
import LandingNav from "../components/landing/LandingNav";
import LandingFooter from "../components/landing/LandingFooter";
import { Target, Star } from "lucide-react";

const BASE_URL = "https://buenaonda.ai";

const MILESTONES = [
  { count: 1, icon: Target, label: "First referral", reward: "Personal welcome video from the founders" },
  { count: 10, icon: Star, label: "10 active clients", reward: "Personal strategy call + featured partner" },
];

const STEPS = [
  { n: "01", title: "Sign up in 30 seconds", body: "Name and email. That's it. You get your unique referral link instantly." },
  { n: "02", title: "Share your link", body: "Post it, email it, add it to your content. Anyone who clicks and signs up is tracked for 90 days." },
  { n: "03", title: "Get paid every month", body: "50% on their first month. 40% every month after — for as long as they're a customer. Deposited directly to your bank." },
];

export default function AffiliatesPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [affiliateName, setAffiliateName] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [refs, setRefs] = useState(5);

  const referralLink = affiliateCode ? `${BASE_URL}/?ref=${affiliateCode}` : "";

  const avgPlan = 197;
  const month1 = Math.round(refs * avgPlan * 0.5);
  const monthly = Math.round(refs * avgPlan * 0.4);
  const annual = monthly * 12 + month1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 || data.affiliate_code) {
          setAffiliateCode(data.affiliate_code);
          setAffiliateName(name.trim());
          return;
        }
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setAffiliateCode(data.affiliate_code);
      setAffiliateName(name.trim());
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="landing-dark min-h-screen bg-[#0d0f14] text-[#e8eaf0]">
      <LandingNav />

      <div className="max-w-[960px] mx-auto px-6 pt-28 pb-20">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-[11px] text-amber-400 font-semibold uppercase tracking-wide mb-7">
            Affiliate Program · Early Access
          </div>
          <div className="mb-6">
            {["Earn 40%.", "Buena Onda.", "Forever."].map((line, i) => (
              <div
                key={line}
                className={`text-[clamp(40px,5.5vw,68px)] font-extrabold tracking-tighter leading-tight ${
                  i === 1 ? "bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent" : ""
                }`}
              >
                {line}
              </div>
            ))}
          </div>
          <p className="text-[17px] text-[#8b8fa8] max-w-[500px] mx-auto mb-3 leading-relaxed">
            50% on their first month. 40% every month after.
          </p>
          <p className="text-xs text-[#5a5e72] tracking-wide">
            Early affiliates are locked in at these rates. No cap. No expiry.
          </p>
        </div>

        {/* 4-box stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
          {[
            { label: "Month 1 commission", value: "50%", sub: "on first payment" },
            { label: "Recurring commission", value: "40%", sub: "every month after" },
            { label: "Cookie window", value: "90 days", sub: "from first click" },
            { label: "Payout cycle", value: "Monthly", sub: "direct to your bank" },
          ].map((s) => (
            <div key={s.label} className="bg-[#161820] border border-white/[0.06] rounded-xl p-5 text-center">
              <div className="text-[10px] text-[#5a5e72] uppercase tracking-wider mb-2">{s.label}</div>
              <div className="text-2xl font-extrabold text-amber-400 tracking-tight mb-1">{s.value}</div>
              <div className="text-[11px] text-[#8b8fa8]">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Earnings calc + sign up */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 items-start">

          {/* Earnings calculator */}
          <div className="bg-[#161820] border border-amber-500/30 rounded-2xl p-7">
            <div className="text-[10px] text-amber-400 uppercase tracking-wider mb-4">Earnings calculator</div>

            <div className="mb-5">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-[#8b8fa8]">Active referrals</span>
                <span className="text-sm font-bold text-[#e8eaf0]">{refs}</span>
              </div>
              <input
                type="range" min={1} max={50} value={refs}
                onChange={(e) => setRefs(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <div className="flex flex-col gap-2.5 p-4 bg-[#1e2130] rounded-xl">
              <div className="flex justify-between">
                <span className="text-xs text-[#8b8fa8]">Month 1 (50%)</span>
                <span className="text-sm font-bold text-amber-400">${month1.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#8b8fa8]">Monthly recurring (40%)</span>
                <span className="text-sm font-bold text-emerald-400">${monthly.toLocaleString()}/mo</span>
              </div>
              <div className="border-t border-white/[0.06] pt-2.5 flex justify-between">
                <span className="text-xs text-[#8b8fa8]">Year 1 total</span>
                <span className="text-lg font-extrabold text-[#e8eaf0]">${annual.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-[#5a5e72]">
              Based on avg Growth plan ($197/mo). All plans earn commissions.
            </div>
          </div>

          {/* Sign up form or success state */}
          {!affiliateCode ? (
            <div className="bg-[#161820] border border-white/[0.06] rounded-2xl p-7">
              <div className="text-base font-bold text-[#e8eaf0] mb-1.5">Get your referral link</div>
              <div className="text-xs text-[#8b8fa8] mb-6">No application. Instant access. Locked-in rates.</div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  className="w-full bg-[#1e2130] border border-white/[0.06] rounded-lg text-sm text-[#e8eaf0] px-4 py-3.5 outline-none focus:border-amber-500/40 transition-colors"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  type="email"
                  className="w-full bg-[#1e2130] border border-white/[0.06] rounded-lg text-sm text-[#e8eaf0] px-4 py-3.5 outline-none focus:border-amber-500/40 transition-colors"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                {error && <div className="text-xs text-red-400">{error}</div>}

                <button
                  type="submit"
                  disabled={submitting || !name.trim() || !email.trim()}
                  className={`py-3.5 rounded-lg text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                    submitting || !name.trim() || !email.trim()
                      ? "bg-white/5 text-[#5a5e72] cursor-not-allowed"
                      : "bg-gradient-to-r from-amber-500 to-orange-500 text-[#0d0f14] hover:brightness-110"
                  }`}
                >
                  {submitting ? "Creating your link..." : "Join the affiliate program →"}
                </button>

                <p className="text-[11px] text-[#5a5e72] text-center">
                  By joining you agree to our affiliate terms. You&apos;ll connect your bank account via Stripe from your dashboard.
                </p>
              </form>
            </div>
          ) : (
            <div className="bg-[#161820] border border-emerald-500/25 rounded-2xl p-7 text-center">
              <div className="text-xl font-extrabold text-emerald-400 mb-1 tracking-tight">
                You&apos;re in, {affiliateName.split(" ")[0]}!
              </div>
              <div className="text-sm text-[#8b8fa8] mb-6 leading-relaxed">
                50% on month 1, 40% every month after — locked in for life.
              </div>

              <div className="bg-[#1e2130] rounded-xl px-4 py-3.5 mb-4 flex items-center gap-2.5 text-left">
                <span className="flex-1 text-xs text-amber-400 overflow-hidden text-ellipsis whitespace-nowrap">
                  {referralLink}
                </span>
                <button
                  onClick={copyLink}
                  className={`px-3.5 py-1.5 rounded-md text-[11px] font-bold cursor-pointer flex-shrink-0 transition-all duration-200 ${
                    copied
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                      : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                  }`}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <div className="flex gap-2.5 justify-center flex-wrap mb-5">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent("I use Buena Onda AI to manage Meta ads with AI. Try it free:")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg border border-white/[0.06] text-[#8b8fa8] text-xs font-semibold no-underline hover:border-white/[0.15] hover:text-[#e8eaf0] transition-all"
                >
                  Share on Facebook
                </a>
                <a
                  href="https://www.instagram.com/"
                  target="_blank" rel="noopener noreferrer"
                  onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(`I use Buena Onda AI to manage Meta ads with AI. Try it free: ${referralLink}`); alert("Caption copied! Paste it into your Instagram post."); }}
                  className="px-4 py-2 rounded-lg border border-white/[0.06] text-[#8b8fa8] text-xs font-semibold no-underline hover:border-white/[0.15] hover:text-[#e8eaf0] transition-all cursor-pointer"
                >
                  Share on Instagram
                </a>
              </div>

              <a
                href={`/affiliates/dashboard?email=${encodeURIComponent(email)}`}
                className="block py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold no-underline hover:bg-amber-500/20 transition-all"
              >
                Set up payouts &amp; view dashboard →
              </a>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="mb-16">
          <div className="text-[10px] text-[#5a5e72] uppercase tracking-wider mb-7 text-center">How it works</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-[#161820] border border-white/[0.06] rounded-xl p-6">
                <div className="text-[28px] font-black text-amber-500/20 tracking-tighter leading-none mb-3">{s.n}</div>
                <div className="text-sm font-bold text-[#e8eaf0] mb-2">{s.title}</div>
                <div className="text-xs text-[#8b8fa8] leading-relaxed">{s.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone rewards */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <div className="text-[10px] text-[#5a5e72] uppercase tracking-wider mb-3">Milestone rewards</div>
            <h2 className="text-[28px] font-extrabold text-[#e8eaf0] tracking-tight mb-2">
              The more you refer, the better it gets
            </h2>
            <p className="text-sm text-[#8b8fa8]">
              We personally reach out at every milestone. These aren&apos;t automated badges — they&apos;re real rewards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MILESTONES.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.count} className="bg-[#161820] border border-white/[0.06] rounded-xl p-5 flex items-start gap-3.5">
                  <Icon className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-[#e8eaf0] mb-1">{m.label}</div>
                    <div className="text-xs text-[#8b8fa8]">{m.reward}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        {!affiliateCode && (
          <div className="text-center p-12 bg-[#161820] border border-amber-500/30 rounded-2xl">
            <h3 className="text-[26px] font-extrabold text-[#e8eaf0] tracking-tight mb-3">
              Ready to earn?
            </h3>
            <p className="text-sm text-[#8b8fa8] mb-7">
              Early affiliates lock in these rates permanently. Join now before we change the structure.
            </p>
            <a
              href="#top"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="inline-block px-10 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0d0f14] text-sm font-extrabold no-underline hover:brightness-110 transition-all cursor-pointer"
            >
              Get your referral link →
            </a>
          </div>
        )}
      </div>

      <LandingFooter />
    </div>
  );
}
