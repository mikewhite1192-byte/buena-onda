// Returns a short-lived Clerk sign-in token for the demo account.
// The client uses it with strategy:"ticket" — no password needed.
import { NextResponse } from "next/server";
import { createClerkClient } from "@clerk/nextjs/server";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const DEMO_EMAIL = "demo@buenaonda.ai";

export async function GET() {
  try {
    const users = await clerk.users.getUserList({ emailAddress: [DEMO_EMAIL] });
    if (users.totalCount === 0) {
      return NextResponse.json({ error: "Demo account not found" }, { status: 404 });
    }

    const userId = users.data[0].id;
    const token = await clerk.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: 120,
    });

    return NextResponse.json({ token: token.token });
  } catch (err) {
    console.error("Demo token error:", err);
    return NextResponse.json({ error: "Could not generate demo token" }, { status: 500 });
  }
}
