// app/api/agent/ads/create/route.ts
// Manual ad creation endpoint — accepts form data and creates a full Meta campaign.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createMetaCampaign } from "@/lib/meta/actions";
import { getClientToken } from "@/lib/meta/get-client-token";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    client_id,
    ad_account_id,
    page_id,
    pixel_id,
    campaign_name,
    objective,
    daily_budget,
    countries,
    age_min,
    age_max,
    primary_text,
    headline,
    description,
    cta_type,
    destination_url,
    lead_form_id,
    image_hash,
    image_url,
    video_url,
    special_ad_categories,
    interests,
    publisher_platforms,
    facebook_positions,
    instagram_positions,
    advantage_plus_audience,
  } = body;

  if (!ad_account_id) return NextResponse.json({ error: "ad_account_id is required" }, { status: 400 });
  if (!campaign_name) return NextResponse.json({ error: "campaign_name is required" }, { status: 400 });
  if (!primary_text) return NextResponse.json({ error: "primary_text is required" }, { status: 400 });
  if (!headline) return NextResponse.json({ error: "headline is required" }, { status: 400 });
  if (!daily_budget) return NextResponse.json({ error: "daily_budget is required" }, { status: 400 });
  if (!image_hash && !image_url && !video_url) return NextResponse.json({ error: "A creative (image or video) is required" }, { status: 400 });

  let token: string;
  try {
    token = client_id ? await getClientToken(userId, client_id) : (process.env.META_ACCESS_TOKEN ?? "");
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
  if (!token) return NextResponse.json({ error: "Missing access token" }, { status: 500 });

  // Map objective to Meta fields
  const objectiveMap: Record<string, { objective: "OUTCOME_LEADS" | "OUTCOME_TRAFFIC" | "OUTCOME_SALES"; optimizationGoal: "LEAD_GENERATION" | "LINK_CLICKS" | "OFFSITE_CONVERSIONS"; billingEvent: "IMPRESSIONS" | "LINK_CLICKS" }> = {
    leads:   { objective: "OUTCOME_LEADS",   optimizationGoal: "LEAD_GENERATION",    billingEvent: "IMPRESSIONS" },
    traffic: { objective: "OUTCOME_TRAFFIC", optimizationGoal: "LINK_CLICKS",         billingEvent: "IMPRESSIONS" },
    sales:   { objective: "OUTCOME_SALES",   optimizationGoal: "OFFSITE_CONVERSIONS", billingEvent: "IMPRESSIONS" },
  };
  const mapped = objectiveMap[objective ?? "leads"] ?? objectiveMap.leads;

  const result = await createMetaCampaign({
    adAccountId: ad_account_id,
    pageId: page_id ?? process.env.META_PAGE_ID ?? "",
    pixelId: pixel_id ?? process.env.META_PIXEL_ID,
    campaignName: campaign_name,
    adSetName: `${campaign_name} — Ad Set`,
    adName: `${campaign_name} — Ad`,
    objective: mapped.objective,
    optimizationGoal: mapped.optimizationGoal,
    billingEvent: mapped.billingEvent,
    dailyBudgetCents: Math.round(daily_budget * 100),
    countries: countries?.length ? countries : ["US"],
    ageMin: age_min ?? 25,
    ageMax: age_max ?? 65,
    imageHash: image_hash,
    imageUrl: image_url,
    videoUrl: video_url,
    primaryText: primary_text,
    headline,
    description: description ?? "",
    ctaType: cta_type ?? (lead_form_id ? "SIGN_UP" : "LEARN_MORE"),
    destinationUrl: destination_url,
    leadFormId: lead_form_id,
    specialAdCategories: special_ad_categories ?? [],
    interests: interests ?? [],
    publisherPlatforms: publisher_platforms,
    facebookPositions: facebook_positions,
    instagramPositions: instagram_positions,
    advantagePlusAudience: advantage_plus_audience ?? false,
    token,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, ...result.data });
}
