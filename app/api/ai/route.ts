// app/api/ai/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { systemPrompt, userInput } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not set.' },
        { status: 500 }
      );
    }
    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'Missing userInput (string).' },
        { status: 400 }
      );
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        input: [
          ...(systemPrompt
            ? [{ role: 'system', content: systemPrompt }]
            : []),
          { role: 'user', content: userInput },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `OpenAI error: ${err}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Try to extract text robustly (Responses API may vary)
    let text = '';
    if (typeof data.output_text === 'string') {
      text = data.output_text;
    } else if (Array.isArray(data.output) && data.output.length) {
      const first = data.output.find((o: any) => o?.content)?.content ?? [];
      const part = Array.isArray(first) ? first.find((p: any) => p?.type === 'output_text') : null;
      text = part?.text ?? '';
    } else if (data.choices?.[0]?.message?.content) {
      // Fallback if provider returns Chat-style payloads
      text = data.choices[0].message.content;
    }

    return NextResponse.json({ output: text || '(No content returned.)' });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
