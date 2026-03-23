// Returns demo account credentials for the client-side password sign-in strategy.
// The demo account is intentionally shared — these credentials are not sensitive.
import { NextResponse } from "next/server";

export async function GET() {
  const email = "demo@buenaonda.ai";
  const password = process.env.DEMO_ACCOUNT_PASSWORD;

  if (!password) {
    return NextResponse.json({ error: "Demo account not configured" }, { status: 503 });
  }

  return NextResponse.json({ email, password });
}
