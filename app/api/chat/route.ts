// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { neon } from "@neondatabase/serverless";
import {
  pauseAdSet, scaleAdSet,
  pauseCampaign, enableCampaign, scaleCampaignBudget,
  pauseAd, enableAd, deleteAd,
  createMetaCampaign,
} from "@/lib/meta/actions";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const sql = neon(process.env.DATABASE_URL!);

interface Message {
  role: "user" | "assistant";
  content: string;
}

const TOOLS: Anthropic.Tool[] = [
  // ── Ad Set controls ──────────────────────────────────────────────────────
  {
    name: "pause_ad_set",
    description: "Pause an ad set in Meta Ads Manager",
    input_schema: {
      type: "object" as const,
      properties: { ad_set_id: { type: "string", description: "The Meta ad set ID to pause" } },
      required: ["ad_set_id"],
    },
  },
  {
    name: "enable_ad_set",
    description: "Enable/unpause an ad set in Meta Ads Manager",
    input_schema: {
      type: "object" as const,
      properties: { ad_set_id: { type: "string", description: "The Meta ad set ID to enable" } },
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
        new_daily_budget: { type: "number", description: "New daily budget in USD (e.g. 50 = $50/day)" },
      },
      required: ["ad_set_id", "new_daily_budget"],
    },
  },
  // ── Campaign controls ────────────────────────────────────────────────────
  {
    name: "pause_campaign",
    description: "Pause an entire campaign in Meta Ads Manager",
    input_schema: {
      type: "object" as const,
      properties: { campaign_id: { type: "string", description: "The Meta campaign ID to pause" } },
      required: ["campaign_id"],
    },
  },
  {
    name: "enable_campaign",
    description: "Enable/unpause a campaign in Meta Ads Manager",
    input_schema: {
      type: "object" as const,
      properties: { campaign_id: { type: "string", description: "The Meta campaign ID to enable" } },
      required: ["campaign_id"],
    },
  },
  {
    name: "scale_campaign_budget",
    description: "Change the daily budget of a campaign (for CBO / Advantage Campaign Budget campaigns)",
    input_schema: {
      type: "object" as const,
      properties: {
        campaign_id: { type: "string" },
        new_daily_budget: { type: "number", description: "New daily budget in USD" },
      },
      required: ["campaign_id", "new_daily_budget"],
    },
  },
  // ── Ad controls ──────────────────────────────────────────────────────────
  {
    name: "pause_ad",
    description: "Pause a specific ad in Meta Ads Manager",
    input_schema: {
      type: "object" as const,
      properties: { ad_id: { type: "string", description: "The Meta ad ID to pause" } },
      required: ["ad_id"],
    },
  },
  {
    name: "enable_ad",
    description: "Enable/unpause a specific ad in Meta Ads Manager",
    input_schema: {
      type: "object" as const,
      properties: { ad_id: { type: "string", description: "The Meta ad ID to enable" } },
      required: ["ad_id"],
    },
  },
  {
    name: "delete_ad",
    description: "Permanently delete (kill) a specific ad in Meta Ads Manager. This cannot be undone.",
    input_schema: {
      type: "object" as const,
      properties: { ad_id: { type: "string", description: "The Meta ad ID to delete" } },
      required: ["ad_id"],
    },
  },
  // ── Campaign creation ────────────────────────────────────────────────────
  {
    name: "create_ad_campaign",
    description: "Create a complete Meta ad campaign (campaign + ad set + ad creative + ad) from scratch, all set to PAUSED for review before launch. Use this when the user provides their industry, target audience, location, budget, creative, and landing page.",
    input_schema: {
      type: "object" as const,
      properties: {
        industry: { type: "string", description: "Industry or offer type, e.g. 'Final expense life insurance'" },
        target_avatar: { type: "string", description: "Description of the target audience, e.g. 'Seniors 65-80, homeowners concerned about end-of-life expenses'" },
        locations: {
          type: "array",
          items: { type: "string" },
          description: "ISO 2-letter country codes, e.g. ['US'] or ['US', 'CA']",
        },
        daily_budget_usd: { type: "number", description: "Daily budget in USD, e.g. 50" },
        creative_url: { type: "string", description: "Public URL to the ad image (jpg/png) or the image_hash from a prior upload" },
        destination_url: { type: "string", description: "Landing page URL where clicks will go" },
        page_id: { type: "string", description: "Facebook Page ID to use for the ad. Optional if META_PAGE_ID env var is set." },
        objective: {
          type: "string",
          enum: ["LEADS", "TRAFFIC", "SALES"],
          description: "Campaign objective. Default: LEADS",
        },
        age_min: { type: "number", description: "Minimum age for targeting. Default: 25" },
        age_max: { type: "number", description: "Maximum age for targeting. Default: 65" },
      },
      required: ["industry", "target_avatar", "locations", "daily_budget_usd", "creative_url", "destination_url"],
    },
  },
];

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  clientInfo?: { meta_ad_account_id?: string }
): Promise<string> {

  // ── Ad set ────────────────────────────────────────────────────────────────
  if (name === "pause_ad_set") {
    const r = await pauseAdSet(input.ad_set_id as string);
    return r.ok ? `Paused ad set ${input.ad_set_id}.` : `Failed: ${r.error}`;
  }

  if (name === "enable_ad_set") {
    const url = new URL(`https://graph.facebook.com/v21.0/${input.ad_set_id}`);
    url.searchParams.set("access_token", process.env.META_ACCESS_TOKEN!);
    const res = await fetch(url.toString(), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }), cache: "no-store",
    });
    const data = await res.json();
    return res.ok && !data.error
      ? `Enabled ad set ${input.ad_set_id}.`
      : `Failed: ${data.error?.message ?? res.status}`;
  }

  if (name === "scale_ad_set_budget") {
    const cents = Math.round((input.new_daily_budget as number) * 100);
    const r = await scaleAdSet(input.ad_set_id as string, cents);
    return r.ok
      ? `Updated ad set ${input.ad_set_id} daily budget to $${(cents / 100).toFixed(2)}.`
      : `Failed: ${r.error}`;
  }

  // ── Campaign ──────────────────────────────────────────────────────────────
  if (name === "pause_campaign") {
    const r = await pauseCampaign(input.campaign_id as string);
    return r.ok ? `Paused campaign ${input.campaign_id}.` : `Failed: ${r.error}`;
  }

  if (name === "enable_campaign") {
    const r = await enableCampaign(input.campaign_id as string);
    return r.ok ? `Enabled campaign ${input.campaign_id}.` : `Failed: ${r.error}`;
  }

  if (name === "scale_campaign_budget") {
    const cents = Math.round((input.new_daily_budget as number) * 100);
    const r = await scaleCampaignBudget(input.campaign_id as string, cents);
    return r.ok
      ? `Updated campaign ${input.campaign_id} daily budget to $${(cents / 100).toFixed(2)}.`
      : `Failed: ${r.error}`;
  }

  // ── Ad ────────────────────────────────────────────────────────────────────
  if (name === "pause_ad") {
    const r = await pauseAd(input.ad_id as string);
    return r.ok ? `Paused ad ${input.ad_id}.` : `Failed: ${r.error}`;
  }

  if (name === "enable_ad") {
    const r = await enableAd(input.ad_id as string);
    return r.ok ? `Enabled ad ${input.ad_id}.` : `Failed: ${r.error}`;
  }

  if (name === "delete_ad") {
    const r = await deleteAd(input.ad_id as string);
    return r.ok ? `Deleted ad ${input.ad_id}. This cannot be undone.` : `Failed: ${r.error}`;
  }

  // ── Campaign creation ─────────────────────────────────────────────────────
  if (name === "create_ad_campaign") {
    const {
      industry, target_avatar, locations, daily_budget_usd,
      creative_url, destination_url, objective = "LEADS",
      age_min = 25, age_max = 65,
    } = input;

    // Resolve page ID
    const pageId = (input.page_id as string | undefined)
      ?? process.env.META_PAGE_ID
      ?? "";
    if (!pageId) {
      return "I need your Facebook Page ID to create the ad creative. Please provide it (e.g. 'My page ID is 123456789') or set META_PAGE_ID in your environment.";
    }

    // Resolve ad account ID
    const adAccountId = clientInfo?.meta_ad_account_id
      ?? process.env.META_AD_ACCOUNT_ID
      ?? "";
    if (!adAccountId) {
      return "No Meta Ad Account ID found. Make sure a client is selected or META_AD_ACCOUNT_ID is set.";
    }

    // Generate ad copy with Claude
    let copy = { headline: "", primary_text: "", description: "", cta_type: "LEARN_MORE" };
    try {
      const copyRes = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 400,
        system: "You write concise, high-converting Meta ad copy. Respond ONLY with valid JSON, no markdown.",
        messages: [{
          role: "user",
          content: `Industry: ${industry}\nTarget avatar: ${target_avatar}\nObjective: ${objective}\n\nGenerate ad copy as JSON:\n{"headline":"<30 chars>","primary_text":"<150 chars>","description":"<30 chars>","cta_type":"LEARN_MORE"|"GET_QUOTE"|"SIGN_UP"|"APPLY_NOW"|"CONTACT_US"|"SHOP_NOW"}`,
        }],
      });
      const raw = (copyRes.content.find(b => b.type === "text") as Anthropic.TextBlock | undefined)?.text ?? "{}";
      copy = { ...copy, ...JSON.parse(raw) };
    } catch {
      copy.headline = String(industry).slice(0, 30);
      copy.primary_text = `Looking for help with ${industry}? ${target_avatar}. Contact us today.`;
    }

    // Determine if creative_url is already a hash (no dots, alphanumeric)
    const isHash = /^[a-f0-9]{32}$/i.test(creative_url as string);
    const objectiveMap: Record<string, { obj: "OUTCOME_LEADS" | "OUTCOME_TRAFFIC" | "OUTCOME_SALES"; goal: "LEAD_GENERATION" | "LINK_CLICKS" | "OFFSITE_CONVERSIONS" }> = {
      LEADS: { obj: "OUTCOME_LEADS", goal: "LEAD_GENERATION" },
      TRAFFIC: { obj: "OUTCOME_TRAFFIC", goal: "LINK_CLICKS" },
      SALES: { obj: "OUTCOME_SALES", goal: "OFFSITE_CONVERSIONS" },
    };
    const { obj, goal } = objectiveMap[String(objective).toUpperCase()] ?? objectiveMap.LEADS;
    const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const result = await createMetaCampaign({
      adAccountId,
      pageId,
      campaignName: `${industry} — ${date}`,
      adSetName: `${target_avatar} · ${(locations as string[]).join(", ")}`,
      adName: copy.headline || "Ad 1",
      objective: obj,
      optimizationGoal: goal,
      billingEvent: "IMPRESSIONS",
      dailyBudgetCents: Math.round((daily_budget_usd as number) * 100),
      locations: locations as string[],
      ageMin: age_min as number,
      ageMax: age_max as number,
      imageHash: isHash ? (creative_url as string) : undefined,
      imageUrl: isHash ? undefined : (creative_url as string),
      primaryText: copy.primary_text,
      headline: copy.headline,
      description: copy.description,
      ctaType: copy.cta_type,
      destinationUrl: destination_url as string,
    });

    if (!result.ok) return `Failed to create campaign: ${result.error}`;

    const d = result.data;
    return [
      `Campaign created successfully — all set to PAUSED for your review.`,
      ``,
      `**Campaign ID:** ${d.campaign_id}`,
      `**Ad Set ID:** ${d.adset_id}`,
      `**Ad ID:** ${d.ad_id}`,
      ``,
      `**Generated Copy:**`,
      `Headline: ${copy.headline}`,
      `Primary text: ${copy.primary_text}`,
      `CTA: ${copy.cta_type}`,
      ``,
      `Review in Meta Ads Manager, then activate when ready.`,
    ].join("\n");
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

  // Pull live context
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

  const systemPrompt = `You are the Buena Onda AI — an expert Meta ads analyst, strategist, and operator embedded in the Buena Onda dashboard. You help agency owners and media buyers make smart decisions and take direct action on their Meta ad accounts.

You have a direct, knowledgeable communication style. No fluff, no filler. Real recommendations backed by data.

**ACTIONS YOU CAN TAKE:**
- Pause, enable, or scale budgets at the **campaign**, **ad set**, or **ad** level
- Permanently delete (kill) individual ads
- Create complete new campaigns from scratch — all set to PAUSED for review

When the user asks you to take an action, confirm the ID you're acting on before executing. For destructive actions (delete_ad), confirm explicitly with the user first.

**CAMPAIGN CREATION:**
To create a campaign, you need:
1. Industry / offer type
2. Target avatar (who they're selling to)
3. Locations (country codes like "US")
4. Daily budget ($)
5. Creative — image URL or image_hash from an upload
6. Destination URL (landing page)
7. Objective (LEADS, TRAFFIC, or SALES — default: LEADS)

You'll generate the ad copy automatically. All campaigns are created PAUSED so the user reviews before going live.

${clientInfo ? `
CURRENT CLIENT:
- Name: ${clientInfo.name}
- Vertical: ${clientInfo.vertical}
- Meta Ad Account: ${clientInfo.meta_ad_account_id}
` : ""}

${recentMetrics.length > 0 ? `
LIVE CAMPAIGN DATA (last 7 days):
${JSON.stringify(recentMetrics, null, 2)}
` : "No campaign data available."}

${recentActions.length > 0 ? `
RECENT AGENT ACTIONS:
${JSON.stringify(recentActions, null, 2)}
` : ""}

${recentLearnings.length > 0 ? `
ACTIVE LEARNED RULES:
${JSON.stringify(recentLearnings, null, 2)}
` : ""}

Keep responses concise and actionable. Use numbers when you have them.`;

  const apiMessages: Anthropic.MessageParam[] = messages.map((m: Message) => ({
    role: m.role,
    content: m.content,
  }));

  let response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
    system: systemPrompt,
    tools: TOOLS,
    messages: apiMessages,
  });

  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        const result = await executeTool(
          block.name,
          block.input as Record<string, unknown>,
          clientInfo
        );
        return { type: "tool_result" as const, tool_use_id: block.id, content: result };
      })
    );

    response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
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
