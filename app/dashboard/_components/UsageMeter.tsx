// app/dashboard/_components/UsageMeter.tsx
type Props = { current: number; limit: number };

export default function UsageMeter({ current, limit }: Props) {
  const pct = Math.min(100, Math.round((current / Math.max(1, limit)) * 100));
  return (
    <div className="rounded-2xl border border-neutral-200 p-4 bg-white">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">AI Messages</h3>
        <span className="text-sm text-neutral-600">
          {current} / {limit}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-neutral-100">
        <div className="h-2 rounded-full bg-neutral-900 transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-neutral-500">Resets every 30 days.</p>
    </div>
  );
}
