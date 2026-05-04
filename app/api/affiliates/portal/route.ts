// app/api/affiliates/portal/route.ts
// Returns affiliate stats for the portal. Auth: requires affiliate_email cookie
// to match the requested email — referral list contains PII (referred-customer
// emails) and must not be accessible by email-only enumeration.
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { requireAffiliate, isErrorResponse } from "@/lib/auth/affiliate";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const authResult = requireAffiliate(req, email);
  if (isErrorResponse(authResult)) return authResult;

  const rows = await sql`
    SELECT affiliate_code, name, created_at
    FROM affiliate_applications
    WHERE email = ${email} AND status = 'active'
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { affiliate_code, name, created_at } = rows[0];

  const referralRows = await sql`
    SELECT referred_email, status, created_at
    FROM referrals
    WHERE affiliate_code = ${affiliate_code}
    ORDER BY created_at DESC
    LIMIT 100
  `;

  return NextResponse.json({
    affiliate_code,
    name,
    member_since: created_at,
    referral_link: `https://buenaonda.ai/?ref=${affiliate_code}`,
    referrals: referralRows,
    total_referrals: referralRows.length,
  });
}
