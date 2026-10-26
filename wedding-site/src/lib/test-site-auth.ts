import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/** Browser HTTP Basic authentication for the entire test deployment. */
export function testSiteAuthorized(authorization: string | null, password: string): boolean {
  if (password.length < 16 || !authorization || authorization.length > 4096) return false;
  const match = /^Basic ([A-Za-z0-9+/]+={0,2})$/i.exec(authorization);
  if (!match) return false;
  const supplied = Buffer.from(match[1], "base64");
  const hash = (value: string | Buffer) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(supplied), hash(`test:${password}`));
}
