// Admin session: one shared password (ADMIN_PASSWORD) and an HMAC-signed,
// HttpOnly cookie (ADMIN_SESSION_SECRET). Server-only.
import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createAttemptLimiter } from "./attempts";
import { db, dbConfigured, nowIso } from "./db";
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
  const now = Math.floor(Date.now() / 1000);
  (await cookies()).set(COOKIE, createToken(secret, password, now, now + MAX_AGE_S), {
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

// „Odhlásiť všetky zariadenia“: sessions issued before this time (seconds) no longer
// count. A row in the content table, under a key the guest pages ignore, so it
// takes effect at once on every server instance, with no deploy.
const CUTOFF_KEY = "admin_sessions_after";

/** The cut-off, read once per request. 0 if never set; also if the database can't answer, as nothing else works then either. */
const sessionsAfter = cache(async (): Promise<number> => {
  if (!dbConfigured()) return 0;
  try {
    const { rows } = await (await db()).execute({ sql: "SELECT value FROM content WHERE key = ?", args: [CUTOFF_KEY] });
    return Number(rows[0]?.value ?? 0) || 0;
  } catch (err) {
    console.error(`Session cut-off unavailable: ${err instanceof Error ? err.message : "unknown error"}`);
    return 0;
  }
});

/** Signs out every device: sessions issued until now stop counting. False if the database can't store it. */
export async function revokeSessions(): Promise<boolean> {
  if (!dbConfigured()) return false;
  try {
    await (await db()).execute({
      sql: "INSERT INTO content (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
      args: [CUTOFF_KEY, String(Math.floor(Date.now() / 1000)), nowIso()],
    });
    return true;
  } catch (err) {
    console.error(`Session cut-off not saved: ${err instanceof Error ? err.message : "unknown error"}`);
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  const secret = sessionSecret();
  const password = adminPassword();
  const value = (await cookies()).get(COOKIE)?.value;
  if (!secret || !password || !value) return false;
  const now = Date.now() / 1000;
  // The cut-off costs a query, so only for a token that is valid otherwise.
  return verifyToken(value, secret, password, now) && verifyToken(value, secret, password, now, await sessionsAfter());
}

/** Call at the top of every admin page and admin server action. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

// Brakes on password guessing. `tries` counts every try per address in the
// database, shared by all server instances, and is the real limit. `perIp`, in
// memory, answers first without a query. There is no count across all
// addresses: anyone could fill it and lock the couple out. Against a guesser
// with many addresses, the password's length (MIN_PASSWORD) is the defence.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRIES = 8;
export const loginFailures = {
  tries: createAttemptLimiter(MAX_TRIES, WINDOW_MS),
  perIp: createLimiter(MAX_TRIES, WINDOW_MS),
};
