"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { submitRsvp } from "@/app/(site)/rsvp/actions";
import { art } from "@/lib/art";
import { initialRsvpState, LIMITS, type Field, type RsvpState } from "@/lib/rsvp";
import { AppleLogo, GoogleLogo } from "./CalendarLogos";
import { InfoTip, KidPick } from "./KidPick";
import { Tint } from "./Tint";

function FieldError({ id, state }: { id: Field; state: RsvpState }) {
  const message = state.errors[id];
  if (!message) return null;
  return (
    <p className="field__error" id={`${id}-error`}>
      {message}
    </p>
  );
}

const described = (id: Field, state: RsvpState, hint?: string) =>
  [state.errors[id] ? `${id}-error` : null, hint].filter(Boolean).join(" ") || undefined;

// One key per answer, made in the browser: a retry of the same answer sends the same key, so the
// Sheet stores it once. A new key after "sent", so a second household on this device is a new answer.
let answerKey: string | null = null;
const keyStore = {
  subscribe: () => () => {},
  get: () => (answerKey ??= globalThis.crypto?.randomUUID?.() ?? ""),
  // The static page is shared by every guest, so the server never renders a key.
  server: () => "",
  renew: () => {
    answerKey = null;
  },
};

/** 1 osoba, 2–4 osoby, 5 osôb */
const persons = (n: number) => (n === 1 ? "osoba" : n >= 2 && n <= 4 ? "osoby" : "osôb");

/** Number input with − and + buttons. Without JavaScript the input alone still works. */
function GuestsField({ state, value, onChange }: { state: RsvpState; value: string; onChange: (v: string) => void }) {
  const n = Number.parseInt(value, 10);
  const valid = Number.isInteger(n);
  const step = (by: number) => onChange(String(Math.min(LIMITS.guestsMax, Math.max(1, (valid ? n : 1) + by))));
  return (
    <div className="stepper">
      <button type="button" className="stepper__btn" onClick={() => step(-1)} disabled={valid && n <= 1} aria-label="O jednu osobu menej">
        −
      </button>
      <input
        id="guests"
        name="guests"
        type="number"
        inputMode="numeric"
        min={1}
        max={LIMITS.guestsMax}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={state.errors.guests ? true : undefined}
        aria-describedby={described("guests", state, "guests-unit")}
      />
      <button type="button" className="stepper__btn" onClick={() => step(1)} disabled={valid && n >= LIMITS.guestsMax} aria-label="O jednu osobu viac">
        +
      </button>
      <span className="stepper__unit" id="guests-unit">
        {valid && n >= 1 ? persons(n) : "osoby"}, aj s vami
      </span>
    </div>
  );
}

/**
 * One required name per guest, each with an adult / child choice. The first place is the
 * respondent (from step 1); answers typed for places that are removed come back if the count goes up again.
 */
function PartyNames({ state, count, you }: { state: RsvpState; count: number; you: string }) {
  const [names, setNames] = useState(() =>
    Array.from({ length: LIMITS.guestsMax - 1 }, (_, i) => state.values[`party-${i + 2}`] ?? ""),
  );
  const [kids, setKids] = useState(() =>
    Array.from({ length: LIMITS.guestsMax - 1 }, (_, i) => state.values[`kid-${i + 2}`] === "kid"),
  );
  return (
    <ol className="party" aria-describedby="party-hint">
      <li className="party__row party__row--you">
        <span className="party__num" aria-hidden="true">
          1
        </span>
        <span className="party__you">
          {you.trim() || "Vaše meno z prvého kroku"} <span className="party__tag">vy</span>
        </span>
      </li>
      {names.slice(0, Math.max(0, count - 1)).map((value, i) => {
        const field = `party-${i + 2}` as const;
        return (
          <li className="party__row" key={field}>
            <label className="party__num" htmlFor={field}>
              <span className="sr-only">Meno a priezvisko {i + 2}. hosťa</span>
              <span aria-hidden="true">{i + 2}</span>
            </label>
            <div className="party__field">
              <input
                id={field}
                name="party"
                required
                autoComplete="off"
                maxLength={LIMITS.name}
                value={value}
                onChange={(e) => setNames((all) => all.map((n, j) => (j === i ? e.target.value : n)))}
                aria-invalid={state.errors[field] ? true : undefined}
                aria-describedby={described(field, state)}
              />
              <KidPick
                field={`kid-${i + 2}`}
                value={kids[i]}
                onChange={(kid) => setKids((all) => all.map((k, j) => (j === i ? kid : k)))}
                guest={value.trim() || `${i + 2}. hosť`}
              />
              <FieldError id={field} state={state} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const DIETS = ["vegetariánska", "vegánska", "bezlepková", "bez laktózy"] as const;

const items = (text: string) =>
  text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** Free text with quick chips that add or remove a common diet. */
function DietField({ state }: { state: RsvpState }) {
  const [text, setText] = useState(state.values.dietary ?? "");
  const has = (d: string) => items(text).some((i) => i.toLowerCase() === d);
  const toggle = (d: string) =>
    setText((t) => (has(d) ? items(t).filter((i) => i.toLowerCase() !== d) : [...items(t), d]).join(", "));
  return (
    <>
      <div className="chips" role="group" aria-label="Časté možnosti">
        {DIETS.map((d) => (
          <button key={d} type="button" className="chip" aria-pressed={has(d)} onClick={() => toggle(d)}>
            {d}
          </button>
        ))}
      </div>
      <textarea
        id="dietary"
        name="dietary"
        rows={2}
        maxLength={LIMITS.dietary}
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-describedby={described("dietary", state, "dietary-hint")}
      />
    </>
  );
}

/** The numbered stops. Remounts with the form after each attempt, so its state starts from the echoed values. */
function FormSteps({ state, pending, privacy }: { state: RsvpState; pending: boolean; privacy: string }) {
  const [name, setName] = useState(state.values.name ?? "");
  const [guests, setGuests] = useState(state.values.guests || "1");
  const n = Number.parseInt(guests, 10);
  const count = Number.isInteger(n) ? Math.min(LIMITS.guestsMax, Math.max(1, n)) : 1;
  return (
    <ol className="steps">
      <li className="step">
        <label className="step__title" htmlFor="name">
          Ako sa voláte?
        </label>
        <p className="field__hint" id="name-hint">
          Meno a priezvisko. Ostatných z domácnosti dopíšete o dva kroky nižšie.
        </p>
        <input
          id="name"
          name="name"
          autoComplete="name"
          required
          maxLength={LIMITS.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={state.errors.name ? true : undefined}
          aria-describedby={described("name", state, "name-hint")}
        />
        <FieldError id="name" state={state} />
      </li>

      <li className="step">
        <fieldset className="step__set" aria-describedby={described("attending", state)}>
          <legend className="step__title">Budete s nami 29. mája?</legend>
          <div className="tiles" role="radiogroup" aria-invalid={state.errors.attending ? true : undefined}>
            <label className="tile tile--yes">
              <input
                type="radio"
                name="attending"
                value="yes"
                id="attending-yes"
                required
                defaultChecked={state.values.attending === "yes"}
              />
              <Tint className="tile__art" src={art("champagne-toast", "black")} c="butter" c2="peony" reveal={false} />
              <span className="tile__title">Áno, s radosťou</span>
              <span className="tile__note">Ďalej už len kto príde a strava.</span>
            </label>
            <label className="tile tile--no">
              <input type="radio" name="attending" value="no" id="attending-no" defaultChecked={state.values.attending === "no"} />
              <Tint className="tile__art" src={art("ranunculus-bouquet", "black")} c="linen" c2="butter" reveal={false} />
              <span className="tile__title">Žiaľ, tentoraz nie</span>
              <span className="tile__note">Pošlite nám aspoň pár slov.</span>
            </label>
          </div>
        </fieldset>
        <FieldError id="attending" state={state} />
      </li>

      <li className="step step--coming">
        <label className="step__title" htmlFor="guests">
          Koľko vás príde?
        </label>
        <GuestsField state={state} value={guests} onChange={setGuests} />
        <FieldError id="guests" state={state} />
        <p className="field__hint" id="party-hint">
          Ak prídete viacerí, dopíšte, prosím, meno a priezvisko každého hosťa a označte, či ide o dieťa.{" "}
          <InfoTip label="Prečo sa pýtame, či ide o dieťa">
            Pomôže nám to pri zasadacom poriadku a pri plánovaní veľkosti porcií.
          </InfoTip>
        </p>
        <PartyNames state={state} count={count} you={name} />
      </li>

      <li className="step step--coming">
        <label className="step__title" htmlFor="dietary">
          Niečo, čo nejete?
        </label>
        <p className="field__hint" id="dietary-hint">
          Vyberte alebo dopíšte, napríklad alergiu. Nepovinné.
        </p>
        <DietField state={state} />
        <FieldError id="dietary" state={state} />
      </li>

      <li className="step" id="odkaz">
        <label className="step__title" htmlFor="sprava">
          Chcete nám niečo odkázať?
        </label>
        <p className="field__hint" id="message-hint">
          Otázka, prianie alebo čokoľvek, čo by sme mali vedieť. Nepovinné.
        </p>
        <textarea
          id="sprava"
          name="message"
          rows={4}
          maxLength={LIMITS.message}
          defaultValue={state.values.message}
          aria-describedby={described("message", state, "message-hint")}
        />
        <FieldError id="message" state={state} />
      </li>

      <li className="step step--send">
        {/* Honeypot for bots: hidden from people and assistive technology. Its name and label match
            nothing browsers or password managers autofill, so a guest's autofill never trips it. */}
        <div className="hp" aria-hidden="true">
          <label htmlFor="hp_note">Nechajte prázdne</label>
          <input id="hp_note" name="hp_note" tabIndex={-1} autoComplete="off" />
        </div>
        <button className="btn btn--solid btn--send" type="submit" disabled={pending} data-pending={pending || undefined}>
          {pending ? "Odosielam…" : "Odoslať odpoveď"}
        </button>
        <p className="field__hint">{privacy}</p>
      </li>
    </ol>
  );
}

interface RsvpFormProps {
  contact: string | null;
  /** Google Calendar link for the thank-you screen (built on the server). */
  calendarUrl: string;
  /** Who sees the answer, where it is kept and when it is deleted. */
  privacy: string;
}

export function RsvpForm({ contact, calendarUrl, privacy }: RsvpFormProps) {
  const [state, action, pending] = useActionState(submitRsvp, initialRsvpState);
  const submission = useSyncExternalStore(keyStore.subscribe, keyStore.get, keyStore.server);
  const v = state.values;
  const form = useRef<HTMLFormElement>(null);
  const notice = useRef<HTMLDivElement>(null);
  const done = useRef<HTMLHeadingElement>(null);

  // After each attempt, take the guest to what needs their attention.
  useEffect(() => {
    if (state.status === "invalid") {
      const first = form.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      (first?.matches("input, textarea") ? first : first?.querySelector<HTMLElement>("input"))?.focus();
    }
    else if (state.status === "failed" || state.status === "unavailable") notice.current?.focus();
    else if (state.status === "sent" || state.status === "closed") {
      if (state.status === "sent") keyStore.renew();
      done.current?.focus();
    }
  }, [state]);

  if (state.status === "sent") {
    const coming = v.attending === "yes";
    return (
      <div className={`reply-end${coming ? " reply-end--yes" : ""}`} role="status">
        <Tint
          className="reply-end__art"
          src={coming ? art("dance-twirl", "black") : art("ranunculus-bouquet", "black")}
          c={coming ? "peony" : "linen"}
          c2="butter"
          reveal={false}
        />
        <h2 ref={done} tabIndex={-1}>
          {coming ? "Ďakujeme, tešíme sa na vás!" : "Ďakujeme, že ste nám dali vedieť."}
        </h2>
        <p className="lead">
          {coming
            ? "Vašu odpoveď sme dostali. Uložte si dátum do kalendára, nech vás 29. máj nezaskočí."
            : "Vašu odpoveď sme dostali. Budete nám chýbať a pripijeme si aj na vás."}
        </p>
        {coming && (
          <div className="reply-end__cal">
            <a className="btn cal__btn cal__btn--google" href={calendarUrl} target="_blank" rel="noopener noreferrer">
              <GoogleLogo />
              Google Kalendár<span className="sr-only"> (otvorí sa v novom okne)</span>
            </a>
            <a className="btn cal__btn cal__btn--apple" href="/svadba.ics" download="svadba-barbora-michal.ics">
              <AppleLogo />
              Apple a iné kalendáre
            </a>
          </div>
        )}
        <p className="reply-end__links">
          {coming ? (
            <>
              <Link className="link" href="/#program">
                Pozrieť program
              </Link>
              <Link className="link" href="/#ubytovanie">
                Kde prespať
              </Link>
              <Link className="link" href="/#otazky">
                Časté otázky
              </Link>
            </>
          ) : (
            <Link className="link" href="/">
              Späť na pozvánku
            </Link>
          )}
        </p>
        <p className="field__hint">
          {contact ? `Ak sa niečo zmení, napíšte nám: ${contact}.` : "Ak sa niečo zmení, dajte nám, prosím, vedieť."}
        </p>
      </div>
    );
  }

  if (state.status === "closed") {
    return (
      <div className="reply-end" role="status">
        <h2 ref={done} tabIndex={-1}>
          Termín na odpoveď už uplynul.
        </h2>
        <p className="lead">{contact ? `Ozvite sa nám, prosím, priamo: ${contact}.` : "Ozvite sa nám, prosím, priamo."}</p>
      </div>
    );
  }

  return (
    // key: remount with the echoed values after each attempt, so nothing typed is lost
    <form ref={form} className="rsvp-form" action={action} key={JSON.stringify(v)} noValidate>
      {(state.status === "unavailable" || state.status === "failed" || state.status === "invalid") && (
        <div className="notice" role="alert" ref={notice} tabIndex={-1}>
          {state.status === "invalid" && <p>Ešte chvíľku: skontrolujte, prosím, označené kroky.</p>}
          {state.status === "unavailable" && (
            <p>
              <strong>Odpoveď sa zatiaľ nedá odoslať online, vašu odpoveď sme nedostali.</strong>{" "}
              {contact ? `Dajte nám, prosím, vedieť priamo: ${contact}.` : "Dajte nám, prosím, vedieť osobne alebo telefonicky."}
            </p>
          )}
          {state.status === "failed" && (
            <p>
              <strong>Odpoveď sa nepodarilo odoslať.</strong> Skúste to, prosím, o chvíľu znova
              {contact ? ` alebo nám napíšte priamo: ${contact}.` : "."}
            </p>
          )}
        </div>
      )}

      <input type="hidden" name="submission" value={submission} />
      <FormSteps state={state} pending={pending} privacy={privacy} />
    </form>
  );
}
