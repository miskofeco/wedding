// Shared RSVP types and validation. Runs on the server (authoritative) and is
// safe to import on the client (no secrets here).

export const LIMITS = { name: 100, dietary: 500, message: 1000, guestsMax: 10 } as const;

/** `party-2` … `party-10`: the name of the second, third … guest. `kid-2` … `kid-10`: "kid" or "adult" for the same guest. */
export type Field = "name" | "attending" | "guests" | "dietary" | "message" | `party-${number}` | `kid-${number}`;

export type RsvpStatus =
  | "idle"
  | "invalid" // fix the highlighted fields
  | "sent" // the endpoint confirmed delivery
  | "unavailable" // no destination configured yet: nothing was sent
  | "failed" // the endpoint refused or timed out: nothing confirmed
  | "closed"; // past the deadline

export interface RsvpState {
  status: RsvpStatus;
  errors: Partial<Record<Field, string>>;
  /** Echo of what the guest typed, so a failed attempt keeps their answers. */
  values: Partial<Record<Field, string>>;
}

export interface RsvpAnswer {
  name: string;
  attending: boolean;
  guests: number;
  /** Everyone coming, the respondent first; as many names as guests. Empty when not coming. */
  party: string[];
  /** One flag per name in `party` (same order): true for a child. The respondent is never one. */
  kids: boolean[];
  dietary: string;
  message: string;
}

export const initialRsvpState: RsvpState = { status: "idle", errors: {}, values: {} };

// Strip control characters except newlines and tabs, normalise, trim.
function clean(value: FormDataEntryValue | null, max: number, multiline = false): string {
  if (typeof value !== "string") return "";
  const stripped = value.normalize("NFC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  const flat = multiline ? stripped.replace(/\r\n?/g, "\n") : stripped.replace(/\s+/g, " ");
  return flat.trim().slice(0, max + 1);
}

export function parseRsvp(form: FormData):
  | { ok: true; answer: RsvpAnswer; values: RsvpState["values"] }
  | { ok: false; errors: RsvpState["errors"]; values: RsvpState["values"] } {
  const name = clean(form.get("name"), LIMITS.name);
  const attendingRaw = clean(form.get("attending"), 3);
  const guestsRaw = clean(form.get("guests"), 2);
  const dietary = clean(form.get("dietary"), LIMITS.dietary, true);
  const message = clean(form.get("message"), LIMITS.message, true);
  // One `party` input per guest after the respondent (inputs party-2 … party-N, in order).
  const others = form.getAll("party").map((v) => clean(v, LIMITS.name));
  const values: RsvpState["values"] = { name, attending: attendingRaw, guests: guestsRaw, dietary, message };
  others.forEach((o, i) => (values[`party-${i + 2}`] = o));
  // `kid-N` radios pair with `party-N`; anything but "kid" counts as an adult.
  const kidFlags = others.map((_, i) => clean(form.get(`kid-${i + 2}`), 5) === "kid");
  kidFlags.forEach((k, i) => (values[`kid-${i + 2}`] = k ? "kid" : "adult"));
  const errors: RsvpState["errors"] = {};

  if (name.length < 2) errors.name = "Napíšte, prosím, svoje meno.";
  else if (name.length > LIMITS.name) errors.name = `Meno môže mať najviac ${LIMITS.name} znakov.`;

  if (attendingRaw !== "yes" && attendingRaw !== "no") errors.attending = "Vyberte, prosím, či prídete.";
  const attending = attendingRaw === "yes";

  let guests = 0;
  if (attending) {
    guests = Number.parseInt(guestsRaw, 10);
    if (!Number.isInteger(guests) || guests < 1 || guests > LIMITS.guestsMax)
      errors.guests = `Zadajte počet od 1 do ${LIMITS.guestsMax}.`;
    else
      for (let n = 2; n <= guests; n++) {
        const o = others[n - 2] ?? "";
        if (o.length < 2) errors[`party-${n}`] = "Napíšte, prosím, meno a priezvisko.";
        else if (o.length > LIMITS.name) errors[`party-${n}`] = `Meno môže mať najviac ${LIMITS.name} znakov.`;
      }
  }
  if (dietary.length > LIMITS.dietary) errors.dietary = `Najviac ${LIMITS.dietary} znakov.`;
  if (message.length > LIMITS.message) errors.message = `Najviac ${LIMITS.message} znakov.`;

  if (Object.keys(errors).length > 0) return { ok: false, errors, values };
  const party = attending ? [name, ...others.slice(0, guests - 1)] : [];
  const kids = attending ? [false, ...kidFlags.slice(0, guests - 1)] : [];
  return { ok: true, answer: { name, attending, guests, party, kids, dietary: attending ? dietary : "", message }, values };
}

/** True once the deadline day (Slovak time) has passed. */
export function isPastDeadline(deadline: string | null, now = new Date()): boolean {
  if (!deadline) return false;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bratislava" }).format(now);
  return today > deadline;
}
