// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { neon } from "@neondatabase/serverless";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const sql = neon(process.env.DATABASE_URL!);

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, clientId, adAccountId } = await req.json();

  if (!messages?.length) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  // Pull live context for this client
  const [recentMetrics, recentActions, recentLearnings, client] = await Promise.all([
    // Last 7 days metrics
    adAccountId ? sql`
      SELECT ad_set_name, ad_set_id, spend, leads, cpl, ctr, frequency, impressions, ad_status, date_recorded
      FROM ad_metrics
      WHERE ad_account_id = ${adAccountId}
        AND date_recorded >= NOW() - INTERVAL '7 days'
      ORDER BY date_recorded DESC
      LIMIT 20
    ` : Promise.resolve([]),

    // Last 10 agent actions
    adAccountId ? sql`
      SELECT action_type, details, status, created_at
      FROM agent_actions
      WHERE ad_account_id = ${adAccountId}
      ORDER BY created_at DESC
      LIMIT 10
    ` : Promise.resolve([]),

    // Active learnings for vertical
    clientId ? sql`
      SELECT rule_key, rule_value, pattern_description, confidence_score, vertical
      FROM agent_learnings
      WHERE is_active_rule = true
      ORDER BY confidence_score DESC
      LIMIT 10
    ` : Promise.resolve([]),

    // Client info
    clientId ? sql`
      SELECT name, vertical, meta_ad_account_id FROM clients WHERE id = ${clientId} LIMIT 1
    ` : Promise.resolve([]),
  ]);

  const clientInfo = client?.[0] as { name: string; vertical: string; meta_ad_account_id: string } | undefined;

  const systemPrompt = `You are the Buena Onda AI — an expert Meta ads analyst and strategist embedded in the Buena Onda dashboard. You help agency owners and media buyers make smart decisions about their Meta ad campaigns.

You have a direct, knowledgeable communication style. No fluff, no filler. You give real recommendations backed by data.

${clientInfo ? `
CURRENT CLIENT CONTEXT:
- Client: ${clientInfo.name}
- Vertical: ${clientInfo.vertical} (${clientInfo.vertical === "leads" ? "lead generation — final expense, insurance, real estate, solar, etc." : "ecommerce — product sales, DTC brands"})
- Meta Ad Account: ${clientInfo.meta_ad_account_id}
` : ""}

${recentMetrics.length > 0 ? `
LIVE CAMPAIGN DATA (last 7 days):
${JSON.stringify(recentMetrics, null, 2)}
` : "No campaign data available yet."}

${recentActions.length > 0 ? `
RECENT AGENT ACTIONS:
${JSON.stringify(recentActions, null, 2)}
` : "No recent agent actions."}

${recentLearnings.length > 0 ? `
ACTIVE LEARNED RULES FOR THIS VERTICAL:
${JSON.stringify(recentLearnings, null, 2)}
` : ""}

You can help with:
- Analyzing campaign performance and explaining what the data means
- Explaining why the agent took specific actions
- Recommending which ad sets to scale, pause, or test
- Brainstorming creative angles, hooks, and ad concepts
- Advising on budget allocation and bidding strategy
- Answering any Meta ads questions
- Identifying patterns in the data
- Suggesting new campaigns or audiences to test

When you see specific metrics, reference them directly. Be specific. "Your FEX Video Testimonial ad set is scaling at $7.14 CPL — that's well below your \$20 floor. I'd push the budget harder here."

Keep responses concise and actionable. Use numbers when you have them.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1000,
    system: systemPrompt,
    messages: messages.map((m: Message) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const reply = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  return NextResponse.json({ reply });
}
