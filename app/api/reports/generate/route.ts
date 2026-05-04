// app/api/reports/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const sql = neon(process.env.DATABASE_URL!);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, startDate, endDate, sendEmail, emailTo } = await req.json();
  if (!clientId || !startDate || !endDate) {
    return NextResponse.json({ error: "clientId, startDate, endDate required" }, { status: 400 });
  }

  // Fetch client info — owner-scope so an attacker can't pass another tenant's
  // clientId and have us read their Meta token + email an Insights report to
  // an attacker-supplied address.
  const [client] = await sql`
    SELECT name, vertical, meta_ad_account_id, meta_access_token
    FROM clients WHERE id = ${clientId} AND owner_id = ${userId} LIMIT 1
  `;
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Fetch campaign metrics for date range
  const adAccountId = client.meta_ad_account_id;
  const { decryptToken } = await import("@/lib/crypto/tokens");
  const stored = client.meta_access_token as string | null | undefined;
  const token = stored ? decryptToken(stored) : process.env.META_ACCESS_TOKEN;

  let campaigns: Array<Record<string, unknown>> = [];
  let adSets: Array<Record<string, unknown>> = [];

  try {
    const [campRes, adSetRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/agent/metrics/campaigns?client_id=${clientId}&ad_account_id=${adAccountId}&startDate=${startDate}&endDate=${endDate}`, {
        headers: { Cookie: req.headers.get("cookie") ?? "" },
      }),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/agent/metrics/adsets?ad_account_id=${adAccountId}&startDate=${startDate}&endDate=${endDate}&token=${token}`, {
        headers: { Cookie: req.headers.get("cookie") ?? "" },
      }),
    ]);
    const campData = await campRes.json();
    const adSetData = await adSetRes.json();
    campaigns = campData.campaigns ?? [];
    adSets = adSetData.ad_sets ?? [];
  } catch {
    // proceed with empty data
  }

  // Compute aggregate metrics
  const totalSpend = campaigns.reduce((s, c) => s + (Number(c.spend) || 0), 0);
  const totalLeads = campaigns.reduce((s, c) => s + (Number(c.leads) || 0), 0);
  const totalPurchases = campaigns.reduce((s, c) => s + (Number(c.purchases) || 0), 0);
  const totalPurchaseValue = campaigns.reduce((s, c) => s + (Number(c.purchase_value) || 0), 0);
  const totalImpressions = campaigns.reduce((s, c) => s + (Number(c.impressions) || 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (Number(c.clicks) || 0), 0);
  const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const avgCPA = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
  const avgROAS = totalSpend > 0 ? totalPurchaseValue / totalSpend : 0;
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgFrequency = campaigns.length > 0
    ? campaigns.reduce((s, c) => s + (Number(c.frequency) || 0), 0) / campaigns.length
    : 0;

  const isLeads = client.vertical === "leads";
  const dateLabel = `${startDate} to ${endDate}`;

  // Generate AI summary
  const prompt = `You are a senior Meta ads analyst writing a performance report for an agency client.

CLIENT: ${client.name} (${isLeads ? "Lead Generation" : "Ecommerce"})
PERIOD: ${dateLabel}

METRICS:
- Total Spend: $${totalSpend.toFixed(2)}
${isLeads
  ? `- Total Leads: ${totalLeads}\n- CPL: $${avgCPL.toFixed(2)}`
  : `- Total Purchases: ${totalPurchases}\n- Purchase Value: $${totalPurchaseValue.toFixed(2)}\n- ROAS: ${avgROAS.toFixed(2)}x\n- CPA: $${avgCPA.toFixed(2)}`
}
- CTR: ${avgCTR.toFixed(2)}%
- Avg Frequency: ${avgFrequency.toFixed(2)}
- Impressions: ${totalImpressions.toLocaleString()}
- Active Campaigns: ${campaigns.length}

TOP CAMPAIGNS:
${campaigns.slice(0, 5).map((c, i) => isLeads
  ? `${i + 1}. ${c.campaign_name ?? c.campaign_id}: $${Number(c.spend).toFixed(2)} spend, ${c.leads} leads, $${Number(c.cpl).toFixed(2)} CPL`
  : `${i + 1}. ${c.campaign_name ?? c.campaign_id}: $${Number(c.spend).toFixed(2)} spend, ${c.purchases} purchases, $${Number(c.purchase_value).toFixed(2)} revenue, ${Number(c.roas).toFixed(2)}x ROAS`
).join("\n")}

Write a concise performance report with these sections:
1. **Executive Summary** (2-3 sentences — what happened this period overall)
2. **What's Working** (specific campaigns or patterns performing well)
3. **Areas of Concern** (anything underperforming or needs attention)
4. **Recommendations** (3-5 specific, actionable next steps)

Be direct and specific. Use the actual numbers. No filler.`;

  const aiResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = aiResponse.content[0]?.type === "text" ? aiResponse.content[0].text : "";

  const report = {
    clientName: client.name,
    vertical: client.vertical,
    startDate,
    endDate,
    generatedAt: new Date().toISOString(),
    metrics: {
      totalSpend,
      totalLeads,
      totalPurchases,
      totalPurchaseValue,
      avgCPL,
      avgCPA,
      avgROAS,
      avgCTR,
      avgFrequency,
      totalImpressions,
      totalClicks,
      campaignCount: campaigns.length,
    },
    campaigns,
    adSets: adSets.slice(0, 10),
    summary,
  };

  // Send email if requested
  if (sendEmail && emailTo) {
    const topCampaignsHtml = campaigns.slice(0, 5).map(c => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #1e2130; color: #e8eaf0; font-size: 12px;">${c.campaign_name ?? c.campaign_id}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #1e2130; color: #e8eaf0; font-size: 12px; text-align: right;">$${Number(c.spend).toFixed(2)}</td>
        ${isLeads
          ? `<td style="padding: 8px 12px; border-bottom: 1px solid #1e2130; color: #e8eaf0; font-size: 12px; text-align: right;">${c.leads}</td>
             <td style="padding: 8px 12px; border-bottom: 1px solid #1e2130; color: #f5a623; font-size: 12px; text-align: right;">$${Number(c.cpl).toFixed(2)}</td>`
          : `<td style="padding: 8px 12px; border-bottom: 1px solid #1e2130; color: #e8eaf0; font-size: 12px; text-align: right;">${c.purchases}</td>
             <td style="padding: 8px 12px; border-bottom: 1px solid #1e2130; color: #f5a623; font-size: 12px; text-align: right;">${Number(c.roas).toFixed(2)}x</td>`
        }
      </tr>
    `).join("");

    const summaryHtml = summary
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");

    const emailStats = isLeads
      ? [
          { label: "Total Spend", value: `$${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
          { label: "Leads", value: String(totalLeads) },
          { label: "Avg CPL", value: `$${avgCPL.toFixed(0)}` },
          { label: "Avg CTR", value: `${avgCTR.toFixed(2)}%` },
        ]
      : [
          { label: "Total Spend", value: `$${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
          { label: "Revenue", value: `$${totalPurchaseValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
          { label: "ROAS", value: `${avgROAS.toFixed(2)}x` },
          { label: "Purchases", value: String(totalPurchases) },
        ];

    await resend.emails.send({
      from: "Buena Onda Reports <reports@buenaonda.ai>",
      to: emailTo,
      subject: `${client.name} — Performance Report (${startDate} to ${endDate})`,
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 680px; background: #0d0f14; color: #e8eaf0; padding: 40px; border-radius: 12px;">
          <div style="background: linear-gradient(135deg,#f5a623,#f76b1c); display: inline-block; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 13px; color: #fff; margin-bottom: 8px;">
            Buena Onda
          </div>
          <h1 style="font-size: 22px; font-weight: 800; color: #e8eaf0; margin: 0 0 4px; letter-spacing: -0.5px;">${client.name}</h1>
          <div style="font-size: 13px; color: #8b8fa8; margin-bottom: 32px;">Performance Report · ${dateLabel}</div>

          <!-- Stats -->
          <div style="display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 32px;">
            ${emailStats.map(s => `
              <div style="background: #161820; border-radius: 8px; padding: 14px; text-align: center;">
                <div style="font-size: 10px; color: #8b8fa8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">${s.label}</div>
                <div style="font-size: 22px; font-weight: 800; color: #f5a623;">${s.value}</div>
              </div>
            `).join("")}
          </div>

          <!-- AI Summary -->
          <div style="background: #161820; border-radius: 10px; padding: 20px; margin-bottom: 28px; border-left: 3px solid #f5a623;">
            <div style="font-size: 11px; color: #8b8fa8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">AI Analysis</div>
            <div style="font-size: 13px; color: #e8eaf0; line-height: 1.7;">${summaryHtml}</div>
          </div>

          <!-- Campaign Table -->
          ${campaigns.length > 0 ? `
          <div style="margin-bottom: 28px;">
            <div style="font-size: 11px; color: #8b8fa8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Campaign Breakdown</div>
            <table style="width: 100%; border-collapse: collapse; background: #161820; border-radius: 10px; overflow: hidden;">
              <thead>
                <tr style="background: #1e2130;">
                  <th style="padding: 8px 12px; text-align: left; font-size: 10px; color: #8b8fa8; text-transform: uppercase;">Campaign</th>
                  <th style="padding: 8px 12px; text-align: right; font-size: 10px; color: #8b8fa8; text-transform: uppercase;">Spend</th>
                  <th style="padding: 8px 12px; text-align: right; font-size: 10px; color: #8b8fa8; text-transform: uppercase;">${isLeads ? "Leads" : "Purchases"}</th>
                  <th style="padding: 8px 12px; text-align: right; font-size: 10px; color: #8b8fa8; text-transform: uppercase;">${isLeads ? "CPL" : "ROAS"}</th>
                </tr>
              </thead>
              <tbody>${topCampaignsHtml}</tbody>
            </table>
          </div>
          ` : ""}

          <div style="font-size: 11px; color: #5a5e72; border-top: 1px solid #1e2130; padding-top: 20px;">
            Generated by Buena Onda · ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}
          </div>
        </div>
      `,
    });
  }

  return NextResponse.json({ report });
}
