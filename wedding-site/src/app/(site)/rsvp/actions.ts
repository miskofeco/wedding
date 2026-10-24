"use server";

import { rsvp } from "@/content";
import { isPastDeadline, parseRsvp, type RsvpState } from "@/lib/rsvp";
import { createAnswer } from "@/lib/sheet";

/**
 * Validates an RSVP and stores it in the Google Sheet.
 * Reports "sent" only when the sheet confirms the row was written. Never logs the answer.
 */
export async function submitRsvp(_prev: RsvpState, form: FormData): Promise<RsvpState> {
  if (isPastDeadline(rsvp.deadline)) return { status: "closed", errors: {}, values: {} };

  const parsed = parseRsvp(form);
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors, values: parsed.values };

  // Honeypot: real guests never see or fill this field.
  if (typeof form.get("company") === "string" && form.get("company") !== "") {
    return { status: "failed", errors: {}, values: parsed.values };
  }

  const result = await createAnswer(parsed.answer, "web");
  if (!result.ok) {
    return { status: result.error === "not_configured" ? "unavailable" : "failed", errors: {}, values: parsed.values };
  }
  return { status: "sent", errors: {}, values: { attending: parsed.values.attending } };
}
