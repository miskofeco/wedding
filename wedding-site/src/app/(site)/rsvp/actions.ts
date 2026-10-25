"use server";

import { headers } from "next/headers";
import { rsvp } from "@/content";
import { clientIp, createLimiter } from "@/lib/limit";
import { isPastDeadline, parseRsvp, submissionKey, type RsvpState } from "@/lib/rsvp";
import { createAnswer } from "@/lib/sheet";

// A household sends one answer, maybe a retry or two; ten in ten minutes from one address is a script.
const sends = createLimiter(10, 10 * 60 * 1000);

/**
 * Validates an RSVP and stores it in the Google Sheet.
 * Reports "sent" only when the sheet confirms the row was written. Never logs the answer.
 */
export async function submitRsvp(_prev: RsvpState, form: FormData): Promise<RsvpState> {
  if (isPastDeadline(rsvp.deadline)) return { status: "closed", errors: {}, values: {} };

  const parsed = parseRsvp(form);
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors, values: parsed.values };

  // Honeypot: real guests never see or fill this field. A bot is told its answer arrived, and nothing is stored.
  const trap = form.get("hp_note");
  if (typeof trap === "string" && trap !== "") {
    return { status: "sent", errors: {}, values: { attending: parsed.values.attending } };
  }

  const ip = clientIp(await headers());
  if (sends.blocked(ip)) return { status: "failed", errors: {}, values: parsed.values };
  sends.hit(ip);

  const result = await createAnswer(parsed.answer, "web", submissionKey(form));
  if (!result.ok) {
    return { status: result.error === "not_configured" ? "unavailable" : "failed", errors: {}, values: parsed.values };
  }
  return { status: "sent", errors: {}, values: { attending: parsed.values.attending } };
}
