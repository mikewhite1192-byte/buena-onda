// lib/meta/metric-definitions.ts
// Complete list of Meta Insights API fields, organized by group
// matching Meta Ads Manager's column picker UI

export interface MetricDef {
  key: string;           // column key used in UI + raw_metrics
  label: string;         // display label
  apiField: string;      // Meta Insights API field name
  format: "currency" | "number" | "percent" | "text" | "roas";
  description?: string;
}

export interface MetricGroup {
  group: string;
  subgroups: {
    name: string;
    metrics: MetricDef[];
  }[];
}

// Default preset for leads vertical
export const LEADS_DEFAULT_COLUMNS = [
  "spend", "leads", "cpl", "ctr", "frequency", "impressions", "reach", "cpm", "link_clicks", "cpc"
];

// Default preset for ecomm vertical
export const ECOMM_DEFAULT_COLUMNS = [
  "spend", "purchases", "purchase_roas", "cpm", "ctr", "frequency", "impressions", "reach", "adds_to_cart", "link_clicks"
];

export const METRIC_GROUPS: MetricGroup[] = [
  {
    group: "Results & Spend",
    subgroups: [
      {
        name: "Results",
        metrics: [
          { key: "leads", label: "Leads", apiField: "actions:lead", format: "number" },
          { key: "purchases", label: "Purchases", apiField: "actions:purchase", format: "number" },
          { key: "cpl", label: "Cost per Lead", apiField: "cost_per_action_type:lead", format: "currency" },
          { key: "cost_per_purchase", label: "Cost per Purchase", apiField: "cost_per_action_type:purchase", format: "currency" },
          { key: "purchase_roas", label: "Purchase ROAS", apiField: "purchase_roas", format: "roas" },
          { key: "registrations", label: "Registrations Completed", apiField: "actions:complete_registration", format: "number" },
          { key: "leads_form", label: "Lead Form Submissions", apiField: "actions:leadgen_grouped", format: "number" },
        ],
      },
      {
        name: "Spend",
        metrics: [
          { key: "spend", label: "Amount Spent", apiField: "spend", format: "currency" },
        ],
      },
    ],
  },
  {
    group: "Impressions",
    subgroups: [
      {
        name: "Reach & Impressions",
        metrics: [
          { key: "impressions", label: "Impressions", apiField: "impressions", format: "number" },
          { key: "reach", label: "Reach", apiField: "reach", format: "number" },
          { key: "frequency", label: "Frequency", apiField: "frequency", format: "number" },
          { key: "cpm", label: "CPM (Cost per 1,000 Impressions)", apiField: "cpm", format: "currency" },
        ],
      },
    ],
  },
  {
    group: "Clicks",
    subgroups: [
      {
        name: "Clicks",
        metrics: [
          { key: "clicks", label: "Clicks (All)", apiField: "clicks", format: "number" },
          { key: "link_clicks", label: "Link Clicks", apiField: "actions:link_click", format: "number" },
          { key: "unique_clicks", label: "Unique Clicks (All)", apiField: "unique_clicks", format: "number" },
          { key: "unique_link_clicks", label: "Unique Link Clicks", apiField: "unique_actions:link_click", format: "number" },
          { key: "outbound_clicks", label: "Outbound Clicks", apiField: "outbound_clicks", format: "number" },
          { key: "unique_outbound_clicks", label: "Unique Outbound Clicks", apiField: "unique_outbound_clicks", format: "number" },
          { key: "ctr", label: "CTR (All)", apiField: "ctr", format: "percent" },
          { key: "link_ctr", label: "CTR (Link Click-Through Rate)", apiField: "inline_link_click_ctr", format: "percent" },
          { key: "outbound_ctr", label: "Outbound CTR", apiField: "outbound_clicks_ctr", format: "percent" },
          { key: "unique_ctr", label: "Unique CTR (All)", apiField: "unique_ctr", format: "percent" },
          { key: "cpc", label: "CPC (All)", apiField: "cpc", format: "currency" },
          { key: "cost_per_link_click", label: "CPC (Cost per Link Click)", apiField: "cost_per_action_type:link_click", format: "currency" },
          { key: "cost_per_unique_click", label: "Cost per Unique Click", apiField: "cost_per_unique_click", format: "currency" },
          { key: "cost_per_outbound_click", label: "Cost per Outbound Click", apiField: "cost_per_outbound_click", format: "currency" },
        ],
      },
      {
        name: "Traffic",
        metrics: [
          { key: "landing_page_views", label: "Landing Page Views", apiField: "actions:landing_page_view", format: "number" },
          { key: "cost_per_landing_page_view", label: "Cost per Landing Page View", apiField: "cost_per_action_type:landing_page_view", format: "currency" },
        ],
      },
    ],
  },
  {
    group: "Video",
    subgroups: [
      {
        name: "Media",
        metrics: [
          { key: "video_plays", label: "Video Plays", apiField: "actions:video_view", format: "number" },
          { key: "video_3sec", label: "3-Second Video Plays", apiField: "video_3_sec_watched_actions", format: "number" },
          { key: "video_thruplay", label: "ThruPlays", apiField: "video_thruplay_watched_actions", format: "number" },
          { key: "hook_rate", label: "Hook Rate (3-sec / Impressions)", apiField: "computed:hook_rate", format: "percent" },
          { key: "cost_per_thruplay", label: "Cost per ThruPlay", apiField: "cost_per_thruplay", format: "currency" },
        ],
      },
    ],
  },
  {
    group: "Engagement",
    subgroups: [
      {
        name: "Post Engagement",
        metrics: [
          { key: "post_engagement", label: "Post Engagement", apiField: "actions:post_engagement", format: "number" },
          { key: "post_reactions", label: "Post Reactions", apiField: "actions:post_reaction", format: "number" },
          { key: "post_comments", label: "Post Comments", apiField: "actions:comment", format: "number" },
          { key: "post_shares", label: "Post Shares", apiField: "actions:post", format: "number" },
          { key: "post_saves", label: "Post Saves", apiField: "actions:onsite_conversion.post_save", format: "number" },
          { key: "page_engagement", label: "Page Engagement", apiField: "actions:page_engagement", format: "number" },
          { key: "cost_per_post_engagement", label: "Cost per Post Engagement", apiField: "cost_per_action_type:post_engagement", format: "currency" },
        ],
      },
      {
        name: "Messaging",
        metrics: [
          { key: "messaging_conversations", label: "Messaging Conversations Started", apiField: "actions:onsite_conversion.messaging_conversation_started_7d", format: "number" },
          { key: "messaging_replies", label: "Messaging Conversations Replied", apiField: "actions:onsite_conversion.messaging_first_reply", format: "number" },
        ],
      },
    ],
  },
  {
    group: "Conversions",
    subgroups: [
      {
        name: "Standard Events",
        metrics: [
          { key: "adds_to_cart", label: "Adds to Cart", apiField: "actions:add_to_cart", format: "number" },
          { key: "checkouts_initiated", label: "Checkouts Initiated", apiField: "actions:initiate_checkout", format: "number" },
          { key: "purchase_value", label: "Purchase Value", apiField: "action_values:purchase", format: "currency" },
          { key: "adds_payment_info", label: "Adds Payment Info", apiField: "actions:add_payment_info", format: "number" },
          { key: "adds_to_wishlist", label: "Adds to Wishlist", apiField: "actions:add_to_wishlist", format: "number" },
          { key: "content_views", label: "Content Views", apiField: "actions:view_content", format: "number" },
          { key: "searches", label: "Searches", apiField: "actions:search", format: "number" },
          { key: "contacts", label: "Contacts", apiField: "actions:contact", format: "number" },
          { key: "appointments_scheduled", label: "Appointments Scheduled", apiField: "actions:schedule", format: "number" },
          { key: "subscriptions", label: "Subscriptions", apiField: "actions:subscribe", format: "number" },
          { key: "cost_per_add_to_cart", label: "Cost per Add to Cart", apiField: "cost_per_action_type:add_to_cart", format: "currency" },
          { key: "cost_per_initiate_checkout", label: "Cost per Checkout Initiated", apiField: "cost_per_action_type:initiate_checkout", format: "currency" },
          { key: "cost_per_content_view", label: "Cost per Content View", apiField: "cost_per_action_type:view_content", format: "currency" },
        ],
      },
    ],
  },
  {
    group: "Ad Quality",
    subgroups: [
      {
        name: "Rankings",
        metrics: [
          { key: "quality_ranking", label: "Quality Ranking", apiField: "quality_ranking", format: "text" },
          { key: "engagement_rate_ranking", label: "Engagement Rate Ranking", apiField: "engagement_rate_ranking", format: "text" },
          { key: "conversion_rate_ranking", label: "Conversion Rate Ranking", apiField: "conversion_rate_ranking", format: "text" },
        ],
      },
    ],
  },
];

// Flat map for quick lookup
export const METRIC_BY_KEY: Record<string, MetricDef> = {};
for (const group of METRIC_GROUPS) {
  for (const sub of group.subgroups) {
    for (const m of sub.metrics) {
      METRIC_BY_KEY[m.key] = m;
    }
  }
}

// All API fields needed (non-computed)
export const ALL_API_FIELDS = [
  "spend", "impressions", "reach", "frequency", "clicks", "unique_clicks",
  "ctr", "unique_ctr", "cpc", "cpm", "inline_link_click_ctr",
  "outbound_clicks", "unique_outbound_clicks", "outbound_clicks_ctr",
  "cost_per_unique_click", "cost_per_outbound_click",
  "quality_ranking", "engagement_rate_ranking", "conversion_rate_ranking",
  "purchase_roas",
  "actions", "unique_actions", "action_values", "cost_per_action_type",
  "cost_per_unique_action_type",
  "video_3_sec_watched_actions", "video_thruplay_watched_actions",
  "cost_per_thruplay",
];
