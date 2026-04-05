import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VOICE_PROFILE = `You are writing content as Mike — founder of buenaonda.ai and thewolfpack.ai.

VOICE RULES (always active):
- Audience: entrepreneurs who believe AI is the future but don't know where to start
- Origin: frustrated with GoHighLevel's complexity — built something simpler
- Tone: plain, direct, outcome-first, uses 'literally' naturally
- NEVER use these words: game-changing, revolutionary, unlock, leverage, synergy, elevate, empower
- Always sound like: texting a smart friend about something real
- Keep it conversational, not corporate
- Lead with the outcome, not the feature`;

const SCRIPT_FORMATS: Record<string, string> = {
  "15-30s": "15-30 second reel — hook, core insight, CTA — approximately 65 words",
  "30-60s": "30-60 second reel — hook, problem, solution, CTA — approximately 130 words",
  "60-90s": "60-90 second reel — hook, story, 2-3 points, CTA — approximately 220 words",
  "talking-points": "Talking points only — 5 bold sentences to riff on camera",
};

const VIDEO_FORMATS: Record<string, string> = {
  "talking-head": "Talking head — include stage directions like [PAUSE], [LOOK AT CAMERA], [LEAN IN]",
  "screen-record": "Screen record — include [SHOW SCREEN] directions for dashboard walkthroughs",
  "b-roll": "B-roll voiceover — include [B-ROLL: description] directions describing what to film",
};

export async function POST(req: Request) {
  try {
    const { action, topic, scriptFormat, videoFormat, viralFormat, platform, theme, dayDesc, trend, hook, day } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
    }

    let systemPrompt = VOICE_PROFILE;
    let userPrompt = "";

    if (action === "script") {
      const format = SCRIPT_FORMATS[scriptFormat] || SCRIPT_FORMATS["30-60s"];
      const video = VIDEO_FORMATS[videoFormat] || "";
      const viral = viralFormat ? `Use this viral format structure: "${viralFormat}"` : "";

      systemPrompt += `\n\nYou are a script writing engine. Write scroll-stopping scripts that sound like Mike talking to a friend about something that actually matters.

Format: ${format}
${video ? `Video style: ${video}` : ""}
${viral}

Structure your output as:
**HOOK:** [the opening line]
**SCRIPT:** [the full script with stage directions]
**CTA:** [the call to action]
**CAPTION:** [Instagram caption, 2-3 sentences max]
**HASHTAGS:** [5-7 relevant hashtags]`;

      userPrompt = `Write a reel script about: ${topic}`;
    } else if (action === "hooks") {
      systemPrompt += `\n\nGenerate exactly 5 hook variations for a reel. Each hook should be a different angle:
1. Curiosity hook — teases the answer without giving it
2. Controversy hook — challenges a common belief
3. Result hook — leads with the outcome
4. Story hook — opens mid-story
5. Question hook — asks something the audience is already thinking

Format each as:
**[TYPE]:** [hook text]`;

      userPrompt = `Generate 5 hook variations for a reel about: ${topic}`;
    } else if (action === "ad-copy") {
      const plat = platform || "meta";
      systemPrompt += `\n\nWrite ad copy for ${plat === "meta" ? "Meta (Facebook/Instagram)" : "Google"} ads.

Generate 3 variations (A/B/C test versions) for each:
${plat === "meta" ? `- Primary text (the main copy above the image/video)
- Headline (short punch line under the creative)
- Description (secondary text below headline)` : `- 5 Headlines (30 chars max each)
- 2 Descriptions (90 chars max each)`}

For each variation, target a different funnel stage:
A) Awareness — cold audience, hook-first
B) Consideration — warm audience, solution focused
C) Conversion — hot audience, offer-forward

Format clearly with headers for each variation.`;

      userPrompt = `Write ${plat} ad copy about: ${topic}`;
    } else if (action === "brief") {
      systemPrompt += `\n\nYou are generating a morning content intelligence brief. Search your knowledge for the latest trends in AI, digital marketing, and business automation.

Structure the brief as:

**TODAY'S BRIEF — [today's day name]**

**TOP STORIES**
[3-5 stories about AI, marketing, or automation — 2 sentences each, plain English, why it matters for entrepreneurs]

**CONTENT ANGLES**
[3 content angles for Mike's brand with a suggested hook for each]

**RECOMMENDED REEL**
[1 topic recommendation based on what's trending, with a hook]

**RECOMMENDED STORY**
[1 story angle for today]

**PLATFORM UPDATES**
[Any recent Instagram algorithm, Meta ads, or Google changes worth knowing]`;

      userPrompt = `Generate today's morning content intelligence brief. Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}. Focus on the latest in AI tools, digital marketing, and business automation.`;
    } else if (action === "trending") {
      systemPrompt += `\n\nYou are a trend intelligence engine for content creators in the AI and digital marketing space. Analyze what's trending RIGHT NOW.

Structure your output as a list of 8-10 trending topics. For each trend:

**[NUMBER]. [TREND TITLE]**
**Why it's trending:** [1 sentence — what happened or why people are talking about it]
**Content angle:** [1 sentence — how Mike could make a reel about this]
**Suggested hook:** [The opening line for a reel on this topic]
**Heat:** [HOT / WARM / RISING]

---

Focus areas:
- AI tools and announcements (new models, features, product launches)
- Social media algorithm changes (Instagram, TikTok, YouTube)
- Digital marketing shifts (Meta ads, Google ads, attribution changes)
- Business automation and SaaS trends
- Creator economy news
- Anything entrepreneurs are buzzing about right now

Prioritize topics that are timely (happening this week) and have clear content potential.`;

      userPrompt = `What's trending right now in AI, digital marketing, and business automation? Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}. Give me the hottest topics that an entrepreneur content creator should be talking about today.`;
    } else if (action === "wizard-topics") {
      systemPrompt += `\n\nGenerate exactly 7 content topic ideas for a reel. The theme for today is "${theme}" — ${dayDesc}.

Each topic should be specific, filmable, and relevant to entrepreneurs in the AI/digital marketing space.

Output ONLY a numbered list, one topic per line. No explanations, no headers, just the topics.
Example format:
1. Why 90% of businesses overpay for their CRM
2. The AI tool that replaced my $200/mo scheduling app`;

      userPrompt = `Generate 7 reel topic ideas for the theme: "${theme}" — ${dayDesc}. Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.`;
    } else if (action === "wizard-trends") {
      systemPrompt += `\n\nGenerate exactly 7 trending angles related to this specific topic. Each angle should tie the topic to something currently happening in AI, digital marketing, or business automation.

Output ONLY a numbered list, one angle per line. Each should be a specific, filmable angle — not generic.
Example format:
1. OpenAI just dropped GPT-5 — here's what it means for small business owners using AI CRMs
2. Instagram just changed how Reels get distributed — this is how to adapt your content strategy`;

      userPrompt = `Give me 7 trending angles for the topic: "${topic}". What's happening RIGHT NOW that connects to this topic? Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.`;
    } else if (action === "wizard-hooks") {
      systemPrompt += `\n\nGenerate exactly 5 opening hooks for a reel about this topic with this trending angle. Each hook should be a single sentence — the first thing Mike says on camera.

The 5 hooks should each use a different angle:
1. Curiosity — teases the answer without giving it
2. Controversy — challenges a common belief
3. Result — leads with the outcome
4. Story — opens mid-story
5. Question — asks something the audience is already thinking

Output ONLY a numbered list. One hook per line. No labels, no explanations — just the hook text.`;

      userPrompt = `Generate 5 hooks for a reel about: "${topic}" with trending angle: "${trend}"`;
    } else if (action === "wizard-script") {
      const format = SCRIPT_FORMATS[scriptFormat] || SCRIPT_FORMATS["30-60s"];
      const video = VIDEO_FORMATS[videoFormat] || "";
      const viral = viralFormat ? `Use this viral format structure: "${viralFormat}"` : "";

      systemPrompt += `\n\nYou are writing a complete reel script. The user has already chosen their day, topic, trending angle, and hook through a guided workflow. Use ALL of this context to write the most relevant, timely script possible.

Day: ${day} (theme: ${theme})
Topic: ${topic}
Trending angle: ${trend}
Opening hook: ${hook}
Format: ${format}
${video ? `Video style: ${video}` : ""}
${viral}

IMPORTANT: Start the script with the exact hook the user chose. Build the rest of the script around that opening.

Structure your output as:
**HOOK:** ${hook}
**SCRIPT:** [the full script with stage directions — starts with the hook, flows naturally]
**CTA:** [the call to action]
**CAPTION:** [Instagram caption, 2-3 sentences max, ties to the trending angle]
**HASHTAGS:** [5-7 relevant hashtags]`;

      userPrompt = `Write a ${day} reel script. Topic: "${topic}". Trending angle: "${trend}". Hook: "${hook}". Make it sound like Mike talking to a friend.`;
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = response.content.find(
      (b): b is Anthropic.Messages.TextBlock => b.type === "text"
    );

    return NextResponse.json({ output: block?.text ?? "(No content returned.)" });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
