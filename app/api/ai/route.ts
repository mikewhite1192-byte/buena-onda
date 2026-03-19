import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { systemPrompt, userInput } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not set.' },
        { status: 500 }
      );
    }
    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'Missing userInput (string).' },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: 'user', content: userInput }],
    });

    const block = response.content.find(
      (b): b is Anthropic.Messages.TextBlock => b.type === 'text'
    );
    const text = block?.text ?? '';

    return NextResponse.json({ output: text || '(No content returned.)' });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
