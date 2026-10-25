"use client";

import { useActionState, useState } from "react";
import { saveAnswer } from "@/app/admin/actions";
import { initialAdminState, type AdminFormState } from "@/lib/admin";
import { LIMITS } from "@/lib/rsvp";
import type { Invite, StoredAnswer } from "@/lib/records";
import { KidPick } from "../KidPick";

interface Props {
  answer?: StoredAnswer;
  invites: Invite[];
  /** The invite this answer is linked to now (by hand or by name). */
  inviteId?: string | null;
  onDone: () => void;
}

/** Edit an answer, or add one received by phone or in person. */
export function AnswerEditor({ answer, invites, inviteId, onDone }: Props) {
  const [state, action, pending] = useActionState(async (prev: AdminFormState, form: FormData) => {
    const result = await saveAnswer(prev, form);
    if (result.status === "saved") onDone();
    return result;
  }, initialAdminState);
  const p = answer ? `e-${answer.id}` : "new";
  const [attending, setAttending] = useState(answer ? answer.attending : true);
  const [guests, setGuests] = useState(answer?.attending ? answer.guests : 1);
  // Names of guests 2…N; the first guest is the person in „Meno a priezvisko“.
  const [names, setNames] = useState(() => Array.from({ length: LIMITS.guestsMax - 1 }, (_, i) => answer?.party?.[i + 1] ?? ""));
  const [kids, setKids] = useState(() => Array.from({ length: LIMITS.guestsMax - 1 }, (_, i) => answer?.kids?.[i + 1] ?? false));
  const err = (f: keyof AdminFormState["errors"]) =>
    state.errors[f] ? (
      <p className="adm-field__error" id={`${p}-${f}-error`}>
        {state.errors[f]}
      </p>
    ) : null;
  const invalid = (f: keyof AdminFormState["errors"]) =>
    state.errors[f] ? { "aria-invalid": true as const, "aria-describedby": `${p}-${f}-error` } : {};

  return (
    <form action={action} className="adm-form" noValidate>
      <input type="hidden" name="id" value={answer?.id ?? ""} />
      {state.status === "error" && (
        <p className="adm-notice adm-notice--warn" role="alert">
          {state.message}
        </p>
      )}
      <div className="adm-field">
        <label htmlFor={`${p}-name`}>Meno a priezvisko</label>
        <input className="adm-input" id={`${p}-name`} name="name" required maxLength={LIMITS.name} defaultValue={answer?.name} {...invalid("name")} />
        {err("name")}
      </div>

      <fieldset className="adm-field">
        <legend>Príde?</legend>
        <div className="adm-seg">
          <label>
            <input type="radio" name="attending" value="yes" checked={attending} onChange={() => setAttending(true)} />
            <span>Áno, príde</span>
          </label>
          <label>
            <input type="radio" name="attending" value="no" checked={!attending} onChange={() => setAttending(false)} />
            <span>Nie</span>
          </label>
        </div>
        {err("attending")}
      </fieldset>

      {attending && (
        <>
          <div className="adm-field">
            <label htmlFor={`${p}-guests`}>Počet hostí spolu</label>
            <div className="adm-stepper">
              <button type="button" className="adm-icon-btn" aria-label="Menej" disabled={guests <= 1} onClick={() => setGuests((g) => Math.max(1, g - 1))}>
                −
              </button>
              <input
                className="adm-input adm-input--num"
                id={`${p}-guests`}
                name="guests"
                type="number"
                inputMode="numeric"
                min={1}
                max={LIMITS.guestsMax}
                value={guests}
                onChange={(e) => setGuests(Math.min(LIMITS.guestsMax, Math.max(1, Number.parseInt(e.target.value, 10) || 1)))}
                {...invalid("guests")}
              />
              <button
                type="button"
                className="adm-icon-btn"
                aria-label="Viac"
                disabled={guests >= LIMITS.guestsMax}
                onClick={() => setGuests((g) => Math.min(LIMITS.guestsMax, g + 1))}
              >
                +
              </button>
            </div>
            {err("guests")}
          </div>

          {guests > 1 && (
            <fieldset className="adm-field">
              <legend>Ďalší hostia</legend>
              <ol className="adm-party">
                {names.slice(0, guests - 1).map((value, i) => {
                  const field = `party-${i + 2}` as const;
                  return (
                    <li key={field}>
                      <label className="sr-only" htmlFor={`${p}-${field}`}>
                        {i + 2}. hosť
                      </label>
                      <input
                        className="adm-input"
                        id={`${p}-${field}`}
                        name="party"
                        required
                        autoComplete="off"
                        placeholder={`${i + 2}. hosť`}
                        maxLength={LIMITS.name}
                        value={value}
                        onChange={(e) => setNames((all) => all.map((x, j) => (j === i ? e.target.value : x)))}
                        {...invalid(field)}
                      />
                      <KidPick
                        field={`kid-${i + 2}`}
                        value={kids[i]}
                        onChange={(kid) => setKids((all) => all.map((k, j) => (j === i ? kid : k)))}
                        guest={value.trim() || `${i + 2}. hosť`}
                      />
                      {err(field)}
                    </li>
                  );
                })}
              </ol>
            </fieldset>
          )}

          <div className="adm-field">
            <label htmlFor={`${p}-dietary`}>Strava a alergie</label>
            <textarea className="adm-input" id={`${p}-dietary`} name="dietary" rows={2} maxLength={LIMITS.dietary} defaultValue={answer?.dietary} />
            {err("dietary")}
          </div>
        </>
      )}

      <div className="adm-field">
        <label htmlFor={`${p}-message`}>Odkaz</label>
        <textarea className="adm-input" id={`${p}-message`} name="message" rows={3} maxLength={LIMITS.message} defaultValue={answer?.message} />
        {err("message")}
      </div>

      <div className="adm-field">
        <label htmlFor={`${p}-invite`}>Pozvánka</label>
        <select className="adm-input" id={`${p}-invite`} name="invite" defaultValue={answer?.inviteId ?? ""}>
          <option value="">{inviteId && !answer?.inviteId ? `Podľa mena (${invites.find((i) => i.id === inviteId)?.household ?? "?"})` : "Podľa mena"}</option>
          {invites.map((i) => (
            <option key={i.id} value={i.id}>
              {i.household}
            </option>
          ))}
        </select>
        <p className="adm-field__hint">Ak sa meno nezhoduje s pozvánkou, priraďte ju tu.</p>
      </div>

      <div className="adm-form__actions">
        <button className="adm-btn adm-btn--primary" type="submit" disabled={pending}>
          {pending ? "Ukladám…" : answer ? "Uložiť zmeny" : "Pridať odpoveď"}
        </button>
        <button className="adm-btn" type="button" onClick={onDone} disabled={pending}>
          Zrušiť
        </button>
      </div>
    </form>
  );
}
