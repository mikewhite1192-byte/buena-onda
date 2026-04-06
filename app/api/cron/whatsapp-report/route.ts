// Weekly WhatsApp performance report — runs every Monday at 9am ET
// Sends a summary of each user's ad performance to their WhatsApp number
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";

const sql = neon(process.env.DATABASE_URL!);

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all users with a WhatsApp number
  const users = await sql`
    SELECT clerk_user_id, whatsapp_number
    FROM user_subscriptions
    WHERE whatsapp_number IS NOT NULL
      AND status IN ('active', 'trialing')
  `;

  if (users.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "No users with WhatsApp configured" });
  }

  let sent = 0;

  for (const user of users) {
    try {
      // Get their clients
      const clients = await sql`
        SELECT id, name, vertical, meta_ad_account_id
        FROM clients
        WHERE owner_id = ${user.clerk_user_id}
          AND status = 'active'
      `;

      if (clients.length === 0) continue;

      // Get last 7 days of metrics per client
      const clientLines: string[] = [];

      for (const client of clients) {
        const metrics = await sql`
          SELECT
            SUM(spend)::numeric     AS total_spend,
            SUM(leads)::numeric     AS total_leads,
            AVG(cpl)::numeric       AS avg_cpl,
            AVG(ctr)::numeric       AS avg_ctr
          FROM ad_metrics
          WHERE ad_account_id = ${client.meta_ad_account_id}
            AND date_recorded >= NOW() - INTERVAL '7 days'
        `;

        const m = metrics[0];
        const spend = parseFloat(m?.total_spend ?? "0").toFixed(0);
        const leads = parseInt(m?.total_leads ?? "0");
        const cpl = parseFloat(m?.avg_cpl ?? "0").toFixed(2);
        const ctr = parseFloat(m?.avg_ctr ?? "0").toFixed(2);

        if (parseFloat(spend) === 0 && leads === 0) continue;

        const vertical = client.vertical === "leads" ? "📋" : "🛒";
        clientLines.push(
          `${vertical} *${client.name}*\n` +
          `  Spend: $${spend} | Leads: ${leads} | CPL: $${cpl} | CTR: ${ctr}%`
        );
      }

      if (clientLines.length === 0) continue;

      // Get recent agent actions (last 7 days)
      const actions = await sql`
        SELECT action_type, details, created_at
        FROM agent_actions
        WHERE created_at >= NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 5
      `;

      const actionLines = actions.map(a => {
        const d = a.details as Record<string, unknown>;
        return `  • ${a.action_type}: ${d?.reason ?? "—"}`;
      });

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const message =
        `📊 *Buena Onda Weekly Report* — ${dateStr}\n\n` +
        `*Campaign Performance (Last 7 Days)*\n` +
        clientLines.join("\n\n") +
        (actionLines.length > 0
          ? `\n\n*Agent Actions Taken*\n${actionLines.join("\n")}`
          : "") +
        `\n\n_Reply with any questions or instructions._`;

      await sendWhatsAppMessage(user.whatsapp_number, message);
      sent++;
    } catch (err) {
      console.error(`[whatsapp-report] Error for user ${user.clerk_user_id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
