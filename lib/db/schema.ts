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
ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_customer_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tiktok_advertiser_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS shopify_domain TEXT;

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

CREATE TABLE IF NOT EXISTS affiliate_applications (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  email             TEXT        NOT NULL,
  website           TEXT,
  audience_size     TEXT,
  promotion_plan    TEXT,
  status            TEXT        NOT NULL DEFAULT 'pending',
  affiliate_code    TEXT        UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliates_email ON affiliate_applications(email);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliate_applications(status);

-- Make promotion_plan nullable for zero-friction flow
ALTER TABLE affiliate_applications ALTER COLUMN promotion_plan DROP NOT NULL;

CREATE TABLE IF NOT EXISTS referrals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code  TEXT        NOT NULL REFERENCES affiliate_applications(affiliate_code) ON DELETE CASCADE,
  referred_email  TEXT,
  referred_user_id TEXT,
  status          TEXT        NOT NULL DEFAULT 'signed_up',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_affiliate_code ON referrals(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);

-- Affiliate program v2 — extended columns (safe to re-run)
ALTER TABLE affiliate_applications ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE affiliate_applications ADD COLUMN IF NOT EXISTS stripe_onboarded BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE affiliate_applications ADD COLUMN IF NOT EXISTS is_free_account BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE affiliate_applications ADD COLUMN IF NOT EXISTS total_clicks INTEGER NOT NULL DEFAULT 0;
ALTER TABLE affiliate_applications ADD COLUMN IF NOT EXISTS milestones_reached TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE affiliate_applications ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE affiliate_applications ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE affiliate_applications ADD COLUMN IF NOT EXISTS at_risk_notified_at TIMESTAMPTZ;

-- Plan tracking on referrals
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'growth';
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS plan_amount NUMERIC(10,2) NOT NULL DEFAULT 197.00;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS months_active INTEGER NOT NULL DEFAULT 0;

-- Affiliate payouts table
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code    TEXT        NOT NULL REFERENCES affiliate_applications(affiliate_code) ON DELETE CASCADE,
  amount            NUMERIC(10,2) NOT NULL,
  period_start      DATE        NOT NULL,
  period_end        DATE        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'pending',
  stripe_transfer_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payouts_affiliate_code ON affiliate_payouts(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON affiliate_payouts(status);

-- Per-invoice affiliate commissions. One row per paid Stripe invoice for a referred customer.
-- Rate is 0.50 for the referral's first paid invoice (month 1 promise) and 0.40 thereafter.
-- Cron sums unpaid rows and bundles them into an affiliate_payouts transfer.
CREATE TABLE IF NOT EXISTS referral_commissions (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id          UUID          NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  affiliate_code       TEXT          NOT NULL REFERENCES affiliate_applications(affiliate_code) ON DELETE CASCADE,
  stripe_invoice_id    TEXT          NOT NULL UNIQUE,
  invoice_amount       NUMERIC(10,2) NOT NULL,
  commission_rate      NUMERIC(4,2)  NOT NULL,
  commission_amount    NUMERIC(10,2) NOT NULL,
  invoice_paid_at      TIMESTAMPTZ   NOT NULL,
  payout_id            UUID          REFERENCES affiliate_payouts(id) ON DELETE SET NULL,
  paid_to_affiliate    BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_code ON referral_commissions(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_commissions_referral_id ON referral_commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_commissions_unpaid ON referral_commissions(affiliate_code, paid_to_affiliate) WHERE paid_to_affiliate = FALSE;

-- Reverses a commission row when the underlying Stripe charge is refunded or
-- disputed. The payout cron filters these out so we never pay out on
-- charges Stripe later took back.
ALTER TABLE referral_commissions ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- Webhook idempotency. Created here for completeness — the table already
-- exists in prod via inline DDL in lib/webhook-idempotency.ts.
CREATE TABLE IF NOT EXISTS processed_webhooks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    TEXT        NOT NULL,
  event_id    TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_processed_webhooks_lookup ON processed_webhooks(provider, event_id);

-- Rate limit hits, keyed by (bucket, key, window_start). Supports counting
-- distinct request hits in a time window without external infra.
CREATE TABLE IF NOT EXISTS rate_limit_hits (
  id           BIGSERIAL    PRIMARY KEY,
  bucket       TEXT         NOT NULL,
  key          TEXT         NOT NULL,
  hit_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup ON rate_limit_hits(bucket, key, hit_at);

-- Tenant-scope knowledge_base. Without owner_id, every user's WhatsApp "new
-- rule" message landed in a global table that the agent loop and conversation
-- handler read for every user — letting one tenant's instructions leak into
-- another tenant's prompts.
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS owner_id TEXT;
CREATE INDEX IF NOT EXISTS idx_knowledge_base_owner ON knowledge_base(owner_id);

-- Per-tenant daily spend cap on autonomous-agent budget changes. NULL = no cap.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS agent_daily_spend_cap NUMERIC(10,2);

-- Client targets/budget — previously added inline at every dashboard load.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cpl_target     DECIMAL(10,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS roas_target    DECIMAL(10,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS monthly_budget DECIMAL(12,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_url    TEXT;
-- Meta token columns (also previously added inline by integration routes).
ALTER TABLE clients ADD COLUMN IF NOT EXISTS meta_access_token     TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS meta_token_expires_at TIMESTAMPTZ;

-- ── Audit-fix: missing indexes on owner_id / client_id columns ──────────
CREATE INDEX IF NOT EXISTS idx_creatives_client     ON creatives(client_id);
CREATE INDEX IF NOT EXISTS idx_creatives_user       ON creatives(user_id);
CREATE INDEX IF NOT EXISTS idx_client_rules_owner   ON client_rules(owner_id);
CREATE INDEX IF NOT EXISTS idx_client_rules_client  ON client_rules(client_id);
CREATE INDEX IF NOT EXISTS idx_pending_campaigns_client ON pending_campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_owner  ON agent_actions(owner_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_ad_set ON agent_actions(ad_set_id);
CREATE INDEX IF NOT EXISTS idx_campaign_budget_changes_client ON campaign_budget_changes(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_learnings_client ON agent_learnings(client_id);
CREATE INDEX IF NOT EXISTS idx_user_metric_presets_owner ON user_metric_presets(owner_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user ON referrals(referred_user_id);

-- Composite indexes on the metrics hot path. Every dashboard route filters
-- by ad_account_id and date_recorded; without these, queries seq-scan.
CREATE INDEX IF NOT EXISTS idx_ad_metrics_account_date ON ad_metrics(ad_account_id, date_recorded DESC);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_brief_date   ON ad_metrics(campaign_brief_id, date_recorded DESC);

-- Reject obviously-bad commission rates at write time. The migrate runner
-- already swallows "already exists" / "duplicate" errors, so re-running is safe.
ALTER TABLE referral_commissions ADD CONSTRAINT commission_rate_chk
  CHECK (commission_rate >= 0 AND commission_rate <= 1);

-- User subscriptions — tracks Stripe subscription status per Clerk user
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id          TEXT        UNIQUE NOT NULL,
  stripe_customer_id     TEXT        NOT NULL,
  stripe_subscription_id TEXT        NOT NULL,
  status                 TEXT        NOT NULL DEFAULT 'trialing',
  plan_name              TEXT,
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_clerk_user_id ON user_subscriptions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);

-- User WhatsApp number for agent alerts and weekly reports
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Platform support on campaign_briefs (meta | google | tiktok | shopify)
ALTER TABLE campaign_briefs ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'meta';
ALTER TABLE campaign_briefs ADD COLUMN IF NOT EXISTS google_campaign_resource_name TEXT;
ALTER TABLE campaign_briefs ADD COLUMN IF NOT EXISTS google_budget_resource_name TEXT;
ALTER TABLE campaign_briefs ADD COLUMN IF NOT EXISTS google_ad_group_resource_name TEXT;
ALTER TABLE campaign_briefs ADD COLUMN IF NOT EXISTS google_customer_id TEXT;

-- Google Ads OAuth connections
CREATE TABLE IF NOT EXISTS google_ads_connections (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id    TEXT        UNIQUE NOT NULL,
  access_token     TEXT,
  refresh_token    TEXT        NOT NULL,
  customer_id      TEXT,
  manager_id       TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_google_ads_conn_user ON google_ads_connections(clerk_user_id);

-- Google Ads campaign metrics (synced daily)
CREATE TABLE IF NOT EXISTS google_ad_metrics (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id    TEXT        NOT NULL,
  customer_id      TEXT        NOT NULL,
  campaign_id      TEXT        NOT NULL,
  campaign_name    TEXT,
  date_recorded    DATE        NOT NULL,
  impressions      INTEGER     NOT NULL DEFAULT 0,
  clicks           INTEGER     NOT NULL DEFAULT 0,
  spend            NUMERIC(10,2) NOT NULL DEFAULT 0,
  conversions      NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_per_conv    NUMERIC(10,2),
  ctr              NUMERIC(8,6),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clerk_user_id, campaign_id, date_recorded)
);

CREATE INDEX IF NOT EXISTS idx_google_ad_metrics_user ON google_ad_metrics(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_google_ad_metrics_date ON google_ad_metrics(date_recorded);

-- TikTok Ads connections
CREATE TABLE IF NOT EXISTS tiktok_ads_connections (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id    TEXT        UNIQUE NOT NULL,
  access_token     TEXT,
  refresh_token    TEXT,
  advertiser_id    TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tiktok_ads_conn_user ON tiktok_ads_connections(clerk_user_id);

-- TikTok campaign metrics (synced daily)
CREATE TABLE IF NOT EXISTS tiktok_ad_metrics (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id    TEXT        NOT NULL,
  advertiser_id    TEXT        NOT NULL,
  campaign_id      TEXT        NOT NULL,
  campaign_name    TEXT,
  campaign_status  TEXT,
  date_recorded    DATE        NOT NULL,
  impressions      INTEGER     NOT NULL DEFAULT 0,
  clicks           INTEGER     NOT NULL DEFAULT 0,
  spend            NUMERIC(10,2) NOT NULL DEFAULT 0,
  conversions      NUMERIC(10,2) NOT NULL DEFAULT 0,
  cpa              NUMERIC(10,2),
  ctr              NUMERIC(8,6),
  video_play_actions INTEGER   DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clerk_user_id, campaign_id, date_recorded)
);

CREATE INDEX IF NOT EXISTS idx_tiktok_ad_metrics_user ON tiktok_ad_metrics(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_ad_metrics_date ON tiktok_ad_metrics(date_recorded);

-- Shopify store connections
CREATE TABLE IF NOT EXISTS shopify_connections (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id    TEXT        UNIQUE NOT NULL,
  shop             TEXT        NOT NULL,
  shop_name        TEXT,
  access_token     TEXT        NOT NULL,
  scope            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shopify_conn_user ON shopify_connections(clerk_user_id);

-- Shopify daily metrics (synced by cron)
CREATE TABLE IF NOT EXISTS shopify_metrics (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id    TEXT          NOT NULL,
  shop             TEXT          NOT NULL,
  date_recorded    DATE          NOT NULL,
  orders           INTEGER       NOT NULL DEFAULT 0,
  revenue          NUMERIC(12,2) NOT NULL DEFAULT 0,
  avg_order_value  NUMERIC(10,2),
  sessions         INTEGER       NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE(clerk_user_id, shop, date_recorded)
);

CREATE INDEX IF NOT EXISTS idx_shopify_metrics_user ON shopify_metrics(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_shopify_metrics_date ON shopify_metrics(date_recorded);

-- Slack workspace connections
CREATE TABLE IF NOT EXISTS slack_connections (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id    TEXT        UNIQUE NOT NULL,
  team_id          TEXT        NOT NULL,
  team_name        TEXT,
  access_token     TEXT        NOT NULL,
  webhook_url      TEXT,
  webhook_channel  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_slack_conn_user ON slack_connections(clerk_user_id);

-- Team invites — pending email invitations sent by agency owner
CREATE TABLE IF NOT EXISTS team_invites (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_clerk_user_id  TEXT        NOT NULL,
  email                TEXT        NOT NULL,
  role                 TEXT        NOT NULL DEFAULT 'viewer',
  token                TEXT        NOT NULL UNIQUE,
  expires_at           TIMESTAMPTZ NOT NULL,
  accepted_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token);
CREATE INDEX IF NOT EXISTS idx_team_invites_owner ON team_invites(owner_clerk_user_id);

-- Team members — accepted invites linking member Clerk IDs to owner
CREATE TABLE IF NOT EXISTS team_members (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_clerk_user_id  TEXT        NOT NULL,
  member_clerk_user_id TEXT        NOT NULL,
  role                 TEXT        NOT NULL DEFAULT 'viewer',
  name                 TEXT,
  email                TEXT,
  joined_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_clerk_user_id, member_clerk_user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_owner ON team_members(owner_clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member ON team_members(member_clerk_user_id);

-- Workspace branding — per-agency white-label config
CREATE TABLE IF NOT EXISTS workspace_branding (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_clerk_user_id  TEXT        UNIQUE NOT NULL,
  agency_name          TEXT,
  logo_url             TEXT,
  primary_color        TEXT        NOT NULL DEFAULT '#f5a623',
  custom_domain        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_branding_owner ON workspace_branding(owner_clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_branding_domain ON workspace_branding(custom_domain);

-- Client portal — contact email on client record
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Client login tokens — magic link auth for client portal
CREATE TABLE IF NOT EXISTS client_login_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_login_tokens_token ON client_login_tokens(token);
CREATE INDEX IF NOT EXISTS idx_client_login_tokens_client ON client_login_tokens(client_id);

-- Support tickets — persisted so owner dashboard can show/manage them
CREATE TABLE IF NOT EXISTS support_tickets (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id  TEXT        NOT NULL,
  user_email     TEXT,
  user_name      TEXT,
  subject        TEXT        NOT NULL,
  description    TEXT        NOT NULL,
  category       TEXT        NOT NULL DEFAULT 'general',
  status         TEXT        NOT NULL DEFAULT 'open',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at);

-- Feedback submissions — persisted so owner dashboard can show/manage them
CREATE TABLE IF NOT EXISTS feedback_submissions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id  TEXT        NOT NULL,
  user_email     TEXT,
  user_name      TEXT,
  message        TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'open',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_submissions(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback_submissions(created_at);

-- Autonomous mode toggle — when true, AI executes immediately; when false (default), AI stores pending recommendations
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS autonomous_mode BOOLEAN NOT NULL DEFAULT false;

-- Status tracking on agent_actions — pending (awaiting approval) | executed | approved | rejected
ALTER TABLE agent_actions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'executed';
CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON agent_actions(status);

-- ═══════════════════════════════════════════════════════════════════════
-- AUDIT FIX: Missing columns on ad_metrics (code queries these)
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE ad_metrics ADD COLUMN IF NOT EXISTS ad_set_id TEXT;
ALTER TABLE ad_metrics ADD COLUMN IF NOT EXISTS ad_set_name TEXT;
ALTER TABLE ad_metrics ADD COLUMN IF NOT EXISTS ad_status TEXT;
ALTER TABLE ad_metrics ADD COLUMN IF NOT EXISTS ad_account_id TEXT;
ALTER TABLE ad_metrics ADD COLUMN IF NOT EXISTS campaign_id TEXT;
ALTER TABLE ad_metrics ADD COLUMN IF NOT EXISTS frequency NUMERIC(10,2);
ALTER TABLE ad_metrics ADD COLUMN IF NOT EXISTS date_recorded DATE;
-- After migration, run manually if needed: UPDATE ad_metrics SET date_recorded = date WHERE date_recorded IS NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- AUDIT FIX: Missing columns on agent_actions (code queries these)
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE agent_actions ADD COLUMN IF NOT EXISTS ad_set_id TEXT;
ALTER TABLE agent_actions ADD COLUMN IF NOT EXISTS ad_account_id TEXT;
ALTER TABLE agent_actions ADD COLUMN IF NOT EXISTS action_details JSONB DEFAULT '{}';
ALTER TABLE agent_actions ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE agent_actions ADD COLUMN IF NOT EXISTS resolved_by TEXT;
ALTER TABLE agent_actions ADD COLUMN IF NOT EXISTS owner_id TEXT;
-- After migration, run manually if needed: UPDATE agent_actions SET action_details = details WHERE action_details = '{}' AND details != '{}';

-- ═══════════════════════════════════════════════════════════════════════
-- AUDIT FIX: Missing columns on clients (code queries these)
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE clients ADD COLUMN IF NOT EXISTS meta_page_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS meta_access_token TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_url TEXT;

-- ═══════════════════════════════════════════════════════════════════════
-- AUDIT FIX: Missing tables referenced in code
-- ═══════════════════════════════════════════════════════════════════════

-- User metric presets (dashboard column customization)
CREATE TABLE IF NOT EXISTS user_metric_presets (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   TEXT        NOT NULL,
  name       TEXT        NOT NULL,
  columns    JSONB       NOT NULL DEFAULT '[]',
  is_default BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campaign budget change log
CREATE TABLE IF NOT EXISTS campaign_budget_changes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT        NOT NULL,
  client_id   UUID,
  old_budget  NUMERIC(12,2),
  new_budget  NUMERIC(12,2),
  pct         NUMERIC(8,2),
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Creatives (also created inline in /api/clients/[id]/creatives)
CREATE TABLE IF NOT EXISTS creatives (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID        NOT NULL,
  user_id    TEXT        NOT NULL,
  name       TEXT        NOT NULL,
  format     TEXT        NOT NULL DEFAULT 'image',
  status     TEXT        NOT NULL DEFAULT 'testing',
  hook       TEXT,
  spend      NUMERIC(12,2),
  cpl        NUMERIC(12,2),
  roas       NUMERIC(8,4),
  ctr        NUMERIC(8,6),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports (generated weekly/on-demand)
CREATE TABLE IF NOT EXISTS reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  client_id   UUID,
  client_name TEXT,
  token       TEXT        UNIQUE NOT NULL,
  start_date  DATE,
  end_date    DATE,
  snapshot    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_token ON reports(token);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);

-- Action log (audit trail)
CREATE TABLE IF NOT EXISTS action_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    TEXT        NOT NULL,
  client_id   UUID,
  client_name TEXT,
  action_type TEXT        NOT NULL,
  details     JSONB       DEFAULT '{}',
  meta        JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_action_log_owner ON action_log(owner_id);
CREATE INDEX IF NOT EXISTS idx_action_log_created ON action_log(created_at);

-- Pending campaigns (review queue)
CREATE TABLE IF NOT EXISTS pending_campaigns (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID        NOT NULL,
  owner_id      TEXT        NOT NULL,
  campaign_data JSONB       NOT NULL DEFAULT '{}',
  status        TEXT        NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_campaigns_status ON pending_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_pending_campaigns_owner ON pending_campaigns(owner_id);

-- Affiliate login tokens (magic link)
CREATE TABLE IF NOT EXISTS affiliate_login_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  token      TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_login_token ON affiliate_login_tokens(token);

-- Agent learnings (accumulated from conversation analysis)
CREATE TABLE IF NOT EXISTS agent_learnings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    TEXT        NOT NULL,
  client_id   UUID,
  category    TEXT        NOT NULL DEFAULT 'general',
  content     TEXT        NOT NULL,
  source      TEXT        NOT NULL DEFAULT 'agent',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_learnings_owner ON agent_learnings(owner_id);

-- Client rules (also created inline in rules route)
CREATE TABLE IF NOT EXISTS client_rules (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    TEXT        NOT NULL,
  client_id   TEXT        NOT NULL,
  rule_text   TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'general',
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  source      TEXT        NOT NULL DEFAULT 'chat',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════
-- AUDIT FIX: Missing indexes on frequently queried columns
-- ═══════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_clients_owner_id ON clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_clients_meta_ad_account ON clients(meta_ad_account_id);
CREATE INDEX IF NOT EXISTS idx_clients_google_customer ON clients(google_customer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_ad_account ON campaign_briefs(ad_account_id);
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_status ON campaign_briefs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_created ON campaign_briefs(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback_submissions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_ad_set ON ad_metrics(ad_set_id);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_account ON ad_metrics(ad_account_id);

-- Site traffic tracking (owner dashboard analytics)
CREATE TABLE IF NOT EXISTS site_traffic (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  path        TEXT        NOT NULL,
  referrer    TEXT,
  user_agent  TEXT,
  country     TEXT,
  visitor_id  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_traffic_created ON site_traffic(created_at);
CREATE INDEX IF NOT EXISTS idx_site_traffic_path ON site_traffic(path);
CREATE INDEX IF NOT EXISTS idx_site_traffic_visitor ON site_traffic(visitor_id);
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
  status: string;
  created_at: Date;
}
