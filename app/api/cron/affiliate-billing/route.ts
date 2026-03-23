// app/api/cron/affiliate-billing/route.ts
// Runs monthly — pauses/resumes Stripe billing based on active referral count,
// and sends at-risk notifications when an affiliate is one referral away from losing their free account.
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";
import Stripe from "stripe";

const sql = neon(process.env.DATABASE_URL!);
const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });

const FREE_THRESHOLD = 3; // active referrals needed to keep account free

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all active affiliates with their subscription info
  const affiliates = await sql`
    SELECT
      a.id,
      a.name,
      a.email,
      a.affiliate_code,
      a.stripe_subscription_id,
      a.is_free_account,
      a.at_risk_notified_at,
      COUNT(r.id) FILTER (WHERE r.status = 'active') AS active_referral_count
    FROM affiliate_applications a
    LEFT JOIN referrals r ON r.affiliate_code = a.affiliate_code
    WHERE a.status = 'active'
    GROUP BY a.id, a.name, a.email, a.affiliate_code, a.stripe_subscription_id, a.is_free_account, a.at_risk_notified_at
  `;

  const results: { email: string; action: string; active: number }[] = [];

  for (const aff of affiliates) {
    const active = Number(aff.active_referral_count);
    const dashboardUrl = `https://buenaonda.ai/affiliates/dashboard?email=${encodeURIComponent(aff.email)}`;

    // ── Billing: pause if newly hit threshold, resume if dropped below ──
    if (active >= FREE_THRESHOLD && !aff.is_free_account) {
      // Just hit 3+ referrals — pause billing
      if (aff.stripe_subscription_id) {
        try {
          await stripe.subscriptions.update(aff.stripe_subscription_id, {
            pause_collection: { behavior: "void" },
          });
        } catch { /* subscription may already be cancelled or paused */ }
      }

      await sql`
        UPDATE affiliate_applications
        SET is_free_account = TRUE, at_risk_notified_at = NULL
        WHERE id = ${aff.id}
      `;

      await sendEmail(aff.email, aff.name, "free", { active, dashboardUrl });
      results.push({ email: aff.email, action: "billing_paused", active });

    } else if (active < FREE_THRESHOLD && aff.is_free_account) {
      // Dropped below threshold — resume billing
      if (aff.stripe_subscription_id) {
        try {
          await stripe.subscriptions.update(aff.stripe_subscription_id, {
            pause_collection: null,
          });
        } catch { /* best-effort */ }
      }

      await sql`
        UPDATE affiliate_applications
        SET is_free_account = FALSE
        WHERE id = ${aff.id}
      `;

      await sendEmail(aff.email, aff.name, "billing_resumed", { active, dashboardUrl });
      results.push({ email: aff.email, action: "billing_resumed", active });

    } else if (active === FREE_THRESHOLD - 1 && aff.is_free_account) {
      // At risk: has free account but only 2 active referrals — send warning (max once per 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const lastNotified = aff.at_risk_notified_at ? new Date(aff.at_risk_notified_at) : null;

      if (!lastNotified || lastNotified < thirtyDaysAgo) {
        await sql`
          UPDATE affiliate_applications
          SET at_risk_notified_at = NOW()
          WHERE id = ${aff.id}
        `;

        await sendEmail(aff.email, aff.name, "at_risk", { active, dashboardUrl });
        results.push({ email: aff.email, action: "at_risk_notified", active });
      }
    }
  }

  return NextResponse.json({ ok: true, processed: affiliates.length, actions: results });
}

// ── Email templates ──────────────────────────────────────────────────────────

type EmailType = "free" | "billing_resumed" | "at_risk";

async function sendEmail(
  to: string,
  name: string,
  type: EmailType,
  data: { active: number; dashboardUrl: string }
) {
  const firstName = name.split(" ")[0];

  const templates: Record<EmailType, { subject: string; html: string }> = {
    free: {
      subject: "🎁 Your Buena Onda account is now free",
      html: `
        <div style="font-family:'Courier New',monospace;max-width:600px;background:#0d0f14;color:#e8eaf0;padding:40px;border-radius:12px;">
          <div style="background:linear-gradient(135deg,#f5a623,#f76b1c);display:inline-block;padding:6px 14px;border-radius:6px;font-weight:700;font-size:13px;color:#fff;margin-bottom:20px;">Buena Onda</div>
          <h1 style="font-size:22px;font-weight:800;color:#e8eaf0;margin:0 0 8px;">Your account is free, ${firstName}. 🎁</h1>
          <p style="font-size:14px;color:#8b8fa8;margin:0 0 24px;">You now have ${data.active} active referrals — you've hit the milestone. Your Buena Onda subscription is paused and you won't be charged as long as you maintain 3+ active clients.</p>
          <div style="background:#161820;border-radius:10px;padding:18px 20px;margin-bottom:24px;border:1px solid rgba(245,166,35,0.2);">
            <div style="font-size:11px;color:#5a5e72;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Your status</div>
            <div style="font-size:20px;font-weight:800;color:#f5a623;">${data.active} active referrals</div>
            <div style="font-size:12px;color:#8b8fa8;margin-top:4px;">Keep referring to keep your account free and earn commissions.</div>
          </div>
          <a href="${data.dashboardUrl}" style="display:block;text-align:center;background:rgba(245,166,35,0.12);border:1px solid rgba(245,166,35,0.3);color:#f5a623;text-decoration:none;padding:12px;border-radius:8px;font-weight:700;font-size:13px;margin-bottom:20px;">
            View your affiliate dashboard →
          </a>
          <div style="font-size:11px;color:#5a5e72;border-top:1px solid #1e2130;padding-top:16px;">Buena Onda · The AI-Powered Meta Ads Platform</div>
        </div>
      `,
    },

    at_risk: {
      subject: "⚠️ You're one referral away from losing your free account",
      html: `
        <div style="font-family:'Courier New',monospace;max-width:600px;background:#0d0f14;color:#e8eaf0;padding:40px;border-radius:12px;">
          <div style="background:linear-gradient(135deg,#f5a623,#f76b1c);display:inline-block;padding:6px 14px;border-radius:6px;font-weight:700;font-size:13px;color:#fff;margin-bottom:20px;">Buena Onda</div>
          <h1 style="font-size:22px;font-weight:800;color:#e8eaf0;margin:0 0 8px;">Heads up, ${firstName}</h1>
          <p style="font-size:14px;color:#8b8fa8;margin:0 0 24px;">You currently have <strong style="color:#f5a623;">${data.active} active referral${data.active !== 1 ? "s" : ""}</strong>. You need 3 to keep your Buena Onda account free — you're just one referral away from the threshold.</p>
          <div style="background:rgba(245,166,35,0.08);border:1px solid rgba(245,166,35,0.2);border-radius:10px;padding:18px 20px;margin-bottom:24px;">
            <div style="font-size:13px;color:#f5a623;font-weight:700;margin-bottom:6px;">What this means</div>
            <div style="font-size:12px;color:#8b8fa8;line-height:1.7;">If one of your active referrals churns, your account drops below 3 and your Buena Onda billing resumes at your normal plan rate. Refer one more client to create a buffer — and earn more commissions at the same time.</div>
          </div>
          <a href="${data.dashboardUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#f5a623,#f76b1c);color:#0d0f14;text-decoration:none;padding:12px;border-radius:8px;font-weight:800;font-size:13px;margin-bottom:20px;">
            Share your referral link now →
          </a>
          <div style="font-size:11px;color:#5a5e72;border-top:1px solid #1e2130;padding-top:16px;">Buena Onda · The AI-Powered Meta Ads Platform</div>
        </div>
      `,
    },

    billing_resumed: {
      subject: "Your Buena Onda billing has resumed",
      html: `
        <div style="font-family:'Courier New',monospace;max-width:600px;background:#0d0f14;color:#e8eaf0;padding:40px;border-radius:12px;">
          <div style="background:linear-gradient(135deg,#f5a623,#f76b1c);display:inline-block;padding:6px 14px;border-radius:6px;font-weight:700;font-size:13px;color:#fff;margin-bottom:20px;">Buena Onda</div>
          <h1 style="font-size:22px;font-weight:800;color:#e8eaf0;margin:0 0 8px;">Billing update, ${firstName}</h1>
          <p style="font-size:14px;color:#8b8fa8;margin:0 0 24px;">Your active referral count has dropped to <strong style="color:#e8eaf0;">${data.active}</strong> — below the 3-referral threshold for a free account. Your Buena Onda subscription has been resumed.</p>
          <div style="background:#161820;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
            <div style="font-size:12px;color:#8b8fa8;line-height:1.7;">Refer one more paying client to pause billing again and get your account free. You'll also earn commission on every referral — 50% month 1, 40% every month after.</div>
          </div>
          <a href="${data.dashboardUrl}" style="display:block;text-align:center;background:rgba(245,166,35,0.12);border:1px solid rgba(245,166,35,0.3);color:#f5a623;text-decoration:none;padding:12px;border-radius:8px;font-weight:700;font-size:13px;margin-bottom:20px;">
            View your affiliate dashboard →
          </a>
          <div style="font-size:11px;color:#5a5e72;border-top:1px solid #1e2130;padding-top:16px;">Buena Onda · The AI-Powered Meta Ads Platform</div>
        </div>
      `,
    },
  };

  const { subject, html } = templates[type];
  try {
    await resend.emails.send({ from: "Buena Onda <reports@buenaonda.ai>", to, subject, html });
  } catch { /* best-effort */ }
}
