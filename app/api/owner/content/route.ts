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
    const { action, topic, scriptFormat, videoFormat, viralFormat, platform } = await req.json();

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
