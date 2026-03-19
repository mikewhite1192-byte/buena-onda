import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { planWorkflowFromPrompt } from "@/lib/ai/brain";
import { executePlan } from "@/lib/employee/executor";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { prompt, contactId } = await request.json();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const plan = await planWorkflowFromPrompt(prompt);

  if (contactId) {
    await executePlan(plan, { contactId });
  }

  return NextResponse.json({ plan });
}
