import Anthropic from "@anthropic-ai/sdk";

export type WorkflowPlan = {
  name: string;
  trigger: { type: "facebook_lead_form" | "form_submission" | "manual"; value?: string };
  goals: string[];
  steps: (
    | { type: "tag.add"; value: string[] }
    | { type: "notify.internal"; channel: "email" | "sms"; to_role: "sales" | "admin"; template: string }
    | { type: "wait"; for: string }
    | { type: "sms.send"; template: string }
    | { type: "email.send"; template: string }
    | { type: "calendar.offer"; calendar_slug: string; method: "link" | "auto" }
    | { type: "stage.move"; pipeline: string; stage: string; when?: string }
    | { type: "drip.monthly"; months: number; templates: string[] }
  )[];
};

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function planWorkflowFromPrompt(prompt: string): Promise<WorkflowPlan> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }
  if (!prompt.trim()) {
    throw new Error("Prompt is required");
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system:
      "You turn GoHighLevel operator prompts into strict JSON that matches the WorkflowPlan type. Do not add prose.",
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content.find(
    (b): b is Anthropic.Messages.TextBlock => b.type === "text"
  );
  if (!block) {
    throw new Error("Claude response missing plan content");
  }

  try {
    const plan = JSON.parse(block.text);
    return plan as WorkflowPlan;
  } catch {
    throw new Error("Failed to parse workflow plan JSON");
  }
}
