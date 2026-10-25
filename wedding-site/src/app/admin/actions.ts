"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminConfigured, endSession, loginFailures, MIN_PASSWORD, passwordMatches, requireAdmin, revokeSessions, startSession } from "@/lib/auth";
import { dbConfigured } from "@/lib/db";
import { clientIp } from "@/lib/limit";
import { parseRsvp } from "@/lib/rsvp";
import { createAnswer, deleteAnswer, setAnswerInvite, updateAnswer, type StoreResult } from "@/lib/answers";
import { createInvites, deleteInvite, markReminded, updateInvite } from "@/lib/invites";
import { check, resetContent, saveContent } from "@/lib/content";
import { syncPending } from "@/lib/mirror";
import { isSide, parseBulk, parseInvite } from "@/lib/records";
import { CONTENT_KEYS, type ContentKey } from "@/lib/site-content";
import type { AdminFormState, ContentFormState, InviteFormState, LoginState } from "@/lib/admin";

const storeMessage: Record<Extract<StoreResult, { ok: false }>["error"], string> = {
  not_configured: "Databáza nie je pripojená. Chýba TURSO_DATABASE_URL (pozri README).",
  not_found: "Tento záznam už neexistuje. Obnovte stránku.",
  failed: "Uloženie zlyhalo. Skúste to o chvíľu znova.",
};

const stamp = () => Date.now();
const id = (form: FormData, key = "id") => {
  const v = form.get(key);
  return typeof v === "string" && /^[0-9a-f-]{36}$/.test(v) ? v : "";
};

/** After every write: refresh the admin pages and copy what changed to the Sheet once the reply is sent. */
function changed(paths: string[] = ["/admin"]) {
  for (const p of paths) revalidatePath(p, "layout");
  after(() => syncPending());
}

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!adminConfigured()) {
    return { error: `Prihlásenie nie je nastavené. Chýba ADMIN_PASSWORD (aspoň ${MIN_PASSWORD} znakov) alebo ADMIN_SESSION_SECRET.` };
  }
  const ip = clientIp(await headers());
  // Counted before the password is checked, so parallel tries can't race past the limit.
  if (loginFailures.perIp.blocked(ip) || !(await withinTries(ip))) {
    return { error: "Príliš veľa pokusov. Skúste to znova o 15 minút." };
  }

  const password = form.get("password");
  if (typeof password !== "string" || !passwordMatches(password)) {
    loginFailures.perIp.hit(ip);
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Nesprávne heslo." };
  }
  loginFailures.perIp.clear(ip);
  await loginFailures.tries.clear(ip).catch(() => {}); // a stale count only expires with its window
  await startSession();
  redirect("/admin");
}

/** The database count of tries. If the database can't answer, the in-memory brakes still hold. */
async function withinTries(ip: string): Promise<boolean> {
  if (!dbConfigured()) return true;
  try {
    return await loginFailures.tries.attempt(ip);
  } catch (err) {
    console.error(`Login limit unavailable: ${err instanceof Error ? err.message : "unknown error"}`);
    return true;
  }
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}

/** For a lost phone or a borrowed computer: every other device has to sign in again; this one stays. */
export async function signOutEverywhere(): Promise<AdminFormState> {
  await requireAdmin();
  if (!dbConfigured()) return { status: "error", errors: {}, message: storeMessage.not_configured, at: stamp() };
  if (!(await revokeSessions())) return { status: "error", errors: {}, message: storeMessage.failed, at: stamp() };
  await startSession();
  return { status: "saved", errors: {}, message: "Ostatné zariadenia sú odhlásené.", at: stamp() };
}

// ---- answers ----

export async function saveAnswer(_prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = parseRsvp(form);
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors, at: stamp() };

  const answerId = id(form);
  const invite = id(form, "invite") || null;
  const result = answerId ? await updateAnswer(answerId, parsed.answer, invite) : await createAnswer(parsed.answer, "admin", "", invite);
  if (!result.ok) return { status: "error", errors: {}, message: storeMessage[result.error], at: stamp() };
  changed();
  return { status: "saved", errors: {}, at: stamp() };
}

export async function removeAnswer(_prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const answerId = id(form);
  if (!answerId) return { status: "error", errors: {}, message: "Chýba ID odpovede.", at: stamp() };
  const result = await deleteAnswer(answerId);
  if (!result.ok) return { status: "error", errors: {}, message: storeMessage[result.error], at: stamp() };
  changed();
  return { status: "saved", errors: {}, at: stamp() };
}

export async function assignInvite(_prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const answerId = id(form);
  if (!answerId) return { status: "error", errors: {}, message: "Chýba ID odpovede.", at: stamp() };
  const result = await setAnswerInvite(answerId, id(form, "invite") || null);
  if (!result.ok) return { status: "error", errors: {}, message: storeMessage[result.error], at: stamp() };
  changed();
  return { status: "saved", errors: {}, at: stamp() };
}

// ---- invites ----

export async function saveInvite(_prev: InviteFormState, form: FormData): Promise<InviteFormState> {
  await requireAdmin();
  const parsed = parseInvite(form);
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors, at: stamp() };
  const inviteId = id(form);
  const result = inviteId ? await updateInvite(inviteId, parsed.invite) : await createInvites([parsed.invite]);
  if (!result.ok) return { status: "error", errors: {}, message: storeMessage[result.error], at: stamp() };
  changed();
  return { status: "saved", errors: {}, at: stamp() };
}

export async function addInvitesInBulk(_prev: InviteFormState, form: FormData): Promise<InviteFormState> {
  await requireAdmin();
  const text = form.get("lines");
  const side = form.get("side");
  const group = form.get("group");
  if (!isSide(side)) return { status: "invalid", errors: { side: "Vyberte stranu." }, at: stamp() };
  const items = parseBulk(typeof text === "string" ? text : "", side, typeof group === "string" ? group.trim() : "");
  if (items.length === 0) return { status: "invalid", errors: { household: "Napíšte aspoň jednu domácnosť na riadok." }, at: stamp() };
  const result = await createInvites(items);
  if (!result.ok) return { status: "error", errors: {}, message: storeMessage[result.error], at: stamp() };
  changed();
  return { status: "saved", errors: {}, message: `Pridané: ${items.length}`, at: stamp() };
}

export async function removeInvite(_prev: InviteFormState, form: FormData): Promise<InviteFormState> {
  await requireAdmin();
  const inviteId = id(form);
  if (!inviteId) return { status: "error", errors: {}, message: "Chýba ID pozvánky.", at: stamp() };
  const result = await deleteInvite(inviteId);
  if (!result.ok) return { status: "error", errors: {}, message: storeMessage[result.error], at: stamp() };
  changed();
  return { status: "saved", errors: {}, at: stamp() };
}

export async function toggleReminded(_prev: InviteFormState, form: FormData): Promise<InviteFormState> {
  await requireAdmin();
  const inviteId = id(form);
  if (!inviteId) return { status: "error", errors: {}, message: "Chýba ID pozvánky.", at: stamp() };
  const result = await markReminded(inviteId, form.get("reminded") === "yes");
  if (!result.ok) return { status: "error", errors: {}, message: storeMessage[result.error], at: stamp() };
  changed();
  return { status: "saved", errors: {}, at: stamp() };
}

// ---- Sheet ----

export async function syncSheet(): Promise<{ done: number; left: number }> {
  await requireAdmin();
  const result = await syncPending();
  revalidatePath("/admin", "layout");
  return result;
}

// ---- site content ----

const isKey = (v: unknown): v is ContentKey => CONTENT_KEYS.includes(v as ContentKey);

/**
 * The guest pages are static: rebuild them (and the calendar file) on the next visit. The
 * layout covers them all; the calendar file, a route handler, and /rsvp, with its own
 * revalidate, are named as well in case the layout doesn't reach them on Vercel.
 */
function refreshGuestPages() {
  revalidatePath("/", "layout");
  revalidatePath("/svadba.ics");
  revalidatePath("/rsvp");
}

/** Saves one part of the site (programme, requests, FAQ, details) and rebuilds the guest pages. */
export async function saveSiteContent(_prev: ContentFormState, form: FormData): Promise<ContentFormState> {
  await requireAdmin();
  const key = form.get("key");
  const raw = form.get("value");
  if (!isKey(key) || typeof raw !== "string" || raw.length > 100_000) {
    return { status: "error", errors: {}, message: "Neplatná požiadavka.", at: stamp() };
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { status: "error", errors: {}, message: "Neplatné údaje.", at: stamp() };
  }
  const checked = check(key, value);
  if (!checked.ok) return { status: "invalid", errors: checked.errors, message: "Opravte zvýraznené polia.", at: stamp() };
  if (!(await saveContent(key, checked.value))) {
    return { status: "error", errors: {}, message: storeMessage.failed, at: stamp() };
  }
  refreshGuestPages();
  return { status: "saved", errors: {}, at: stamp() };
}

export async function resetSiteContent(_prev: ContentFormState, form: FormData): Promise<ContentFormState> {
  await requireAdmin();
  const key = form.get("key");
  if (!isKey(key)) return { status: "error", errors: {}, message: "Neplatná požiadavka.", at: stamp() };
  if (!(await resetContent(key))) return { status: "error", errors: {}, message: storeMessage.failed, at: stamp() };
  refreshGuestPages();
  return { status: "saved", errors: {}, message: "reset", at: stamp() };
}
