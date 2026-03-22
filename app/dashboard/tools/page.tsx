// app/dashboard/tools/page.tsx
import Link from 'next/link';

const tools = [
{ href: '/dashboard/tools/marketing', label: 'Marketing', emoji: '📣', desc: 'Campaign ideas, angles, offers.' },
  { href: '/dashboard/tools/ads', label: 'Ads', emoji: '📊', desc: 'Ad copy + iterative optimization.' },
  { href: '/dashboard/tools/seo', label: 'SEO', emoji: '🔎', desc: 'Keywords, briefs, outlines, content.' },
  { href: '/dashboard/tools/ghl', label: 'GHL', emoji: '⚙️', desc: 'Workflows & automation helpers.' },
  { href: '/dashboard/tools/finance', label: 'Finance', emoji: '💸', desc: 'Insights & simple forecasts.' },
  { href: '/dashboard/tools/custom', label: 'Custom', emoji: '🧩', desc: 'Your bespoke prompts & flows.' },
];

export default function ToolsIndex() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow transition"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{t.emoji}</span>
            <h2 className="font-medium">{t.label}</h2>
          </div>
          <p className="mt-2 text-sm text-neutral-600">{t.desc}</p>
          <div className="mt-4 inline-flex items-center gap-1 text-sm text-neutral-700 group-hover:gap-2 transition-all">
            Open tool <span>→</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
