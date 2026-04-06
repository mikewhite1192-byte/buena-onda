// app/api/token-debug/route.ts — owner-only debug endpoint
export const dynamic = "force-dynamic";
import { requireOwner, isErrorResponse } from "@/lib/auth/owner";

function b64urlDecode(input: string) {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = input.length % 4 ? 4 - (input.length % 4) : 0;
  const str = input + "=".repeat(pad);
  return Buffer.from(str, "base64").toString("utf8");
}

export async function GET(req: Request) {
  const ownerCheck = await requireOwner();
  if (isErrorResponse(ownerCheck)) return ownerCheck;
  const cookie = req.headers.get("cookie") || "";
  const sess = cookie.split(";").find(c => c.trim().startsWith("__session="))?.split("=")[1];

  if (!sess) {
    return Response.json({ hasSessionCookie: false }, { headers: { "Cache-Control": "no-store" } });
  }

  const [h, p] = sess.split(".");
  let header: any = null;
  let payload: any = null;

  try {
    header = JSON.parse(b64urlDecode(h));
    payload = JSON.parse(b64urlDecode(p));
  } catch {
    // ignore
  }

  return Response.json(
    {
      hasSessionCookie: true,
      header: { kid: header?.kid ?? null, alg: header?.alg ?? null },
      payload: {
        iss: payload?.iss ?? null,
        aud: payload?.aud ?? null,
        sub: payload?.sub ?? null,
        sid: payload?.sid ?? null,
        exp: payload?.exp ?? null,
        iat: payload?.iat ?? null,
      },
      envVars: {
        pkPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 9) ?? null,
        skPrefix: process.env.CLERK_SECRET_KEY?.slice(0, 6) ?? null,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
