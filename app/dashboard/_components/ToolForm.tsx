// app/dashboard/_components/ToolForm.tsx
'use client';

import { useState } from 'react';

type Props = {
  title: string;
  description?: string;
  systemPrompt?: string;
  placeholder?: string;
  emoji?: string;
};

export default function ToolForm({
  title,
  description,
  systemPrompt = '',
  placeholder = 'Describe what you want…',
  emoji = '✨',
}: Props) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setOutput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, userInput: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setOutput(data.output || '');
    } catch (error: any) {
      setErr(error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-1 text-sm">
          <span className="text-lg">{emoji}</span>
          <span className="font-medium">{title}</span>
        </div>
        {description && <p className="text-neutral-600">{description}</p>}
      </header>

      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full min-h-[140px] rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
          placeholder={placeholder}
          required
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate'}
          </button>
          <button
            type="button"
            onClick={() => {
              setInput('');
              setOutput('');
              setErr('');
            }}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
          >
            Reset
          </button>
        </div>
      </form>

      {(err || output) && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          {err ? (
            <p className="text-sm text-red-600">{err}</p>
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-neutral-800">{output}</pre>
          )}
        </div>
      )}
    </section>
  );
}
