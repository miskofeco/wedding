// What the guest pages show: the content files in src/content, with the parts
// the couple edited in /admin laid over them. An edit that fails validation, or
// a database that can't be reached, falls back to the files. Server-only.
import "server-only";
import { cache } from "react";
import { events, faq, places, requests, requestsIntro, rsvp, site } from "@/content";
import type { Place, Rsvp } from "@/content/types";
import { db, dbConfigured, nowIso } from "./db";
import {
  checkDetails,
  checkFaq,
  checkProgramme,
  checkRequests,
  type Checked,
  type ContentKey,
  type Details,
  type EditableContent,
} from "./site-content";

export const defaults: EditableContent = {
  programme: events,
  requests: { intro: requestsIntro, items: requests },
  faq,
  details: { deadline: rsvp.deadline, contact: rsvp.contact, churchTime: places.church.time, venueTime: places.venue.time },
};

export function check<K extends ContentKey>(key: K, value: unknown): Checked<EditableContent[K]> {
  const checked =
    key === "programme"
      ? checkProgramme(value)
      : key === "requests"
        ? checkRequests(value)
        : key === "faq"
          ? checkFaq(value)
          : checkDetails(value, site.date);
  return checked as Checked<EditableContent[K]>;
}

export interface StoredContent {
  content: EditableContent;
  /** When each part was last saved in /admin; `null` while it still comes from the files. */
  updatedAt: Record<ContentKey, string | null>;
}

/** The edited content, read once per request (or once per static render). */
export const readContent = cache(async (): Promise<StoredContent> => {
  const content: EditableContent = { ...defaults };
  const updatedAt: StoredContent["updatedAt"] = { programme: null, requests: null, faq: null, details: null };
  if (!dbConfigured()) return { content, updatedAt };
  try {
    const { rows } = await (await db()).execute("SELECT key, value, updated_at FROM content");
    for (const r of rows) {
      const key = String(r.key) as ContentKey;
      if (!(key in defaults)) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(r.value));
      } catch {
        continue;
      }
      const checked = check(key, parsed);
      if (!checked.ok) {
        console.error(`Content "${key}" in the database is invalid; showing the default.`);
        continue;
      }
      (content as unknown as Record<ContentKey, unknown>)[key] = checked.value;
      updatedAt[key] = String(r.updated_at);
    }
  } catch (err) {
    console.error(`Content read failed, showing the defaults: ${err instanceof Error ? err.message : "unknown error"}`);
  }
  return { content, updatedAt };
});

export interface SiteContent {
  events: EditableContent["programme"];
  requests: EditableContent["requests"]["items"];
  requestsIntro: string;
  faq: EditableContent["faq"];
  rsvp: Rsvp;
  places: Record<Place["id"], Place>;
  details: Details;
}

/** Everything the guest pages read that /admin can change. */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const { content } = await readContent();
  const d = content.details;
  return {
    events: content.programme,
    requests: content.requests.items,
    requestsIntro: content.requests.intro,
    faq: content.faq,
    rsvp: { ...rsvp, deadline: d.deadline, contact: d.contact },
    places: {
      church: { ...places.church, time: d.churchTime },
      venue: { ...places.venue, time: d.venueTime },
    },
    details: d,
  };
});

export async function saveContent<K extends ContentKey>(key: K, value: EditableContent[K]): Promise<boolean> {
  if (!dbConfigured()) return false;
  try {
    await (await db()).execute({
      sql: "INSERT INTO content (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
      args: [key, JSON.stringify(value), nowIso()],
    });
    return true;
  } catch (err) {
    console.error(`Content save failed: ${err instanceof Error ? err.message : "unknown error"}`);
    return false;
  }
}

/** Drops the edits for one part, so the guest pages show the content files again. */
export async function resetContent(key: ContentKey): Promise<boolean> {
  if (!dbConfigured()) return false;
  try {
    await (await db()).execute({ sql: "DELETE FROM content WHERE key = ?", args: [key] });
    return true;
  } catch (err) {
    console.error(`Content reset failed: ${err instanceof Error ? err.message : "unknown error"}`);
    return false;
  }
}
