// app/api/review/campaigns/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { logAction } from "@/lib/action-log";

const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const { status, notes } = await req.json();

  if (!status || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "status must be 'approved' or 'rejected'" }, { status: 400 });
  }

  try {
    const [row] = await sql`
      UPDATE pending_campaigns
      SET status = ${status}, notes = ${notes ?? null}, updated_at = now()
      WHERE id = ${id} AND owner_id = ${userId}
      RETURNING *
    `;

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Log the action
    const actionType = status === "approved" ? "campaign_approved" : "campaign_rejected";
    const description = status === "approved"
      ? `Approved campaign "${row.campaign_name}" for ${row.client_name}`
      : `Rejected campaign "${row.campaign_name}" for ${row.client_name}${notes ? `: ${notes}` : ""}`;

    await logAction({
      ownerId: userId,
      clientId: row.client_id as string,
      clientName: row.client_name as string,
      actionType,
      description,
      campaignId: row.id as string,
      campaignName: row.campaign_name as string,
    });

    return NextResponse.json({ campaign: row });
  } catch (err) {
    console.error("PATCH /api/review/campaigns/[id] error:", err);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [row] = await sql`
      SELECT * FROM pending_campaigns
      WHERE id = ${params.id} AND owner_id = ${userId}
      LIMIT 1
    `;
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ campaign: row });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
