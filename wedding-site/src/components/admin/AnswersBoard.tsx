"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { StoredAnswer } from "@/lib/sheet";
import { AnswerEditor } from "./AnswerEditor";
import { DeleteAnswer } from "./DeleteAnswer";
import { formatStamp } from "./format";

type Filter = "all" | "yes" | "no" | "diet";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Všetky" },
  { id: "yes", label: "Prídu" },
  { id: "no", label: "Neprídu" },
  { id: "diet", label: "So stravou" },
];

/** 1 odpoveď, 2–4 odpovede, 5+ odpovedí */
const answersWord = (n: number) => (n === 1 ? "odpoveď" : n >= 2 && n <= 4 ? "odpovede" : "odpovedí");

const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export function AnswersBoard({ answers }: { answers: StoredAnswer[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<string | null>(null);

  const sorted = useMemo(() => [...answers].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)), [answers]);
  const coming = sorted.filter((a) => a.attending);
  const stats = [
    { label: "Prídu (domácnosti)", value: coming.length, c: "sage" },
    { label: "Počet hostí", value: coming.reduce((n, a) => n + a.guests, 0), c: "butter" },
    { label: "Z toho detí", value: coming.reduce((n, a) => n + (a.kids ?? []).filter(Boolean).length, 0), c: "linen" },
    { label: "Neprídu (domácnosti)", value: sorted.length - coming.length, c: "peony" },
    { label: "So stravou alebo alergiou", value: coming.filter((a) => a.dietary).length, c: "ivory" },
  ];

  const visible = sorted.filter((a) => {
    if (filter === "yes" && !a.attending) return false;
    if (filter === "no" && a.attending) return false;
    if (filter === "diet" && !(a.attending && a.dietary)) return false;
    if (!query.trim()) return true;
    const q = fold(query.trim());
    return fold(`${a.name} ${(a.party ?? []).join(" ")} ${a.dietary} ${a.message}`).includes(q);
  });
  const kitchen = coming.filter((a) => a.dietary);

  return (
    <div className="board">
      <ul className="stats" aria-label="Súhrn">
        {stats.map((s) => (
          <li key={s.label} className="stat" style={{ "--c": `var(--${s.c})` } as CSSProperties}>
            <span className="stat__value">{s.value}</span>
            <span className="stat__label">{s.label}</span>
          </li>
        ))}
      </ul>

      <div className="toolbar">
        <div className="field toolbar__search">
          <label htmlFor="search" className="sr-only">
            Hľadať
          </label>
          <input
            id="search"
            type="search"
            placeholder="Hľadať meno, stravu alebo odkaz"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="toolbar__filters" role="group" aria-label="Filter">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              className="filter"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--solid admin-btn" onClick={() => setEditing("new")} disabled={editing === "new"}>
          Pridať odpoveď
        </button>
      </div>

      {editing === "new" && (
        <div className="admin-panel">
          <h2 className="admin-panel__title">Nová odpoveď</h2>
          <p className="field__hint">Pre hostí, ktorí odpovedali telefonicky alebo osobne.</p>
          <AnswerEditor onDone={() => setEditing(null)} />
        </div>
      )}

      <p className="board__count" aria-live="polite">
        {visible.length === sorted.length
          ? `${sorted.length} ${answersWord(sorted.length)}`
          : `Zobrazené: ${visible.length} z ${sorted.length}`}
      </p>

      {sorted.length === 0 ? (
        <div className="admin-empty">
          <h2>Zatiaľ žiadne odpovede</h2>
          <p>Keď hostia odpovedia cez formulár, objavia sa tu aj v tabuľke.</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="admin-empty">Tomuto hľadaniu nič nezodpovedá.</p>
      ) : (
        <table className="answers">
          <thead>
            <tr>
              <th scope="col">Meno</th>
              <th scope="col">Účasť</th>
              <th scope="col" className="num">
                Hostí
              </th>
              <th scope="col">Strava a alergie</th>
              <th scope="col">Odkaz</th>
              <th scope="col">Prijaté</th>
              <th scope="col">
                <span className="sr-only">Akcie</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) =>
              editing === a.id ? (
                <tr key={a.id} className="answers__edit">
                  <td colSpan={7}>
                    <p className="admin-panel__title">Upraviť: {a.name}</p>
                    <AnswerEditor answer={a} onDone={() => setEditing(null)} />
                  </td>
                </tr>
              ) : (
                <tr key={a.id}>
                  <th scope="row" data-label="Meno">
                    {a.name}
                    {a.source === "admin" && <span className="tag">pridané ručne</span>}
                    {a.attending && (a.party ?? []).length > 1 && (
                      <span className="party-names">
                        s: {(a.party ?? []).slice(1).map((g, i) => (a.kids?.[i + 1] ? `${g} (dieťa)` : g)).join(", ")}
                      </span>
                    )}
                  </th>
                  <td data-label="Účasť">
                    <span className={a.attending ? "badge badge--yes" : "badge badge--no"}>{a.attending ? "Príde" : "Nepríde"}</span>
                  </td>
                  <td data-label="Hostí" className="num">
                    {a.attending ? a.guests : "–"}
                  </td>
                  <td data-label="Strava" className="clip">
                    {a.dietary || <span className="soft">–</span>}
                  </td>
                  <td data-label="Odkaz" className="clip">
                    {a.message || <span className="soft">–</span>}
                  </td>
                  <td data-label="Prijaté" className="stamp">
                    <span>
                      {formatStamp(a.submittedAt)}
                      {a.updatedAt && a.updatedAt !== a.submittedAt && " · upravené"}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button type="button" className="link-btn" onClick={() => setEditing(a.id)}>
                      Upraviť<span className="sr-only"> odpoveď {a.name}</span>
                    </button>
                    <DeleteAnswer id={a.id} name={a.name} />
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}

      {kitchen.length > 0 && (
        <section className="kitchen" aria-labelledby="kitchen-h">
          <h2 id="kitchen-h">Pre kuchyňu</h2>
          <p className="field__hint">Hostia, ktorí prídu a uviedli stravu alebo alergiu.</p>
          <ul>
            {kitchen.map((a) => (
              <li key={a.id}>
                <strong>{a.name}</strong> <span className="soft">({a.guests})</span>
                <span>{a.dietary}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
