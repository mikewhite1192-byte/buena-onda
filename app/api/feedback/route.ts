// app/api/feedback/route.ts
// "What do you want to see?" — stores feedback and emails hello@buenaonda.ai
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
  const { message } = await req.json() as { message: string };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? "unknown";
  const userName = user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : userEmail;
  const submittedAt = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "full", timeStyle: "short" });

  // Store in DB
  await sql`
    INSERT INTO feedback_submissions (clerk_user_id, user_email, user_name, message)
    VALUES (${userId}, ${userEmail}, ${userName}, ${message.trim()})
  `.catch(() => {})

  // Email Mike
  await resend.emails.send({
    from: "Buena Onda <support@buenaonda.ai>",
    to: "hello@buenaonda.ai",
    replyTo: userEmail,
    subject: `💡 New feedback from ${userName}`,
    html: `
      <div style="font-family: monospace; max-width: 600px; background: #0d0f14; color: #e8eaf0; padding: 32px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="background: linear-gradient(135deg,#f5a623,#f76b1c); display: inline-block; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 13px; color: #fff; margin-bottom: 24px;">
          💡 Feature Request / Feedback
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 6px 0; color: #8b8fa8; font-size: 12px; width: 100px;">From</td>
            <td style="padding: 6px 0; color: #e8eaf0; font-size: 13px;">${userName} &lt;${userEmail}&gt;</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8b8fa8; font-size: 12px;">Submitted</td>
            <td style="padding: 6px 0; color: #8b8fa8; font-size: 12px;">${submittedAt}</td>
          </tr>
        </table>
        <div style="background: #161820; border: 1px solid rgba(245,166,35,0.2); border-left: 3px solid #f5a623; border-radius: 8px; padding: 16px;">
          <div style="color: #e8eaf0; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${message.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        </div>
        <div style="color: #5a5e72; font-size: 11px; margin-top: 20px;">Reply to this email to respond directly to ${userName}.</div>
      </div>
    `,
  }).catch(() => {}); // Don't fail the request if email fails

  return NextResponse.json({ ok: true });
}
