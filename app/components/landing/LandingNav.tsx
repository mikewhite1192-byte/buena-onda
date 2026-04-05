"use client";

import { useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-4 left-4 right-4 z-50 bg-[#0d0f14]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl px-6 h-14 flex items-center justify-between">
        <Link href="/" className="no-underline">
          <span className="font-extrabold text-lg bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            Buena Onda
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-5">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm text-[#8b8fa8] no-underline hover:text-amber-400 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:rounded-md"
            >
              {l.label}
            </a>
          ))}
          <SignedOut>
            <Link
              href="/sign-in"
              className="text-sm text-[#8b8fa8] no-underline hover:text-amber-400 transition-colors duration-200 cursor-pointer"
            >
              Log in
            </Link>
            <Link
              href="/#pricing"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-[#0d0f14] text-sm font-bold no-underline hover:brightness-110 transition-all duration-200 cursor-pointer"
            >
              Start Free
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-[#0d0f14] text-sm font-bold no-underline hover:brightness-110 transition-all duration-200 cursor-pointer"
            >
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        {/* Mobile right side */}
        <div className="flex sm:hidden items-center gap-3">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            className="text-[#8b8fa8] hover:text-amber-400 transition-colors cursor-pointer bg-transparent border-none p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:rounded-md"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {open && (
        <div className="fixed inset-0 top-[72px] z-40 bg-[#0d0f14]/95 backdrop-blur-xl sm:hidden flex flex-col px-6 pt-4 pb-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-4 text-[15px] text-[#8b8fa8] no-underline border-b border-white/5 hover:text-amber-400 transition-colors"
            >
              {l.label}
            </a>
          ))}
          <SignedOut>
            <Link
              href="/#pricing"
              onClick={() => setOpen(false)}
              className="mt-6 block text-center py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0d0f14] text-sm font-extrabold no-underline"
            >
              Start Free Trial →
            </Link>
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="mt-3 block text-center py-3.5 rounded-xl border border-amber-500/25 text-amber-400 text-sm font-bold no-underline"
            >
              Log in
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="mt-6 block text-center py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0d0f14] text-sm font-extrabold no-underline"
            >
              Dashboard →
            </Link>
          </SignedIn>
        </div>
      )}
    </>
  );
}
