// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { neon } from "@neondatabase/serverless";
import { pauseAdSet, scaleAdSet } from "@/lib/meta/actions";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const sql = neon(process.env.DATABASE_URL!);

interface Message {
  role: "user" | "assistant";
  content: string;
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "pause_ad_set",
    description: "Pause an ad set in Meta Ads Manager",
    input_schema: {
      type: "object" as const,
      properties: {
        ad_set_id: { type: "string", description: "The Meta ad set ID to pause" },
      },
      required: ["ad_set_id"],
    },
  },
  {
    name: "enable_ad_set",
    description: "Enable/unpause an ad set in Meta Ads Manager",
    input_schema: {
      type: "object" as const,
      properties: {
        ad_set_id: { type: "string", description: "The Meta ad set ID to enable" },
      },
      required: ["ad_set_id"],
    },
  },
  {
    name: "scale_ad_set_budget",
    description: "Change the daily budget of an ad set",
    input_schema: {
      type: "object" as const,
      properties: {
        ad_set_id: { type: "string" },
        new_daily_budget: { type: "number", description: "New daily budget in dollars" },
      },
      required: ["ad_set_id", "new_daily_budget"],
    },
  },
];

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  if (name === "pause_ad_set") {
    const result = await pauseAdSet(input.ad_set_id as string);
    return result.ok
      ? `Successfully paused ad set ${input.ad_set_id}.`
      : `Failed to pause ad set: ${result.error}`;
  }

  if (name === "enable_ad_set") {
    // Meta API: set status to ACTIVE
    const url = new URL(`https://graph.facebook.com/v21.0/${input.ad_set_id}`);
    url.searchParams.set("access_token", process.env.META_ACCESS_TOKEN!);
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
      cache: "no-store",
    });
    const data = await res.json();
    return res.ok && !data.error
      ? `Successfully enabled ad set ${input.ad_set_id}.`
      : `Failed to enable ad set: ${data.error?.message ?? res.status}`;
  }

  if (name === "scale_ad_set_budget") {
    const budgetCents = Math.round((input.new_daily_budget as number) * 100);
    const result = await scaleAdSet(input.ad_set_id as string, budgetCents);
    return result.ok
      ? `Successfully updated ad set ${input.ad_set_id} daily budget to $${(budgetCents / 100).toFixed(2)}.`
      : `Failed to update budget: ${result.error}`;
  }

  return `Unknown tool: ${name}`;
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
    adAccountId ? sql`
      SELECT ad_set_name, ad_set_id, spend, leads, cpl, ctr, frequency, impressions, ad_status, date_recorded
      FROM ad_metrics
      WHERE ad_account_id = ${adAccountId}
        AND date_recorded >= NOW() - INTERVAL '7 days'
      ORDER BY date_recorded DESC
      LIMIT 20
    ` : Promise.resolve([]),

    adAccountId ? sql`
      SELECT action_type, details, status, created_at
      FROM agent_actions
      WHERE ad_account_id = ${adAccountId}
      ORDER BY created_at DESC
      LIMIT 10
    ` : Promise.resolve([]),

    clientId ? sql`
      SELECT rule_key, rule_value, pattern_description, confidence_score, vertical
      FROM agent_learnings
      WHERE is_active_rule = true
      ORDER BY confidence_score DESC
      LIMIT 10
    ` : Promise.resolve([]),

    clientId ? sql`
      SELECT name, vertical, meta_ad_account_id FROM clients WHERE id = ${clientId} LIMIT 1
    ` : Promise.resolve([]),
  ]);

  const clientInfo = client?.[0] as { name: string; vertical: string; meta_ad_account_id: string } | undefined;

  const systemPrompt = `You are the Buena Onda AI — an expert Meta ads analyst and strategist embedded in the Buena Onda dashboard. You help agency owners and media buyers make smart decisions about their Meta ad campaigns.

You have a direct, knowledgeable communication style. No fluff, no filler. You give real recommendations backed by data.

You have tools to take real actions on Meta ad accounts: pausing ad sets, enabling them, and changing budgets. Only use these tools when the user explicitly asks you to take an action. Before using a tool, confirm the ad set ID you're acting on.

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

Keep responses concise and actionable. Use numbers when you have them.`;

  // Build the message list for the API
  const apiMessages: Anthropic.MessageParam[] = messages.map((m: Message) => ({
    role: m.role,
    content: m.content,
  }));

  // Agentic loop — handle tool use
  let response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1000,
    system: systemPrompt,
    tools: TOOLS,
    messages: apiMessages,
  });

  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    // Execute all tool calls in parallel
    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        const result = await executeTool(block.name, block.input as Record<string, unknown>);
        return {
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: result,
        };
      })
    );

    // Continue with tool results
    response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system: systemPrompt,
      tools: TOOLS,
      messages: [
        ...apiMessages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ],
    });
  }

  const reply = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return NextResponse.json({ reply });
}
