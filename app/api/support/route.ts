// app/api/support/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Resend } from "resend";
import { neon } from "@neondatabase/serverless";

const resend = new Resend(process.env.RESEND_API_KEY);
const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const { subject, description, category } = await req.json();

  if (!subject?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Subject and description are required" }, { status: 400 });
  }

  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? "unknown";
  const userName = user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : userEmail;
  const submittedAt = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "full", timeStyle: "short" });

  try {
    // Persist to DB
    await sql`
      INSERT INTO support_tickets (clerk_user_id, user_email, user_name, subject, description, category)
      VALUES (${userId}, ${userEmail}, ${userName}, ${subject}, ${description}, ${category ?? 'general'})
    `.catch(() => {})

    await resend.emails.send({
      from: "Buena Onda Support <support@buenaonda.ai>",
      to: "hello@buenaonda.ai",
      replyTo: userEmail,
      subject: `[Support Ticket] ${subject}`,
      html: `
        <div style="font-family: monospace; max-width: 600px; background: #0d0f14; color: #e8eaf0; padding: 32px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
          <div style="background: linear-gradient(135deg,#f5a623,#f76b1c); display: inline-block; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 13px; color: #fff; margin-bottom: 24px;">
            🎫 New Support Ticket
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #8b8fa8; font-size: 12px; width: 120px;">From</td>
              <td style="padding: 8px 0; color: #e8eaf0; font-size: 13px;">${userName} &lt;${userEmail}&gt;</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #8b8fa8; font-size: 12px;">Category</td>
              <td style="padding: 8px 0; color: #f5a623; font-size: 13px;">${category ?? "General"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #8b8fa8; font-size: 12px;">Subject</td>
              <td style="padding: 8px 0; color: #e8eaf0; font-size: 13px; font-weight: 700;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #8b8fa8; font-size: 12px;">Submitted</td>
              <td style="padding: 8px 0; color: #8b8fa8; font-size: 12px;">${submittedAt}</td>
            </tr>
          </table>

          <div style="background: #161820; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="color: #8b8fa8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Description</div>
            <div style="color: #e8eaf0; font-size: 13px; line-height: 1.7; white-space: pre-wrap;">${description.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          </div>

          <div style="color: #5a5e72; font-size: 11px;">
            Reply directly to this email to respond to ${userName}.
          </div>
        </div>
      `,
    });

    // Also send a confirmation to the user
    await resend.emails.send({
      from: "Buena Onda Support <support@buenaonda.ai>",
      to: userEmail,
      subject: `We got your ticket: ${subject}`,
      html: `
        <div style="font-family: monospace; max-width: 600px; background: #0d0f14; color: #e8eaf0; padding: 32px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
          <div style="background: linear-gradient(135deg,#f5a623,#f76b1c); display: inline-block; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 13px; color: #fff; margin-bottom: 24px;">
            Buena Onda
          </div>

          <div style="font-size: 20px; font-weight: 700; color: #e8eaf0; margin-bottom: 10px;">We got your ticket ✓</div>
          <div style="font-size: 13px; color: #8b8fa8; line-height: 1.7; margin-bottom: 24px;">
            Hey ${user?.firstName ?? "there"} — we received your support request and will get back to you as soon as possible. Usually within 1 business day.
          </div>

          <div style="background: #161820; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="color: #8b8fa8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom:8px;">Your ticket</div>
            <div style="color: #f5a623; font-size: 14px; font-weight: 700; margin-bottom: 6px;">${subject}</div>
            <div style="color: #8b8fa8; font-size: 12px; line-height: 1.6; white-space: pre-wrap;">${description.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          </div>

          <div style="font-size: 12px; color: #5a5e72;">
            Questions? Reply to this email or reach us at hello@buenaonda.ai
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
