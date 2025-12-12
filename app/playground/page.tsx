'use client';

import { useState, useRef } from 'react';

export default function Playground() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const streamingRef = useRef<HTMLDivElement | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setInput('');

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: q })
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    let full = '';
    setMessages((m) => [...m, { role: 'ai', content: '' }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      full += chunk;
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: 'ai', content: full };
        return copy;
      });
    }
  };

  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold">Playground</h1>
      <p className="text-slate-600 mt-2">A white‑label chat experience powered by <span className="font-semibold">Buena Onda AI</span>.</p>

      <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden shadow-soft">
        <div className="bg-onda-navy text-white px-4 py-3 font-semibold">Buena Onda AI</div>
        <div className="h-96 overflow-auto p-4 bg-white space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[80%] p-3 rounded-xl ${m.role === 'user' ? 'bg-blue-50 ml-auto' : 'bg-slate-50'}`}>
              {m.content}
            </div>
          ))}
        </div>
        <form onSubmit={send} className="flex gap-2 p-3 bg-slate-50">
          <input
            className="flex-1 border border-slate-300 rounded-xl px-3 py-2"
            placeholder="Ask me anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="rounded-xl bg-onda-teal text-white px-4">Send</button>
        </form>
      </div>
    </section>
  );
}
