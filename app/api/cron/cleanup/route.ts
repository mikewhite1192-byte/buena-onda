// app/api/cron/cleanup/route.ts
// Daily housekeeping — purges old rows from tables that grow without bound:
// rate_limit_hits, processed_webhooks, site_traffic, login tokens, and
// expired team invites. Required because the rate-limiter and webhook
// idempotency table only insert; they never clean themselves up.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, number | string> = {};

  const steps: { table: string; q: Promise<unknown> }[] = [
    { table: "rate_limit_hits",        q: sql`DELETE FROM rate_limit_hits        WHERE hit_at      < NOW() - INTERVAL '1 day'` },
    { table: "processed_webhooks",     q: sql`DELETE FROM processed_webhooks     WHERE created_at  < NOW() - INTERVAL '30 days'` },
    { table: "site_traffic",           q: sql`DELETE FROM site_traffic           WHERE created_at  < NOW() - INTERVAL '90 days'` },
    { table: "affiliate_login_tokens", q: sql`DELETE FROM affiliate_login_tokens WHERE expires_at  < NOW() - INTERVAL '7 days'` },
    { table: "client_login_tokens",    q: sql`DELETE FROM client_login_tokens    WHERE expires_at  < NOW() - INTERVAL '7 days'` },
    { table: "team_invites_expired",   q: sql`DELETE FROM team_invites           WHERE expires_at  < NOW() - INTERVAL '30 days' AND accepted_at IS NULL` },
  ];

  for (const step of steps) {
    try {
      const out = await step.q as { count?: number }[] & { rowCount?: number };
      results[step.table] = (out as unknown as { rowCount?: number }).rowCount ?? "ok";
    } catch (err) {
      results[step.table] = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return NextResponse.json({ ok: true, results });
}
