// lib/demo-data.ts — Full agency demo data with 4 clients
// Account IDs follow the act_demo_* convention

export const DEMO_ACCOUNTS = {
  roofing: "act_demo_roofing",
  dental:  "act_demo_dental",
  ecomm:   "act_demo_ecomm",
  solar:   "act_demo_solar",
};

export function isDemoAccount(id: string | null | undefined): boolean {
  return !!id && (id === "act_demo" || id.startsWith("act_demo_"));
}

// ─── Campaign data per account ────────────────────────────────────────────────

const CAMPAIGNS: Record<string, object[]> = {
  act_demo_roofing: [
    { campaign_id: "demo_r_001", campaign_name: "Summit | Homeowners 35-65 | Lead Gen", spend: 187.40, leads: 4, cpl: 46.85, ctr: 0.021, frequency: 2.4, impressions: 14200, clicks: 298, raw_metrics: {} },
    { campaign_id: "demo_r_002", campaign_name: "Summit | Storm Damage | Retargeting",  spend: 62.50,  leads: 2, cpl: 31.25, ctr: 0.038, frequency: 3.1, impressions: 2840,  clicks: 107, raw_metrics: {} },
    { campaign_id: "demo_r_003", campaign_name: "Summit | Lookalike 1% | Prospecting",  spend: 44.20,  leads: 1, cpl: 44.20, ctr: 0.012, frequency: 1.8, impressions: 6720,  clicks: 80,  raw_metrics: {} },
  ],
  act_demo_dental: [
    { campaign_id: "demo_d_001", campaign_name: "Bright Smile | Invisalign | Leads",    spend: 174.00, leads: 3, cpl: 58.00, ctr: 0.018, frequency: 3.2, impressions: 18600, clicks: 334, raw_metrics: {} },
    { campaign_id: "demo_d_002", campaign_name: "Bright Smile | Teeth Whitening | RT",  spend: 89.50,  leads: 1, cpl: 89.50, ctr: 0.022, frequency: 4.1, impressions: 7200,  clicks: 158, raw_metrics: {} },
  ],
  act_demo_ecomm: [
    { campaign_id: "demo_e_001", campaign_name: "Urban Threads | Summer Drop | DPA",    spend: 420.00, leads: 18, cpl: 23.33, ctr: 0.032, frequency: 2.1, impressions: 42000, clicks: 1344, raw_metrics: {} },
    { campaign_id: "demo_e_002", campaign_name: "Urban Threads | Lookalike | Broad",    spend: 280.00, leads: 8,  cpl: 35.00, ctr: 0.019, frequency: 1.6, impressions: 31000, clicks: 589,  raw_metrics: {} },
    { campaign_id: "demo_e_003", campaign_name: "Urban Threads | Retargeting | 7d",     spend: 190.00, leads: 14, cpl: 13.57, ctr: 0.055, frequency: 5.2, impressions: 12400, clicks: 682,  raw_metrics: {} },
  ],
  act_demo_solar: [
    { campaign_id: "demo_s_001", campaign_name: "Pacific Solar | Homeowners | Leads",   spend: 310.00, leads: 0, cpl: 0, ctr: 0.009, frequency: 2.8, impressions: 34400, clicks: 309, raw_metrics: {} },
    { campaign_id: "demo_s_002", campaign_name: "Pacific Solar | Eco Audience | Leads", spend: 110.00, leads: 0, cpl: 0, ctr: 0.007, frequency: 2.2, impressions: 15700, clicks: 109, raw_metrics: {} },
  ],
};

// Fallback for legacy act_demo
CAMPAIGNS["act_demo"] = CAMPAIGNS["act_demo_roofing"];

// ─── Ad sets per campaign ─────────────────────────────────────────────────────

const AD_SETS: Record<string, object[]> = {
  demo_r_001: [
    { ad_set_id: "demo_r_001a", ad_set_name: "Homeowners 35-45 | San Diego",  campaign_id: "demo_r_001", spend: 68.00,  leads: 2, cpl: 34.00, ctr: 0.024, frequency: 2.2, impressions: 5100,  clicks: 122, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
    { ad_set_id: "demo_r_001b", ad_set_name: "Homeowners 45-65 | San Diego",  campaign_id: "demo_r_001", spend: 82.00,  leads: 2, cpl: 41.00, ctr: 0.019, frequency: 2.6, impressions: 6240,  clicks: 118, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
    { ad_set_id: "demo_r_001c", ad_set_name: "Homeowners 35-65 | Los Angeles", campaign_id: "demo_r_001", spend: 37.40,  leads: 0, cpl: 0,     ctr: 0.018, frequency: 2.4, impressions: 2860,  clicks: 51,  ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
  ],
  demo_r_002: [
    { ad_set_id: "demo_r_002a", ad_set_name: "Website Visitors 30d",          campaign_id: "demo_r_002", spend: 38.00,  leads: 1, cpl: 38.00, ctr: 0.042, frequency: 3.4, impressions: 1620,  clicks: 68,  ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
    { ad_set_id: "demo_r_002b", ad_set_name: "Engaged FB/IG 60d",             campaign_id: "demo_r_002", spend: 24.50,  leads: 1, cpl: 24.50, ctr: 0.033, frequency: 2.8, impressions: 1220,  clicks: 40,  ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
  ],
  demo_d_001: [
    { ad_set_id: "demo_d_001a", ad_set_name: "Invisalign | Women 25-44",      campaign_id: "demo_d_001", spend: 98.00,  leads: 2, cpl: 49.00, ctr: 0.021, frequency: 3.0, impressions: 10400, clicks: 218, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
    { ad_set_id: "demo_d_001b", ad_set_name: "Invisalign | Men 25-44",        campaign_id: "demo_d_001", spend: 76.00,  leads: 1, cpl: 76.00, ctr: 0.014, frequency: 3.4, impressions: 8200,  clicks: 114, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
  ],
  demo_e_001: [
    { ad_set_id: "demo_e_001a", ad_set_name: "DPA | Viewers 7d",              campaign_id: "demo_e_001", spend: 180.00, leads: 8,  cpl: 22.50, ctr: 0.035, frequency: 2.0, impressions: 18000, clicks: 630, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
    { ad_set_id: "demo_e_001b", ad_set_name: "DPA | Add to Cart 14d",         campaign_id: "demo_e_001", spend: 240.00, leads: 10, cpl: 24.00, ctr: 0.029, frequency: 2.2, impressions: 24000, clicks: 696, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
  ],
  demo_s_001: [
    { ad_set_id: "demo_s_001a", ad_set_name: "Homeowners 35-65 | California", campaign_id: "demo_s_001", spend: 180.00, leads: 0, cpl: 0, ctr: 0.010, frequency: 2.6, impressions: 20000, clicks: 200, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
    { ad_set_id: "demo_s_001b", ad_set_name: "Homeowners 45-65 | California", campaign_id: "demo_s_001", spend: 130.00, leads: 0, cpl: 0, ctr: 0.008, frequency: 3.0, impressions: 14400, clicks: 115, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
  ],
};

export function getDemoCampaigns(accountId: string): object[] {
  return CAMPAIGNS[accountId] ?? CAMPAIGNS["act_demo_roofing"];
}

export function getDemoAdSets(campaignId: string): object[] {
  return AD_SETS[campaignId] ?? [];
}

// ─── 30-day summary per account ───────────────────────────────────────────────

const SUMMARIES: Record<string, object> = {
  act_demo_roofing: {
    current:  { total_spend: "2959.62", total_leads: 69, avg_cpl: "42.89", avg_ctr: "0.0237", avg_frequency: "2.43", total_impressions: 238420, active_ad_sets: 5 },
    previous: { total_spend: "2640.00", total_leads: 58, avg_cpl: "45.52" },
    active_briefs: 2,
  },
  act_demo_dental: {
    current:  { total_spend: "1840.00", total_leads: 41, avg_cpl: "44.88", avg_ctr: "0.0195", avg_frequency: "3.62", total_impressions: 128400, active_ad_sets: 4 },
    previous: { total_spend: "1620.00", total_leads: 30, avg_cpl: "54.00" },
    active_briefs: 1,
  },
  act_demo_ecomm: {
    current:  { total_spend: "3240.00", total_leads: 87, avg_cpl: "37.24", avg_ctr: "0.0326", avg_frequency: "2.87", total_impressions: 312000, active_ad_sets: 6 },
    previous: { total_spend: "2980.00", total_leads: 74, avg_cpl: "40.27" },
    active_briefs: 3,
  },
  act_demo_solar: {
    current:  { total_spend: "4100.00", total_leads: 12, avg_cpl: "341.67", avg_ctr: "0.0082", avg_frequency: "3.14", total_impressions: 512000, active_ad_sets: 4 },
    previous: { total_spend: "3800.00", total_leads: 28, avg_cpl: "135.71" },
    active_briefs: 2,
  },
};

SUMMARIES["act_demo"] = SUMMARIES["act_demo_roofing"];

export function getDemoSummary(accountId: string): object {
  return SUMMARIES[accountId] ?? SUMMARIES["act_demo_roofing"];
}

// ─── Seed config ──────────────────────────────────────────────────────────────

export const DEMO_CLIENTS_CONFIG = [
  { name: "Summit Roofing Co",   meta_ad_account_id: "act_demo_roofing", vertical: "leads",  notes: "Demo — roofing lead gen, San Diego" },
  { name: "Bright Smile Dental", meta_ad_account_id: "act_demo_dental",  vertical: "leads",  notes: "Demo — dental leads, Invisalign focus" },
  { name: "Urban Threads",       meta_ad_account_id: "act_demo_ecomm",   vertical: "ecomm",  notes: "Demo — DTC fashion e-commerce" },
  { name: "Pacific Solar",       meta_ad_account_id: "act_demo_solar",   vertical: "leads",  notes: "Demo — solar leads, needs attention" },
] as const;
