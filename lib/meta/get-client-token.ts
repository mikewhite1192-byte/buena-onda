import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);
export async function getClientToken(clientId: string): Promise<string> {
  const rows = await sql`
    SELECT meta_access_token, meta_token_expires_at FROM clients WHERE id = ${clientId} LIMIT 1
  `;
  const client = rows[0];
  if (client?.meta_access_token) {
    const exp = client.meta_token_expires_at as Date | null;
    if (exp && exp.getTime() < Date.now()) throw new Error("Meta token expired — client must reconnect Facebook");
    return client.meta_access_token as string;
  }
  const envToken = process.env.META_ACCESS_TOKEN;
  if (!envToken) throw new Error("No Meta token available");
  return envToken;
}
