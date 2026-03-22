// app/api/affiliates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

const sql = neon(process.env.DATABASE_URL!);
const resend = new Resend(process.env.RESEND_API_KEY);

// GET — look up affiliate by email (for returning affiliates)
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const rows = await sql`
    SELECT affiliate_code, name, created_at FROM affiliate_applications WHERE email = ${email} LIMIT 1
  `;
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ affiliate_code: rows[0].affiliate_code, name: rows[0].name });
}

// POST — instant signup, no friction
export async function POST(req: NextRequest) {
  const { name, email } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  // Return existing code if already signed up
  const existing = await sql`SELECT affiliate_code FROM affiliate_applications WHERE email = ${email} LIMIT 1`;
  if (existing.length > 0) {
    return NextResponse.json({ affiliate_code: existing[0].affiliate_code });
  }

  // Generate unique affiliate code
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
  const suffix = Math.random().toString(36).slice(2, 6);
  const affiliate_code = `${base}-${suffix}`;

  await sql`
    INSERT INTO affiliate_applications (name, email, affiliate_code, status)
    VALUES (${name}, ${email}, ${affiliate_code}, 'active')
  `;

  // Confirmation email (best-effort)
  try {
    const link = `https://buenaonda.ai/?ref=${affiliate_code}`;
    await resend.emails.send({
      from: "Buena Onda <reports@buenaonda.ai>",
      to: email,
      subject: "Your Buena Onda referral link is ready",
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; background: #0d0f14; color: #e8eaf0; padding: 40px; border-radius: 12px;">
          <div style="background: linear-gradient(135deg,#f5a623,#f76b1c); display: inline-block; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 13px; color: #fff; margin-bottom: 20px;">Buena Onda</div>
          <h1 style="font-size: 22px; font-weight: 800; color: #e8eaf0; margin: 0 0 8px;">You're in, ${name.split(" ")[0]}.</h1>
          <p style="font-size: 14px; color: #8b8fa8; margin: 0 0 28px;">Share your link and earn 20% every month someone stays.</p>
          <div style="background: #161820; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px;">
            <div style="font-size: 11px; color: #5a5e72; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Your referral link</div>
            <div style="font-size: 15px; font-weight: 700; color: #f5a623;">${link}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px;">
            <div style="background: #161820; border-radius: 8px; padding: 14px; text-align: center;">
              <div style="font-size: 10px; color: #8b8fa8; margin-bottom: 4px; text-transform: uppercase;">Commission</div>
              <div style="font-size: 24px; font-weight: 800; color: #f5a623;">20%</div>
              <div style="font-size: 11px; color: #5a5e72;">every month, forever</div>
            </div>
            <div style="background: #161820; border-radius: 8px; padding: 14px; text-align: center;">
              <div style="font-size: 10px; color: #8b8fa8; margin-bottom: 4px; text-transform: uppercase;">Cookie</div>
              <div style="font-size: 24px; font-weight: 800; color: #e8eaf0;">90 days</div>
              <div style="font-size: 11px; color: #5a5e72;">from first click</div>
            </div>
          </div>
          <a href="https://buenaonda.ai/affiliates/portal?email=${encodeURIComponent(email)}" style="display: block; text-align: center; background: rgba(245,166,35,0.12); border: 1px solid rgba(245,166,35,0.3); color: #f5a623; text-decoration: none; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 13px; margin-bottom: 20px;">
            View your affiliate dashboard →
          </a>
          <div style="font-size: 11px; color: #5a5e72; border-top: 1px solid #1e2130; padding-top: 16px;">
            Buena Onda · The AI-Powered Meta Ads Platform
          </div>
        </div>
      `,
    });
  } catch { /* best-effort */ }

  // Notify Mike
  try {
    await resend.emails.send({
      from: "Buena Onda <reports@buenaonda.ai>",
      to: "hello@buenaonda.ai",
      subject: `New affiliate — ${name}`,
      html: `<p><strong>${name}</strong> (${email}) just joined the affiliate program. Code: <strong>${affiliate_code}</strong></p>`,
    });
  } catch { /* best-effort */ }

  return NextResponse.json({ affiliate_code });
}
