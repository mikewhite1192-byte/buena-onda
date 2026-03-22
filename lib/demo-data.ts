// lib/demo-data.ts — Full 15-client agency demo
// Account IDs follow act_demo_* convention

export function isDemoAccount(id: string | null | undefined): boolean {
  return !!id && (id === "act_demo" || id.startsWith("act_demo_"));
}

// ─── Campaign baseline (daily numbers) ───────────────────────────────────────

type DemoCampaign = {
  campaign_id: string;
  campaign_name: string;
  status: string;
  spend: number;
  leads: number;
  cpl: number;
  purchases: number;
  purchase_value: number;
  roas: number;
  cost_per_purchase: number;
  ctr: number;
  frequency: number;
  impressions: number;
  clicks: number;
  raw_metrics: object;
};

// Helper to build a leads-vertical campaign row
function lc(campaign_id: string, campaign_name: string, status: string, spend: number, leads: number, ctr: number, frequency: number, impressions: number, clicks: number): DemoCampaign {
  const cpl = leads > 0 ? Number((spend / leads).toFixed(2)) : 0;
  return { campaign_id, campaign_name, status, spend, leads, cpl, purchases: 0, purchase_value: 0, roas: 0, cost_per_purchase: 0, ctr, frequency, impressions, clicks, raw_metrics: {} };
}

// Helper to build an ecomm-vertical campaign row
function ec(campaign_id: string, campaign_name: string, status: string, spend: number, purchases: number, purchase_value: number, ctr: number, frequency: number, impressions: number, clicks: number): DemoCampaign {
  const roas = spend > 0 && purchase_value > 0 ? Number((purchase_value / spend).toFixed(2)) : 0;
  const cost_per_purchase = purchases > 0 ? Number((spend / purchases).toFixed(2)) : 0;
  return { campaign_id, campaign_name, status, spend, leads: 0, cpl: 0, purchases, purchase_value, roas, cost_per_purchase, ctr, frequency, impressions, clicks, raw_metrics: {} };
}

const CAMPAIGNS: Record<string, DemoCampaign[]> = {
  act_demo_roofing: [
    lc("demo_r_001", "Summit | Homeowners 35-65 | Lead Gen",   "ACTIVE",  187.40, 4, 0.021, 2.4, 14200, 298),
    lc("demo_r_002", "Summit | Storm Damage | Retargeting",    "ACTIVE",  62.50,  2, 0.038, 3.1, 2840,  107),
    lc("demo_r_003", "Summit | LAL 1% | Prospecting",          "PAUSED",  44.20,  1, 0.012, 1.8, 6720,  80),
  ],
  act_demo_dental: [
    lc("demo_d_001", "Bright Smile | Invisalign | Leads",      "ACTIVE",  174.00, 3, 0.018, 3.2, 18600, 334),
    lc("demo_d_002", "Bright Smile | Whitening | Retargeting", "PAUSED",  89.50,  1, 0.022, 4.1, 7200,  158),
  ],
  act_demo_ecomm: [
    ec("demo_e_001", "Urban Threads | Summer Drop | DPA",      "ACTIVE",  420.00, 18, 864.00,  0.032, 2.1, 42000, 1344),
    ec("demo_e_002", "Urban Threads | Lookalike | Broad",      "ACTIVE",  280.00, 8,  320.00,  0.019, 1.6, 31000, 589),
    ec("demo_e_003", "Urban Threads | Retargeting 7d",         "PAUSED",  190.00, 14, 812.00,  0.055, 5.2, 12400, 682),
  ],
  act_demo_solar: [
    lc("demo_s_001", "Pacific Solar | Homeowners | Leads",     "ACTIVE",  310.00, 0, 0.009, 2.8, 34400, 309),
    lc("demo_s_002", "Pacific Solar | Eco Audience | Leads",   "PAUSED",  110.00, 0, 0.007, 2.2, 15700, 109),
  ],
  act_demo_hvac: [
    lc("demo_h_001", "Apex HVAC | Homeowners | AC Leads",      "ACTIVE",  112.00, 4, 0.026, 2.0, 9800, 254),
    lc("demo_h_002", "Apex HVAC | Retargeting | Hot Summer",   "ACTIVE",  73.00,  3, 0.041, 3.3, 4200, 172),
  ],
  act_demo_legal: [
    lc("demo_l_001", "Rodriguez Law | Personal Injury | Leads", "ACTIVE",  195.00, 3, 0.014, 2.6, 22000, 308),
    lc("demo_l_002", "Rodriguez Law | Auto Accident | Broad",   "PAUSED",  115.00, 2, 0.011, 2.1, 16500, 181),
  ],
  act_demo_realty: [
    lc("demo_re_001", "SoCal Realty | Buyers 35-55 | Leads",   "ACTIVE",  280.00, 3, 0.016, 3.1, 28000, 448),
    lc("demo_re_002", "SoCal Realty | Seller Leads | Broad",   "ACTIVE",  160.00, 2, 0.013, 2.7, 19000, 247),
  ],
  act_demo_remodel: [
    lc("demo_rm_001", "Premier Remodel | Kitchen | Leads",     "ACTIVE",  138.00, 4, 0.022, 2.2, 11800, 259),
    lc("demo_rm_002", "Premier Remodel | Bathroom | LAL",      "PAUSED",  87.00,  2, 0.018, 1.9, 8400,  151),
  ],
  act_demo_auto: [
    lc("demo_a_001", "Valley Auto | New Arrivals | Leads",     "ACTIVE",  220.00, 6, 0.019, 2.4, 26000, 494),
    lc("demo_a_002", "Valley Auto | Trade-In | Retargeting",   "ACTIVE",  160.00, 5, 0.031, 3.8, 14200, 440),
  ],
  act_demo_insurance: [
    lc("demo_i_001", "Coastal Insurance | Homeowners | Leads", "ACTIVE",  130.00, 2, 0.015, 2.9, 14500, 217),
    lc("demo_i_002", "Coastal Insurance | Auto | Leads",       "PAUSED",  65.00,  1, 0.012, 2.4, 9800,  117),
  ],
  act_demo_beauty: [
    ec("demo_b_001", "Glow Beauty | Skincare Set | DPA",       "ACTIVE",  295.00, 21, 1302.00, 0.044, 2.3, 38000, 1672),
    ec("demo_b_002", "Glow Beauty | New Customers | LAL",      "ACTIVE",  225.00, 14, 812.00,  0.031, 1.7, 29000, 899),
  ],
  act_demo_supps: [
    ec("demo_sp_001", "Peak Supps | Protein | DPA Catalog",    "ACTIVE",  410.00, 22, 1210.00, 0.038, 2.6, 44000, 1672),
    ec("demo_sp_002", "Peak Supps | Pre-Workout | LAL 2%",     "PAUSED",  330.00, 15, 780.00,  0.027, 2.0, 38000, 1026),
  ],
  act_demo_homegood: [
    ec("demo_hg_001", "Casa Living | Furniture | Broad",       "ACTIVE",  220.00, 9,  765.00,  0.021, 5.8, 26000, 546),
    ec("demo_hg_002", "Casa Living | Decor | Retargeting",     "PAUSED",  120.00, 5,  360.00,  0.035, 6.2, 12000, 420),
  ],
  act_demo_fitness: [
    ec("demo_ft_001", "Iron & Oak | Equipment | DPA",          "ACTIVE",  165.00, 8,  960.00,  0.029, 2.2, 21000, 609),
    ec("demo_ft_002", "Iron & Oak | Gym Gear | LAL",           "ACTIVE",  115.00, 5,  575.00,  0.023, 1.8, 16000, 368),
  ],
  act_demo_finance: [
    lc("demo_fi_001", "Crestwood | Debt Relief | Leads",       "ACTIVE",  310.00, 0, 0.008, 3.2, 38000, 304),
    lc("demo_fi_002", "Crestwood | Credit Repair | Broad",     "PAUSED",  200.00, 0, 0.006, 2.8, 28000, 168),
  ],
};

CAMPAIGNS["act_demo"] = CAMPAIGNS["act_demo_roofing"];

// ─── Scale daily baseline to a date range ─────────────────────────────────────

export function getDemoCampaigns(accountId: string, days = 1): object[] {
  const base = CAMPAIGNS[accountId] ?? CAMPAIGNS["act_demo_roofing"];
  if (days <= 1) return base;
  return base.map(c => {
    const spend         = Number((c.spend        * days * 0.91).toFixed(2));
    const leads         = Math.max(0, Math.round(c.leads        * days * 0.88));
    const purchases     = Math.max(0, Math.round(c.purchases    * days * 0.88));
    const purchaseValue = Number((c.purchase_value * days * 0.90).toFixed(2));
    const impr          = Math.round(c.impressions * days * 0.94);
    const clicks        = Math.round(c.clicks      * days * 0.92);
    const cpl           = leads > 0 ? Number((spend / leads).toFixed(2)) : 0;
    const roas          = spend > 0 && purchaseValue > 0 ? Number((purchaseValue / spend).toFixed(2)) : 0;
    const cost_per_purchase = purchases > 0 ? Number((spend / purchases).toFixed(2)) : 0;
    return { ...c, spend, leads, cpl, purchases, purchase_value: purchaseValue, roas, cost_per_purchase, impressions: impr, clicks };
  });
}

// ─── Daily timeseries (for charts) ───────────────────────────────────────────

export interface TimeseriesPoint {
  date: string;
  spend: number;
  leads: number;
  cpl: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  link_clicks: number;
  unique_clicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  purchases: number;
  purchase_value: number;
  adds_to_cart: number;
  checkouts: number;
  cpa: number;
  roas: number;
}

// Day-of-week multipliers (0=Sun .. 6=Sat)
const DOW_FACTOR = [0.62, 1.08, 1.18, 1.22, 1.12, 1.00, 0.72];

// Seeded pseudo-random so charts look consistent across refreshes
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function getDemoTimeseries(accountId: string, startDate: string, endDate: string): TimeseriesPoint[] {
  const campaigns = (CAMPAIGNS[accountId] ?? CAMPAIGNS["act_demo_roofing"]) as DemoCampaign[];
  const start = new Date(startDate);
  const end   = new Date(endDate);
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  const points: TimeseriesPoint[] = [];

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dow = d.getDay();
    const dowFactor = DOW_FACTOR[dow];
    // Slight improving trend over time (CPL improves ~0.3% per day)
    const trendFactor = 1 - (i * 0.003);

    let daySpend = 0, dayLeads = 0, dayImpressions = 0, dayClicks = 0;

    for (const c of campaigns) {
      // Each campaign+day gets a unique seed for consistent variance
      const seed = (c.campaign_id.charCodeAt(c.campaign_id.length - 1) * 31 + i) * 7;
      const variance = 0.82 + seededRand(seed) * 0.36; // ±18% variance
      const factor = dowFactor * variance;

      daySpend       += c.spend       * factor;
      dayLeads       += c.leads       * factor * trendFactor;
      dayImpressions += c.impressions * factor;
      dayClicks      += c.clicks      * factor;
    }

    daySpend       = Math.max(0, Number(daySpend.toFixed(2)));
    dayLeads       = Math.max(0, Math.round(dayLeads));
    dayImpressions = Math.max(0, Math.round(dayImpressions));
    dayClicks      = Math.max(0, Math.round(dayClicks));
    const dayCpl       = dayLeads > 0 ? Number((daySpend / dayLeads).toFixed(2)) : 0;
    // Derived delivery metrics
    const freqSeed     = (i * 17 + 3);
    const dayFrequency = Number((1.8 + seededRand(freqSeed) * 1.8).toFixed(2)); // 1.8–3.6
    const dayReach     = dayImpressions > 0 ? Math.round(dayImpressions / dayFrequency) : 0;
    const dayLinkClicks   = Math.round(dayClicks * (0.55 + seededRand(i * 5) * 0.15));
    const dayUniqueClicks = Math.round(dayClicks * (0.85 + seededRand(i * 9) * 0.1));
    const dayCtr   = dayImpressions > 0 ? Number((dayClicks / dayImpressions).toFixed(4)) : 0;
    const dayCpm   = dayImpressions > 0 ? Number(((daySpend / dayImpressions) * 1000).toFixed(2)) : 0;
    const dayCpc   = dayClicks > 0 ? Number((daySpend / dayClicks).toFixed(2)) : 0;

    // For ecomm accounts, treat leads as purchases
    const isEcomm = ["act_demo_ecomm","act_demo_beauty","act_demo_supps","act_demo_homegood","act_demo_fitness"].includes(accountId);
    const purchases     = isEcomm ? dayLeads : 0;
    const purchaseValue = isEcomm ? Number((purchases * (75 + seededRand(i * 13) * 40)).toFixed(2)) : 0;
    const addsToCart    = isEcomm ? Math.round(purchases * (3 + seededRand(i * 7))) : 0;
    const checkouts     = isEcomm ? Math.round(purchases * (1.4 + seededRand(i * 11) * 0.4)) : 0;
    const cpa           = purchases > 0 ? Number((daySpend / purchases).toFixed(2)) : 0;
    const roas          = daySpend > 0 && purchaseValue > 0 ? Number((purchaseValue / daySpend).toFixed(2)) : 0;

    points.push({
      date: dateStr, spend: daySpend, leads: dayLeads, cpl: dayCpl,
      impressions: dayImpressions, reach: dayReach, frequency: dayFrequency,
      clicks: dayClicks, link_clicks: dayLinkClicks, unique_clicks: dayUniqueClicks,
      ctr: dayCtr, cpm: dayCpm, cpc: dayCpc,
      purchases, purchase_value: purchaseValue, adds_to_cart: addsToCart, checkouts,
      cpa, roas,
    });
  }

  return points;
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
    { ad_set_id: "demo_e_001a", ad_set_name: "DPA | Viewers 7d",              campaign_id: "demo_e_001", spend: 180.00, leads: 0, cpl: 0, purchases: 8,  purchase_value: 384.00, roas: 2.13, cost_per_purchase: 22.50, ctr: 0.035, frequency: 2.0, impressions: 18000, clicks: 630, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
    { ad_set_id: "demo_e_001b", ad_set_name: "DPA | Add to Cart 14d",         campaign_id: "demo_e_001", spend: 240.00, leads: 0, cpl: 0, purchases: 10, purchase_value: 480.00, roas: 2.00, cost_per_purchase: 24.00, ctr: 0.029, frequency: 2.2, impressions: 24000, clicks: 696, ad_status: "ACTIVE", date_recorded: new Date().toISOString(), raw_metrics: {} },
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

// ─── Demo Creatives ────────────────────────────────────────────────────────────

export type DemoCreative = {
  id: string;
  client_id: string;
  name: string;
  format: "image" | "video" | "carousel" | "story" | "reel";
  status: "live" | "testing" | "fatigued" | "killed";
  hook: string | null;
  spend: number | null;
  cpl: number | null;
  roas: number | null;
  ctr: number | null;
  notes: string | null;
  created_at: string;
};

const DEMO_CREATIVES_LEADS: DemoCreative[] = [
  { id: "dc_l_001", client_id: "demo", name: "Storm Damage UGC — Homeowner Testimonial", format: "video",    status: "live",     hook: "My roof was gone in 20 minutes. Here's what I did next.", spend: 1840, cpl: 24.50, roas: null, ctr: 0.038, notes: "Top performer. Push more budget here. Works best with 35-55 homeowners.", created_at: "2026-02-01T00:00:00Z" },
  { id: "dc_l_002", client_id: "demo", name: "Before/After Roof Replacement — Static",   format: "image",    status: "live",     hook: "Before vs After: See the difference a new roof makes.", spend: 1220, cpl: 31.00, roas: null, ctr: 0.029, notes: "Consistent performer. Good for retargeting audiences.", created_at: "2026-02-05T00:00:00Z" },
  { id: "dc_l_003", client_id: "demo", name: "Free Inspection Offer — Carousel",         format: "carousel", status: "testing",  hook: "Your roof could be failing right now. Get a free inspection.", spend: 620,  cpl: 38.75, roas: null, ctr: 0.021, notes: "Testing with cold audiences. Too early to call.", created_at: "2026-03-01T00:00:00Z" },
  { id: "dc_l_004", client_id: "demo", name: "Hail Season Alert — Video",                format: "video",    status: "fatigued", hook: "Hail season is here. Is your roof ready?", spend: 2100, cpl: 72.00, roas: null, ctr: 0.014, notes: "Crushed it in Jan. CPL spiked hard in Feb — frequency too high. Rest or refresh.", created_at: "2026-01-10T00:00:00Z" },
  { id: "dc_l_005", client_id: "demo", name: "Price Anchor Ad — Static Image",           format: "image",    status: "killed",   hook: "Roof replacements starting at $4,999.", spend: 480,  cpl: 142.00, roas: null, ctr: 0.009, notes: "Price-forward messaging didn't land. Killed after 2 weeks.", created_at: "2026-01-20T00:00:00Z" },
  { id: "dc_l_006", client_id: "demo", name: "Reels — 15s Crew At Work",                 format: "reel",     status: "testing",  hook: "Watch us replace a full roof in one day.", spend: 310,  cpl: 29.80, roas: null, ctr: 0.044, notes: "Early results look promising. Extend if CPL holds.", created_at: "2026-03-10T00:00:00Z" },
];

const DEMO_CREATIVES_ECOMM: DemoCreative[] = [
  { id: "dc_e_001", client_id: "demo", name: "Summer Drop — Lifestyle Lookbook Video",    format: "video",    status: "live",     hook: "The drop you've been waiting for. Limited pieces.", spend: 3200, cpl: null, roas: 4.10, ctr: 0.047, notes: "Best performer this quarter. Scale carefully — audience still fresh.", created_at: "2026-02-01T00:00:00Z" },
  { id: "dc_e_002", client_id: "demo", name: "DPA — Retargeting Catalog",                 format: "carousel", status: "live",     hook: null, spend: 2100, cpl: null, roas: 3.60, ctr: 0.038, notes: "DPA always on for retargeting. Steady ROAS, don't touch.", created_at: "2026-01-15T00:00:00Z" },
  { id: "dc_e_003", client_id: "demo", name: "UGC Unboxing — Customer Review",            format: "video",    status: "live",     hook: "I wasn't expecting this quality at this price.", spend: 1850, cpl: null, roas: 3.20, ctr: 0.041, notes: "Authentic UGC outperforming branded content. Sourcing more creators.", created_at: "2026-02-10T00:00:00Z" },
  { id: "dc_e_004", client_id: "demo", name: "Static Product Hero — White Background",    format: "image",    status: "fatigued", hook: "Shop the new collection.", spend: 1400, cpl: null, roas: 1.80, ctr: 0.018, notes: "ROAS dropped from 3.1 to 1.8 over 6 weeks. Audience exhausted.", created_at: "2026-01-01T00:00:00Z" },
  { id: "dc_e_005", client_id: "demo", name: "Influencer Story — @thestyleloft",          format: "story",    status: "testing",  hook: "My honest review after 30 days.", spend: 720,  cpl: null, roas: 2.40, ctr: 0.033, notes: "Testing influencer format vs UGC. Need more data.", created_at: "2026-03-05T00:00:00Z" },
  { id: "dc_e_006", client_id: "demo", name: "Promo — 20% Off Flash Sale",                format: "image",    status: "killed",   hook: "20% off everything. Today only.", spend: 560,  cpl: null, roas: 0.90, ctr: 0.022, notes: "Sale ads hurt brand perception and ROAS was sub-1. Won't repeat.", created_at: "2026-02-14T00:00:00Z" },
];

export function getDemoCreatives(vertical: string): DemoCreative[] {
  return vertical === "ecomm" ? DEMO_CREATIVES_ECOMM : DEMO_CREATIVES_LEADS;
}
