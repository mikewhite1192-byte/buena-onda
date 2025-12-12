'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { useState } from 'react';
import clsx from 'clsx';

const links = [
  { href: '/products', label: 'Products' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/playground', label: 'Playground' },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            {/* replace with your logo img if you have one */}
            <span className="inline-block h-8 w-8 rounded-full bg-emerald-600" />
            <span className="sr-only">Buena Onda AI</span>
          </Link>
          <Link
            href="/"
            className="hidden text-lg font-semibold text-slate-900 sm:inline"
          >
            Buena Onda AI
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'text-sm font-medium transition-colors',
                pathname === l.href
                  ? 'text-slate-900'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              {l.label}
            </Link>
          ))}

          {/* Auth actions */}
<SignedOut>
  <SignInButton mode="redirect" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
    <button className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
      Start free
    </button>
  </SignInButton>
</SignedOut>



          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    'text-base font-medium',
                    pathname === l.href
                      ? 'text-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {l.label}
                </Link>
              ))}

              <SignedOut>
  <SignInButton mode="redirect" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
    <button className="mt-1 w-full rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
      Start free
    </button>
  </SignInButton>
</SignedOut>


              <SignedIn>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="text-base font-medium text-slate-700 hover:text-slate-900"
                >
                  Dashboard
                </Link>
                <div className="mt-1">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
