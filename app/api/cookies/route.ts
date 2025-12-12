// app/api/cookies/route.ts
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const all = cookies()
    .getAll()
    .map((c) => ({ name: c.name, value: c.value?.slice(0, 12) + "…" }));

  const session = cookies().get("__session")?.value ?? null;
  const client = cookies().get("__client")?.value ?? null;

  return Response.json(
    {
      hasSessionCookie: Boolean(session),
      hasClientCookie: Boolean(client),
      cookies: all,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
