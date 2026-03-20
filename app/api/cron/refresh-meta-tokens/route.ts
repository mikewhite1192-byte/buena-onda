import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const APP_ID = process.env.META_APP_ID!;
const APP_SECRET = process.env.META_APP_SECRET!;

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await sql`
    SELECT id, meta_access_token FROM clients
    WHERE meta_access_token IS NOT NULL
      AND meta_token_expires_at < NOW() + INTERVAL '10 days'
  `;

  const results = await Promise.all(clients.map(async (client) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${client.meta_access_token}`
      );
      const data = await res.json();
      if (!data.access_token) throw new Error(data.error?.message ?? "Refresh failed");
      const expiresAt = new Date(Date.now() + ((data.expires_in as number) ?? 5184000) * 1000);
      await sql`UPDATE clients SET meta_access_token = ${data.access_token}, meta_token_expires_at = ${expiresAt.toISOString()} WHERE id = ${client.id}`;
      return { id: client.id, status: "refreshed" };
    } catch (err) {
      await sql`UPDATE clients SET meta_access_token = NULL, meta_token_expires_at = NULL WHERE id = ${client.id}`;
      return { id: client.id, status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  }));

  return NextResponse.json({ refreshed: results.length, results });
}
