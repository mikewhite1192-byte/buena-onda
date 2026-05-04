// app/api/agent/actions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { decision } = await req.json(); // 'approved' | 'rejected'
  if (!["approved", "rejected"].includes(decision)) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  // Fetch the action and verify the caller owns it. Without this join, any
  // logged-in user could approve/execute another tenant's pending Meta action
  // (pause/scale their ad sets) just by enumerating the action UUID.
  const rows = await sql`
    SELECT aa.*
    FROM agent_actions aa
    JOIN clients c ON c.meta_ad_account_id = aa.ad_account_id
    WHERE aa.id = ${id} AND c.owner_id = ${userId}
    LIMIT 1
  `;
  const action = rows[0];
  if (!action) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (action.status !== "flag_review") {
    return NextResponse.json({ error: "Action already resolved" }, { status: 409 });
  }

  // If approved, execute against Meta API
  if (decision === "approved") {
    const result = await executeAction(action as Record<string, unknown>);
    if (!result.success) {
      console.error("[agent/actions/:id] execute failed:", result.error);
      return NextResponse.json(
        { error: "Meta API error — check the action and try again" },
        { status: 502 }
      );
    }
  }

  // Update status in DB
  await sql`
    UPDATE agent_actions
    SET status = ${decision},
        resolved_at = NOW(),
        resolved_by = ${userId}
    WHERE id = ${id}
  `;

  return NextResponse.json({ success: true, decision });
}

// ─── Execute the action against Meta ─────────────────────────────────────────

async function executeAction(action: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  const token = process.env.META_ACCESS_TOKEN;
  const details = action.action_details as Record<string, unknown>;

  try {
    switch (action.action_type) {
      case "scale": {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${action.ad_set_id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              daily_budget: Math.round((details.new_budget as number) * 100), // Meta uses cents
              access_token: token,
            }),
          }
        );
        if (!res.ok) {
          const err = await res.json();
          return { success: false, error: JSON.stringify(err) };
        }
        return { success: true };
      }

      case "pause": {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${action.ad_set_id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "PAUSED",
              access_token: token,
            }),
          }
        );
        if (!res.ok) {
          const err = await res.json();
          return { success: false, error: JSON.stringify(err) };
        }
        return { success: true };
      }

      case "creative_brief": {
        // No Meta API call needed — brief is already written to campaign_briefs
        // Just mark as approved so the creative team/agent picks it up
        return { success: true };
      }

      default:
        return { success: false, error: `Unknown action type: ${action.action_type}` };
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
