"use client";

import { useActionState } from "react";
import { addInvitesInBulk, saveInvite } from "@/app/admin/actions";
import { initialInviteState, type InviteFormState } from "@/lib/admin";
import { INVITE_LIMITS, SIDES, type Invite, type Side } from "@/lib/records";

function useSave(action: (p: InviteFormState, f: FormData) => Promise<InviteFormState>, onDone: () => void) {
  return useActionState(async (prev: InviteFormState, form: FormData) => {
    const r = await action(prev, form);
    if (r.status === "saved") onDone();
    return r;
  }, initialInviteState);
}

function SidePick({ value, name = "side" }: { value: Side; name?: string }) {
  return (
    <fieldset className="adm-field">
      <legend>Strana</legend>
      <div className="adm-seg">
        {(Object.keys(SIDES) as Side[]).map((s) => (
          <label key={s}>
            <input type="radio" name={name} value={s} defaultChecked={value === s} />
            <span>{SIDES[s]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Add or edit one invitation. */
export function InviteEditor({ invite, groups, onDone }: { invite?: Invite; groups: string[]; onDone: () => void }) {
  const [state, action, pending] = useSave(saveInvite, onDone);
  const p = invite ? `i-${invite.id}` : "i-new";
  const err = (f: keyof InviteFormState["errors"]) =>
    state.errors[f] ? (
      <p className="adm-field__error" id={`${p}-${f}-error`}>
        {state.errors[f]}
      </p>
    ) : null;
  const invalid = (f: keyof InviteFormState["errors"]) =>
    state.errors[f] ? { "aria-invalid": true as const, "aria-describedby": `${p}-${f}-error` } : {};

  return (
    <form action={action} className="adm-form" noValidate>
      <input type="hidden" name="id" value={invite?.id ?? ""} />
      {state.status === "error" && (
        <p className="adm-notice adm-notice--warn" role="alert">
          {state.message}
        </p>
      )}
      <div className="adm-field">
        <label htmlFor={`${p}-household`}>Domácnosť</label>
        <input
          className="adm-input"
          id={`${p}-household`}
          name="household"
          required
          maxLength={INVITE_LIMITS.household}
          placeholder="napríklad Novákovci"
          defaultValue={invite?.household}
          {...invalid("household")}
        />
        {err("household")}
      </div>
      <div className="adm-field">
        <label htmlFor={`${p}-members`}>Mená na pozvánke</label>
        <textarea className="adm-input" id={`${p}-members`} name="members" rows={3} defaultValue={invite?.members.join("\n")} {...invalid("members")} />
        <p className="adm-field__hint">Jedno meno na riadok. Podľa nich sa odpovede priradia k pozvánke samy.</p>
        {err("members")}
      </div>
      <div className="adm-form__row">
        <div className="adm-field">
          <label htmlFor={`${p}-expected`}>Počet pozvaných</label>
          <input
            className="adm-input adm-input--num"
            id={`${p}-expected`}
            name="expected"
            type="number"
            inputMode="numeric"
            min={1}
            max={INVITE_LIMITS.expectedMax}
            defaultValue={invite?.expected}
            placeholder="podľa mien"
            {...invalid("expected")}
          />
          {err("expected")}
        </div>
        <div className="adm-field">
          <label htmlFor={`${p}-group`}>Skupina</label>
          <input className="adm-input" id={`${p}-group`} name="group" list={`${p}-groups`} maxLength={INVITE_LIMITS.group} placeholder="Rodina, Práca…" defaultValue={invite?.group} />
          <datalist id={`${p}-groups`}>
            {groups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>
      </div>
      <SidePick value={invite?.side ?? "both"} />
      {err("side")}
      <div className="adm-field">
        <label htmlFor={`${p}-contact`}>Telefón alebo e-mail</label>
        <input className="adm-input" id={`${p}-contact`} name="contact" maxLength={INVITE_LIMITS.contact} autoComplete="off" defaultValue={invite?.contact} />
        <p className="adm-field__hint">Na pripomienku cez SMS alebo e-mail.</p>
      </div>
      <div className="adm-field">
        <label htmlFor={`${p}-note`}>Poznámka</label>
        <textarea className="adm-input" id={`${p}-note`} name="note" rows={2} maxLength={INVITE_LIMITS.note} defaultValue={invite?.note} />
      </div>
      <div className="adm-form__actions">
        <button className="adm-btn adm-btn--primary" type="submit" disabled={pending}>
          {pending ? "Ukladám…" : invite ? "Uložiť zmeny" : "Pridať pozvánku"}
        </button>
        <button className="adm-btn" type="button" onClick={onDone} disabled={pending}>
          Zrušiť
        </button>
      </div>
    </form>
  );
}

/** Paste a list: one household per line. */
export function BulkInvites({ groups, onDone }: { groups: string[]; onDone: () => void }) {
  const [state, action, pending] = useSave(addInvitesInBulk, onDone);
  return (
    <form action={action} className="adm-form" noValidate>
      {state.status === "error" && (
        <p className="adm-notice adm-notice--warn" role="alert">
          {state.message}
        </p>
      )}
      <div className="adm-field">
        <label htmlFor="bulk-lines">Zoznam</label>
        <textarea
          className="adm-input adm-input--tall"
          id="bulk-lines"
          name="lines"
          rows={10}
          placeholder={"Novákovci; 4\nJán Kováč, Eva Kováčová\nTeta Mária"}
          aria-invalid={state.errors.household ? true : undefined}
          aria-describedby="bulk-help"
        />
        <p className="adm-field__hint" id="bulk-help">
          Jedna domácnosť na riadok. Za bodkočiarkou počet ľudí („Novákovci; 4“), alebo mená oddelené čiarkou („Ján Kováč, Eva Kováčová“). Dá sa
          vložiť aj z Excelu.
        </p>
        {state.errors.household && <p className="adm-field__error">{state.errors.household}</p>}
      </div>
      <SidePick value="both" />
      <div className="adm-field">
        <label htmlFor="bulk-group">Skupina pre všetkých</label>
        <input className="adm-input" id="bulk-group" name="group" list="bulk-groups" maxLength={INVITE_LIMITS.group} />
        <datalist id="bulk-groups">
          {groups.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
      </div>
      <div className="adm-form__actions">
        <button className="adm-btn adm-btn--primary" type="submit" disabled={pending}>
          {pending ? "Pridávam…" : "Pridať všetkých"}
        </button>
        <button className="adm-btn" type="button" onClick={onDone} disabled={pending}>
          Zrušiť
        </button>
      </div>
    </form>
  );
}
