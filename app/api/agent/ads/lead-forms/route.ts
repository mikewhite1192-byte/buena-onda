// app/api/agent/ads/lead-forms/route.ts
// Returns lead forms for a given Facebook Page.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { listLeadForms } from "@/lib/meta/actions";
import { getClientToken } from "@/lib/meta/get-client-token";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pageId = searchParams.get("page_id") ?? process.env.META_PAGE_ID ?? "";
  const clientId = searchParams.get("client_id") ?? "";

  if (!pageId) return NextResponse.json({ error: "page_id is required" }, { status: 400 });

  let token: string;
  try {
    token = clientId ? await getClientToken(userId, clientId) : (process.env.META_ACCESS_TOKEN ?? "");
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
  if (!token) return NextResponse.json({ error: "Missing access token" }, { status: 500 });

  const result = await listLeadForms(pageId, token);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ forms: result.data });
}
