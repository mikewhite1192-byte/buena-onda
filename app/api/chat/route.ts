// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { neon } from "@neondatabase/serverless";
import {
  pauseAdSet, scaleAdSet,
  pauseCampaign, enableCampaign, scaleCampaignBudget,
  pauseAd, enableAd, deleteAd,
  createMetaCampaign, listLeadForms, resolveGeoLocations,
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
  // ── Lead forms ────────────────────────────────────────────────────────────
  {
    name: "list_lead_forms",
    description: "List all instant lead forms (lead gen forms) attached to the Facebook Page. Use this before creating a lead gen campaign so the user can pick their form.",
    input_schema: {
      type: "object" as const,
      properties: {
        page_id: { type: "string", description: "Facebook Page ID. Optional if META_PAGE_ID env var is set." },
      },
      required: [],
    },
  },
  // ── Campaign creation ────────────────────────────────────────────────────
  {
    name: "create_ad_campaign",
    description: "Create a complete Meta ad campaign (campaign + ad set + ad creative + ad), all PAUSED for review. Supports lead gen (instant forms), traffic, and sales objectives. Supports state/region-level targeting and special ad categories.",
    input_schema: {
      type: "object" as const,
      properties: {
        industry: { type: "string", description: "Industry or offer type, e.g. 'Final expense life insurance'" },
        target_avatar: { type: "string", description: "Description of the target audience" },
        locations: {
          type: "array",
          items: { type: "string" },
          description: "Countries (2-letter codes like 'US') OR US state/region names like 'Texas', 'Florida'. Mix is fine.",
        },
        daily_budget_usd: { type: "number", description: "Daily budget in USD" },
        creative_url: { type: "string", description: "Public image URL or image_hash from a prior upload" },
        destination_url: { type: "string", description: "Landing page URL. Required for TRAFFIC/SALES. Omit for lead gen." },
        lead_form_id: { type: "string", description: "Instant form ID for lead gen campaigns. Use list_lead_forms to get available forms." },
        page_id: { type: "string", description: "Facebook Page ID. Optional if META_PAGE_ID env var is set." },
        objective: {
          type: "string",
          enum: ["LEADS", "TRAFFIC", "SALES"],
          description: "Campaign objective. Default: LEADS",
        },
        special_ad_categories: {
          type: "array",
          items: { type: "string" },
          description: "Required for regulated industries. Options: FINANCIAL_PRODUCTS_SERVICES, CREDIT, EMPLOYMENT, HOUSING, ISSUES_ELECTIONS_POLITICS. Age/gender targeting is automatically removed when set.",
        },
        age_min: { type: "number", description: "Min age. Ignored for special ad category campaigns." },
        age_max: { type: "number", description: "Max age. Ignored for special ad category campaigns." },
      },
      required: ["industry", "target_avatar", "locations", "daily_budget_usd", "creative_url"],
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

  // ── List lead forms ───────────────────────────────────────────────────────
  if (name === "list_lead_forms") {
    const pageId = (input.page_id as string | undefined) ?? process.env.META_PAGE_ID ?? "";
    if (!pageId) return "No page ID available. Provide it or set META_PAGE_ID.";
    const r = await listLeadForms(pageId);
    if (!r.ok) return `Failed to fetch lead forms: ${r.error}`;
    if (r.data.length === 0) return "No instant forms found on this page. Create one in Meta Ads Manager under your Page → Instant Forms.";
    return r.data.map(f => `- **${f.name}** (ID: ${f.id}) — ${f.status}`).join("\n");
  }

  // ── Campaign creation ─────────────────────────────────────────────────────
  if (name === "create_ad_campaign") {
    const {
      industry, target_avatar, locations, daily_budget_usd,
      creative_url, destination_url, lead_form_id,
      objective = "LEADS", age_min = 25, age_max = 65,
      special_ad_categories,
    } = input;

    const pageId = (input.page_id as string | undefined) ?? process.env.META_PAGE_ID ?? "";
    if (!pageId) return "I need your Facebook Page ID. Provide it or set META_PAGE_ID in your environment.";

    const adAccountId = clientInfo?.meta_ad_account_id ?? process.env.META_AD_ACCOUNT_ID ?? "";
    if (!adAccountId) return "No Meta Ad Account ID found. Select a client or set META_AD_ACCOUNT_ID.";

    const isLeadGen = !!lead_form_id;
    if (!isLeadGen && !destination_url) {
      return "Please provide either a `lead_form_id` (for instant form campaigns) or a `destination_url` (for traffic/sales campaigns).";
    }

    // Resolve geo locations — handles country codes AND state/region names
    const rawLocations = locations as string[];
    const { countries, regionKeys } = await resolveGeoLocations(rawLocations);

    // Generate ad copy
    const specialCats = (special_ad_categories as string[] | undefined) ?? [];
    let copy = { headline: "", primary_text: "", description: "", cta_type: isLeadGen ? "SIGN_UP" : "LEARN_MORE" };
    try {
      const copyRes = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 400,
        system: "You write concise, high-converting Meta ad copy. Respond ONLY with valid JSON, no markdown.",
        messages: [{
          role: "user",
          content: `Industry: ${industry}\nTarget: ${target_avatar}\nObjective: ${objective}${isLeadGen ? " (lead form — no URL)" : ""}\n\nJSON:\n{"headline":"<30 chars>","primary_text":"<150 chars>","description":"<30 chars>","cta_type":"${isLeadGen ? "SIGN_UP" : "LEARN_MORE"}"|"GET_QUOTE"|"APPLY_NOW"|"CONTACT_US"}`,
        }],
      });
      const raw = (copyRes.content.find(b => b.type === "text") as Anthropic.TextBlock | undefined)?.text ?? "{}";
      copy = { ...copy, ...JSON.parse(raw) };
    } catch {
      copy.headline = String(industry).slice(0, 30);
      copy.primary_text = `${target_avatar}. Get your free quote today.`;
    }

    const isHash = /^[a-f0-9]{32}$/i.test(creative_url as string);
    const objectiveMap: Record<string, { obj: "OUTCOME_LEADS" | "OUTCOME_TRAFFIC" | "OUTCOME_SALES"; goal: "LEAD_GENERATION" | "LINK_CLICKS" | "OFFSITE_CONVERSIONS" }> = {
      LEADS: { obj: "OUTCOME_LEADS", goal: "LEAD_GENERATION" },
      TRAFFIC: { obj: "OUTCOME_TRAFFIC", goal: "LINK_CLICKS" },
      SALES: { obj: "OUTCOME_SALES", goal: "OFFSITE_CONVERSIONS" },
    };
    const { obj, goal } = objectiveMap[String(objective).toUpperCase()] ?? objectiveMap.LEADS;
    const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const locationLabel = rawLocations.join(", ");

    const result = await createMetaCampaign({
      adAccountId,
      pageId,
      campaignName: `${industry} — ${date}`,
      adSetName: `${target_avatar} · ${locationLabel}`,
      adName: copy.headline || "Ad 1",
      objective: obj,
      optimizationGoal: goal,
      billingEvent: "IMPRESSIONS",
      dailyBudgetCents: Math.round((daily_budget_usd as number) * 100),
      countries: countries.length ? countries : undefined,
      regionKeys: regionKeys.length ? regionKeys : undefined,
      ageMin: age_min as number,
      ageMax: age_max as number,
      imageHash: isHash ? (creative_url as string) : undefined,
      imageUrl: isHash ? undefined : (creative_url as string),
      primaryText: copy.primary_text,
      headline: copy.headline,
      description: copy.description,
      ctaType: copy.cta_type,
      destinationUrl: destination_url as string | undefined,
      leadFormId: lead_form_id as string | undefined,
      specialAdCategories: specialCats.length ? specialCats : undefined,
    });

    if (!result.ok) return `Failed to create campaign: ${result.error}`;

    const d = result.data;
    return [
      `Campaign created — all PAUSED for your review.`,
      ``,
      `**Campaign ID:** ${d.campaign_id}`,
      `**Ad Set ID:** ${d.adset_id}`,
      `**Ad ID:** ${d.ad_id}`,
      specialCats.length ? `**Special Category:** ${specialCats.join(", ")}` : "",
      isLeadGen ? `**Form:** ${lead_form_id}` : `**Destination:** ${destination_url}`,
      `**Geo:** ${regionKeys.length ? regionKeys.map(r => r.name).join(", ") : countries.join(", ")}`,
      ``,
      `**Copy:**`,
      `Headline: ${copy.headline}`,
      `Primary text: ${copy.primary_text}`,
      `CTA: ${copy.cta_type}`,
      ``,
      `Review in Meta Ads Manager, then activate when ready.`,
    ].filter(Boolean).join("\n");
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
To create a campaign you need: industry, target avatar, locations, daily budget, creative (URL or image_hash), and either a destination URL (traffic/sales) OR a lead_form_id (instant form lead gen).

For lead gen campaigns: first call list_lead_forms so the user can pick their form ID.

Locations accept country codes ("US") OR state/region names ("Texas", "Florida", "Michigan") — mix is fine.

For regulated industries (insurance, financial, housing, employment) always set special_ad_categories — e.g. ["FINANCIAL_PRODUCTS_SERVICES"]. This removes age/gender targeting restrictions automatically.

You generate the ad copy. All campaigns created PAUSED for review before going live.

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
