// lib/meta/metric-definitions.ts
// Complete Meta Insights API field registry, matching Meta Ads Manager column picker

export interface MetricDef {
  key: string;
  label: string;
  apiField: string;      // "field" for flat, "array:action_type" for nested, "computed:x" for derived
  format: "currency" | "number" | "percent" | "text" | "roas" | "seconds";
  rawIsPercent?: boolean; // Meta returns value as "1.5" meaning 1.5% — skip ×100 in format
  description?: string;
}

export interface MetricGroup {
  group: string;
  subgroups: { name: string; metrics: MetricDef[] }[];
}

// ── Default presets ───────────────────────────────────────────────────────────

export const LEADS_DEFAULT_COLUMNS = [
  "spend", "leads", "cpl", "ctr", "frequency", "impressions", "reach", "cpm", "link_clicks", "cpc"
];

export const ECOMM_DEFAULT_COLUMNS = [
  "spend", "purchases", "purchase_roas", "cpm", "ctr", "frequency", "impressions", "reach", "adds_to_cart", "link_clicks"
];

// ── Metric groups ─────────────────────────────────────────────────────────────

export const METRIC_GROUPS: MetricGroup[] = [

  // ── 1. Performance & Delivery ───────────────────────────────────────────────
  {
    group: "Performance & Delivery",
    subgroups: [
      {
        name: "Results",
        metrics: [
          { key: "leads",              label: "Leads",                    apiField: "actions:lead",                            format: "number" },
          { key: "leads_form",         label: "Lead Form Submissions",    apiField: "actions:leadgen_grouped",                 format: "number" },
          { key: "purchases",          label: "Purchases",                apiField: "actions:purchase",                        format: "number" },
          { key: "registrations",      label: "Complete Registrations",   apiField: "actions:complete_registration",           format: "number" },
          { key: "cpl",                label: "Cost per Lead",            apiField: "cost_per_action_type:lead",               format: "currency" },
          { key: "cost_per_purchase",  label: "Cost per Purchase",        apiField: "cost_per_action_type:purchase",           format: "currency" },
          { key: "purchase_roas",      label: "Purchase ROAS",            apiField: "purchase_roas:omni_purchase",             format: "roas" },
        ],
      },
      {
        name: "Delivery",
        metrics: [
          { key: "spend",       label: "Amount Spent",                    apiField: "spend",       format: "currency" },
          { key: "reach",       label: "Reach",                           apiField: "reach",       format: "number" },
          { key: "impressions", label: "Impressions",                     apiField: "impressions", format: "number" },
          { key: "frequency",   label: "Frequency",                       apiField: "frequency",   format: "number" },
          { key: "cpm",         label: "CPM (Cost per 1,000 Impressions)", apiField: "cpm",        format: "currency" },
        ],
      },
    ],
  },

  // ── 2. Engagement & Clicks ──────────────────────────────────────────────────
  {
    group: "Engagement & Clicks",
    subgroups: [
      {
        name: "Clicks",
        metrics: [
          { key: "clicks",                  label: "Clicks (All)",                  apiField: "clicks",                              format: "number" },
          { key: "link_clicks",             label: "Link Clicks",                   apiField: "actions:link_click",                  format: "number" },
          { key: "outbound_clicks",         label: "Outbound Clicks",               apiField: "outbound_clicks:outbound_click",       format: "number" },
          { key: "unique_clicks",           label: "Unique Clicks (All)",           apiField: "unique_clicks",                       format: "number" },
          { key: "unique_link_clicks",      label: "Unique Link Clicks",            apiField: "unique_actions:link_click",            format: "number" },
          { key: "unique_outbound_clicks",  label: "Unique Outbound Clicks",        apiField: "unique_outbound_clicks:outbound_click",format: "number" },
          { key: "ctr",                     label: "CTR (All)",                     apiField: "ctr",                                 format: "percent" },
          { key: "link_ctr",                label: "CTR (Link Click-Through Rate)", apiField: "inline_link_click_ctr",               format: "percent", rawIsPercent: true },
          { key: "outbound_ctr",            label: "Outbound CTR",                  apiField: "outbound_clicks_ctr:outbound_click",  format: "percent", rawIsPercent: true },
          { key: "unique_ctr",              label: "Unique CTR (All)",              apiField: "unique_ctr",                          format: "percent", rawIsPercent: true },
          { key: "cpc",                     label: "CPC (All)",                     apiField: "cpc",                                 format: "currency" },
          { key: "cost_per_link_click",     label: "CPC (Cost per Link Click)",     apiField: "cost_per_action_type:link_click",     format: "currency" },
          { key: "cost_per_unique_click",   label: "Cost per Unique Click",         apiField: "cost_per_unique_click",               format: "currency" },
          { key: "cost_per_outbound_click", label: "Cost per Outbound Click",       apiField: "cost_per_outbound_click:outbound_click", format: "currency" },
        ],
      },
      {
        name: "Post Engagement",
        metrics: [
          { key: "post_engagement",          label: "Post Engagement",             apiField: "actions:post_engagement",                            format: "number" },
          { key: "post_reactions",           label: "Post Reactions",              apiField: "actions:post_reaction",                              format: "number" },
          { key: "post_comments",            label: "Post Comments",               apiField: "actions:comment",                                    format: "number" },
          { key: "post_shares",              label: "Post Shares",                 apiField: "actions:post",                                       format: "number" },
          { key: "post_saves",               label: "Post Saves",                  apiField: "actions:onsite_conversion.post_save",                format: "number" },
          { key: "page_likes",               label: "Page Likes",                  apiField: "actions:like",                                       format: "number" },
          { key: "page_engagement",          label: "Page Engagement",             apiField: "actions:page_engagement",                            format: "number" },
          { key: "cost_per_post_engagement", label: "Cost per Post Engagement",    apiField: "cost_per_action_type:post_engagement",               format: "currency" },
        ],
      },
      {
        name: "Traffic",
        metrics: [
          { key: "landing_page_views",          label: "Landing Page Views",              apiField: "actions:landing_page_view",                      format: "number" },
          { key: "cost_per_landing_page_view",  label: "Cost per Landing Page View",      apiField: "cost_per_action_type:landing_page_view",         format: "currency" },
        ],
      },
    ],
  },

  // ── 3. Video Performance ────────────────────────────────────────────────────
  {
    group: "Video Performance",
    subgroups: [
      {
        name: "Plays",
        metrics: [
          { key: "video_2sec",      label: "2-Second Continuous Video Plays", apiField: "video_continuous_2_sec_watched_actions:video_continuous_2_sec_watched", format: "number" },
          { key: "video_3sec",      label: "3-Second Video Plays",            apiField: "video_play_actions:video_view",                                         format: "number" },
          { key: "video_thruplay",  label: "ThruPlays (15-sec or complete)",  apiField: "video_thruplay_watched_actions:video_view",                             format: "number" },
          { key: "video_avg_time",  label: "Video Average Play Time",         apiField: "video_avg_time_watched_actions:video_view",                             format: "seconds" },
          { key: "hook_rate",       label: "Hook Rate (3-sec / Impressions)", apiField: "computed:hook_rate",                                                    format: "percent" },
          { key: "cost_per_thruplay", label: "Cost per ThruPlay",            apiField: "cost_per_thruplay",                                                     format: "currency" },
        ],
      },
      {
        name: "Watch Milestones",
        metrics: [
          { key: "video_p25",  label: "Video Plays at 25%",  apiField: "video_p25_watched_actions:video_view",  format: "number" },
          { key: "video_p50",  label: "Video Plays at 50%",  apiField: "video_p50_watched_actions:video_view",  format: "number" },
          { key: "video_p75",  label: "Video Plays at 75%",  apiField: "video_p75_watched_actions:video_view",  format: "number" },
          { key: "video_p95",  label: "Video Plays at 95%",  apiField: "video_p95_watched_actions:video_view",  format: "number" },
          { key: "video_p100", label: "Video Plays at 100%", apiField: "video_p100_watched_actions:video_view", format: "number" },
        ],
      },
    ],
  },

  // ── 4. Media & Creative Quality ─────────────────────────────────────────────
  {
    group: "Media & Creative Quality",
    subgroups: [
      {
        name: "Ad Quality Rankings",
        metrics: [
          { key: "quality_ranking",          label: "Quality Ranking",            apiField: "quality_ranking",          format: "text" },
          { key: "engagement_rate_ranking",  label: "Engagement Rate Ranking",    apiField: "engagement_rate_ranking",  format: "text" },
          { key: "conversion_rate_ranking",  label: "Conversion Rate Ranking",    apiField: "conversion_rate_ranking",  format: "text" },
        ],
      },
      {
        name: "Instant Experience",
        metrics: [
          { key: "instant_exp_view_time", label: "Instant Experience View Time",       apiField: "canvas_avg_view_time",    format: "seconds" },
          { key: "instant_exp_view_pct",  label: "Instant Experience View Percentage", apiField: "canvas_avg_view_percent", format: "percent", rawIsPercent: true },
        ],
      },
    ],
  },

  // ── 5. Conversion Funnel ────────────────────────────────────────────────────
  {
    group: "Conversion Funnel",
    subgroups: [
      {
        name: "Top of Funnel",
        metrics: [
          { key: "content_views",             label: "Content Views",              apiField: "actions:view_content",              format: "number" },
          { key: "searches",                  label: "Searches",                   apiField: "actions:search",                    format: "number" },
          { key: "adds_to_wishlist",          label: "Add to Wishlist",            apiField: "actions:add_to_wishlist",           format: "number" },
          { key: "cost_per_content_view",     label: "Cost per Content View",      apiField: "cost_per_action_type:view_content", format: "currency" },
        ],
      },
      {
        name: "Mid Funnel",
        metrics: [
          { key: "adds_to_cart",                label: "Add to Cart",                  apiField: "actions:add_to_cart",                    format: "number" },
          { key: "checkouts_initiated",         label: "Checkouts Initiated",          apiField: "actions:initiate_checkout",              format: "number" },
          { key: "adds_payment_info",           label: "Add Payment Info",             apiField: "actions:add_payment_info",               format: "number" },
          { key: "cost_per_add_to_cart",        label: "Cost per Add to Cart",         apiField: "cost_per_action_type:add_to_cart",       format: "currency" },
          { key: "cost_per_initiate_checkout",  label: "Cost per Checkout Initiated",  apiField: "cost_per_action_type:initiate_checkout", format: "currency" },
        ],
      },
      {
        name: "Purchases & Revenue",
        metrics: [
          { key: "purchase_value", label: "Purchase Value", apiField: "action_values:purchase", format: "currency" },
        ],
      },
      {
        name: "Other Standard Events",
        metrics: [
          { key: "contacts",             label: "Contacts",              apiField: "actions:contact",              format: "number" },
          { key: "appointments",         label: "Appointments Scheduled",apiField: "actions:schedule",             format: "number" },
          { key: "subscriptions",        label: "Subscriptions",         apiField: "actions:subscribe",            format: "number" },
          { key: "customize_product",    label: "Customize Product",     apiField: "actions:customize_product",    format: "number" },
          { key: "donate",               label: "Donate",                apiField: "actions:donate",               format: "number" },
          { key: "find_location",        label: "Find Location",         apiField: "actions:find_location",        format: "number" },
          { key: "start_trial",          label: "Start Trial",           apiField: "actions:start_trial",          format: "number" },
          { key: "submit_application",   label: "Submit Application",    apiField: "actions:submit_application",   format: "number" },
        ],
      },
    ],
  },

  // ── 6. Messaging & Awareness ────────────────────────────────────────────────
  {
    group: "Messaging & Awareness",
    subgroups: [
      {
        name: "Messaging",
        metrics: [
          { key: "messaging_new_connections",  label: "New Messaging Connections",          apiField: "actions:onsite_conversion.messaging_connection",              format: "number" },
          { key: "messaging_conversations",    label: "Messaging Conversations Started",    apiField: "actions:onsite_conversion.messaging_conversation_started_7d", format: "number" },
          { key: "messaging_replies",          label: "Messaging Conversations Replied",    apiField: "actions:onsite_conversion.messaging_first_reply",             format: "number" },
          { key: "messaging_blocked",          label: "Blocked Messaging Conversations",    apiField: "actions:onsite_conversion.messaging_block",                   format: "number" },
        ],
      },
      {
        name: "Brand Awareness",
        metrics: [
          { key: "ad_recall_lift",             label: "Est. Ad Recall Lift (People)",  apiField: "estimated_ad_recall_lift",                  format: "number" },
          { key: "ad_recall_lift_rate",        label: "Est. Ad Recall Lift Rate",      apiField: "estimated_ad_recall_lift_rate",             format: "percent", rawIsPercent: true },
          { key: "cost_per_ad_recall_lift",    label: "Cost per Est. Ad Recall Lift",  apiField: "cost_per_estimated_ad_recal_lift",          format: "currency" },
        ],
      },
    ],
  },

  // ── 7. App Performance ──────────────────────────────────────────────────────
  {
    group: "App Performance",
    subgroups: [
      {
        name: "App Events",
        metrics: [
          { key: "app_installs",          label: "Mobile App Installs",     apiField: "actions:mobile_app_install",                   format: "number" },
          { key: "app_store_clicks",      label: "App Store Clicks",        apiField: "actions:app_custom_event.fb_mobile_app_store_click", format: "number" },
          { key: "app_purchases",         label: "App Purchases",           apiField: "actions:app_custom_event.fb_mobile_purchase",  format: "number" },
          { key: "in_app_ad_clicks",      label: "In-App Ad Clicks",        apiField: "actions:in_app_ad_click",                      format: "number" },
          { key: "in_app_ad_impressions", label: "In-App Ad Impressions",   apiField: "actions:in_app_ad_impression",                 format: "number" },
          { key: "cost_per_app_install",  label: "Cost per App Install",    apiField: "cost_per_action_type:mobile_app_install",      format: "currency" },
        ],
      },
    ],
  },

  // ── Dashboard-only (UI columns, no API fetch needed) ────────────────────────
  {
    group: "Dashboard",
    subgroups: [
      {
        name: "Visual",
        metrics: [
          { key: "trend",  label: "CPL Trend (Sparkline)", apiField: "computed:trend",  format: "number" },
          { key: "health", label: "Health Status",         apiField: "computed:health", format: "text"   },
        ],
      },
    ],
  },
];

// ── Flat lookup by key ────────────────────────────────────────────────────────

export const METRIC_BY_KEY: Record<string, MetricDef> = {};
for (const group of METRIC_GROUPS) {
  for (const sub of group.subgroups) {
    for (const m of sub.metrics) {
      METRIC_BY_KEY[m.key] = m;
    }
  }
}

// ── All API fields to request from Meta Insights ──────────────────────────────
// Flat field names only (no action_type suffix). Arrays (actions, etc.) are
// requested once and parsed by extractFromRaw() using the apiField definition.

export const ALL_API_FIELDS = [
  // Delivery
  "spend", "impressions", "reach", "frequency", "clicks", "unique_clicks",
  "ctr", "unique_ctr", "cpc", "cpm", "inline_link_click_ctr",
  "outbound_clicks", "unique_outbound_clicks", "outbound_clicks_ctr",
  "cost_per_unique_click", "cost_per_outbound_click",
  // Rankings
  "quality_ranking", "engagement_rate_ranking", "conversion_rate_ranking",
  // ROAS
  "purchase_roas",
  // Actions (cover all event-based fields)
  "actions", "unique_actions", "action_values",
  "cost_per_action_type", "cost_per_unique_action_type",
  // Video
  "video_play_actions",
  "video_continuous_2_sec_watched_actions",
  "video_thruplay_watched_actions",
  "video_p25_watched_actions",
  "video_p50_watched_actions",
  "video_p75_watched_actions",
  "video_p95_watched_actions",
  "video_p100_watched_actions",
  "video_avg_time_watched_actions",
  "cost_per_thruplay",
  // Instant Experience
  "canvas_avg_view_time",
  "canvas_avg_view_percent",
  // Awareness
  "estimated_ad_recall_lift",
  "estimated_ad_recall_lift_rate",
  "cost_per_estimated_ad_recal_lift",
];
