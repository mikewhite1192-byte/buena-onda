// lib/demo-data.ts — Full 15-client agency demo
// Account IDs follow act_demo_* convention

export function isDemoAccount(id: string | null | undefined): boolean {
  return !!id && (id === "act_demo" || id.startsWith("act_demo_"));
}

// ─── Campaign baseline (daily numbers) ───────────────────────────────────────

type DemoCampaign = {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  leads: number;
  cpl: number;
  ctr: number;
  frequency: number;
  impressions: number;
  clicks: number;
  raw_metrics: object;
};

const CAMPAIGNS: Record<string, DemoCampaign[]> = {
  act_demo_roofing: [
    { campaign_id: "demo_r_001", campaign_name: "Summit | Homeowners 35-65 | Lead Gen",   spend: 187.40, leads: 4, cpl: 46.85, ctr: 0.021, frequency: 2.4, impressions: 14200, clicks: 298, raw_metrics: {} },
    { campaign_id: "demo_r_002", campaign_name: "Summit | Storm Damage | Retargeting",    spend: 62.50,  leads: 2, cpl: 31.25, ctr: 0.038, frequency: 3.1, impressions: 2840,  clicks: 107, raw_metrics: {} },
    { campaign_id: "demo_r_003", campaign_name: "Summit | LAL 1% | Prospecting",          spend: 44.20,  leads: 1, cpl: 44.20, ctr: 0.012, frequency: 1.8, impressions: 6720,  clicks: 80,  raw_metrics: {} },
  ],
  act_demo_dental: [
    { campaign_id: "demo_d_001", campaign_name: "Bright Smile | Invisalign | Leads",      spend: 174.00, leads: 3, cpl: 58.00, ctr: 0.018, frequency: 3.2, impressions: 18600, clicks: 334, raw_metrics: {} },
    { campaign_id: "demo_d_002", campaign_name: "Bright Smile | Whitening | Retargeting", spend: 89.50,  leads: 1, cpl: 89.50, ctr: 0.022, frequency: 4.1, impressions: 7200,  clicks: 158, raw_metrics: {} },
  ],
  act_demo_ecomm: [
    { campaign_id: "demo_e_001", campaign_name: "Urban Threads | Summer Drop | DPA",      spend: 420.00, leads: 18, cpl: 23.33, ctr: 0.032, frequency: 2.1, impressions: 42000, clicks: 1344, raw_metrics: {} },
    { campaign_id: "demo_e_002", campaign_name: "Urban Threads | Lookalike | Broad",      spend: 280.00, leads: 8,  cpl: 35.00, ctr: 0.019, frequency: 1.6, impressions: 31000, clicks: 589,  raw_metrics: {} },
    { campaign_id: "demo_e_003", campaign_name: "Urban Threads | Retargeting 7d",         spend: 190.00, leads: 14, cpl: 13.57, ctr: 0.055, frequency: 5.2, impressions: 12400, clicks: 682,  raw_metrics: {} },
  ],
  act_demo_solar: [
    { campaign_id: "demo_s_001", campaign_name: "Pacific Solar | Homeowners | Leads",     spend: 310.00, leads: 0, cpl: 0, ctr: 0.009, frequency: 2.8, impressions: 34400, clicks: 309, raw_metrics: {} },
    { campaign_id: "demo_s_002", campaign_name: "Pacific Solar | Eco Audience | Leads",   spend: 110.00, leads: 0, cpl: 0, ctr: 0.007, frequency: 2.2, impressions: 15700, clicks: 109, raw_metrics: {} },
  ],
  act_demo_hvac: [
    { campaign_id: "demo_h_001", campaign_name: "Apex HVAC | Homeowners | AC Leads",      spend: 112.00, leads: 4, cpl: 28.00, ctr: 0.026, frequency: 2.0, impressions: 9800, clicks: 254, raw_metrics: {} },
    { campaign_id: "demo_h_002", campaign_name: "Apex HVAC | Retargeting | Hot Summer",   spend: 73.00,  leads: 3, cpl: 24.33, ctr: 0.041, frequency: 3.3, impressions: 4200, clicks: 172, raw_metrics: {} },
  ],
  act_demo_legal: [
    { campaign_id: "demo_l_001", campaign_name: "Rodriguez Law | Personal Injury | Leads", spend: 195.00, leads: 3, cpl: 65.00, ctr: 0.014, frequency: 2.6, impressions: 22000, clicks: 308, raw_metrics: {} },
    { campaign_id: "demo_l_002", campaign_name: "Rodriguez Law | Auto Accident | Broad",   spend: 115.00, leads: 2, cpl: 57.50, ctr: 0.011, frequency: 2.1, impressions: 16500, clicks: 181, raw_metrics: {} },
  ],
  act_demo_realty: [
    { campaign_id: "demo_re_001", campaign_name: "SoCal Realty | Buyers 35-55 | Leads",   spend: 280.00, leads: 3, cpl: 93.33, ctr: 0.016, frequency: 3.1, impressions: 28000, clicks: 448, raw_metrics: {} },
    { campaign_id: "demo_re_002", campaign_name: "SoCal Realty | Seller Leads | Broad",   spend: 160.00, leads: 2, cpl: 80.00, ctr: 0.013, frequency: 2.7, impressions: 19000, clicks: 247, raw_metrics: {} },
  ],
  act_demo_remodel: [
    { campaign_id: "demo_rm_001", campaign_name: "Premier Remodel | Kitchen | Leads",     spend: 138.00, leads: 4, cpl: 34.50, ctr: 0.022, frequency: 2.2, impressions: 11800, clicks: 259, raw_metrics: {} },
    { campaign_id: "demo_rm_002", campaign_name: "Premier Remodel | Bathroom | LAL",      spend: 87.00,  leads: 2, cpl: 43.50, ctr: 0.018, frequency: 1.9, impressions: 8400,  clicks: 151, raw_metrics: {} },
  ],
  act_demo_auto: [
    { campaign_id: "demo_a_001", campaign_name: "Valley Auto | New Arrivals | Leads",     spend: 220.00, leads: 6, cpl: 36.67, ctr: 0.019, frequency: 2.4, impressions: 26000, clicks: 494, raw_metrics: {} },
    { campaign_id: "demo_a_002", campaign_name: "Valley Auto | Trade-In | Retargeting",   spend: 160.00, leads: 5, cpl: 32.00, ctr: 0.031, frequency: 3.8, impressions: 14200, clicks: 440, raw_metrics: {} },
  ],
  act_demo_insurance: [
    { campaign_id: "demo_i_001", campaign_name: "Coastal Insurance | Homeowners | Leads", spend: 130.00, leads: 2, cpl: 65.00, ctr: 0.015, frequency: 2.9, impressions: 14500, clicks: 217, raw_metrics: {} },
    { campaign_id: "demo_i_002", campaign_name: "Coastal Insurance | Auto | Leads",       spend: 65.00,  leads: 1, cpl: 65.00, ctr: 0.012, frequency: 2.4, impressions: 9800,  clicks: 117, raw_metrics: {} },
  ],
  act_demo_beauty: [
    { campaign_id: "demo_b_001", campaign_name: "Glow Beauty | Skincare Set | DPA",       spend: 295.00, leads: 21, cpl: 14.05, ctr: 0.044, frequency: 2.3, impressions: 38000, clicks: 1672, raw_metrics: {} },
    { campaign_id: "demo_b_002", campaign_name: "Glow Beauty | New Customers | LAL",      spend: 225.00, leads: 14, cpl: 16.07, ctr: 0.031, frequency: 1.7, impressions: 29000, clicks: 899,  raw_metrics: {} },
  ],
  act_demo_supps: [
    { campaign_id: "demo_sp_001", campaign_name: "Peak Supps | Protein | DPA Catalog",    spend: 410.00, leads: 22, cpl: 18.64, ctr: 0.038, frequency: 2.6, impressions: 44000, clicks: 1672, raw_metrics: {} },
    { campaign_id: "demo_sp_002", campaign_name: "Peak Supps | Pre-Workout | LAL 2%",     spend: 330.00, leads: 15, cpl: 22.00, ctr: 0.027, frequency: 2.0, impressions: 38000, clicks: 1026, raw_metrics: {} },
  ],
  act_demo_homegood: [
    { campaign_id: "demo_hg_001", campaign_name: "Casa Living | Furniture | Broad",       spend: 220.00, leads: 9,  cpl: 24.44, ctr: 0.021, frequency: 5.8, impressions: 26000, clicks: 546,  raw_metrics: {} },
    { campaign_id: "demo_hg_002", campaign_name: "Casa Living | Decor | Retargeting",     spend: 120.00, leads: 5,  cpl: 24.00, ctr: 0.035, frequency: 6.2, impressions: 12000, clicks: 420,  raw_metrics: {} },
  ],
  act_demo_fitness: [
    { campaign_id: "demo_ft_001", campaign_name: "Iron & Oak | Equipment | DPA",          spend: 165.00, leads: 8,  cpl: 20.63, ctr: 0.029, frequency: 2.2, impressions: 21000, clicks: 609,  raw_metrics: {} },
    { campaign_id: "demo_ft_002", campaign_name: "Iron & Oak | Gym Gear | LAL",           spend: 115.00, leads: 5,  cpl: 23.00, ctr: 0.023, frequency: 1.8, impressions: 16000, clicks: 368,  raw_metrics: {} },
  ],
  act_demo_finance: [
    { campaign_id: "demo_fi_001", campaign_name: "Crestwood | Debt Relief | Leads",       spend: 310.00, leads: 0, cpl: 0, ctr: 0.008, frequency: 3.2, impressions: 38000, clicks: 304, raw_metrics: {} },
    { campaign_id: "demo_fi_002", campaign_name: "Crestwood | Credit Repair | Broad",     spend: 200.00, leads: 0, cpl: 0, ctr: 0.006, frequency: 2.8, impressions: 28000, clicks: 168, raw_metrics: {} },
  ],
};

CAMPAIGNS["act_demo"] = CAMPAIGNS["act_demo_roofing"];

// ─── Scale daily baseline to a date range ─────────────────────────────────────

export function getDemoCampaigns(accountId: string, days = 1): object[] {
  const base = CAMPAIGNS[accountId] ?? CAMPAIGNS["act_demo_roofing"];
  if (days <= 1) return base;
  return base.map(c => {
    const spend   = Number((c.spend   * days * 0.91).toFixed(2));
    const leads   = Math.max(0, Math.round(c.leads   * days * 0.88));
    const impr    = Math.round(c.impressions * days * 0.94);
    const clicks  = Math.round(c.clicks      * days * 0.92);
    const cpl     = leads > 0 ? Number((spend / leads).toFixed(2)) : 0;
    return { ...c, spend, leads, impressions: impr, clicks, cpl };
  });
}

// ─── Ad sets (campaign drill-down) ────────────────────────────────────────────

const AD_SETS: Record<string, object[]> = {
  demo_r_001: [
    { ad_set_id: "demo_r_001a", ad_set_name: "Homeowners 35-45 | San Diego",  campaign_id: "demo_r_001", spend: 68.00,  leads: 2, cpl: 34.00, ctr: 0.024, frequency: 2.2, impressions: 5100,  clicks: 122, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
    { ad_set_id: "demo_r_001b", ad_set_name: "Homeowners 45-65 | San Diego",  campaign_id: "demo_r_001", spend: 82.00,  leads: 2, cpl: 41.00, ctr: 0.019, frequency: 2.6, impressions: 6240,  clicks: 118, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
    { ad_set_id: "demo_r_001c", ad_set_name: "Homeowners 35-65 | Los Angeles", campaign_id: "demo_r_001", spend: 37.40, leads: 0, cpl: 0,     ctr: 0.018, frequency: 2.4, impressions: 2860,  clicks: 51,  ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
  ],
  demo_r_002: [
    { ad_set_id: "demo_r_002a", ad_set_name: "Website Visitors 30d",          campaign_id: "demo_r_002", spend: 38.00,  leads: 1, cpl: 38.00, ctr: 0.042, frequency: 3.4, impressions: 1620,  clicks: 68,  ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
    { ad_set_id: "demo_r_002b", ad_set_name: "Engaged FB/IG 60d",             campaign_id: "demo_r_002", spend: 24.50,  leads: 1, cpl: 24.50, ctr: 0.033, frequency: 2.8, impressions: 1220,  clicks: 40,  ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
  ],
  demo_d_001: [
    { ad_set_id: "demo_d_001a", ad_set_name: "Women 25-44 | Invisalign",      campaign_id: "demo_d_001", spend: 98.00,  leads: 2, cpl: 49.00, ctr: 0.021, frequency: 3.0, impressions: 10400, clicks: 218, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
    { ad_set_id: "demo_d_001b", ad_set_name: "Men 25-44 | Invisalign",        campaign_id: "demo_d_001", spend: 76.00,  leads: 1, cpl: 76.00, ctr: 0.014, frequency: 3.4, impressions: 8200,  clicks: 114, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
  ],
  demo_e_001: [
    { ad_set_id: "demo_e_001a", ad_set_name: "DPA | Viewers 7d",              campaign_id: "demo_e_001", spend: 180.00, leads: 8,  cpl: 22.50, ctr: 0.035, frequency: 2.0, impressions: 18000, clicks: 630, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
    { ad_set_id: "demo_e_001b", ad_set_name: "DPA | Add to Cart 14d",         campaign_id: "demo_e_001", spend: 240.00, leads: 10, cpl: 24.00, ctr: 0.029, frequency: 2.2, impressions: 24000, clicks: 696, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
  ],
  demo_s_001: [
    { ad_set_id: "demo_s_001a", ad_set_name: "Homeowners 35-65 | CA",         campaign_id: "demo_s_001", spend: 180.00, leads: 0, cpl: 0, ctr: 0.010, frequency: 2.6, impressions: 20000, clicks: 200, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
    { ad_set_id: "demo_s_001b", ad_set_name: "Homeowners 45-65 | CA",         campaign_id: "demo_s_001", spend: 130.00, leads: 0, cpl: 0, ctr: 0.008, frequency: 3.0, impressions: 14400, clicks: 115, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
  ],
};

export function getDemoAdSets(campaignId: string): object[] {
  return AD_SETS[campaignId] ?? [];
}

// ─── Summary (30-day equivalent, scaled by route) ────────────────────────────

export function getDemoSummary(accountId: string): object {
  const campaigns = getDemoCampaigns(accountId, 30);
  const totalSpend  = (campaigns as DemoCampaign[]).reduce((s, c) => s + c.spend, 0);
  const totalLeads  = (campaigns as DemoCampaign[]).reduce((s, c) => s + c.leads, 0);
  const avgCPL      = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const prevSpend   = totalSpend * 0.91;
  const prevLeads   = Math.round(totalLeads * 0.87);
  return {
    current:  { total_spend: totalSpend.toFixed(2), total_leads: totalLeads, avg_cpl: avgCPL.toFixed(2), avg_ctr: "0.0237", avg_frequency: "2.43", total_impressions: Math.round(totalSpend * 80), active_ad_sets: (campaigns as DemoCampaign[]).length * 2 },
    previous: { total_spend: prevSpend.toFixed(2), total_leads: prevLeads, avg_cpl: (prevLeads > 0 ? prevSpend / prevLeads : 0).toFixed(2) },
    active_briefs: 2,
  };
}

// ─── Seed config — 15 clients ─────────────────────────────────────────────────

export const DEMO_CLIENTS_CONFIG = [
  { name: "Summit Roofing Co",        meta_ad_account_id: "act_demo_roofing",   vertical: "leads",  notes: "Demo — roofing lead gen, San Diego" },
  { name: "Bright Smile Dental",      meta_ad_account_id: "act_demo_dental",    vertical: "leads",  notes: "Demo — dental, Invisalign focus" },
  { name: "Urban Threads",            meta_ad_account_id: "act_demo_ecomm",     vertical: "ecomm",  notes: "Demo — DTC fashion brand" },
  { name: "Pacific Solar",            meta_ad_account_id: "act_demo_solar",     vertical: "leads",  notes: "Demo — solar, needs attention" },
  { name: "Apex HVAC Services",       meta_ad_account_id: "act_demo_hvac",      vertical: "leads",  notes: "Demo — HVAC seasonal lead gen" },
  { name: "Rodriguez Law Group",      meta_ad_account_id: "act_demo_legal",     vertical: "leads",  notes: "Demo — personal injury law" },
  { name: "SoCal Realty Group",       meta_ad_account_id: "act_demo_realty",    vertical: "leads",  notes: "Demo — real estate buyer/seller leads" },
  { name: "Premier Home Remodel",     meta_ad_account_id: "act_demo_remodel",   vertical: "leads",  notes: "Demo — kitchen & bath remodel leads" },
  { name: "Valley Auto Group",        meta_ad_account_id: "act_demo_auto",      vertical: "leads",  notes: "Demo — auto dealership leads" },
  { name: "Coastal Insurance",        meta_ad_account_id: "act_demo_insurance", vertical: "leads",  notes: "Demo — home & auto insurance leads" },
  { name: "Glow Beauty Co",           meta_ad_account_id: "act_demo_beauty",    vertical: "ecomm",  notes: "Demo — DTC skincare, scaling well" },
  { name: "Peak Performance Supps",   meta_ad_account_id: "act_demo_supps",     vertical: "ecomm",  notes: "Demo — supplements DTC" },
  { name: "Casa Living Co",           meta_ad_account_id: "act_demo_homegood",  vertical: "ecomm",  notes: "Demo — home goods, high frequency warning" },
  { name: "Iron & Oak Fitness",       meta_ad_account_id: "act_demo_fitness",   vertical: "ecomm",  notes: "Demo — fitness equipment DTC" },
  { name: "Crestwood Financial",      meta_ad_account_id: "act_demo_finance",   vertical: "leads",  notes: "Demo — financial services, critical" },
] as const;
