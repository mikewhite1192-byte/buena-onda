// app/dashboard/_components/UpgradeCTA.tsx
import Link from 'next/link';

export default function UpgradeCTA() {
  return (
    <div className="rounded-2xl border border-neutral-200 p-4 bg-white">
      <div className="space-y-1">
        <h3 className="font-medium">Need more messages?</h3>
        <p className="text-sm text-neutral-600">
          Upgrade to Pro for higher limits and premium tools.
        </p>
      </div>
      <Link
        href="/pricing"
        className="mt-3 inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 active:scale-[0.99]"
      >
        Upgrade to Pro
      </Link>
    </div>
  );
}
