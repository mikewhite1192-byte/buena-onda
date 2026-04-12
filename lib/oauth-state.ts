import { createHmac, randomUUID } from "crypto";

// ── Signed OAuth state for CSRF protection ──────────────────────────
// Generates HMAC-signed, timestamped, nonce-bearing state parameters
// for OAuth redirect flows. Prevents:
//   - State forgery (HMAC signature)
//   - State replay (10-minute timestamp expiry)
//   - State prediction (random nonce)
//
// Uses CLERK_SECRET_KEY as the HMAC key (already in env, proper secret).
// Override with OAUTH_STATE_SECRET if you want a dedicated key.

const SECRET = process.env.OAUTH_STATE_SECRET || process.env.CLERK_SECRET_KEY || "";

if (!SECRET) {
  console.warn("[oauth-state] No OAUTH_STATE_SECRET or CLERK_SECRET_KEY — state signing is disabled");
}

export function createOAuthState(data: Record<string, unknown>): string {
  const payload = JSON.stringify({
    ...data,
    ts: Date.now(),
    nonce: randomUUID(),
  });
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ p: payload, s: sig })).toString("base64url");
}

export function verifyOAuthState(
  state: string,
  maxAgeMs: number = 600_000, // 10 minutes
): Record<string, unknown> {
  let parsed: { p: string; s: string };
  try {
    parsed = JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    throw new Error("Malformed OAuth state — cannot decode");
  }

  const { p: payload, s: sig } = parsed;
  if (!payload || !sig) {
    throw new Error("Invalid OAuth state structure");
  }

  // Verify HMAC signature
  const expectedSig = createHmac("sha256", SECRET).update(payload).digest("hex");
  if (sig !== expectedSig) {
    throw new Error("Invalid state signature — possible CSRF attack");
  }

  // Verify timestamp
  const data = JSON.parse(payload);
  if (typeof data.ts !== "number" || Date.now() - data.ts > maxAgeMs) {
    throw new Error("OAuth state expired — flow took too long, please try again");
  }

  return data;
}
