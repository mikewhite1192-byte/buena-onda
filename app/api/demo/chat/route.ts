// app/api/demo/chat/route.ts
// Public endpoint — no auth required. Powers the AI chat popup in /demo.
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the Buena Onda AI assistant — a friendly, concise AI for a Meta Ads management platform built for marketing agencies. The user is exploring a live demo of the platform.

Buena Onda is an AI-powered command center for marketing agencies that run Meta Ads. Key features:
- Live dashboard showing spend, leads, ROAS, CPL, CTR across all client accounts
- Anomaly alerts: AI flags spending with 0 leads, CPL spikes, creative fatigue in real-time
- AI recommendations: ranked suggestions (pause fatigued ad, scale winner, fix audience overlap) with one-click approve/dismiss
- Campaign builder: AI builds full campaign structure from a conversation — copy, targeting, ad sets, budget
- Performance charts: any metric over time with metric switcher
- Shareable client reports: read-only link, no login required
- Automated weekly/monthly reports emailed to clients
- 15 demo client accounts across verticals: roofing, dental, solar, insurance, ecommerce, real estate, HVAC, legal, auto, fitness, beauty, supplements, home goods, remodeling, finance

Keep answers short (2-4 sentences max). Be helpful and enthusiastic but concise. If asked how to do something, explain the feature. If asked about pricing, tell them to check /#pricing. If someone wants to sign up, send them to /#pricing.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json() as { messages: { role: "user" | "assistant"; content: string }[] };

    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: SYSTEM,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Chat unavailable" }), { status: 500 });
  }
}
