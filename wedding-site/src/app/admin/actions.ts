"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminConfigured, endSession, loginFailures, MIN_PASSWORD, passwordMatches, requireAdmin, startSession } from "@/lib/auth";
import { clientIp } from "@/lib/limit";
import { parseRsvp } from "@/lib/rsvp";
import { createAnswer, deleteAnswer, updateAnswer, type SheetError } from "@/lib/sheet";
import type { AdminFormState, LoginState } from "@/lib/admin";

const sheetMessage: Record<SheetError, string> = {
  not_configured: "Tabuľka nie je pripojená. Chýba RSVP_SHEET_URL alebo RSVP_SHEET_SECRET.",
  unreachable: "Tabuľka neodpovedá. Skúste to o chvíľu znova.",
  rejected: "Tabuľka zmenu odmietla. Skontrolujte nastavenie skriptu.",
  not_found: "Táto odpoveď už v tabuľke nie je. Obnovte stránku.",
  invalid: "Tabuľka údaje neprijala. Skontrolujte polia.",
};

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!adminConfigured()) {
    return { error: `Prihlásenie nie je nastavené. Chýba ADMIN_PASSWORD (aspoň ${MIN_PASSWORD} znakov) alebo ADMIN_SESSION_SECRET.` };
  }
  const ip = clientIp(await headers());
  if (loginFailures.perIp.blocked(ip) || loginFailures.all.blocked("all")) {
    return { error: "Príliš veľa pokusov. Skúste to znova o 15 minút." };
  }

  const password = form.get("password");
  if (typeof password !== "string" || !passwordMatches(password)) {
    loginFailures.perIp.hit(ip);
    loginFailures.all.hit("all");
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Nesprávne heslo." };
  }
  loginFailures.perIp.clear(ip);
  await startSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}

export async function saveAnswer(_prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = parseRsvp(form);
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors, at: Date.now() };

  const id = form.get("id");
  const result =
    typeof id === "string" && id !== "" ? await updateAnswer(id, parsed.answer) : await createAnswer(parsed.answer, "admin");
  if (!result.ok) return { status: "error", errors: {}, message: sheetMessage[result.error], at: Date.now() };

  revalidatePath("/admin");
  return { status: "saved", errors: {}, at: Date.now() };
}

export async function removeAnswer(_prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = form.get("id");
  if (typeof id !== "string" || id === "") return { status: "error", errors: {}, message: "Chýba ID odpovede.", at: Date.now() };
  const result = await deleteAnswer(id);
  if (!result.ok) return { status: "error", errors: {}, message: sheetMessage[result.error], at: Date.now() };
  revalidatePath("/admin");
  return { status: "saved", errors: {}, at: Date.now() };
}
