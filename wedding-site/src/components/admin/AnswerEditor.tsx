"use client";

import { useActionState, useState } from "react";
import { saveAnswer } from "@/app/admin/actions";
import { initialAdminState, type AdminFormState } from "@/lib/admin";
import { LIMITS } from "@/lib/rsvp";
import { KidPick } from "../KidPick";
import type { StoredAnswer } from "@/lib/sheet";

interface Props {
  answer?: StoredAnswer;
  onDone: () => void;
}

/** Edit an answer, or add one received by phone or in person. */
export function AnswerEditor({ answer, onDone }: Props) {
  const [state, action, pending] = useActionState(async (prev: AdminFormState, form: FormData) => {
    const result = await saveAnswer(prev, form);
    if (result.status === "saved") onDone();
    return result;
  }, initialAdminState);
  const p = answer ? `e-${answer.id}` : "new";
  const [guests, setGuests] = useState(String(answer?.attending ? answer.guests : 1));
  // Names of guests 2…N; the first guest is the person in „Meno a priezvisko“.
  const [names, setNames] = useState(() =>
    Array.from({ length: LIMITS.guestsMax - 1 }, (_, i) => answer?.party?.[i + 1] ?? ""),
  );
  const [kids, setKids] = useState(() =>
    Array.from({ length: LIMITS.guestsMax - 1 }, (_, i) => answer?.kids?.[i + 1] ?? false),
  );
  const n = Number.parseInt(guests, 10);
  const count = Number.isInteger(n) ? Math.min(LIMITS.guestsMax, Math.max(1, n)) : 1;
  const err = (f: keyof AdminFormState["errors"]) =>
    state.errors[f] ? (
      <p className="field__error" id={`${p}-${f}-error`}>
        {state.errors[f]}
      </p>
    ) : null;

  return (
    <form action={action} className="admin-form admin-editor" noValidate>
      <input type="hidden" name="id" value={answer?.id ?? ""} />
      {state.status === "error" && (
        <p className="notice" role="alert">
          {state.message}
        </p>
      )}
      <div className="admin-editor__grid">
        <div className="field">
          <label htmlFor={`${p}-name`}>Meno a priezvisko</label>
          <input
            id={`${p}-name`}
            name="name"
            required
            maxLength={LIMITS.name}
            defaultValue={answer?.name}
            aria-invalid={state.errors.name ? true : undefined}
            aria-describedby={state.errors.name ? `${p}-name-error` : undefined}
          />
          {err("name")}
        </div>
        <fieldset className="field">
          <legend>Príde?</legend>
          <div className="choices">
            <label className="choice">
              <input type="radio" name="attending" value="yes" defaultChecked={answer ? answer.attending : true} />
              Áno
            </label>
            <label className="choice">
              <input type="radio" name="attending" value="no" defaultChecked={answer ? !answer.attending : false} />
              Nie
            </label>
          </div>
          {err("attending")}
        </fieldset>
        <div className="field field--short if-coming">
          <label htmlFor={`${p}-guests`}>Počet hostí</label>
          <input
            id={`${p}-guests`}
            name="guests"
            type="number"
            inputMode="numeric"
            min={1}
            max={LIMITS.guestsMax}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            aria-invalid={state.errors.guests ? true : undefined}
            aria-describedby={state.errors.guests ? `${p}-guests-error` : undefined}
          />
          {err("guests")}
        </div>
        {count > 1 && (
          <fieldset className="field if-coming admin-editor__wide">
            <legend>Ďalší hostia</legend>
            <div className="admin-editor__party">
              {names.slice(0, count - 1).map((value, i) => {
                const field = `party-${i + 2}` as const;
                return (
                  <div className="field" key={field}>
                    <label htmlFor={`${p}-${field}`}>{i + 2}. hosť</label>
                    <input
                      id={`${p}-${field}`}
                      name="party"
                      required
                      autoComplete="off"
                      maxLength={LIMITS.name}
                      value={value}
                      onChange={(e) => setNames((all) => all.map((x, j) => (j === i ? e.target.value : x)))}
                      aria-invalid={state.errors[field] ? true : undefined}
                      aria-describedby={state.errors[field] ? `${p}-${field}-error` : undefined}
                    />
                    <KidPick
                      field={`kid-${i + 2}`}
                      value={kids[i]}
                      onChange={(kid) => setKids((all) => all.map((k, j) => (j === i ? kid : k)))}
                      guest={value.trim() || `${i + 2}. hosť`}
                    />
                    {err(field)}
                  </div>
                );
              })}
            </div>
          </fieldset>
        )}
        <div className="field if-coming admin-editor__wide">
          <label htmlFor={`${p}-dietary`}>Strava a alergie</label>
          <textarea id={`${p}-dietary`} name="dietary" rows={2} maxLength={LIMITS.dietary} defaultValue={answer?.dietary} />
          {err("dietary")}
        </div>
        <div className="field admin-editor__wide">
          <label htmlFor={`${p}-message`}>Odkaz</label>
          <textarea id={`${p}-message`} name="message" rows={2} maxLength={LIMITS.message} defaultValue={answer?.message} />
          {err("message")}
        </div>
      </div>
      <div className="admin-editor__actions">
        <button className="btn btn--solid admin-btn" type="submit" disabled={pending}>
          {pending ? "Ukladám…" : answer ? "Uložiť zmeny" : "Pridať odpoveď"}
        </button>
        <button className="btn admin-btn" type="button" onClick={onDone} disabled={pending}>
          Zrušiť
        </button>
      </div>
    </form>
  );
}
