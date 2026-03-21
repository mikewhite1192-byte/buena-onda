// lib/action-log.ts — Shared helper to log agency actions
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export type ActionType =
  | "pause_campaign"
  | "scale_budget"
  | "rec_declined"
  | "rec_snoozed"
  | "campaign_created"
  | "campaign_approved"
  | "campaign_rejected";

export interface LogActionParams {
  ownerId: string;
  clientId?: string;
  clientName?: string;
  actionType: ActionType;
  description: string;
  campaignId?: string;
  campaignName?: string;
  metaBefore?: object;
  metaAfter?: object;
}

export async function logAction(params: LogActionParams) {
  await sql`
    CREATE TABLE IF NOT EXISTS action_log (
      id serial PRIMARY KEY,
      owner_id text NOT NULL,
      client_id text,
      client_name text,
      action_type text NOT NULL,
      description text,
      campaign_id text,
      campaign_name text,
      meta_before jsonb,
      meta_after jsonb,
      created_at timestamptz DEFAULT now()
    )
  `;
  await sql`
    INSERT INTO action_log
      (owner_id, client_id, client_name, action_type, description, campaign_id, campaign_name, meta_before, meta_after)
    VALUES
      (${params.ownerId}, ${params.clientId ?? null}, ${params.clientName ?? null},
       ${params.actionType}, ${params.description},
       ${params.campaignId ?? null}, ${params.campaignName ?? null},
       ${params.metaBefore ? JSON.stringify(params.metaBefore) : null},
       ${params.metaAfter  ? JSON.stringify(params.metaAfter)  : null})
  `;
}
