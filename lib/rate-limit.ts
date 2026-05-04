// lib/rate-limit.ts
// Postgres-backed rate limiter — works on Vercel serverless without Redis.
// Each call records a hit and counts hits in the trailing window for the same
// (bucket, key). Cheap enough for endpoints that fire emails or burn API
// quota; not appropriate for hot code paths (use Upstash if/when we have it).
import { neon } from "@neondatabase/serverless";
import type { NextRequest } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetSeconds: number;
}

export async function rateLimit(
  bucket: string,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  // Insert this hit, then count hits in window. Cleanup old rows opportunistically.
  await sql`
    INSERT INTO rate_limit_hits (bucket, key, hit_at)
    VALUES (${bucket}, ${key}, ${now.toISOString()})
  `;

  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM rate_limit_hits
    WHERE bucket = ${bucket} AND key = ${key} AND hit_at >= ${windowStart.toISOString()}
  `;
  const count = (rows[0]?.count as number) ?? 0;

  // Best-effort cleanup of old hits for this bucket/key.
  await sql`
    DELETE FROM rate_limit_hits
    WHERE bucket = ${bucket} AND key = ${key} AND hit_at < ${windowStart.toISOString()}
  `.catch(() => {});

  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    resetSeconds: windowSeconds,
  };
}

// Best-effort caller IP for rate-limit keying. Falls back to "unknown" so we
// still apply some throttle (better than nothing) when headers are absent.
export function callerKey(req: NextRequest, prefix = ""): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return prefix ? `${prefix}:${ip}` : ip;
}
