# Buena Onda — Master QA Checklist

> Every feature, integration, flow, and external service. Check off each item before going live.
> Off-platform setup items are marked 🔧. In-app items are unmarked.

---

## 🔧 DNS (Porkbun)

- [ ] `buenaonda.ai` A record → `216.198.79.1` (Vercel)
- [ ] `www.buenaonda.ai` CNAME → Vercel
- [ ] MX records — all 5 Google Workspace records present (aspmx, alt1–alt4)
- [ ] No rogue MX records (`smtp.google.com`, `inbound-smtp.amazonaws.com` removed)
- [ ] `send.buenaonda.ai` MX → `feedback-smtp.us-east-1.amazonses.com` (Resend)
- [ ] `send.buenaonda.ai` TXT → SPF `v=spf1 include:amazonses.com ~all`
- [ ] `resend._domainkey.buenaonda.ai` TXT → DKIM key from Resend
- [ ] `google._domainkey.buenaonda.ai` TXT → DKIM key from Google Workspace
- [ ] `_dmarc.buenaonda.ai` TXT → DMARC policy
- [ ] `google-site-verification` TXT → Google Search Console
- [ ] `accounts.buenaonda.ai` CNAME → Clerk
- [ ] `clerk.buenaonda.ai` CNAME → Clerk frontend API
- [ ] `clkmail.buenaonda.ai` CNAME → Clerk mail
- [ ] `clk._domainkey.buenaonda.ai` CNAME → Clerk DKIM
- [ ] `clk2._domainkey.buenaonda.ai` CNAME → Clerk DKIM2
- [ ] MXToolbox `buenaonda.ai` shows all 5 Google MX records, no others
- [ ] MXToolbox DKIM test passes for `buenaonda.ai`
- [ ] MXToolbox SPF test passes for `send.buenaonda.ai`

---

## 🔧 Google Workspace

- [ ] `hello@buenaonda.ai` mailbox exists in Google Workspace admin
- [ ] Send test email from personal Gmail → arrives in `hello@buenaonda.ai`
- [ ] Reply from `hello@buenaonda.ai` → arrives at sender
- [ ] Google Workspace domain verified (MX records confirmed)
- [ ] 2FA enabled on the Google Workspace admin account

---

## 🔧 Clerk (Auth Platform)

- [ ] App is under business org (not personal Gmail account)
- [ ] Production instance active (not development)
- [ ] Custom domain `accounts.buenaonda.ai` configured and verified in Clerk
- [ ] `clerk.buenaonda.ai` CNAME verified
- [ ] Email provider: Clerk using custom SMTP or verified domain for outbound
- [ ] Sign-up email template — from address correct (`no-reply@buenaonda.ai` or similar)
- [ ] Test: receive Clerk verification email at `hello@buenaonda.ai`
- [ ] Test: receive Clerk magic link / password reset email
- [ ] Google OAuth provider enabled and configured in Clerk
- [ ] Google OAuth Client ID + Secret set in Clerk dashboard
- [ ] Allowed redirect URLs include `https://buenaonda.ai`
- [ ] Webhook endpoint configured in Clerk → `https://buenaonda.ai/api/webhooks/clerk` (if used)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` set in Vercel (production)
- [ ] `CLERK_SECRET_KEY` set in Vercel (production)
- [ ] `CLERK_WEBHOOK_SECRET` set in Vercel (if webhook used)

---

## 🔧 Resend (Email Sending)

- [ ] `buenaonda.ai` domain verified in Resend dashboard (green checkmark)
- [ ] `send.buenaonda.ai` subdomain verified in Resend
- [ ] DKIM record verified in Resend
- [ ] SPF record verified in Resend
- [ ] `RESEND_API_KEY` set in Vercel (production)
- [ ] Test send from Resend dashboard → arrives at `hello@buenaonda.ai`
- [ ] Test: submit support ticket in-app → email arrives at `hello@buenaonda.ai`
- [ ] Test: submit feedback in-app → email arrives at `hello@buenaonda.ai`
- [ ] Test: submit feedback → confirmation email arrives at user's address
- [ ] Test: submit support ticket → confirmation email arrives at user's address
- [ ] Test: affiliate magic link email arrives and link works
- [ ] Test: client portal magic link email arrives and link works
- [ ] Test: white-label domain submission → notification email arrives at `hello@buenaonda.ai`

---

## 🔧 Stripe (Billing)

- [ ] Stripe account in **Live mode** (not Test mode)
- [ ] Product created: "Buena Onda" — $197/mo
- [ ] Price ID matches `STRIPE_PRICE_ID` env var
- [ ] Webhook endpoint registered in Stripe → `https://buenaonda.ai/api/webhooks/stripe`
- [ ] Webhook events enabled: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- [ ] `STRIPE_SECRET_KEY` set in Vercel (Live key, not test)
- [ ] `STRIPE_WEBHOOK_SECRET` set in Vercel
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` set in Vercel
- [ ] Test checkout: complete payment → subscription created in `user_subscriptions` DB table
- [ ] Test webhook fires and updates `user_subscriptions.status` to `active`
- [ ] Trial period creates `trialing` status in DB
- [ ] Cancel subscription → webhook fires → status updated to `cancelled`
- [ ] Failed payment → webhook fires → status updated to `unpaid`
- [ ] Stripe customer portal link works (if implemented)
- [ ] Subscription status gate: non-subscribed user cannot access gated features

---

## 🔧 Meta (Facebook/Instagram Ads)

- [ ] Meta App in **Live mode** (not Development)
- [ ] Meta Business Verification completed (or in progress)
- [ ] OAuth App ID and Secret set: `META_APP_ID`, `META_APP_SECRET` in Vercel
- [ ] Redirect URI registered in Meta App: `https://buenaonda.ai/api/oauth/meta/callback`
- [ ] Required permissions granted: `ads_management`, `ads_read`, `business_management`, `pages_read_engagement`
- [ ] Token refresh cron working: `/api/cron/refresh-meta-tokens` runs daily
- [ ] `META_CRON_SECRET` or `CRON_SECRET` set in Vercel
- [ ] Test: Connect Meta on a client → redirects to Meta OAuth → returns to app with "Connected"
- [ ] Test: Meta ad metrics pull → data populates in `ad_metrics` table
- [ ] Test: Meta cron sync runs and updates today's metrics

---

## 🔧 Google Ads

- [ ] Google Ads OAuth Client ID + Secret set: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- [ ] Redirect URI registered: `https://buenaonda.ai/api/oauth/google/callback`
- [ ] `GOOGLE_ADS_DEVELOPER_TOKEN` set in Vercel
- [ ] Test: Connect Google Ads single account → auto-saves, redirects with `google_connected`
- [ ] Test: Connect Google Ads multiple accounts → picker modal appears
- [ ] Test: Google cron sync runs and updates `google_ad_metrics`
- [ ] Google Ads cron: `/api/cron/google-ads-sync` runs daily at 7am UTC

---

## 🔧 TikTok Ads

- [ ] TikTok Ads OAuth App ID + Secret set: `TIKTOK_APP_ID`, `TIKTOK_APP_SECRET`
- [ ] Redirect URI registered: `https://buenaonda.ai/api/oauth/tiktok/callback`
- [ ] Test: Connect TikTok single advertiser → auto-saves
- [ ] Test: Connect TikTok multiple advertisers → picker modal
- [ ] TikTok cron: `/api/cron/tiktok-ads-sync` runs daily at 7am UTC

---

## 🔧 Shopify

- [ ] Shopify App Client ID + Secret set: `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`
- [ ] Redirect URI registered in Shopify Partners: `https://buenaonda.ai/api/oauth/shopify/callback`
- [ ] Test: Connect Shopify → domain modal → OAuth redirect → returns with `shopify_connected`
- [ ] Shopify cron: `/api/cron/shopify-sync` runs daily at 7:30am UTC
- [ ] Shopify orders sync → `shopify_metrics` table populated
- [ ] Shopify metrics visible in Reports tab

---

## 🔧 WhatsApp / Meta Cloud API

- [ ] WhatsApp Business Account verified and approved
- [ ] Phone number registered and active
- [ ] `WHATSAPP_PHONE_NUMBER_ID` set in Vercel
- [ ] `WHATSAPP_ACCESS_TOKEN` set in Vercel
- [ ] `OWNER_WHATSAPP_NUMBER` set in Vercel (Mike's number, e.g. `+15551234567`)
- [ ] Webhook registered: `https://buenaonda.ai/api/whatsapp/webhook`
- [ ] `WHATSAPP_VERIFY_TOKEN` set in Vercel
- [ ] Test: send WhatsApp message to a user from owner outreach modal → message arrives
- [ ] Test: reply to WhatsApp bot → AI responds with correct action
- [ ] Test: daily cron digest → WhatsApp message arrives on `OWNER_WHATSAPP_NUMBER`
- [ ] WhatsApp message template approved (if using templates for outbound)

---

## 🔧 Slack

- [ ] Slack App created in Slack API dashboard
- [ ] `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` set in Vercel
- [ ] Redirect URI registered in Slack App: `https://buenaonda.ai/api/oauth/slack/callback`
- [ ] `SLACK_SIGNING_SECRET` set in Vercel (for webhook verification)
- [ ] Test: Connect Slack in Settings → OAuth redirect → returns with `slack=connected`
- [ ] Connected Slack shows workspace name in Settings
- [ ] Welcome message sent to Slack channel on connect
- [ ] Test: AI sends performance report to Slack channel
- [ ] Test: Reply to Slack bot → AI responds and takes action
- [ ] Team Slack reports working (if configured)

---

## 🔧 Vercel (Hosting & Crons)

- [ ] Production deployment active and healthy
- [ ] `buenaonda.ai` custom domain added in Vercel and DNS verified
- [ ] `www.buenaonda.ai` redirects to `buenaonda.ai`
- [ ] SSL certificate active (green padlock)
- [ ] All environment variables set in Vercel **Production** (not just Preview)
- [ ] Crons enabled in Vercel (requires Pro plan or higher for custom cron schedules)
- [ ] Verify all cron routes in `vercel.json` are present:
  - [ ] `/api/cron/refresh-meta-tokens` — 6am UTC daily
  - [ ] `/api/cron/demo-reset` — 5am UTC daily
  - [ ] `/api/cron/affiliate-billing` — 9am UTC 1st of month
  - [ ] `/api/cron/whatsapp-report` — 1pm UTC Mondays
  - [ ] `/api/cron/google-ads-sync` — 7am UTC daily
  - [ ] `/api/cron/tiktok-ads-sync` — 7am UTC daily
  - [ ] `/api/cron/shopify-sync` — 7:30am UTC daily
  - [ ] `/api/cron/owner-alerts` — 8am UTC daily
- [ ] `CRON_SECRET` set in Vercel
- [ ] Function timeouts set in `vercel.json` (chat: 120s, others: 30-60s)
- [ ] Vercel hobby → upgrade if needed for cron frequency

---

## 🔧 Neon (Database)

- [ ] `DATABASE_URL` set in Vercel (production connection string)
- [ ] `/api/db/migrate` run successfully on production DB
- [ ] All tables exist (run `\dt` in Neon console or check migrate output):
  - [ ] `user_subscriptions`
  - [ ] `clients`
  - [ ] `campaign_briefs`
  - [ ] `ad_metrics`
  - [ ] `google_ad_metrics`
  - [ ] `tiktok_ad_metrics`
  - [ ] `shopify_metrics`
  - [ ] `agent_actions`
  - [ ] `creatives`
  - [ ] `team_invites`
  - [ ] `team_members`
  - [ ] `affiliate_accounts`
  - [ ] `affiliate_login_tokens`
  - [ ] `affiliate_payouts`
  - [ ] `support_tickets`
  - [ ] `feedback_submissions`
  - [ ] `workspace_branding`
  - [ ] `client_login_tokens`
  - [ ] `slack_connections`
  - [ ] `chat_history` (if persisted)
- [ ] DB connection pool healthy (no connection limit errors under load)

---

## 🔧 Environment Variables (Vercel Production — Full List)

- [ ] `DATABASE_URL`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `RESEND_API_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_PRICE_ID`
- [ ] `META_APP_ID`
- [ ] `META_APP_SECRET`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_ADS_DEVELOPER_TOKEN`
- [ ] `TIKTOK_APP_ID`
- [ ] `TIKTOK_APP_SECRET`
- [ ] `SHOPIFY_CLIENT_ID`
- [ ] `SHOPIFY_CLIENT_SECRET`
- [ ] `SLACK_CLIENT_ID`
- [ ] `SLACK_CLIENT_SECRET`
- [ ] `SLACK_SIGNING_SECRET`
- [ ] `WHATSAPP_PHONE_NUMBER_ID`
- [ ] `WHATSAPP_ACCESS_TOKEN`
- [ ] `WHATSAPP_VERIFY_TOKEN`
- [ ] `OWNER_WHATSAPP_NUMBER`
- [ ] `OWNER_CLERK_USER_ID`
- [ ] `OWNER_EMAIL`
- [ ] `CRON_SECRET`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` (= `https://buenaonda.ai`)

---

## 🔐 Auth & Onboarding

- [ ] Sign up with email — confirmation email arrives at inbox (not spam)
- [ ] Sign up with Google OAuth — works end to end
- [ ] Sign in with email
- [ ] Sign in with Google OAuth
- [ ] Wrong password shows proper error
- [ ] Forgot password flow works end to end — email arrives
- [ ] After sign up → lands on correct page (dashboard or onboarding)
- [ ] After sign in → lands on dashboard
- [ ] Sign out → redirected to sign-in page
- [ ] Unauthenticated user hitting `/dashboard/*` → redirected to sign-in
- [ ] Unauthenticated user hitting `/api/*` → returns 401, not a crash
- [ ] New user without subscription → prompted/gated correctly
- [ ] Non-owner hitting `/owner` → 404 (not 403, not redirect)
- [ ] Non-owner hitting `/api/owner/*` → 404

---

## 🧭 Dashboard Nav

- [ ] All nav items highlight correctly on active route
- [ ] Overview, Campaigns, Clients, Creatives, Ads, Reports, Review, History, Team, Settings all load
- [ ] Client switcher opens/closes
- [ ] Client switcher search filters correctly
- [ ] Selecting client from switcher navigates to Campaigns
- [ ] "Manage clients" in switcher → Clients page
- [ ] "Add one" when no clients → Clients page
- [ ] Help button opens AI chat bubble
- [ ] UserButton (Clerk) opens account menu
- [ ] Mobile: hamburger menu appears
- [ ] Mobile: sheet opens, nav links navigate and close sheet
- [ ] Demo mode banner shows when in demo
- [ ] Demo mode "Start Free" → sign-up page

---

## 👥 Clients Tab

- [ ] Page loads with client list
- [ ] Empty state shows when no clients
- [ ] Add client — name required validation
- [ ] Add client — vertical selector (leads/ecomm)
- [ ] Add client — saves and appears in list
- [ ] Edit client — save updates list
- [ ] Delete client — confirmation, removed from list
- [ ] Client card shows correct vertical color dot
- [ ] Client card shows correct status (active/paused)
- [ ] **Connect Meta** → OAuth redirect → returns "Connected"
- [ ] **Connect Google Ads** single account → auto-saves, `google_connected` state
- [ ] **Connect Google Ads** multiple accounts → picker modal
- [ ] **Connect TikTok** single advertiser → auto-saves
- [ ] **Connect TikTok** multiple advertisers → picker modal
- [ ] **Connect Shopify** → domain modal → OAuth → `shopify_connected` state
- [ ] **Portal button** shows on each client card
- [ ] Portal modal opens with email input
- [ ] Portal email field required validation
- [ ] Send portal link → magic link email arrives at client email
- [ ] `contact_email` saved on client record after sending portal link

---

## 📋 Campaigns

- [ ] Loads campaigns for active client
- [ ] Empty state when no campaigns
- [ ] Switching client reloads campaigns
- [ ] Campaign cards show correct status, spend, leads, CPL
- [ ] Click into campaign → detail view loads
- [ ] Campaign detail shows ad set metrics
- [ ] Agent actions log shows for campaign
- [ ] Pause/resume campaign button works
- [ ] Budget adjustment reflects correctly

---

## ✍️ New Campaign Brief

- [ ] Form loads clean
- [ ] All required fields validated
- [ ] Avatar, offer, daily budget, CPL cap, frequency cap
- [ ] Ad account ID pre-filled from active client
- [ ] Scaling rules configurable
- [ ] Submit creates brief, redirects to campaigns
- [ ] Brief appears in campaigns list

---

## 🎨 Creatives

- [ ] Page loads
- [ ] Upload creative — file picker opens, upload works
- [ ] Uploaded creative appears in list with preview
- [ ] Delete creative — removed from list
- [ ] Assign creative to campaign brief
- [ ] Creative fatigue log shows flagged ads

---

## 📊 Ads

- [ ] Page loads, shows ad metrics for active client
- [ ] Date range filtering works
- [ ] Platform filter (Meta/Google/TikTok) works
- [ ] Metrics correct (spend, impressions, clicks, CTR, CPL)
- [ ] Empty state when no data

---

## 📈 Reports

- [ ] Page loads for active client
- [ ] Metrics load correctly, charts render
- [ ] Date range selector works
- [ ] Shopify metrics section shows if connected
- [ ] Google/TikTok sections show if connected
- [ ] "Share report" generates shareable URL
- [ ] Shared report URL accessible without login (read-only)

---

## 🔍 Review

- [ ] Page loads, creative fatigue items show
- [ ] Approve/reject actions work, status updates
- [ ] Empty state when nothing to review

---

## 📜 History

- [ ] Page loads, agent actions in reverse chronological order
- [ ] Filter by client works
- [ ] Filter by action type works
- [ ] Actions show correct details/metadata

---

## 👨‍👩‍👧 Team

- [ ] Page loads clean
- [ ] Invite form — email required, role selector (Viewer/Manager/Admin)
- [ ] Send invite — email arrives with correct token link
- [ ] Pending invite appears in list
- [ ] Cancel invite removes it
- [ ] `/team/accept?token=xxx` — not signed in → shows Clerk SignIn
- [ ] Sign in on accept page → auto-accepts → redirects to `/dashboard`
- [ ] Sign up on accept page → auto-accepts → redirects to `/dashboard`
- [ ] Team member appears in Members list after accepting
- [ ] Team member logs in → sees owner's clients and data (not their own empty account)
- [ ] Role change → updates immediately
- [ ] Remove member → removed from list
- [ ] Expired invite (>7 days) → error on accept page
- [ ] Already-used invite → error on accept page

---

## ⚙️ Settings

- [ ] Page loads
- [ ] WhatsApp number — save works, persists on reload
- [ ] WhatsApp number — blank clears it
- [ ] Connect Slack → OAuth redirect → `slack=connected` success state
- [ ] Connected Slack shows workspace name
- [ ] Slack welcome message sent on connect (check Slack channel)
- [ ] **White-label Branding section visible** for subscribed users
- [ ] White-label locked/overlay shows for non-subscribed users
- [ ] Agency name saves and persists
- [ ] Logo URL saves and persists
- [ ] Primary color — color picker works
- [ ] Primary color — hex input works
- [ ] Primary color swatch preview updates live
- [ ] Custom domain field — typing shows DNS instructions inline
- [ ] DNS instructions show correct CNAME record details
- [ ] Save branding — success message appears
- [ ] Save branding with domain — message mentions 24-hour activation
- [ ] Save branding with domain → notification email arrives at `hello@buenaonda.ai`
- [ ] Notification email shows agency name, domain, action steps
- [ ] Non-subscribed user trying to save branding → 403 returned, locked UI shown

---

## 🤖 AI Chat Bubble

- [ ] Chat bubble appears on all dashboard pages
- [ ] Opens on help button click
- [ ] Message sends, response streams back
- [ ] Chat context knows which client is active
- [ ] Close button works
- [ ] Conversation persists within session
- [ ] AI can answer questions about campaigns, metrics, recommendations
- [ ] AI can take actions (pause/resume, budget adjustments) when asked

---

## 💬 Feedback & Support

- [ ] Feedback button visible throughout dashboard
- [ ] Opens feedback modal
- [ ] Submit sends feedback
- [ ] Success state shows after submit
- [ ] Feedback stored in `feedback_submissions` table in DB
- [ ] Feedback email arrives at `hello@buenaonda.ai` with user info + message
- [ ] Feedback email has Reply-To set to user's email
- [ ] Support ticket modal — subject and description required
- [ ] Category selector works
- [ ] Submit stores ticket in `support_tickets` table
- [ ] Support ticket email arrives at `hello@buenaonda.ai`
- [ ] Confirmation email arrives at user's email with ticket summary

---

## 🏷️ Affiliate Dashboard

- [ ] `/affiliates/dashboard` loads
- [ ] Not logged in → magic link request form
- [ ] Enter email → "Check your email" state
- [ ] Magic link email arrives via Resend
- [ ] Click magic link → redirects through verify → sets cookie → loads dashboard
- [ ] Dashboard shows correct affiliate stats
- [ ] Next Payout, Active clients, Lifetime earned all correct
- [ ] Referral list shows correctly
- [ ] Payout history shows correctly
- [ ] Sign out clears cookie, returns to login form
- [ ] Expired token → `?error=expired` error state
- [ ] Used token → `?error=used` error state
- [ ] Invalid token → `?error=invalid` error state
- [ ] Non-existent email → still shows "check your email" (no enumeration)
- [ ] Affiliate billing cron: `/api/cron/affiliate-billing` fires 1st of month

---

## 🔑 Client Portal (White-label)

- [ ] Send portal link from Clients tab → email arrives at client email
- [ ] Magic link email has correct link format
- [ ] Click portal link → token validated → cookie set → redirects to `/portal/dashboard`
- [ ] `/portal/dashboard` loads with client's campaign data
- [ ] Summary stats correct (campaigns, total spend, leads, avg CPL)
- [ ] Daily metrics table shows last 14 days
- [ ] Campaign list shows correct campaigns for that client only
- [ ] "READ ONLY" badge visible in nav
- [ ] Sign out button clears cookie, returns to portal login
- [ ] Expired token → `/portal/login?error=expired` error page
- [ ] Used token → error page
- [ ] Invalid token → error page
- [ ] Portal login error page tells user to contact agency for new link
- [ ] Client cannot see other clients' data
- [ ] Cookie expires after 30 days

### Client Portal — White-label Branding Applied
- [ ] Portal loads owner's branding (agency name, logo, color)
- [ ] Accent color applied to portal nav and highlights
- [ ] Logo URL shows image if set, falls back to letter avatar
- [ ] Agency name shows in portal nav
- [ ] If no branding set → falls back to "Buena Onda" defaults
- [ ] Custom domain: `myagency.com` → portal loads with agency branding
- [ ] `__domain` query param handled (for Vercel rewrite path)
- [ ] Branding API returns correct owner branding for logged-in client via cookie
- [ ] Branding API returns correct branding by `?domain=` for custom domains

---

## 👑 Owner Dashboard (`/owner`)

- [ ] Only accessible to `OWNER_CLERK_USER_ID` — everyone else gets 404
- [ ] Page loads with Overview tab active
- [ ] **Overview Tab**
  - [ ] MRR card shows estimated MRR (active × $197)
  - [ ] Active/Trialing/Churned counts correct
  - [ ] New signups in selected range correct
  - [ ] Total ad spend filterable by date range (7d / 30d / 90d / all)
  - [ ] Ad spend filterable by platform (Meta / Google / TikTok)
  - [ ] Campaigns total and active correct
  - [ ] Agent actions count correct
  - [ ] Recommendations made / used / acceptance rate correct
  - [ ] Ads created count correct
  - [ ] Open tickets count correct
  - [ ] Open feedback count correct
  - [ ] Affiliate stats visible
  - [ ] Date range filter changes all stats
  - [ ] Platform filter changes spend breakdown
- [ ] **Users Tab**
  - [ ] Full user list loads
  - [ ] Filter: All / At-Risk / Trial / Active / Churned
  - [ ] Each user shows: status, plan, signup date, client count, campaign count, last action
  - [ ] At-risk badges visible (no clients, no campaigns, AI unused, 14d inactive, trial expiring)
  - [ ] Message button opens outreach modal
  - [ ] Outreach modal has textarea and Send button
  - [ ] Send outreach → WhatsApp message sent to user's number
  - [ ] Sending state shown while in flight
  - [ ] Modal closes after send
- [ ] **At-Risk Tab**
  - [ ] Shows only at-risk users
  - [ ] Same badges and outreach functionality
- [ ] **Tickets Tab**
  - [ ] All support tickets listed, newest first
  - [ ] Shows: user name, email, category, subject, description, timestamp
  - [ ] Status visible (open / closed)
- [ ] **Feedback Tab**
  - [ ] All feedback submissions listed, newest first
  - [ ] Shows: user name, email, message, timestamp
  - [ ] Status visible (open / closed)

---

## 🤖 Autonomous AI Scanning

- [ ] Settings page shows "AI Behavior" card with toggle
- [ ] Toggle defaults to OFF (Recommendations Mode) for new users
- [ ] Toggle saves correctly — reload page, setting persists
- [ ] Switch to Autonomous Mode — toggle shows green/ON state
- [ ] Switch back to Recommendations Mode — toggle shows blue/OFF state
- [ ] Agent loop cron fires hourly — confirm in Vercel cron logs
- [ ] Agent loop authorized with `CRON_SECRET` — returns 401 without it
- [ ] **Recommendations Mode (guardrails ON):**
  - [ ] Agent loop runs, finds decisions, stores them as `status='pending'` in `agent_actions`
  - [ ] No Meta/Google API action is executed (ads NOT paused/scaled yet)
  - [ ] WhatsApp message sent: "AI Recommendation" (not "Agent Action")
  - [ ] Review tab → AI Recommendations tab shows pending items
  - [ ] Each recommendation shows action type, Claude's reasoning, client name
  - [ ] Approve & Execute → Meta API called → status updated to 'approved'
  - [ ] Reject → status updated to 'rejected', no API call
  - [ ] Approved items move out of pending filter
- [ ] **Autonomous Mode (guardrails OFF):**
  - [ ] Agent loop runs, executes actions immediately
  - [ ] Meta/Google API called directly (ads paused/scaled)
  - [ ] WhatsApp message sent: "Agent Action" with result
  - [ ] `agent_actions` logged with `status='executed'`
  - [ ] Review tab → AI Recommendations shows executed items in history
- [ ] **Claude AI decisions:**
  - [ ] Decision engine calls Claude Haiku for analysis
  - [ ] If Claude unavailable, falls back to rule-based logic silently
  - [ ] Claude reasons holistically (not just CPL threshold matching)
  - [ ] Decisions include specific reasoning in plain English
- [ ] **Collective learning:**
  - [ ] Learning engine runs after each agent loop
  - [ ] `agent_learnings` table updated with patterns
  - [ ] Active learned rules feed into next Claude analysis as context

---

## ⏰ Owner Alert Cron (`/api/cron/owner-alerts`)

- [ ] Cron fires daily at 8am UTC
- [ ] Authorization header check works (returns 401 without `CRON_SECRET`)
- [ ] `OWNER_WHATSAPP_NUMBER` env var required
- [ ] WhatsApp message arrives on Mike's phone at 8am UTC
- [ ] Message includes: date, estimated MRR, active/trial counts, new signups, ad spend (30d), agent actions (24h)
- [ ] Message includes: open tickets count, open feedback count
- [ ] Message includes at-risk user list (up to 5) with flags
- [ ] At-risk flags: no clients, no campaigns, AI unused, 14d inactive, trial expiring
- [ ] Link to `https://buenaonda.ai/owner` in message when at-risk users exist
- [ ] "No at-risk users today" when all clear
- [ ] Cron returns `{ ok: true, at_risk: N }` JSON

---

## 💳 Stripe / Billing

- [ ] Pricing page loads, $197/mo plan visible
- [ ] Subscribe button → Stripe Checkout opens
- [ ] Successful payment → `user_subscriptions` row created with `active` status
- [ ] Stripe webhook fires → DB updated
- [ ] Trial creates `trialing` status
- [ ] Cancellation → status updated to `cancelled`
- [ ] Failed payment → status updated to `unpaid`
- [ ] White-label branding locked for users without active subscription
- [ ] White-label branding unlocked for `active` or `trialing` users
- [ ] Billing portal / manage subscription accessible (if implemented)

---

## ⏰ All Cron Jobs

- [ ] `/api/cron/agent-loop` — every hour — autonomous AI scan (NEW)
- [ ] `/api/cron/refresh-meta-tokens` — 6am UTC daily — refreshes Meta tokens before expiry
- [ ] `/api/cron/demo-reset` — 5am UTC daily — resets demo account data
- [ ] `/api/cron/affiliate-billing` — 9am UTC 1st of month — calculates payouts
- [ ] `/api/cron/whatsapp-report` — 1pm UTC Mondays — weekly WhatsApp report to users
- [ ] `/api/cron/google-ads-sync` — 7am UTC daily — pulls Google metrics
- [ ] `/api/cron/tiktok-ads-sync` — 7am UTC daily — pulls TikTok metrics
- [ ] `/api/cron/shopify-sync` — 7:30am UTC daily — pulls Shopify orders
- [ ] `/api/cron/owner-alerts` — 8am UTC daily — WhatsApp digest to owner
- [ ] All cron routes reject requests without correct `CRON_SECRET`

---

## 🗄️ Database / Migrations

- [ ] `/api/db/migrate` runs clean on production (no errors)
- [ ] All tables listed above exist after migrate
- [ ] `support_tickets` table — status column defaults to `'open'`
- [ ] `feedback_submissions` table — status column defaults to `'open'`
- [ ] `workspace_branding` table exists with all columns
- [ ] `client_login_tokens` table exists
- [ ] `clients` table has `contact_email` column
- [ ] `user_subscriptions` table has `autonomous_mode` column (default false)
- [ ] `agent_actions` table has `status` column (default 'executed')
- [ ] All foreign key constraints intact
- [ ] All indexes created

---

## 🌐 Landing Page

- [ ] Page loads fast (check Vercel analytics)
- [ ] Hero section mentions both WhatsApp AND Slack
- [ ] Ticker/scrolling text includes Slack report line
- [ ] How It Works — report step mentions WhatsApp & Slack
- [ ] How It Works — oversee step mentions replying via WhatsApp or Slack
- [ ] Demo section — AI offers WhatsApp or Slack choice
- [ ] FAQ — trial description mentions WhatsApp & Slack reports
- [ ] Pricing — features list includes "WhatsApp & Slack performance reports"
- [ ] Pricing — $197/mo plan displayed correctly
- [ ] "Start Free Trial" / CTA buttons go to sign-up
- [ ] All links work (no 404s)
- [ ] Mobile responsive — hero, pricing, FAQ all readable on phone

---

## 📱 Mobile / Responsive

- [ ] Nav collapses to hamburger on mobile
- [ ] All dashboard pages scroll properly
- [ ] Modals don't overflow on small screens
- [ ] Buttons are tappable (min 44px touch target)
- [ ] Text doesn't overflow cards
- [ ] Client portal readable on mobile
- [ ] Owner dashboard readable on mobile/tablet

---

## 🔒 Security

- [ ] All `/api/owner/*` routes return 404 for non-owner (middleware check)
- [ ] All `/api/*` routes return 401 for unauthenticated requests
- [ ] Cron routes return 401 without `CRON_SECRET`
- [ ] Client portal data route only returns data for the cookie's client (no IDOR)
- [ ] Team member data access scoped to owner they belong to
- [ ] White-label branding PATCH returns 403 for non-subscribed users
- [ ] Affiliate data scoped to cookie's affiliate only
- [ ] No SQL injection vectors (using parameterized queries throughout)
- [ ] No XSS vectors in email HTML (user content escaped with `replace(/</g, '&lt;')`)
- [ ] `OWNER_CLERK_USER_ID` env var set — if missing, owner route is inaccessible to all
- [ ] Cookie flags: `httpOnly: true`, `sameSite: 'lax'`, `secure: true` in production

---

## 🧹 Code Cleanup

- [ ] Audit `/app/dashboard/tools/ghl/page.tsx` — remove or repurpose
- [ ] Audit `/app/employee/` — remove if unused
- [ ] Any GHL API routes in codebase — remove
- [ ] GHL imports/references in shared components — remove
- [ ] Dead nav items pointing to removed pages
- [ ] `tsconfig.tsbuildinfo` not committed (add to `.gitignore` if needed)
- [ ] No `.env` or secrets in git history
- [ ] `console.log` statements removed from production code

---

## ✅ Go-Live Final Checklist

- [ ] All environment variables set in Vercel **Production**
- [ ] DNS fully propagated (check MXToolbox + DNS checker)
- [ ] `hello@buenaonda.ai` receives email
- [ ] Resend domain verified (green in dashboard)
- [ ] Clerk on business org, production instance, custom domain active
- [ ] Stripe in Live mode, webhook active and receiving events
- [ ] Meta App in Live mode
- [ ] `/api/db/migrate` run on production DB
- [ ] All cron jobs enabled in Vercel
- [ ] `OWNER_CLERK_USER_ID` set → verify `/owner` is accessible only to you
- [ ] `OWNER_WHATSAPP_NUMBER` set → verify daily digest arrives
- [ ] SSL certificate active on `buenaonda.ai`
- [ ] Vercel plan supports cron frequency needed
- [ ] Error monitoring set up (Sentry or Vercel logs)
- [ ] Run full QA pass top to bottom before announcing launch
