"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { createAnswer } from "@/lib/answers";
import { getSiteContent } from "@/lib/content";
import { clientIp, createLimiter } from "@/lib/limit";
import { isPastDeadline, parseRsvp, submissionKey, type RsvpState } from "@/lib/rsvp";
import { syncPending } from "@/lib/mirror";

// A household sends one answer, maybe a retry or two; ten in ten minutes from one address is a script.
const sends = createLimiter(10, 10 * 60 * 1000);

/**
 * Validates an RSVP and stores it in the database; a copy goes to the Google Sheet after the reply.
 * Reports "sent" only when the database confirms the row was written. Never logs the answer.
 */
export async function submitRsvp(_prev: RsvpState, form: FormData): Promise<RsvpState> {
  const { rsvp } = await getSiteContent();
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
  after(() => syncPending());
  return { status: "sent", errors: {}, values: { attending: parsed.values.attending } };
}
