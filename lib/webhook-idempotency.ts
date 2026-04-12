import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// Webhook idempotency guard — prevents duplicate processing.
// Uses INSERT ON CONFLICT with UNIQUE(provider, event_id).
// Returns true if the event is new, false if it's a duplicate.
export async function markWebhookProcessed(
  provider: string,
  eventId: string,
): Promise<boolean> {
  const inserted = await sql`
    INSERT INTO processed_webhooks (provider, event_id)
    VALUES (${provider}, ${eventId})
    ON CONFLICT (provider, event_id) DO NOTHING
    RETURNING id
  `;
  return inserted.length > 0;
}
