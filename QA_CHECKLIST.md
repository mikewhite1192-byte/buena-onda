# Buena Onda — Full QA Checklist

> Work through this after Client Logins, White-label, and Owner Dashboard are built.
> Check off each item as you test it.

---

## 🔐 Auth & Onboarding

- [ ] Sign up with email — confirmation email arrives
- [ ] Sign up with Google OAuth
- [ ] Sign in with email
- [ ] Sign in with Google OAuth
- [ ] Wrong password shows proper error
- [ ] Forgot password flow works end to end
- [ ] After sign up → lands on correct page (dashboard or onboarding)
- [ ] After sign in → lands on dashboard
- [ ] Sign out → redirected to sign-in page
- [ ] Unauthenticated user hitting `/dashboard/*` → redirected to sign-in
- [ ] Unauthenticated user hitting `/api/*` → returns 401, not a crash

---

## 🧭 Dashboard Nav

- [ ] All nav items highlight correctly on active route
- [ ] Overview
- [ ] Campaigns
- [ ] Clients
- [ ] Creatives
- [ ] Ads
- [ ] Reports
- [ ] Review
- [ ] History
- [ ] Team
- [ ] Settings
- [ ] Client switcher opens/closes
- [ ] Client switcher search filters correctly
- [ ] Selecting a client from switcher navigates to Campaigns
- [ ] "Manage clients →" in switcher goes to Clients page
- [ ] "Add one →" when no clients goes to Clients page
- [ ] Help button opens chat bubble
- [ ] UserButton (Clerk) opens account menu
- [ ] Nav on mobile — Menu button appears
- [ ] Mobile sheet opens and closes
- [ ] Mobile sheet nav links navigate and close sheet
- [ ] Demo mode banner shows when in demo
- [ ] Demo mode "Start Free" button goes to sign-up

---

## 👥 Clients Tab

- [ ] Page loads with client list
- [ ] Empty state shows when no clients
- [ ] Add client modal opens
- [ ] Add client — name required validation
- [ ] Add client — vertical selector (leads/ecomm)
- [ ] Add client — saves and appears in list
- [ ] Edit client opens with existing data prefilled
- [ ] Edit client — save updates list
- [ ] Delete client — confirmation, then removed from list
- [ ] Client card shows correct vertical color dot
- [ ] Client card shows correct status (active/paused)
- [ ] **Connect Meta** button — triggers OAuth redirect
- [ ] After Meta connect — button shows "Connected" with green dot
- [ ] **Connect Google Ads** button — triggers OAuth redirect
- [ ] Google single account — auto-saves, redirects back with `google_connected`
- [ ] Google multiple accounts — picker modal appears, select one, saves
- [ ] After Google connect — button shows "Connected"
- [ ] **Connect TikTok Ads** button — triggers OAuth redirect
- [ ] TikTok single advertiser — auto-saves
- [ ] TikTok multiple advertisers — picker modal, select one
- [ ] After TikTok connect — button shows "Connected"
- [ ] **Connect Shopify** button — opens domain modal
- [ ] Shopify domain modal — "Authorize with Shopify →" redirects to OAuth
- [ ] After Shopify connect — button shows "Connected"
- [ ] `google_connected` callback param shows success toast/state
- [ ] `tiktok_connected` callback param shows success toast/state
- [ ] `shopify_connected` callback param shows success toast/state

---

## 📋 Campaigns

- [ ] Page loads campaigns for active client
- [ ] Empty state shows when no campaigns
- [ ] Switching client in switcher reloads campaigns
- [ ] Campaign cards show correct status, spend, leads, CPL
- [ ] Click into a campaign → detail view loads
- [ ] Campaign detail shows ad set metrics
- [ ] Agent actions log shows for campaign
- [ ] Pause/resume campaign button works
- [ ] Budget adjustment reflects correctly
- [ ] Campaign status badge colors correct

---

## ✍️ New Campaign Brief

- [ ] Form loads clean
- [ ] All required fields validated before submit
- [ ] Avatar field
- [ ] Offer field
- [ ] Daily budget
- [ ] CPL cap
- [ ] Frequency cap
- [ ] Ad account ID pre-filled from active client
- [ ] Scaling rules configurable
- [ ] Submit creates brief, redirects to campaigns
- [ ] Brief appears in campaigns list

---

## 🎨 Creatives

- [ ] Page loads
- [ ] Upload creative — file picker opens
- [ ] Uploaded creative appears in list
- [ ] Creative preview shows
- [ ] Delete creative — removed from list
- [ ] Assign creative to campaign brief works
- [ ] Creative fatigue log shows flagged ads

---

## 📊 Ads

- [ ] Page loads
- [ ] Shows ad metrics for active client
- [ ] Date range filtering works
- [ ] Metrics are correct (spend, impressions, clicks, CTR, CPL)
- [ ] Platform filter (Meta/Google/TikTok) works
- [ ] Empty state when no data

---

## 📈 Reports

- [ ] Page loads for active client
- [ ] Metrics load correctly
- [ ] Date range selector works
- [ ] Charts render without error
- [ ] Shopify metrics section shows if connected
- [ ] Google metrics section shows if connected
- [ ] TikTok metrics section shows if connected
- [ ] "Share report" link generates shareable URL
- [ ] Shared report URL accessible without login (read-only)

---

## 🔍 Review

- [ ] Page loads
- [ ] Creative fatigue flagged items show
- [ ] Approve/reject actions work
- [ ] Actioned items update status
- [ ] Empty state when nothing to review

---

## 📜 History

- [ ] Page loads
- [ ] Agent action log shows in reverse chronological order
- [ ] Filter by client works
- [ ] Filter by action type works
- [ ] Actions show correct details/metadata

---

## 👨‍👩‍👧 Team

- [ ] Page loads clean
- [ ] Invite form — email required validation
- [ ] Invite form — role selector (Viewer/Manager/Admin)
- [ ] Send invite — invite email arrives in inbox
- [ ] Invite email has correct link with token
- [ ] Pending invite appears in "Pending Invites" list
- [ ] Cancel invite removes it from list
- [ ] Accept invite — `/team/accept?token=xxx`
- [ ] Accept page — not signed in → shows Clerk SignIn component
- [ ] Sign in on accept page → auto-accepts → redirects to `/dashboard`
- [ ] Sign up on accept page → auto-accepts → redirects to `/dashboard`
- [ ] Team member appears in Members list after accepting
- [ ] Team member logs in → sees owner's clients and data
- [ ] Role change via dropdown → updates immediately
- [ ] Remove member → removed from list
- [ ] Expired invite (>7 days) → error on accept page
- [ ] Already-used invite → error on accept page
- [ ] Owner trying to accept own invite → error

---

## ⚙️ Settings

- [ ] Page loads
- [ ] WhatsApp number — save works, persists on reload
- [ ] WhatsApp number — blank clears it
- [ ] **Connect Slack** button → OAuth redirect
- [ ] After Slack OAuth → `?slack=connected` shows success state
- [ ] Slack error → `?slack=error` shows error state
- [ ] Connected Slack shows workspace name
- [ ] Disconnect Slack (if implemented)
- [ ] Slack welcome message was sent on connect (check Slack channel)

---

## 🤖 AI Chat Bubble

- [ ] Chat bubble appears on all dashboard pages
- [ ] Opens on "?" help button click
- [ ] Opens on `buenaonda:open-chat` event
- [ ] Message sends, response streams back
- [ ] Chat context knows which client is active
- [ ] Close button works
- [ ] Conversation persists within session

---

## 💬 Feedback Button

- [ ] Feedback button visible
- [ ] Opens feedback modal
- [ ] Submit sends feedback
- [ ] Success state shows after submit

---

## 🏷️ Affiliate Dashboard

- [ ] `/affiliates/dashboard` loads
- [ ] Not logged in → shows magic link request form
- [ ] Enter email → "Check your email" state
- [ ] Email arrives via Resend with working magic link
- [ ] Click magic link → `/affiliates/login/verify?token=xxx`
- [ ] Verify page redirects to API verify route
- [ ] API sets cookie, redirects to dashboard
- [ ] Dashboard loads with correct affiliate data
- [ ] Next Payout banner shows correct amount
- [ ] Active client count is correct
- [ ] Lifetime earned is correct
- [ ] Referral list shows correctly
- [ ] Payout history shows correctly
- [ ] Sign out button clears cookie, returns to login form
- [ ] Expired token → error state on dashboard (`?error=expired`)
- [ ] Used token → error state (`?error=used`)
- [ ] Invalid token → error state (`?error=invalid`)
- [ ] Non-existent email → still shows "check your email" (security — no enumeration)

---

## 💳 Stripe / Billing

- [ ] Pricing page loads
- [ ] Subscribe button → Stripe Checkout opens
- [ ] Successful payment → subscription created in DB
- [ ] Webhook fires and updates `user_subscriptions`
- [ ] Subscription status reflects in dashboard
- [ ] Trial period works correctly
- [ ] Cancellation handled by webhook
- [ ] Failed payment handled

---

## ⏰ Cron Jobs

- [ ] `/api/cron/shopify-sync` — runs, paginates all orders, upserts metrics
- [ ] Meta metrics sync cron — fires, pulls data, updates `ad_metrics`
- [ ] Google metrics sync — fires, updates `google_ad_metrics`
- [ ] TikTok metrics sync — fires, updates `tiktok_ad_metrics`
- [ ] Cron routes protected (verify Vercel cron secret header)

---

## 🗄️ Database / Migrations

- [ ] `/api/db/migrate` runs clean (no errors)
- [ ] All tables exist after migrate
- [ ] `team_invites` table created
- [ ] `team_members` table created
- [ ] `affiliate_login_tokens` table created
- [ ] All indexes created

---

## 📱 Mobile / Responsive

- [ ] Nav collapses to hamburger on mobile
- [ ] All pages scroll properly on mobile
- [ ] Modals don't overflow on small screens
- [ ] Buttons are tappable (min 44px touch target)
- [ ] Text doesn't overflow cards

---

## 🧹 Code Cleanup (GHL leftovers)

- [ ] Audit `/app/dashboard/tools/ghl/page.tsx` — remove or repurpose
- [ ] Audit `/app/employee/` — old AI Employee Console, remove if unused
- [ ] Any GHL API routes still in codebase — remove
- [ ] Any GHL imports/references in shared components
- [ ] Dead nav items pointing to removed pages
- [ ] Unused environment variables in `.env`

---

## ✅ Pre-Launch Final Checks

- [ ] All environment variables set in Vercel production
- [ ] Resend domain verified ✓
- [ ] Meta app in Live mode (not Development)
- [ ] Stripe in Live mode (not Test)
- [ ] Vercel crons enabled in production
- [ ] Custom domain pointing correctly
- [ ] SSL certificate active
- [ ] `/api/db/migrate` run on production DB
