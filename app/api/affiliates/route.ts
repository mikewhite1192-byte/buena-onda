// app/api/affiliates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

const sql = neon(process.env.DATABASE_URL!);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { name, email, website, audience_size, promotion_plan } = await req.json();

  if (!name || !email || !promotion_plan) {
    return NextResponse.json({ error: "Name, email, and promotion plan are required." }, { status: 400 });
  }

  // Check for duplicate
  const existing = await sql`SELECT id FROM affiliate_applications WHERE email = ${email} LIMIT 1`;
  if (existing.length > 0) {
    return NextResponse.json({ error: "An application with this email already exists." }, { status: 409 });
  }

  // Generate affiliate code from name
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
  const suffix = Math.random().toString(36).slice(2, 6);
  const affiliate_code = `${base}-${suffix}`;

  await sql`
    INSERT INTO affiliate_applications (name, email, website, audience_size, promotion_plan, affiliate_code)
    VALUES (${name}, ${email}, ${website ?? null}, ${audience_size ?? null}, ${promotion_plan}, ${affiliate_code})
  `;

  // Send confirmation email (best-effort)
  try {
    await resend.emails.send({
      from: "Buena Onda <reports@buenaonda.ai>",
      to: email,
      subject: "You're in — Buena Onda Affiliate Program",
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; background: #0d0f14; color: #e8eaf0; padding: 40px; border-radius: 12px;">
          <div style="background: linear-gradient(135deg,#f5a623,#f76b1c); display: inline-block; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 13px; color: #fff; margin-bottom: 20px;">
            Buena Onda
          </div>
          <h1 style="font-size: 22px; font-weight: 800; color: #e8eaf0; margin: 0 0 8px;">Application received, ${name}.</h1>
          <p style="font-size: 14px; color: #8b8fa8; margin: 0 0 28px;">We'll review your application and get back to you within 48 hours.</p>

          <div style="background: #161820; border-radius: 10px; padding: 20px 24px; margin-bottom: 28px;">
            <div style="font-size: 11px; color: #5a5e72; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">Program Details</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <div style="font-size: 11px; color: #8b8fa8; margin-bottom: 4px;">Commission</div>
                <div style="font-size: 24px; font-weight: 800; color: #f5a623;">20%</div>
                <div style="font-size: 11px; color: #5a5e72;">recurring, every month</div>
              </div>
              <div>
                <div style="font-size: 11px; color: #8b8fa8; margin-bottom: 4px;">Cookie Duration</div>
                <div style="font-size: 24px; font-weight: 800; color: #e8eaf0;">90</div>
                <div style="font-size: 11px; color: #5a5e72;">days</div>
              </div>
            </div>
          </div>

          <div style="background: #161820; border-radius: 10px; padding: 16px 20px; margin-bottom: 28px; border-left: 3px solid #f5a623;">
            <div style="font-size: 12px; color: #e8eaf0; margin-bottom: 4px;">Your affiliate code (pending approval)</div>
            <div style="font-size: 18px; font-weight: 700; color: #f5a623; letter-spacing: 1px;">${affiliate_code}</div>
          </div>

          <p style="font-size: 12px; color: #5a5e72;">Once approved, you'll earn 20% of every subscription you refer — every month they stay. We'll send your unique referral link when you're approved.</p>

          <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #1e2130; font-size: 11px; color: #5a5e72;">
            Buena Onda · The AI-Powered Meta Ads Platform for Agencies
          </div>
        </div>
      `,
    });
  } catch {
    // Don't fail the request if email fails
  }

  // Notify Mike
  try {
    await resend.emails.send({
      from: "Buena Onda <reports@buenaonda.ai>",
      to: "mike@buenaonda.ai",
      subject: `New affiliate application — ${name}`,
      html: `
        <div style="font-family: monospace; padding: 20px;">
          <h2>New Affiliate Application</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Website:</strong> ${website ?? "—"}</p>
          <p><strong>Audience Size:</strong> ${audience_size ?? "—"}</p>
          <p><strong>Promotion Plan:</strong> ${promotion_plan}</p>
          <p><strong>Code:</strong> ${affiliate_code}</p>
        </div>
      `,
    });
  } catch {
    // best-effort
  }

  return NextResponse.json({ success: true, affiliate_code });
}
