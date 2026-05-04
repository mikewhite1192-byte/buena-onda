import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);

/**
 * Returns a Meta access token for the given client, but only if the calling
 * user owns that client. Throws otherwise. Without the userId guard, any
 * logged-in user could pass another tenant's client_id and have the server
 * use that tenant's stored token to drive Meta API calls — including
 * destructive ones in /api/agent/ads/create, /upload, /interests, etc.
 *
 * Falls back to the platform-wide META_ACCESS_TOKEN only when the owned
 * client has no token of its own (e.g. self-managed accounts that share
 * Mike's system user). Never returns a token for an unowned client.
 */
export async function getClientToken(userId: string, clientId: string): Promise<string> {
  if (!userId || !clientId) throw new Error("userId and clientId required");
  const rows = await sql`
    SELECT meta_access_token, meta_token_expires_at
    FROM clients
    WHERE id = ${clientId} AND owner_id = ${userId}
    LIMIT 1
  `;
  const client = rows[0];
  if (!client) throw new Error("Client not found");
  if (client.meta_access_token) {
    const exp = client.meta_token_expires_at as Date | null;
    if (exp && exp.getTime() < Date.now()) throw new Error("Meta token expired — client must reconnect Facebook");
    return client.meta_access_token as string;
  }
  const envToken = process.env.META_ACCESS_TOKEN;
  if (!envToken) throw new Error("No Meta token available");
  return envToken;
}
