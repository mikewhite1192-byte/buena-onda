// app/api/clerk-ping/route.ts
export const dynamic = "force-dynamic";

function b64urlToJSON(seg: string) {
  const s = seg.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  return JSON.parse(Buffer.from(s + "=".repeat(pad), "base64").toString("utf8"));
}

function getSidFromCookie(cookie: string | null) {
  if (!cookie) return null;
  const raw = cookie.split(";").find(c => c.trim().startsWith("__session="))?.split("=")[1];
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length < 2) return null;
  const payload = b64urlToJSON(parts[1]);
  return payload?.sid ?? null;
}

export async function GET(req: Request) {
  const sid = getSidFromCookie(req.headers.get("cookie"));
  if (!sid) return Response.json({ ok: false, reason: "no-session-cookie" }, { status: 400 });

  const r = await fetch(`https://api.clerk.com/v1/sessions/${sid}`, {
    headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    cache: "no-store",
  });

  const body = await r.json().catch(() => ({}));
  return Response.json({ status: r.status, body }, { headers: { "Cache-Control": "no-store" } });
}
