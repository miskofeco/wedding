// The admin login token: `admin.<issued>.<expires>.<password fingerprint>.<signature>`.
// The fingerprint ties the token to the current ADMIN_PASSWORD, so changing the
// password signs everyone out. Rotating ADMIN_SESSION_SECRET does the same, and
// „Odhlásiť všetky zariadenia“ sets a cut-off that tokens issued earlier fail (auth.ts).
// Pure functions (no Next.js), so the tests can run them. Server-only.
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");
const fingerprint = (password: string, secret: string) => sign(`password:${password}`, secret).slice(0, 16);

/** Times in seconds. */
export function createToken(secret: string, password: string, issuedAt: number, expiresAt: number): string {
  const payload = `admin.${issuedAt}.${expiresAt}.${fingerprint(password, secret)}`;
  return `${payload}.${sign(payload, secret)}`;
}

/**
 * True for a token this secret signed, for this password, that hasn't expired at `now`
 * and was issued at or after `notBefore` (seconds; 0 when everyone may stay signed in).
 */
export function verifyToken(token: string, secret: string, password: string, now: number, notBefore = 0): boolean {
  const i = token.lastIndexOf(".");
  if (i <= 0) return false;
  const payload = token.slice(0, i);
  const sig = Buffer.from(token.slice(i + 1));
  const expected = Buffer.from(sign(payload, secret));
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return false;
  const parts = payload.split(".");
  if (parts.length !== 4) return false; // also the older tokens, without an issue time
  const [who, issued, expires, print] = parts;
  return who === "admin" && Number(issued) >= notBefore && Number(expires) > now && print === fingerprint(password, secret);
}
