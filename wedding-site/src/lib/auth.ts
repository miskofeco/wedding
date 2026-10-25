// Admin session: one shared password (ADMIN_PASSWORD) and an HMAC-signed,
// HttpOnly cookie (ADMIN_SESSION_SECRET). Server-only.
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createLimiter } from "./limit";
import { createToken, verifyToken } from "./session";

const COOKIE = "bm_admin";
// Only /admin reads the cookie; the guest pages never receive it.
const COOKIE_PATH = "/admin";
const MAX_AGE_S = 60 * 60 * 24 * 7; // a week
/** The login is the only lock on the guest list, so a short password counts as not set up. */
export const MIN_PASSWORD = 12;

function sessionSecret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET ?? "";
  return s.length >= 32 ? s : null;
}

function adminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD ?? "";
  return p.length >= MIN_PASSWORD ? p : null;
}

export function adminConfigured(): boolean {
  return adminPassword() !== null && sessionSecret() !== null;
}

const digest = (s: string) => createHash("sha256").update(s, "utf8").digest();

export function passwordMatches(candidate: string): boolean {
  const expected = adminPassword();
  if (!expected) return false;
  return timingSafeEqual(digest(candidate), digest(expected));
}

export async function startSession(): Promise<void> {
  const secret = sessionSecret();
  const password = adminPassword();
  if (!secret || !password) throw new Error("ADMIN_PASSWORD or ADMIN_SESSION_SECRET is missing or too short");
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE_S;
  (await cookies()).set(COOKIE, createToken(secret, password, expires), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: COOKIE_PATH,
    maxAge: MAX_AGE_S,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: COOKIE_PATH });
}

export async function isAdmin(): Promise<boolean> {
  const secret = sessionSecret();
  const password = adminPassword();
  const value = (await cookies()).get(COOKIE)?.value;
  if (!secret || !password || !value) return false;
  return verifyToken(value, secret, password, Date.now() / 1000);
}

/** Call at the top of every admin page and admin server action. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

// Best-effort brakes on password guessing (per server instance; the Vercel
// Firewall rule in the README is the real one). Per address, and one for
// everyone, since a guesser can spread tries over many addresses.
const WINDOW_MS = 15 * 60 * 1000;
export const loginFailures = {
  perIp: createLimiter(8, WINDOW_MS),
  all: createLimiter(30, WINDOW_MS),
};
