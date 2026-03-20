// app/api/agent/creative/upload/route.ts
// Accepts an image file upload and uploads it to Meta's ad images API.
// Returns the image_hash needed for ad creative creation.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const META_BASE_URL = "https://graph.facebook.com/v21.0";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "Missing META_ACCESS_TOKEN" }, { status: 500 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const adAccountId = (formData.get("ad_account_id") as string | null) ?? process.env.META_AD_ACCOUNT_ID ?? "";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!adAccountId) return NextResponse.json({ error: "No ad_account_id" }, { status: 400 });

  const acct = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

  // Build multipart form for Meta — field name must be the filename
  const buffer = await file.arrayBuffer();
  const metaForm = new FormData();
  metaForm.append(file.name, new Blob([buffer], { type: file.type }), file.name);
  metaForm.append("access_token", token);

  const res = await fetch(`${META_BASE_URL}/${acct}/adimages`, {
    method: "POST",
    body: metaForm,
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    return NextResponse.json(
      { error: data.error?.message ?? `Upload failed: ${res.status}` },
      { status: 500 }
    );
  }

  // Meta returns: { images: { "filename.jpg": { hash, url, name, ... } } }
  const images = data.images as Record<string, { hash: string; url: string; name: string }>;
  const entries = Object.entries(images ?? {});
  if (entries.length === 0) {
    return NextResponse.json({ error: "Upload succeeded but no image data returned" }, { status: 500 });
  }

  const [, imgData] = entries[0];
  return NextResponse.json({
    image_hash: imgData.hash,
    url: imgData.url,
    name: imgData.name,
  });
}
