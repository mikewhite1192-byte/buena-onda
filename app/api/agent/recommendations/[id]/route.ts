import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { pauseAdSet, scaleAdSet } from "@/lib/meta/actions";

const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json() as { action: "approved" | "rejected" };

  // Load the recommendation + verify ownership
  const rows = await sql`
    SELECT aa.*, cb.daily_budget, cb.client_id
    FROM agent_actions aa
    JOIN campaign_briefs cb ON cb.id = aa.campaign_brief_id
    JOIN clients c ON c.id = cb.client_id
    WHERE aa.id = ${id}
      AND aa.status = 'pending'
      AND c.owner_id = ${userId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Recommendation not found or already actioned" }, { status: 404 });
  }

  const rec = rows[0] as {
    id: string;
    action_type: string;
    details: { adset_id: string; new_budget?: number; reason: string };
    daily_budget: string;
  };

  if (action === "rejected") {
    await sql`UPDATE agent_actions SET status = 'rejected' WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  }

  // Execute the action
  let result = "executed";
  const details = rec.details;

  if (rec.action_type === "pause") {
    const res = await pauseAdSet(details.adset_id);
    result = res.ok ? "paused" : `failed: ${res.error}`;
  } else if (rec.action_type === "scale" && details.new_budget) {
    const budgetCents = Math.round(details.new_budget * 100);
    const currentCents = Math.round(parseFloat(rec.daily_budget) * 100);
    const safeCents = Math.min(budgetCents, Math.round(currentCents * 1.3));
    const res = await scaleAdSet(details.adset_id, safeCents);
    result = res.ok ? `scaled to $${(safeCents / 100).toFixed(2)}/day` : `failed: ${res.error}`;
  }
  // flag_review and creative_brief don't call the Meta API — informational only

  await sql`
    UPDATE agent_actions
    SET status = 'approved', details = ${JSON.stringify({ ...details, meta_result: result })}
    WHERE id = ${id}
  `;

  return NextResponse.json({ ok: true, result });
}
