'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UsageMeter from './UsageMeter';
import UpgradeCTA from './UpgradeCTA';

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/tools/marketing', label: 'Marketing' },
  { href: '/dashboard/tools/ads', label: 'Ads' },
  { href: '/dashboard/tools/seo', label: 'SEO' },
  { href: '/dashboard/tools/ghl', label: 'GHL Workflows' },
  { href: '/dashboard/tools/finance', label: 'Finance' },
  { href: '/dashboard/tools/custom', label: 'Custom' },
  { href: '/pricing', label: 'Pricing' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-neutral-200">
        <Link href="/dashboard" className="block">
          <span className="text-lg font-semibold">Buena Onda AI</span>
        </Link>
        <p className="mt-1 text-xs text-neutral-500">Good energy. Clear focus.</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={[
                'block rounded-xl px-3 py-2 text-sm',
                active ? 'bg-neutral-900 text-white' : 'text-neutral-800 hover:bg-neutral-100',
              ].join(' ')}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 p-4 space-y-4">
        <UsageMeter current={0} limit={200} />
        <UpgradeCTA />
      </div>
    </div>
  );
}

function Sidebar() {
  return <SidebarContent />;
}

/** Mobile helpers **/
function MobileTrigger() {
  const [open, setOpen] = useSidebarOpen();
  return (
    <button
      onClick={() => setOpen(true)}
      aria-label="Open menu"
      className="rounded-xl border border-neutral-200 px-3 py-2 text-sm bg-white shadow-sm active:scale-[0.99]"
    >
      Menu
    </button>
  );
}

function MobileSheet() {
  const [open, setOpen] = useSidebarOpen();

  return (
    <div
      aria-hidden={!open}
      className={['md:hidden fixed inset-0 z-50 transition', open ? 'pointer-events-auto' : 'pointer-events-none'].join(' ')}
    >
      <div
        className={['absolute inset-0 bg-black/30 transition-opacity', open ? 'opacity-100' : 'opacity-0'].join(' ')}
        onClick={() => setOpen(false)}
      />
      <div
        className={[
          'absolute inset-y-0 left-0 w-80 max-w-[85%] bg-white border-r border-neutral-200 shadow-xl transition-transform',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="p-3 border-b border-neutral-200 flex items-center justify-between">
          <span className="font-semibold">Navigation</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-lg px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            Close
          </button>
        </div>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </div>
    </div>
  );
}

function useSidebarOpen() {
  // Keep state module-scoped so MobileTrigger/Sheet share it
  // (simple approach for now; replace with context if needed)
  // NOTE: Because both render in the same component tree, this works.
  const [open, setOpen] = useState(false);
  return [open, setOpen] as const;
}

// Attach helpers as properties to the default export
(Sidebar as any).MobileTrigger = MobileTrigger;
(Sidebar as any).MobileSheet = MobileSheet;

export default Sidebar;
