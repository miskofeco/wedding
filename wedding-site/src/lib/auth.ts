// Admin session: one shared password (ADMIN_PASSWORD) and an HMAC-signed,
// HttpOnly cookie (ADMIN_SESSION_SECRET). Server-only.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "bm_admin";
const MAX_AGE_S = 60 * 60 * 24 * 7; // a week

function sessionSecret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET ?? "";
  return s.length >= 32 ? s : null;
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD) && sessionSecret() !== null;
}

const digest = (s: string) => createHash("sha256").update(s, "utf8").digest();
const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

export function passwordMatches(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeEqual(digest(candidate), digest(expected));
}

export async function startSession(): Promise<void> {
  const secret = sessionSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is missing or shorter than 32 characters");
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE_S;
  const payload = `admin.${expires}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload, secret)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const secret = sessionSecret();
  const value = (await cookies()).get(COOKIE)?.value;
  if (!secret || !value) return false;
  const i = value.lastIndexOf(".");
  const payload = value.slice(0, i);
  const sig = Buffer.from(value.slice(i + 1));
  const expected = Buffer.from(sign(payload, secret));
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return false;
  const [who, expires] = payload.split(".");
  return who === "admin" && Number(expires) > Date.now() / 1000;
}

/** Call at the top of every admin page and admin server action. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

// Best-effort brake on password guessing (per server instance).
const attempts = new Map<string, { count: number; since: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRIES = 8;

export function tooManyAttempts(key: string): boolean {
  const a = attempts.get(key);
  if (!a || Date.now() - a.since > WINDOW_MS) return false;
  return a.count >= MAX_TRIES;
}

export function recordFailure(key: string): void {
  const a = attempts.get(key);
  if (!a || Date.now() - a.since > WINDOW_MS) attempts.set(key, { count: 1, since: Date.now() });
  else a.count += 1;
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}
