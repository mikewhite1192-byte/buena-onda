// lib/auth/owner-of.ts
// Tenant-ownership helpers. Every place that takes a clientId, briefId, or
// ad_account_id from the request must call one of these before touching data.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

/**
 * Returns true iff the given clientId belongs to the calling user. Use this
 * before reading/writing any tenant-scoped table that joins to clients.
 */
export async function ownsClient(userId: string, clientId: string): Promise<boolean> {
  if (!userId || !clientId) return false;
  const rows = await sql`
    SELECT 1 FROM clients WHERE id = ${clientId} AND owner_id = ${userId} LIMIT 1
  `;
  return rows.length > 0;
}

/**
 * Returns true iff the given Meta ad account belongs to one of the calling
 * user's clients. The account ID may or may not have the `act_` prefix.
 */
export async function ownsAdAccount(userId: string, adAccountId: string): Promise<boolean> {
  if (!userId || !adAccountId) return false;
  const rows = await sql`
    SELECT 1 FROM clients
    WHERE owner_id = ${userId}
      AND meta_ad_account_id = ${adAccountId}
    LIMIT 1
  `;
  return rows.length > 0;
}

