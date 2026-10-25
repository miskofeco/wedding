// The admin login token: `admin.<expires>.<password fingerprint>.<signature>`.
// The fingerprint ties the token to the current ADMIN_PASSWORD, so changing the
// password signs everyone out. Rotating ADMIN_SESSION_SECRET does the same.
// Pure functions (no Next.js), so the tests can run them. Server-only.
import { createHmac, timingSafeEqual } from "node:crypto";

const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");
const fingerprint = (password: string, secret: string) => sign(`password:${password}`, secret).slice(0, 16);

export function createToken(secret: string, password: string, expiresAt: number): string {
  const payload = `admin.${expiresAt}.${fingerprint(password, secret)}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** True for a token this secret signed, for this password, that hasn't expired at `now` (seconds). */
export function verifyToken(token: string, secret: string, password: string, now: number): boolean {
  const i = token.lastIndexOf(".");
  if (i <= 0) return false;
  const payload = token.slice(0, i);
  const sig = Buffer.from(token.slice(i + 1));
  const expected = Buffer.from(sign(payload, secret));
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return false;
  const [who, expires, print] = payload.split(".");
  return who === "admin" && Number(expires) > now && print === fingerprint(password, secret);
}
