// app/api/agent/creative/upload/route.ts
// Accepts an image file upload and uploads it to Meta's ad images API via base64 bytes.
// Returns the image_hash needed for ad creative creation.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getClientToken } from "@/lib/meta/get-client-token";

const META_BASE_URL = "https://graph.facebook.com/v21.0";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let file: File | null = null;
  let adAccountId = "";
  let clientId = "";

  try {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
    adAccountId = (formData.get("ad_account_id") as string | null) ?? process.env.META_AD_ACCOUNT_ID ?? "";
    clientId = (formData.get("client_id") as string | null) ?? "";
  } catch (e) {
    return NextResponse.json({ error: `Failed to parse form data: ${e instanceof Error ? e.message : String(e)}` }, { status: 400 });
  }

  let token: string;
  try {
    token = clientId ? await getClientToken(userId, clientId) : (process.env.META_ACCESS_TOKEN ?? "");
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
  if (!token) return NextResponse.json({ error: "Missing META_ACCESS_TOKEN" }, { status: 500 });

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!adAccountId) return NextResponse.json({ error: "No ad_account_id — set META_AD_ACCOUNT_ID or select a client" }, { status: 400 });

  const acct = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

  // Convert file to base64 and upload via the bytes parameter (more reliable than multipart)
  let base64: string;
  try {
    const buffer = await file.arrayBuffer();
    base64 = Buffer.from(buffer).toString("base64");
  } catch (e) {
    return NextResponse.json({ error: `Failed to read file: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }

  const url = new URL(`${META_BASE_URL}/${acct}/adimages`);
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bytes: base64 }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    return NextResponse.json(
      { error: data.error?.message ?? `Meta API error ${res.status}: ${JSON.stringify(data)}` },
      { status: 500 }
    );
  }

  // Meta returns: { images: { "<hash>": { hash, url, ... } } }
  const images = data.images as Record<string, { hash: string; url: string }> | undefined;
  const entries = Object.entries(images ?? {});
  if (entries.length === 0) {
    return NextResponse.json({ error: `Upload succeeded but no image hash returned. Full response: ${JSON.stringify(data)}` }, { status: 500 });
  }

  const [, imgData] = entries[0];
  return NextResponse.json({ image_hash: imgData.hash, url: imgData.url });
}
