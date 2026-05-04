// lib/crypto/tokens.ts
// At-rest encryption for stored OAuth tokens (Meta, Google Ads, TikTok,
// Shopify, Slack). AES-256-GCM with a master key from env. Format:
//
//   enc:v1:<base64url(iv)>:<base64url(authTag)>:<base64url(ciphertext)>
//
// Soft migration: decryptToken() detects the `enc:v1:` prefix and decrypts;
// any other input is returned as-is (treated as legacy plaintext). Writes
// always encrypt, so plaintext rows naturally migrate to encrypted on the
// next refresh/reconnect.
//
// Env var: TOKEN_ENCRYPTION_KEY = base64-encoded 32-byte key.
//   Generate one with: `node -e 'console.log(require("crypto").randomBytes(32).toString("base64"))'`

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALG = "aes-256-gcm";
const PREFIX = "enc:v1:";

function getKey(): Buffer | null {
  const b64 = process.env.TOKEN_ENCRYPTION_KEY;
  if (!b64) return null;
  try {
    const buf = Buffer.from(b64, "base64");
    if (buf.length !== 32) return null;
    return buf;
  } catch {
    return null;
  }
}

const b64u = {
  encode(buf: Buffer): string {
    return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },
  decode(s: string): Buffer {
    const padded = s.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(padded, "base64");
  },
};

/**
 * Encrypt a token for storage. Returns the original plaintext if no
 * encryption key is configured (so rolling out the env var doesn't break
 * things) — but logs a warning so misconfiguration is visible.
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) return plaintext;
  const key = getKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[tokens] TOKEN_ENCRYPTION_KEY missing — storing token in plaintext");
    }
    return plaintext;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${b64u.encode(iv)}:${b64u.encode(tag)}:${b64u.encode(ct)}`;
}

/**
 * Decrypt a token. If the value isn't in `enc:v1:` form it's returned
 * unchanged — that's a legacy plaintext row. Throws on malformed ciphertext
 * so a tampered DB never silently returns garbage.
 */
export function decryptToken(stored: string): string {
  if (!stored || !stored.startsWith(PREFIX)) return stored;
  const key = getKey();
  if (!key) {
    throw new Error("TOKEN_ENCRYPTION_KEY missing — cannot decrypt stored token");
  }
  const parts = stored.slice(PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("Malformed encrypted token");
  const [ivStr, tagStr, ctStr] = parts;
  const iv = b64u.decode(ivStr);
  const tag = b64u.decode(tagStr);
  const ct = b64u.decode(ctStr);
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

/** Convenience: decrypt or null. Useful when a token column may be NULL. */
export function decryptTokenOrNull(stored: string | null | undefined): string | null {
  if (!stored) return null;
  try {
    return decryptToken(stored);
  } catch (err) {
    console.error("[tokens] decrypt failed:", err);
    return null;
  }
}
