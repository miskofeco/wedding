"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { resetSiteContent, saveSiteContent } from "@/app/admin/actions";
import { initialContentState, type ContentFormState } from "@/lib/admin";
import { art } from "@/lib/art";
import type { Colour, ProgrammeEvent, Question, Request } from "@/content/types";
import { CONTENT_LIMITS as L, PICTURES, TINT_NAMES, TINTS, type ContentKey, type Details, type EditableContent, type RequestsContent } from "@/lib/site-content";
import { Tint } from "../Tint";
import { formatStamp } from "./format";
import { Icon } from "./Icon";

type Errors = Partial<Record<string, string>>;
const newId = () => crypto.randomUUID().slice(0, 8);

// ---- shared pieces ----

function Field({
  label,
  path,
  errors,
  hint,
  count,
  max,
  children,
}: {
  label: string;
  path: string;
  errors: Errors;
  hint?: string;
  count?: number;
  max?: number;
  children: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const id = useId();
  const error = errors[path];
  return (
    <div className="adm-field">
      <div className="adm-field__top">
        <label htmlFor={id}>{label}</label>
        {max !== undefined && count !== undefined && count > max * 0.7 && (
          <span className={count > max ? "adm-count adm-count--over" : "adm-count"}>
            {count}/{max}
          </span>
        )}
      </div>
      {children({ id, ...(error ? { "aria-invalid": true as const, "aria-describedby": `${id}-e` } : {}) })}
      {hint && !error && <p className="adm-field__hint">{hint}</p>}
      {error && (
        <p className="adm-field__error" id={`${id}-e`}>
          {error}
        </p>
      )}
    </div>
  );
}

function PicturePick({ value, tint, onChange }: { value: ProgrammeEvent["drawing"]; tint: [Colour, Colour]; onChange: (v: ProgrammeEvent["drawing"]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="adm-pic">
      <button type="button" className="adm-pic__current" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Tint src={art(value, "black")} c={tint[0]} c2={tint[1]} reveal={false} />
        <span className="adm-pic__change">Zmeniť obrázok</span>
      </button>
      {open && (
        <div className="adm-pic__grid" role="radiogroup" aria-label="Obrázok">
          {PICTURES.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={p === value}
              aria-label={p}
              className="adm-pic__opt"
              onClick={() => (onChange(p), setOpen(false))}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art(p, "black")} alt="" width={56} height={56} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TintPick({ value, onChange }: { value: [Colour, Colour]; onChange: (v: [Colour, Colour]) => void }) {
  const name = useId();
  return (
    <div className="adm-tints">
      {(["Hlavná farba", "Malá škvrna"] as const).map((label, slot) => (
        <fieldset key={label} className="adm-tints__row">
          <legend>{label}</legend>
          {TINTS.map((c) => (
            <label key={c} className="adm-swatch-pick" title={TINT_NAMES[c]} style={{ "--c": `var(--${c})` } as React.CSSProperties}>
              <input
                type="radio"
                name={`${name}-${slot}`}
                checked={value[slot] === c}
                onChange={() => onChange(slot === 0 ? [c, value[1]] : [value[0], c])}
              />
              <span className="sr-only">{TINT_NAMES[c]}</span>
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}

/** Up, down and remove for one item of a list. */
function ItemTools({ index, total, onMove, onRemove, label }: { index: number; total: number; onMove: (to: number) => void; onRemove: () => void; label: string }) {
  return (
    <div className="adm-item__tools">
      <button type="button" className="adm-icon-btn" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Posunúť vyššie: ${label}`}>
        <Icon name="up" />
      </button>
      <button type="button" className="adm-icon-btn" disabled={index === total - 1} onClick={() => onMove(index + 1)} aria-label={`Posunúť nižšie: ${label}`}>
        <Icon name="down" />
      </button>
      <button type="button" className="adm-icon-btn adm-icon-btn--danger" onClick={onRemove} aria-label={`Odstrániť: ${label}`}>
        <Icon name="trash" />
      </button>
    </div>
  );
}

const move = <T,>(list: T[], from: number, to: number) => {
  const next = [...list];
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
};

/** Errors for items at `index` after a move or a removal no longer line up: clear them on any structural change. */
function useEditor<K extends ContentKey>(key: K, initial: EditableContent[K]) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [state, action, pending] = useActionState(async (prev: ContentFormState, form: FormData) => {
    const r = await saveSiteContent(prev, form);
    if (r.status === "saved") setSaved(JSON.parse(String(form.get("value"))));
    return r;
  }, initialContentState);
  const dirty = JSON.stringify(value) !== JSON.stringify(saved);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const errors = state.status === "invalid" ? state.errors : {};
  return { value, setValue, dirty, state, action, pending, errors, revert: () => setValue(saved) };
}

function SaveBar({
  k,
  value,
  dirty,
  pending,
  state,
  action,
  revert,
  updatedAt,
  preview,
}: {
  k: ContentKey;
  value: unknown;
  dirty: boolean;
  pending: boolean;
  state: ContentFormState;
  action: (f: FormData) => void;
  revert: () => void;
  updatedAt: string | null;
  preview: string;
}) {
  const [reset, resetAction, resetting] = useActionState(resetSiteContent, initialContentState);
  return (
    <div className="adm-savebar">
      <form action={action} className="adm-savebar__main">
        <input type="hidden" name="key" value={k} />
        <input type="hidden" name="value" value={JSON.stringify(value)} />
        <p className="adm-savebar__state" role="status">
          {pending
            ? "Ukladám…"
            : state.status === "invalid" || state.status === "error"
              ? <span className="adm-field__error">{state.errors._ ?? state.message}</span>
              : dirty
                ? "Neuložené zmeny"
                : state.status === "saved"
                  ? "Uložené. Web sa obnoví pri ďalšej návšteve."
                  : updatedAt
                    ? `Naposledy uložené ${formatStamp(updatedAt)}`
                    : "Zobrazuje sa pôvodný obsah zo súborov webu"}
        </p>
        <a className="adm-btn adm-btn--ghost" href={preview} target="_blank" rel="noopener">
          <Icon name="external" />
          Pozrieť na webe
        </a>
        {dirty && (
          <button type="button" className="adm-btn" onClick={revert} disabled={pending}>
            Zahodiť zmeny
          </button>
        )}
        <button type="submit" className="adm-btn adm-btn--primary" disabled={!dirty || pending}>
          {pending ? "Ukladám…" : "Uložiť a zverejniť"}
        </button>
      </form>
      {updatedAt && !dirty && (
        <form
          action={resetAction}
          className="adm-savebar__reset"
          onSubmit={(e) => {
            if (!window.confirm("Vrátiť túto časť webu na pôvodný obsah zo súborov? Vaše úpravy sa stratia.")) e.preventDefault();
          }}
        >
          <input type="hidden" name="key" value={k} />
          <button type="submit" className="adm-linkbtn" disabled={resetting}>
            <Icon name="undo" size={16} />
            Vrátiť na pôvodný obsah
          </button>
          {reset.status === "error" && <span className="adm-field__error">{reset.message}</span>}
        </form>
      )}
    </div>
  );
}

// ---- programme ----

export function ProgrammeEditor({ initial, updatedAt }: { initial: ProgrammeEvent[]; updatedAt: string | null }) {
  const ed = useEditor("programme", initial);
  const items = ed.value;
  const set = (i: number, patch: Partial<ProgrammeEvent>) => ed.setValue(items.map((e, j) => (j === i ? { ...e, ...patch } : e)));

  return (
    <>
      <ol className="adm-items">
        {items.map((e, i) => (
          <li className="adm-item" key={e.id}>
            <div className="adm-item__aside">
              <PicturePick value={e.drawing} tint={e.tint} onChange={(drawing) => set(i, { drawing })} />
              <TintPick value={e.tint} onChange={(tint) => set(i, { tint })} />
            </div>
            <div className="adm-item__main">
              <div className="adm-item__head">
                <span className="adm-item__time">{e.time ?? e.relativeTime ?? "Čas upresníme"}</span>
                <ItemTools
                  index={i}
                  total={items.length}
                  label={e.title || "chvíľa"}
                  onMove={(to) => ed.setValue(move(items, i, to))}
                  onRemove={() => ed.setValue(items.filter((_, j) => j !== i))}
                />
              </div>
              <Field label="Názov" path={`${i}.title`} errors={ed.errors} count={e.title.length} max={L.title}>
                {(p) => <input className="adm-input adm-input--strong" {...p} value={e.title} onChange={(x) => set(i, { title: x.target.value })} />}
              </Field>
              <div className="adm-form__row">
                <Field label="Čas" path={`${i}.time`} errors={ed.errors} hint="Prázdne: „Čas upresníme“">
                  {(p) => <input className="adm-input" type="time" {...p} value={e.time ?? ""} onChange={(x) => set(i, { time: x.target.value || null })} />}
                </Field>
                <Field label="Namiesto času" path={`${i}.relativeTime`} errors={ed.errors} hint="Napríklad „Po obrade“">
                  {(p) => (
                    <input
                      className="adm-input"
                      {...p}
                      value={e.relativeTime ?? ""}
                      maxLength={L.when}
                      onChange={(x) => set(i, { relativeTime: x.target.value || undefined })}
                    />
                  )}
                </Field>
              </div>
              <Field label="Miesto" path={`${i}.place`} errors={ed.errors} count={e.place.length} max={L.place}>
                {(p) => <input className="adm-input" {...p} value={e.place} onChange={(x) => set(i, { place: x.target.value })} />}
              </Field>
              <Field label="Popis" path={`${i}.description`} errors={ed.errors} count={e.description.length} max={L.text}>
                {(p) => <textarea className="adm-input" rows={2} {...p} value={e.description} onChange={(x) => set(i, { description: x.target.value })} />}
              </Field>
              {e.playlist ? (
                <fieldset className="adm-sub">
                  <legend>Playlist pri tejto chvíli</legend>
                  <div className="adm-form__row">
                    <Field label="Nadpis" path={`${i}.playlist.title`} errors={ed.errors}>
                      {(p) => <input className="adm-input" {...p} value={e.playlist!.title} onChange={(x) => set(i, { playlist: { ...e.playlist!, title: x.target.value } })} />}
                    </Field>
                    <Field label="Text tlačidla" path={`${i}.playlist.label`} errors={ed.errors}>
                      {(p) => <input className="adm-input" {...p} value={e.playlist!.label} onChange={(x) => set(i, { playlist: { ...e.playlist!, label: x.target.value } })} />}
                    </Field>
                  </div>
                  <Field label="Text" path={`${i}.playlist.note`} errors={ed.errors}>
                    {(p) => <textarea className="adm-input" rows={2} {...p} value={e.playlist!.note} onChange={(x) => set(i, { playlist: { ...e.playlist!, note: x.target.value } })} />}
                  </Field>
                  <Field label="Odkaz na Spotify" path={`${i}.playlist.url`} errors={ed.errors} hint="Odkaz na spoločný playlist, aj s časťou „pt=“, inak hostia nepridajú pesničky.">
                    {(p) => <input className="adm-input" type="url" {...p} value={e.playlist!.url} onChange={(x) => set(i, { playlist: { ...e.playlist!, url: x.target.value } })} />}
                  </Field>
                  <button type="button" className="adm-linkbtn" onClick={() => set(i, { playlist: undefined })}>
                    Odstrániť playlist
                  </button>
                </fieldset>
              ) : (
                <button
                  type="button"
                  className="adm-linkbtn"
                  onClick={() => set(i, { playlist: { title: "Spoločný playlist", note: "", label: "Pridať pesničky", url: "" } })}
                >
                  <Icon name="plus" size={16} />
                  Pridať playlist
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
      {items.length < L.programme && (
        <button
          type="button"
          className="adm-add"
          onClick={() =>
            ed.setValue([...items, { id: newId(), title: "", time: null, place: "Stodola Zlatník", description: "", drawing: "music-notes", tint: ["sage", "butter"] }])
          }
        >
          <Icon name="plus" />
          Pridať chvíľu
        </button>
      )}
      <SaveBar k="programme" {...ed} updatedAt={updatedAt} preview="/#program" />
    </>
  );
}

// ---- requests ----

export function RequestsEditor({ initial, updatedAt }: { initial: RequestsContent; updatedAt: string | null }) {
  const ed = useEditor("requests", initial);
  const { intro, items } = ed.value;
  const setItems = (next: Request[]) => ed.setValue({ intro, items: next });
  const set = (i: number, patch: Partial<Request>) => setItems(items.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <>
      <div className="adm-panel adm-panel--form">
        <Field label="Úvodná veta pod nadpisom" path="intro" errors={ed.errors} count={intro.length} max={L.intro}>
          {(p) => <textarea className="adm-input" rows={2} {...p} value={intro} onChange={(x) => ed.setValue({ intro: x.target.value, items })} />}
        </Field>
      </div>
      <ol className="adm-items">
        {items.map((r, i) => (
          <li className="adm-item" key={r.id}>
            <div className="adm-item__aside">
              <PicturePick value={r.drawing} tint={r.tint} onChange={(drawing) => set(i, { drawing })} />
              <TintPick value={r.tint} onChange={(tint) => set(i, { tint })} />
            </div>
            <div className="adm-item__main">
              <div className="adm-item__head">
                <span className="adm-item__time">{r.when || "Kedy?"}</span>
                <ItemTools
                  index={i}
                  total={items.length}
                  label={r.title || "prosba"}
                  onMove={(to) => setItems(move(items, i, to))}
                  onRemove={() => setItems(items.filter((_, j) => j !== i))}
                />
              </div>
              <div className="adm-form__row">
                <Field label="Nadpis" path={`${i}.title`} errors={ed.errors} count={r.title.length} max={L.title}>
                  {(p) => <input className="adm-input adm-input--strong" {...p} value={r.title} onChange={(x) => set(i, { title: x.target.value })} />}
                </Field>
                <Field label="Kedy" path={`${i}.when`} errors={ed.errors} hint="Napríklad „Počas obradu“">
                  {(p) => <input className="adm-input" {...p} value={r.when} maxLength={L.when} onChange={(x) => set(i, { when: x.target.value })} />}
                </Field>
              </div>
              <Field label="Text" path={`${i}.text`} errors={ed.errors} count={r.text.length} max={L.text}>
                {(p) => <textarea className="adm-input" rows={3} {...p} value={r.text} onChange={(x) => set(i, { text: x.target.value })} />}
              </Field>
            </div>
          </li>
        ))}
      </ol>
      {items.length < L.requests && (
        <button
          type="button"
          className="adm-add"
          onClick={() => setItems([...items, { id: newId(), when: "", title: "", text: "", drawing: "polaroids", tint: ["peony", "butter"] }])}
        >
          <Icon name="plus" />
          Pridať prosbu
        </button>
      )}
      <p className="adm-field__hint adm-hint-wide">Na webe sa prosby ukazujú vedľa seba, najlepšie vyzerajú tri.</p>
      <SaveBar k="requests" {...ed} updatedAt={updatedAt} preview="/#prosby" />
    </>
  );
}

// ---- FAQ ----

export function FaqEditor({ initial, updatedAt }: { initial: Question[]; updatedAt: string | null }) {
  // Questions have no id of their own; keep a stable key per row while editing.
  const [keys, setKeys] = useState(() => initial.map(() => newId()));
  const ed = useEditor("faq", initial);
  const items = ed.value;
  const set = (i: number, patch: Partial<Question>) => ed.setValue(items.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const missing = items.filter((q) => !q.answer).length;

  return (
    <>
      {missing > 0 && (
        <p className="adm-notice adm-notice--info">
          {missing} {missing === 1 ? "otázka nemá" : missing <= 4 ? "otázky nemajú" : "otázok nemá"} odpoveď. Hostia pri nich uvidia „Odpoveď doplníme.“
        </p>
      )}
      <ol className="adm-items adm-items--compact">
        {items.map((q, i) => (
          <li className="adm-item adm-item--plain" key={keys[i]}>
            <div className="adm-item__main">
              <div className="adm-item__head">
                <span className={q.answer ? "adm-status adm-status--coming" : "adm-status adm-status--waiting"}>{q.answer ? "S odpoveďou" : "Bez odpovede"}</span>
                <ItemTools
                  index={i}
                  total={items.length}
                  label={q.question || "otázka"}
                  onMove={(to) => (ed.setValue(move(items, i, to)), setKeys(move(keys, i, to)))}
                  onRemove={() => (ed.setValue(items.filter((_, j) => j !== i)), setKeys(keys.filter((_, j) => j !== i)))}
                />
              </div>
              <Field label="Otázka" path={`${i}.question`} errors={ed.errors} count={q.question.length} max={L.question}>
                {(p) => <input className="adm-input adm-input--strong" {...p} value={q.question} onChange={(x) => set(i, { question: x.target.value })} />}
              </Field>
              <Field label="Odpoveď" path={`${i}.answer`} errors={ed.errors} count={(q.answer ?? "").length} max={L.answer}>
                {(p) => <textarea className="adm-input" rows={3} {...p} value={q.answer ?? ""} onChange={(x) => set(i, { answer: x.target.value || null })} />}
              </Field>
            </div>
          </li>
        ))}
      </ol>
      {items.length < L.faq && (
        <button type="button" className="adm-add" onClick={() => (ed.setValue([...items, { question: "", answer: null }]), setKeys([...keys, newId()]))}>
          <Icon name="plus" />
          Pridať otázku
        </button>
      )}
      <SaveBar k="faq" {...ed} updatedAt={updatedAt} preview="/#otazky" />
    </>
  );
}

// ---- details ----

export function DetailsEditor({ initial, updatedAt, weddingDay }: { initial: Details; updatedAt: string | null; weddingDay: string }) {
  const ed = useEditor("details", initial);
  const d = ed.value;
  const set = (patch: Partial<Details>) => ed.setValue({ ...d, ...patch });

  return (
    <>
      <div className="adm-panel adm-panel--form">
        <h2 className="adm-form__title">Odpovede hostí</h2>
        <Field label="Termín na odpovede" path="deadline" errors={ed.errors} hint="Po tomto dni sa formulár zatvorí. Ukazuje sa aj v pozvánke na odpoveď.">
          {(p) => <input className="adm-input adm-input--date" type="date" max={weddingDay} {...p} value={d.deadline ?? ""} onChange={(x) => set({ deadline: x.target.value || null })} />}
        </Field>
        <Field label="Kontakt pre hostí" path="contact" errors={ed.errors} hint="Telefón alebo e-mail na stránke s formulárom, pre tých, čo radšej zavolajú.">
          {(p) => <input className="adm-input" {...p} value={d.contact ?? ""} maxLength={L.contact} onChange={(x) => set({ contact: x.target.value || null })} />}
        </Field>
      </div>
      <div className="adm-panel adm-panel--form">
        <h2 className="adm-form__title">Miesta</h2>
        <div className="adm-form__row">
          <Field label="Čas obradu (panel Sobáš)" path="churchTime" errors={ed.errors}>
            {(p) => <input className="adm-input" type="time" {...p} value={d.churchTime ?? ""} onChange={(x) => set({ churchTime: x.target.value || null })} />}
          </Field>
          <Field label="Začiatok oslavy (panel Oslava)" path="venueTime" errors={ed.errors}>
            {(p) => <input className="adm-input" type="time" {...p} value={d.venueTime ?? ""} onChange={(x) => set({ venueTime: x.target.value || null })} />}
          </Field>
        </div>
        <p className="adm-field__hint">Čas sobáša v kalendári hostí sa berie z prvej chvíle v Programe.</p>
      </div>
      <SaveBar k="details" {...ed} updatedAt={updatedAt} preview="/rsvp" />
    </>
  );
}
