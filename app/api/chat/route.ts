// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { neon } from "@neondatabase/serverless";
import {
  pauseAdSet, scaleAdSet,
  pauseCampaign, enableCampaign, scaleCampaignBudget,
  pauseAd, enableAd, deleteAd,
  createMetaCampaign, addAdToAdSet, listCampaignsWithAdSets,
  listLeadForms, resolveGeoLocations,
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
    description: "List all instant lead forms attached to the Facebook Page. ALWAYS call this automatically whenever the user mentions a lead form, lead gen objective, or says they want to use an existing form — never ask the user to find the ID themselves.",
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
    name: "list_campaigns",
    description: "List all active/paused campaigns and their ad sets for the current client. Call this first when the user wants to create a new ad, so they can choose to add it to an existing campaign/ad set or create a brand new campaign.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "create_ad_campaign",
    description: "Create a Meta ad (PAUSED for review). If existing_adset_id is provided, adds a new ad to that ad set only — no new campaign or ad set is created. Otherwise creates a full new campaign + ad set + ad.",
    input_schema: {
      type: "object" as const,
      properties: {
        existing_adset_id: { type: "string", description: "If the user chose an existing ad set, pass its ID here. This skips campaign/adset creation and adds the ad directly to this ad set." },
        industry: { type: "string", description: "Industry or offer type, e.g. 'Final expense life insurance'" },
        target_avatar: { type: "string", description: "Description of the target audience" },
        locations: {
          type: "array",
          items: { type: "string" },
          description: "Countries (2-letter codes like 'US') OR US state/region names like 'Texas', 'Florida'. Mix is fine.",
        },
        daily_budget_usd: { type: "number", description: "Daily budget in USD. Only used when creating a new campaign. Ignored if existing_adset_id is provided." },
        creative_url: { type: "string", description: "Image: public URL or image_hash from 📎 upload. Video: public URL ending in .mp4/.mov/.avi (must be publicly accessible)." },
        destination_url: { type: "string", description: "Landing page or website URL. ALWAYS required — Meta requires an external URL even for lead gen ads. Never omit this." },
        lead_form_id: { type: "string", description: "Instant form ID for lead gen campaigns. Use list_lead_forms to get available forms." },
        page_id: { type: "string", description: "Facebook Page ID. Optional if META_PAGE_ID env var is set." },
        objective: {
          type: "string",
          enum: ["LEADS", "TRAFFIC", "SALES"],
          description: "Campaign objective. Default: LEADS. Only used when creating a new campaign.",
        },
        special_ad_categories: {
          type: "array",
          items: { type: "string" },
          description: "Required for regulated industries. Options: FINANCIAL_PRODUCTS_SERVICES, CREDIT, EMPLOYMENT, HOUSING, ISSUES_ELECTIONS_POLITICS. Age/gender targeting is automatically removed when set.",
        },
        age_min: { type: "number", description: "Min age. Ignored for special ad category campaigns." },
        age_max: { type: "number", description: "Max age. Ignored for special ad category campaigns." },
        headline: { type: "string", description: "Ad headline (agreed upon with user). Max 40 chars." },
        primary_text: { type: "string", description: "Ad primary text (agreed upon with user). Max 150 chars." },
      },
      required: ["industry", "creative_url"],
    },
  },
  // ── Client memory ─────────────────────────────────────────────────────────
  {
    name: "save_client_rule",
    description: "Save a rule, preference, or strategy for the current client. Call this whenever the user tells you something like 'for this client we never go above $X', 'always use broad targeting', 'pause on weekends', or any other standing instruction they want remembered.",
    input_schema: {
      type: "object" as const,
      properties: {
        rule_text: { type: "string", description: "The rule or preference in plain English, as stated by the user. Keep it concise and clear." },
        category: {
          type: "string",
          enum: ["budget", "targeting", "creative", "strategy", "schedule", "general"],
          description: "Category that best describes this rule.",
        },
      },
      required: ["rule_text"],
    },
  },
  {
    name: "delete_client_rule",
    description: "Remove a previously saved rule for the current client. Use when the user says to forget or remove a rule.",
    input_schema: {
      type: "object" as const,
      properties: {
        rule_id: { type: "string", description: "The UUID of the rule to delete." },
      },
      required: ["rule_id"],
    },
  },
];

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  clientInfo?: { meta_ad_account_id?: string; meta_page_id?: string; meta_access_token?: string },
  imageHash?: string | null,
  context?: { userId?: string; clientId?: string },
): Promise<string> {
  // ── Client memory ─────────────────────────────────────────────────────────
  if (name === "save_client_rule") {
    if (!context?.userId || !context?.clientId) return "No client selected — cannot save rule.";
    const ruleText = (input.rule_text as string)?.trim();
    const category = (input.category as string) ?? "general";
    if (!ruleText) return "No rule text provided.";
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS client_rules (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_id text NOT NULL, client_id text NOT NULL,
          rule_text text NOT NULL, category text NOT NULL DEFAULT 'general',
          is_active boolean NOT NULL DEFAULT true, source text NOT NULL DEFAULT 'chat',
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`
        INSERT INTO client_rules (owner_id, client_id, rule_text, category, source)
        VALUES (${context.userId}, ${context.clientId}, ${ruleText}, ${category}, 'chat')
      `;
      return `Saved rule: "${ruleText}"`;
    } catch (err) {
      return `Failed to save rule: ${err instanceof Error ? err.message : "unknown error"}`;
    }
  }

  if (name === "delete_client_rule") {
    if (!context?.userId || !context?.clientId) return "No client selected.";
    const ruleId = input.rule_id as string;
    if (!ruleId) return "No rule_id provided.";
    try {
      await sql`
        UPDATE client_rules SET is_active = false
        WHERE id = ${ruleId}::uuid AND client_id = ${context.clientId} AND owner_id = ${context.userId}
      `;
      return `Rule removed.`;
    } catch {
      return "Failed to remove rule.";
    }
  }
  const metaToken = clientInfo?.meta_access_token ?? process.env.META_ACCESS_TOKEN;

  // ── Ad set ────────────────────────────────────────────────────────────────
  if (name === "pause_ad_set") {
    const r = await pauseAdSet(input.ad_set_id as string, metaToken);
    return r.ok ? `Paused ad set ${input.ad_set_id}.` : `Failed: ${r.error}`;
  }

  if (name === "enable_ad_set") {
    const r = await enableAd(input.ad_set_id as string, metaToken);
    return r.ok ? `Enabled ad set ${input.ad_set_id}.` : `Failed: ${r.error}`;
  }

  if (name === "scale_ad_set_budget") {
    const cents = Math.round((input.new_daily_budget as number) * 100);
    const r = await scaleAdSet(input.ad_set_id as string, cents, metaToken);
    return r.ok
      ? `Updated ad set ${input.ad_set_id} daily budget to $${(cents / 100).toFixed(2)}.`
      : `Failed: ${r.error}`;
  }

  // ── Campaign ──────────────────────────────────────────────────────────────
  if (name === "pause_campaign") {
    const r = await pauseCampaign(input.campaign_id as string, metaToken);
    return r.ok ? `Paused campaign ${input.campaign_id}.` : `Failed: ${r.error}`;
  }

  if (name === "enable_campaign") {
    const r = await enableCampaign(input.campaign_id as string, metaToken);
    return r.ok ? `Enabled campaign ${input.campaign_id}.` : `Failed: ${r.error}`;
  }

  if (name === "scale_campaign_budget") {
    const cents = Math.round((input.new_daily_budget as number) * 100);
    const r = await scaleCampaignBudget(input.campaign_id as string, cents, metaToken);
    return r.ok
      ? `Updated campaign ${input.campaign_id} daily budget to $${(cents / 100).toFixed(2)}.`
      : `Failed: ${r.error}`;
  }

  // ── Ad ────────────────────────────────────────────────────────────────────
  if (name === "pause_ad") {
    const r = await pauseAd(input.ad_id as string, metaToken);
    return r.ok ? `Paused ad ${input.ad_id}.` : `Failed: ${r.error}`;
  }

  if (name === "enable_ad") {
    const r = await enableAd(input.ad_id as string, metaToken);
    return r.ok ? `Enabled ad ${input.ad_id}.` : `Failed: ${r.error}`;
  }

  if (name === "delete_ad") {
    const r = await deleteAd(input.ad_id as string, metaToken);
    return r.ok ? `Deleted ad ${input.ad_id}. This cannot be undone.` : `Failed: ${r.error}`;
  }

  // ── List lead forms ───────────────────────────────────────────────────────
  if (name === "list_lead_forms") {
    let pageId = ((input.page_id as string | undefined) ?? clientInfo?.meta_page_id ?? process.env.META_PAGE_ID ?? "").trim();

    // Auto-resolve page ID from the ad account if not explicitly set
    let pageResolveError = "";
    if (!pageId && clientInfo?.meta_ad_account_id) {
      try {
        const acct = clientInfo.meta_ad_account_id.startsWith("act_") ? clientInfo.meta_ad_account_id : `act_${clientInfo.meta_ad_account_id}`;
        const url = new URL(`https://graph.facebook.com/v21.0/${acct}/promote_pages`);
        url.searchParams.set("fields", "id,name");
        url.searchParams.set("access_token", metaToken ?? "");
        const res = await fetch(url.toString(), { cache: "no-store" });
        const data = await res.json();
        if (data?.error) pageResolveError = data.error.message ?? "Meta API error";
        else pageId = data?.data?.[0]?.id ?? "";
      } catch (e) {
        pageResolveError = e instanceof Error ? e.message : String(e);
      }
    }

    if (!pageId) {
      const detail = pageResolveError ? ` Meta says: "${pageResolveError}"` : "";
      return `Couldn't find a Facebook Page for this ad account.${detail} You may need to refresh your access token in the .env file (META_ACCESS_TOKEN). Alternatively, save the Page ID in Clients settings.`;
    }
    const r = await listLeadForms(pageId, metaToken);
    if (!r.ok) {
      // leads_retrieval permission missing — fall back to scraping form IDs from existing ads
      const adAccountId = clientInfo?.meta_ad_account_id ?? process.env.META_AD_ACCOUNT_ID ?? "";
      if (adAccountId) {
        try {
          const acct = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
          const url = new URL(`https://graph.facebook.com/v21.0/${acct}/ads`);
          url.searchParams.set("fields", "id,name,creative{object_story_spec}");
          url.searchParams.set("filtering", JSON.stringify([{ field: "effective_status", operator: "IN", value: ["ACTIVE", "PAUSED"] }]));
          url.searchParams.set("limit", "50");
          url.searchParams.set("access_token", metaToken ?? "");
          const res = await fetch(url.toString(), { cache: "no-store" });
          const data = await res.json();
          const formIds = new Map<string, string>();
          for (const ad of data?.data ?? []) {
            const formId = ad?.creative?.object_story_spec?.link_data?.call_to_action?.value?.lead_gen_form_id;
            if (formId) formIds.set(formId, ad.name);
          }
          if (formIds.size > 0) {
            const lines = [...formIds.entries()].map(([id, adName]) => `- Form ID: **${id}** (seen on ad: ${adName})`);
            return `Found lead form IDs from existing ads:\n\n${lines.join("\n")}\n\nWhich form would you like to use?`;
          }
        } catch { /* fall through */ }
      }
      return `Failed to fetch lead forms: ${r.error}. The token may be missing the leads_retrieval permission. You can regenerate it at developers.facebook.com/tools/explorer with that permission checked.`;
    }
    if (r.data.length === 0) return "No instant forms found on this page. Create one in Meta Ads Manager under your Page → Instant Forms.";
    return r.data.map(f => `- **${f.name}** (ID: ${f.id}) — ${f.status}`).join("\n");
  }

  // ── List campaigns ────────────────────────────────────────────────────────
  if (name === "list_campaigns") {
    const adAccountId = clientInfo?.meta_ad_account_id ?? process.env.META_AD_ACCOUNT_ID ?? "";
    if (!adAccountId) return "No Meta Ad Account ID found. Select a client or set META_AD_ACCOUNT_ID.";
    const r = await listCampaignsWithAdSets(adAccountId, metaToken);
    if (!r.ok) return `Failed to fetch campaigns: ${r.error}`;
    if (r.data.length === 0) return "No active or paused campaigns found. You'll need to create a new campaign.";
    const lines = r.data.map(c => {
      const adsetLines = c.adsets.map(a => `  - Ad Set: **${a.adset_name}** (ID: ${a.adset_id}) — ${a.status} — $${(a.daily_budget_cents / 100).toFixed(0)}/day`).join("\n");
      return `**${c.campaign_name}** (ID: ${c.campaign_id}) — ${c.status}\n${adsetLines || "  (no ad sets)"}`;
    });
    return `Here are the current campaigns:\n\n${lines.join("\n\n")}\n\nWould you like to add the new ad to one of these existing ad sets, or create a brand new campaign?`;
  }

  // ── Campaign creation ─────────────────────────────────────────────────────
  if (name === "create_ad_campaign") {
    const {
      industry, target_avatar, locations, daily_budget_usd,
      destination_url, lead_form_id,
      objective = "LEADS", age_min = 25, age_max = 65,
      special_ad_categories,
      existing_adset_id,
    } = input;
    // Use uploaded image hash from request if Claude didn't pass creative_url
    const creative_url = (input.creative_url as string | undefined) ?? imageHash ?? "";

    if (!creative_url) {
      return "No creative found. Please upload an image using the 📎 button and try again — keep the preview visible until the campaign is created.";
    }

    const pageId = ((input.page_id as string | undefined) ?? clientInfo?.meta_page_id ?? process.env.META_PAGE_ID ?? "").trim();
    if (!pageId) return "I need your Facebook Page ID. You can add it to your client profile under Settings → Clients.";

    const adAccountId = clientInfo?.meta_ad_account_id ?? process.env.META_AD_ACCOUNT_ID ?? "";
    if (!adAccountId) return "No Meta Ad Account ID found. Select a client or set META_AD_ACCOUNT_ID.";

    const isLeadGen = !!lead_form_id;
    if (!destination_url) {
      return "destination_url is required for all ad types — Meta needs an external website URL even for lead gen ads. Please provide the landing page or homepage URL.";
    }

    const specialCats = (special_ad_categories as string[] | undefined) ?? [];
    const creativeStr = creative_url as string;
    const isHash = /^[a-f0-9]{32}$/i.test(creativeStr);
    const isVideo = !isHash && /\.(mp4|mov|avi|mkv|webm)(\?|$)/i.test(creativeStr);

    // Use copy agreed upon in conversation; fall back to AI-generated only if not provided
    const agreedHeadline = (input.headline as string | undefined)?.trim() ?? "";
    const agreedPrimaryText = (input.primary_text as string | undefined)?.trim() ?? "";
    let copy = { headline: agreedHeadline, primary_text: agreedPrimaryText, description: "", cta_type: isLeadGen ? "SIGN_UP" : "LEARN_MORE" };

    if (!copy.headline || !copy.primary_text) {
      try {
        const copyRes = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 400,
          system: "You write concise, high-converting Meta ad copy. Respond ONLY with valid JSON, no markdown.",
          messages: [{
            role: "user",
            content: `Industry: ${industry}\nTarget: ${target_avatar ?? ""}\nObjective: ${objective}${isLeadGen ? " (lead form — no URL)" : ""}\n\nJSON:\n{"headline":"<30 chars>","primary_text":"<150 chars>","description":"<30 chars>","cta_type":"${isLeadGen ? "SIGN_UP" : "LEARN_MORE"}"|"GET_QUOTE"|"APPLY_NOW"|"CONTACT_US"}`,
          }],
        });
        const raw = (copyRes.content.find(b => b.type === "text") as Anthropic.TextBlock | undefined)?.text ?? "{}";
        copy = { ...copy, ...JSON.parse(raw) };
      } catch {
        copy.headline = copy.headline || String(industry).slice(0, 30);
        copy.primary_text = copy.primary_text || `Get your free quote today.`;
      }
    }

    // ── Path A: add ad to an existing ad set ──────────────────────────────
    if (existing_adset_id) {
      const result = await addAdToAdSet({
        adAccountId,
        adSetId: existing_adset_id as string,
        pageId,
        adName: copy.headline || "Ad 1",
        primaryText: copy.primary_text,
        headline: copy.headline,
        description: copy.description,
        ctaType: copy.cta_type,
        destinationUrl: destination_url as string | undefined,
        leadFormId: lead_form_id as string | undefined,
        imageHash: isHash ? creativeStr : undefined,
        imageUrl: !isHash && !isVideo ? creativeStr : undefined,
        videoUrl: isVideo ? creativeStr : undefined,
        token: metaToken,
      });

      if (!result.ok) return `TOOL ERROR — do not retry, do not offer workarounds. Tell the user exactly this: "Meta returned an error: ${result.error}"`;

      const d = result.data;
      return [
        `Ad added to existing ad set — PAUSED for your review.`,
        ``,
        `**Ad Set ID:** ${d.adset_id}`,
        `**Ad ID:** ${d.ad_id}`,
        ``,
        `**Copy:**`,
        `Headline: ${copy.headline}`,
        `Primary text: ${copy.primary_text}`,
        `CTA: ${copy.cta_type}`,
        ``,
        `Head to the Ads tab to review and approve when ready.`,
      ].filter(Boolean).join("\n");
    }

    // ── Path B: create a full new campaign ───────────────────────────────
    const rawLocations = (locations as string[] | undefined) ?? [];
    const { countries, regionKeys } = await resolveGeoLocations(rawLocations, metaToken);

    const objectiveUpper = String(objective).toUpperCase();
    const obj =
      objectiveUpper === "TRAFFIC" ? "OUTCOME_TRAFFIC" :
      objectiveUpper === "SALES"   ? "OUTCOME_SALES"   : "OUTCOME_LEADS";
    const goal =
      objectiveUpper === "TRAFFIC"  ? "LINK_CLICKS" :
      objectiveUpper === "SALES"    ? "OFFSITE_CONVERSIONS" :
      isLeadGen                     ? "LEAD_GENERATION" : "OFFSITE_CONVERSIONS";
    const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const locationLabel = rawLocations.join(", ");

    const result = await createMetaCampaign({
      adAccountId,
      pageId,
      pixelId: process.env.META_PIXEL_ID?.trim(),
      campaignName: `${industry} — ${date}`,
      adSetName: `${target_avatar ?? "Broad"} · ${locationLabel}`,
      adName: copy.headline || "Ad 1",
      objective: obj,
      optimizationGoal: goal,
      billingEvent: "IMPRESSIONS",
      dailyBudgetCents: Math.round(((daily_budget_usd as number) ?? 20) * 100),
      countries: countries.length ? countries : undefined,
      regionKeys: regionKeys.length ? regionKeys : undefined,
      ageMin: age_min as number,
      ageMax: age_max as number,
      imageHash: isHash ? creativeStr : undefined,
      imageUrl: !isHash && !isVideo ? creativeStr : undefined,
      videoUrl: isVideo ? creativeStr : undefined,
      primaryText: copy.primary_text,
      headline: copy.headline,
      description: copy.description,
      ctaType: copy.cta_type,
      destinationUrl: destination_url as string | undefined,
      leadFormId: lead_form_id as string | undefined,
      specialAdCategories: specialCats.length ? specialCats : undefined,
      token: metaToken,
    });

    if (!result.ok) return `TOOL ERROR — do not retry, do not offer workarounds. Tell the user exactly this: "Meta returned an error: ${result.error}"`;

    const d = result.data;
    return [
      `Campaign created — all PAUSED for your review.`,
      ``,
      `**Campaign ID:** ${d.campaign_id}`,
      `**Ad Set ID:** ${d.adset_id}`,
      `**Ad ID:** ${d.ad_id}`,
      specialCats.length ? `**Special Category:** ${specialCats.join(", ")}` : "",
      isLeadGen ? `**Form:** ${lead_form_id}` : `**Destination:** ${destination_url}`,
      rawLocations.length ? `**Geo:** ${regionKeys.length ? regionKeys.map(r => r.name).join(", ") : countries.join(", ")}` : "",
      ``,
      `**Copy:**`,
      `Headline: ${copy.headline}`,
      `Primary text: ${copy.primary_text}`,
      `CTA: ${copy.cta_type}`,
      ``,
      `Head to the Ads tab to review and approve when ready.`,
    ].filter(Boolean).join("\n");
  }

  return `Unknown tool: ${name}`;
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  "X-Accel-Buffering": "no",
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, clientId, adAccountId, imageHash, isOnboarding } = await req.json();

  if (!messages?.length) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  // Pull live context
  const [recentMetrics, recentActions, recentLearnings, client, clientRules] = await Promise.all([
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
      SELECT name, vertical, meta_ad_account_id, meta_page_id, meta_access_token FROM clients WHERE id = ${clientId} LIMIT 1
    ` : Promise.resolve([]),
    clientId ? sql`
      SELECT id, rule_text, category FROM client_rules
      WHERE client_id = ${clientId} AND owner_id = ${userId} AND is_active = true
      ORDER BY created_at DESC LIMIT 30
    `.catch(() => []) : Promise.resolve([]),
  ]);

  const clientInfo = client?.[0] as { name: string; vertical: string; meta_ad_account_id: string; meta_page_id?: string; meta_access_token?: string } | undefined;

  const encoder = new TextEncoder();
  function sseChunk(text: string) {
    return encoder.encode(`data: ${JSON.stringify({ text })}\n\n`);
  }
  const DONE_CHUNK = encoder.encode("data: [DONE]\n\n");

  if (isOnboarding) {
    const onboardingPrompt = `You are the Buena Onda AI — an expert Meta ads assistant and the first thing new users interact with. Your job is to excite them about what's possible, show them the platform's most powerful features, and then guide them through setup.

TONE: Confident, direct, exciting. Like a great agency operator showing a colleague a powerful new tool. No fluff, but genuine enthusiasm for what this can do.

YOUR ONBOARDING FLOW — follow this order naturally in conversation:

**STEP 1 — FEATURE TOUR (do this first, proactively)**
When a user first says hello or asks what this can do, walk them through these features one at a time, conversationally. Don't dump them all at once — reveal them naturally as the conversation flows.

The 7 most powerful features to cover:

1. **AI Campaign Builder** — "Tell me what you want to advertise in plain English. I'll ask a few questions, write the ad copy, set up the targeting, attach the creative, and create the full campaign in Meta — all paused for your review before anything goes live."

2. **Live Performance Dashboard** — "Every campaign, ad set, and individual ad updates in real time. Drill down from campaign level all the way to a single ad. See spend, leads, CPL, CTR, frequency, impressions — and pick exactly which columns matter to you."

3. **One-Command Optimization** — "Just tell me what to do: 'pause my worst ad set', 'scale my best campaign 20%', 'kill that ad'. I have live access to your data and I execute instantly. No logging into Ads Manager."

4. **Campaign Diagnostics** — "Ask me why your CPL is rising, why an ad is fatiguing, why a campaign stopped delivering. I'll analyze your data and give you a specific diagnosis — not generic advice. 'Your frequency hit 4.2 on that ad set — creative fatigue. Here's what to do next.'"

5. **Automated Reports** — "Set up weekly or monthly reports per client. They're generated automatically and sent to you (or your client) by email. Or ask me anytime — 'send me a report for [client] this week' — and I'll generate a full performance snapshot instantly. PDF export coming soon."

6. **Multi-Client Agency Overview** — "The dashboard shows every client at once with live status flags. If a client's CPL spikes or they're spending with no leads, you see it the moment you log in — no digging."

7. **Creative Upload in Chat** — "Hit the 📎 button, upload your image, and tell me to build a campaign around it. I'll use that exact creative. For video, just paste a public URL."

**STEP 2 — SETUP GUIDE**
After the feature tour (or when they're ready), guide them through:
1. Click "Clients" in the top nav → Add a client
2. Enter the client name — that's the only required field to start
3. Hit "Connect Facebook" on the client card — this gives the AI access to their ad account
4. You'll need: Meta Ad Account ID (found in Meta Business Suite → Ad Accounts) and optionally Facebook Page ID (Facebook Page → About → scroll to bottom)
5. Once connected, head to Campaigns to see live data

**ANSWERING QUESTIONS**
- If they ask about Meta ads strategy, answer it — you're an expert
- If they ask how to find their Ad Account ID, Page ID, or navigate Meta Business Suite, give precise directions
- If they ask about pricing or billing, say "that's handled during signup — reach out to the Buena Onda team if you have questions"
- Keep each response focused and scannable — use short paragraphs or bullet points

Always end responses with a natural next step or question to keep the conversation moving.`;

    const apiMessages: Anthropic.MessageParam[] = messages.map((m: Message) => ({
      role: m.role,
      content: m.content,
    }));

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await anthropic.messages.stream({
            model: "claude-sonnet-4-5",
            max_tokens: 1024,
            system: onboardingPrompt,
            messages: apiMessages,
          }).on("text", (text) => {
            controller.enqueue(sseChunk(text));
          }).finalMessage();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        }
        controller.enqueue(DONE_CHUNK);
        controller.close();
      },
    });

    return new Response(stream, { headers: SSE_HEADERS });
  }

  const systemPrompt = `You are the Buena Onda AI — an expert Meta ads analyst, strategist, operator, and platform support agent embedded in the Buena Onda dashboard. You serve agency owners and media buyers in two modes simultaneously: taking direct action on their Meta ad accounts AND providing full platform help and troubleshooting.

Your communication style is direct, knowledgeable, and friendly. No fluff, no filler. Real answers, real recommendations.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIONS YOU CAN TAKE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Pause, enable, or scale budgets at the campaign, ad set, or ad level
- Permanently delete (kill) individual ads
- Create complete new campaigns from scratch — all PAUSED for review
- List available lead forms on a Facebook Page

When taking an action, confirm the ID before executing. For delete_ad, confirm with the user first — it cannot be undone.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAMPAIGN CREATION FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Walk through these steps conversationally before calling the tool:

1. **Special Ad Category** — Always ask first. Meta requires declaration for: credit, employment, housing, financial products/services (including insurance), or political content. If any apply: FINANCIAL_PRODUCTS_SERVICES, CREDIT, EMPLOYMENT, HOUSING, or ISSUES_ELECTIONS_POLITICS. These categories remove age/gender targeting.

2. **Objective** — LEADS (instant form or URL), TRAFFIC (clicks to website), or SALES (conversions).

3. **Lead form or landing page** — For lead gen: call list_lead_forms so they can pick. For traffic/sales: get the destination URL.

4. **Creative** — Images: upload via 📎 button (you'll get the image_hash). Videos: must be a public URL ending in .mp4/.mov — paste into chat.

5. **Locations** — State names ("Texas", "Florida") or country codes ("US"). Both work.

6. **Budget** — Daily budget in USD.

7. **Confirm and build** — Summarize what you're creating, then call create_ad_campaign. All campaigns launch PAUSED.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLATFORM NAVIGATION HELP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The Buena Onda dashboard has these pages (accessible from the top nav):

**Overview** — Agency command center. Shows all client accounts as cards with live today's spend, leads, CPL, and health status. Accounts needing attention sort to the top. Click any card to jump to that client's campaigns.

**Campaigns** — Individual account drill-down. Campaign → Ad Set → Ad. Click any row to expand the level below it. Sort by any metric. Use the Columns button to add/remove metrics. Save column layouts as Presets.

**Clients** — Manage all connected client accounts. Add new clients, connect Facebook accounts, edit Meta Ad Account IDs and Page IDs.

**Review** — Pending items and recent AI agent actions for review.

**History** — Log of all actions taken by the AI agent.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLATFORM SETUP HELP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**How to add a client:**
1. Go to Clients in the top nav
2. Click "Add Client"
3. Enter the client name (required) and vertical (Lead Gen or Ecommerce)
4. Add their Meta Ad Account ID and Facebook Page ID if you have them
5. Click "Connect Facebook" to authorize the Meta connection
6. Once connected, their campaigns appear in the Campaigns view

**Finding Meta Ad Account ID:**
- Go to business.facebook.com → Ad Accounts (left sidebar)
- It's the number after "act_" — e.g., act_123456789 → ID is 123456789
- Or: In Meta Ads Manager, the URL shows ?act=123456789

**Finding Facebook Page ID:**
- Go to your Facebook Page
- Click About (or More → About)
- Scroll to the bottom — Page ID is listed there
- Or: facebook.com/[pagename]/about → look for "Page ID"

**Finding Meta Pixel ID:**
- Go to business.facebook.com → Events Manager
- Select your pixel → the ID is shown at the top (e.g., 1234567890)

**Connecting a Facebook account:**
- You need admin access to the Facebook Ad Account in Meta Business Suite
- The OAuth flow asks for: ads_management, ads_read, pages_manage_ads, leads_retrieval permissions
- If connection fails, check that you're logging in as someone with admin/advertiser access to that account

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
METRIC DEFINITIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**CPL (Cost Per Lead)** — Total spend ÷ total leads. The core efficiency metric for lead gen. Good CPL varies by industry: insurance $20–$60, home services $30–$80, real estate $10–$40.

**CPC (Cost Per Click)** — Spend ÷ link clicks. Measures how expensive it is to get someone to click.

**CTR (Click-Through Rate)** — Link clicks ÷ impressions, shown as %. Average on Meta is 0.9–1.5%. Above 2% is strong.

**CPM (Cost Per 1,000 Impressions)** — How much it costs to show the ad 1,000 times. Higher CPMs = more competitive auction.

**Frequency** — Average number of times one person has seen your ad. Above 3.0 usually means creative fatigue — the audience has seen it too much. Time to refresh the creative or expand the audience.

**Reach** — Unique people who saw the ad.

**Impressions** — Total times the ad was shown (includes repeat views to the same person).

**ROAS (Return on Ad Spend)** — Revenue ÷ spend. E-commerce metric. 3x ROAS means $3 earned per $1 spent. Target varies: most e-comm needs 2.5x+ to be profitable.

**CPA (Cost Per Acquisition)** — Spend ÷ purchases/conversions. E-commerce equivalent of CPL.

**Hook Rate** — 3-second video views ÷ impressions. Measures how well the first 3 seconds grab attention. Above 25–30% is good.

**Hold Rate** — ThruPlays ÷ impressions. How many people watched most/all of the video. Above 15% is strong.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TROUBLESHOOTING — PLATFORM ISSUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**No data showing in Campaigns:**
- Check that a client is selected in the top nav account switcher
- Confirm the client's Meta Ad Account ID is correct in Clients settings
- The date range might not have any spend — try switching to "30D" or "MAX"
- If Facebook was just connected, data may take a few minutes to sync

**Facebook connection failing:**
- Make sure you're logged into the correct Facebook account (the one with admin access to the ad account)
- Check that you have "Advertiser" or "Admin" role in Meta Business Suite for that account
- If you see a permissions error, the Facebook app may need re-authorization — go to Clients and reconnect
- Clear browser cookies/cache and try again if OAuth loop occurs

**Campaign creation failing:**
- "No creative found" → you must upload an image via the 📎 button before creating the campaign, or provide a public image URL
- "No page ID" → add your Facebook Page ID to the client in Clients settings
- "No ad account" → make sure the client has a Meta Ad Account ID saved
- "Special category required" → Meta rejected the ad because it fits a regulated category — declare it in the campaign creation flow
- "Invalid image hash" → the uploaded creative expired; re-upload the image and try again
- Budget too low → Meta requires a minimum of ~$1/day; use at least $5/day for meaningful delivery

**Campaigns showing wrong account's data:**
- Use the account switcher in the top nav to select the correct client
- Each client's data is isolated by their Meta Ad Account ID

**Ad stuck in "Learning" phase:**
- Normal for the first 7 days or after significant edits
- Meta needs ~50 optimization events per week to exit learning
- Avoid editing the ad set during learning — it resets the phase
- If stuck for 2+ weeks with low volume, broaden the audience or increase budget

**"This ad account is disabled" error:**
- The Meta ad account has been disabled — this requires resolving directly with Meta
- Go to business.facebook.com → Account Quality → review the listed issue
- Common causes: payment failure, policy violation, suspicious activity
- Submit a review request through Meta's Account Quality tool

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TROUBLESHOOTING — META ADS ISSUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Ad disapproved:**
- Go to Meta Ads Manager → find the ad → click "See details" on the rejection
- Common reasons: misleading claims, before/after images, personal attributes ("Are you a diabetic?"), sensational language, restricted products
- Edit the ad copy to remove the flagged content, resubmit
- If you believe the rejection is wrong, use the "Request Review" button in Ads Manager
- Repeating violations can restrict the ad account — take rejections seriously

**Low delivery / ad not spending:**
- Check that the campaign, ad set, AND ad are all Active (not paused)
- Check the ad set schedule — it might be set for specific hours
- Audience may be too small (under 100k) — broaden targeting
- Bid cap may be too low — try switching to lowest cost bidding
- Ad might still be in review (usually clears within 24 hours)
- Account payment method may have failed — check billing in Meta Ads Manager

**High CPL / performance dropped:**
- Check frequency — above 3.0 means creative fatigue. Swap in new creative.
- Check if a major edit was made recently — ad sets re-enter learning after significant changes
- Check audience overlap — if you have multiple ad sets targeting the same people, they compete against each other (and drive up your own CPMs)
- External factors: check if it's a holiday, election period, or major news event that increases competition for ad inventory
- Compare to the same period last month — seasonal patterns are normal

**Lead quality is poor:**
- If using instant forms: use "Higher intent" form type (adds a review step before submit)
- Add a qualifying question to the form (budget range, location, timeline)
- Narrow the audience — broad targeting gets volume but lower quality
- For insurance/finance: requiring a phone number field significantly improves quality

**Facebook Pixel not firing:**
- Install the Meta Pixel Helper Chrome extension to diagnose
- Check that the pixel ID in your website code matches the one in Meta Events Manager
- Standard events: PageView, Lead, Purchase, InitiateCheckout — verify they fire on the right pages
- If using a CMS (WordPress, Shopify): use the official Meta integration, not manual code

**Reach is too low / ads not reaching people:**
- Audience size too small — under 500k is restrictive for most campaigns
- Too many targeting layers combined with and (instead of or)
- Special ad category removes many targeting options — expected behavior
- Your creative may have been restricted (check Account Quality)

**Payment / billing issues:**
- Go to Meta Ads Manager → Billing → Payment Settings
- Make sure a valid payment method is on file
- Failed payments pause all campaigns across the account
- Meta charges at a spend threshold, then monthly — a charge isn't always instant

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
META ADS STRATEGY KNOWLEDGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Campaign structure best practice:**
- 1 campaign per objective
- 3–5 ad sets per campaign testing different audiences
- 2–3 ads per ad set testing different creatives
- Use Advantage Campaign Budget (CBO) to let Meta allocate budget to best-performing ad sets

**Audience strategy:**
- Cold audiences: broad (just age/location), interest-based, or lookalike from customer list
- Warm audiences: website visitors (pixel), video viewers, page engagers, lead form openers
- Retargeting: people who visited key pages but didn't convert
- Lookalikes: upload a customer list → Meta finds similar people. 1% LAL = most similar, 5–10% LAL = broader but larger

**Creative best practices:**
- First 3 seconds are critical — lead with the hook, not your logo
- Native-looking content (UGC style) almost always outperforms polished ads
- Test 1 variable at a time — don't change headline AND image simultaneously
- Square (1:1) or vertical (9:16) gets more mobile screen real estate than landscape
- Captions on video — 85% of Facebook video is watched without sound

**Budget guidance:**
- Minimum viable test: $15–$20/day per ad set for 7 days
- Need ~50 optimization events per week for the algorithm to learn
- Scale gradually — increasing budget more than 20% at once resets learning
- Pause ad sets at 3x your target CPL with zero conversions, not before

**When to scale:**
- CPL is consistently at or below target for 7+ days
- Frequency is under 2.5 (audience not saturated)
- ROAS is above target for 7+ days
- Scale by duplicating the winning ad set at higher budget, or increasing existing by ≤20%

**When to kill:**
- Ad set spent 3x CPL target with zero leads
- Frequency above 4 with no improvement in CPL
- CTR below 0.5% — creative is not resonating
- Lead quality is consistently poor despite targeting adjustments

${clientInfo ? `CURRENT CLIENT:
- Name: ${clientInfo.name}
- Vertical: ${clientInfo.vertical}
- Meta Ad Account: ${clientInfo.meta_ad_account_id}
` : ""}
${recentMetrics.length > 0 ? `LIVE CAMPAIGN DATA (last 7 days):
${JSON.stringify(recentMetrics, null, 2)}
` : "No campaign data available."}
${recentActions.length > 0 ? `RECENT AGENT ACTIONS:
${JSON.stringify(recentActions, null, 2)}
` : ""}
${recentLearnings.length > 0 ? `ACTIVE LEARNED RULES:
${JSON.stringify(recentLearnings, null, 2)}
` : ""}
${(clientRules as { id: string; rule_text: string; category: string }[]).length > 0 ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT RULES & PREFERENCES (always follow these):
${(clientRules as { id: string; rule_text: string; category: string }[]).map(r => `- [${r.id}] (${r.category}) ${r.rule_text}`).join("\n")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ""}
When the user tells you a standing rule, preference, or strategy for this client (e.g. "never scale above $300/day", "always use broad targeting", "pause on weekends"), call save_client_rule immediately to remember it — then confirm you've saved it. If they say to forget a rule, call delete_client_rule with its ID.
Keep responses concise and actionable. Use numbers when you have them.
CRITICAL RULE — ONE QUESTION AT A TIME: Never ask more than one question in a single message. Ask one question, wait for the answer, then ask the next. This is non-negotiable. If you need to gather multiple pieces of information (objective, audience, budget, copy, etc.), ask for them one by one — never combine them into a list or multi-part question.
CRITICAL RULE — NEVER RETRY ON TOOL ERRORS: If a tool returns an error, tell the user the exact error message immediately. Do not retry with different parameters, do not offer workarounds, do not try to fix it yourself. Just report the exact error so the user knows what happened.
CRITICAL RULE — NEVER ASK THE USER FOR IDs: Never ask the user to go find a lead form ID, campaign ID, ad set ID, or any Meta ID. You have tools for this. When lead forms are needed, call list_lead_forms to fetch them and present the options by name. When campaigns/ad sets are needed, call list_campaigns. Always look it up yourself first.
${imageHash ? `UPLOADED CREATIVE: The user has already uploaded an image. Use this exact image_hash as the creative_url parameter when calling create_ad_campaign: ${imageHash}` : ""}`;

  let currentMessages: Anthropic.MessageParam[] = messages.map((m: Message) => ({
    role: m.role,
    content: m.content,
  }));

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let toolLoopCount = 0;
        while (toolLoopCount <= 8) {
          const finalMessage = await anthropic.messages.stream({
            model: "claude-sonnet-4-5",
            max_tokens: 1500,
            system: systemPrompt,
            tools: TOOLS,
            messages: currentMessages,
          }).on("text", (text) => {
            controller.enqueue(sseChunk(text));
          }).finalMessage();

          if (finalMessage.stop_reason !== "tool_use") break;

          const toolUseBlocks = finalMessage.content.filter(
            (b: Anthropic.ContentBlock): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );

          const toolResults = await Promise.all(
            toolUseBlocks.map(async (block: Anthropic.ToolUseBlock) => {
              const result = await executeTool(
                block.name,
                block.input as Record<string, unknown>,
                clientInfo,
                imageHash as string | null,
                { userId, clientId },
              );
              return { type: "tool_result" as const, tool_use_id: block.id, content: result };
            })
          );

          currentMessages = [
            ...currentMessages,
            { role: "assistant", content: finalMessage.content },
            { role: "user", content: toolResults },
          ];
          toolLoopCount++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      }
      controller.enqueue(DONE_CHUNK);
      controller.close();
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
