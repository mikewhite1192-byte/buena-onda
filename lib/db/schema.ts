// SQL migration — run once via GET /api/db/migrate

export const MIGRATION_SQL = `
-- Add ad_account_id to campaign_briefs (safe to re-run)
ALTER TABLE campaign_briefs ADD COLUMN IF NOT EXISTS ad_account_id TEXT;

CREATE TABLE IF NOT EXISTS creative_fatigue_log (
  id SERIAL PRIMARY KEY,
  ad_id TEXT NOT NULL,
  ad_name TEXT,
  ad_set_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  trigger_reason TEXT NOT NULL,
  frequency NUMERIC,
  ctr_current NUMERIC,
  ctr_previous NUMERIC,
  ctr_drop_pct NUMERIC,
  status TEXT NOT NULL DEFAULT 'flagged',
  replacement_brief TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actioned_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fatigue_ad_id ON creative_fatigue_log(ad_id);
CREATE INDEX IF NOT EXISTS idx_fatigue_status ON creative_fatigue_log(status);
CREATE INDEX IF NOT EXISTS idx_fatigue_detected_at ON creative_fatigue_log(detected_at);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id          SERIAL      PRIMARY KEY,
  content     TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'general',
  source      TEXT        NOT NULL DEFAULT 'whatsapp',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_kb_created_at ON knowledge_base(created_at);

CREATE TABLE IF NOT EXISTS clients (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id    TEXT        UNIQUE NOT NULL,
  name             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extend clients table with agency fields (safe to re-run)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS meta_ad_account_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS vertical TEXT NOT NULL DEFAULT 'leads';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS campaign_briefs (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id          UUID        REFERENCES clients(id) ON DELETE SET NULL,
  avatar             TEXT        NOT NULL,
  offer              TEXT        NOT NULL,
  daily_budget       NUMERIC(10,2) NOT NULL,
  cpl_cap            NUMERIC(10,2) NOT NULL,
  scaling_rules      JSONB       NOT NULL DEFAULT '{}',
  frequency_cap      INTEGER     NOT NULL DEFAULT 3,
  creative_asset_ids TEXT[]      NOT NULL DEFAULT '{}',
  ad_account_id      TEXT,
  status             TEXT        NOT NULL DEFAULT 'draft',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ad_metrics (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_brief_id    UUID        NOT NULL REFERENCES campaign_briefs(id) ON DELETE CASCADE,
  date                 DATE        NOT NULL,
  impressions          INTEGER     NOT NULL DEFAULT 0,
  clicks               INTEGER     NOT NULL DEFAULT 0,
  spend                NUMERIC(10,2) NOT NULL DEFAULT 0,
  leads                INTEGER     NOT NULL DEFAULT 0,
  cpl                  NUMERIC(10,2),
  ctr                  NUMERIC(8,6),
  fetched_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_actions (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_brief_id    UUID        NOT NULL REFERENCES campaign_briefs(id) ON DELETE CASCADE,
  action_type          TEXT        NOT NULL,
  details              JSONB       NOT NULL DEFAULT '{}',
  triggered_by         TEXT        NOT NULL DEFAULT 'agent',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

// TypeScript types matching the tables

export interface Client {
  id: string;
  clerk_user_id: string;
  name: string | null;
  owner_id: string | null;
  meta_ad_account_id: string | null;
  vertical: "leads" | "ecomm";
  whatsapp_number: string | null;
  notes: string | null;
  status: string;
  created_at: Date;
}

export interface CampaignBrief {
  id: string;
  client_id: string | null;
  avatar: string;
  offer: string;
  daily_budget: string;
  cpl_cap: string;
  scaling_rules: Record<string, unknown>;
  frequency_cap: number;
  creative_asset_ids: string[];
  ad_account_id: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface AdMetric {
  id: string;
  campaign_brief_id: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: string;
  leads: number;
  cpl: string | null;
  ctr: string | null;
  fetched_at: Date;
}

export interface AgentAction {
  id: string;
  campaign_brief_id: string;
  action_type: string;
  details: Record<string, unknown>;
  triggered_by: string;
  created_at: Date;
}
