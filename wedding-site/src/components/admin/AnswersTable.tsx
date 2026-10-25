"use client";

import { useMemo, useState } from "react";
import { removeAnswer } from "@/app/admin/actions";
import { initialAdminState } from "@/lib/admin";
import { fold, type Invite, type StoredAnswer } from "@/lib/records";
import { AnswerEditor } from "./AnswerEditor";
import { ConfirmDelete } from "./ConfirmDelete";
import { Drawer } from "./Drawer";
import { formatShort, formatStamp, plural } from "./format";
import { Icon } from "./Icon";
import { SortHeader, type Sort } from "./SortHeader";

type Filter = "all" | "yes" | "no" | "diet" | "kids" | "note" | "unlinked";
type Key = "name" | "guests" | "submitted";

interface Props {
  answers: StoredAnswer[];
  invites: Invite[];
  inviteOf: Record<string, string>;
  linkedBy: Record<string, "manual" | "name">;
  /** Open this answer (from ?id=) or a new one (?nova=1) on load. */
  initialOpen: string | null;
}

const kidsOf = (a: StoredAnswer) => a.kids.filter(Boolean).length;

export function AnswersTable({ answers, invites, inviteOf, linkedBy, initialOpen }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort<Key>>({ key: "submitted", dir: "desc" });
  const [open, setOpen] = useState<string | null>(initialOpen);
  const [editing, setEditing] = useState(initialOpen === "new");
  const inviteName = useMemo(() => new Map(invites.map((i) => [i.id, i.household])), [invites]);

  const filters: { id: Filter; label: string; test: (a: StoredAnswer) => boolean }[] = [
    { id: "all", label: "Všetky", test: () => true },
    { id: "yes", label: "Prídu", test: (a) => a.attending },
    { id: "no", label: "Neprídu", test: (a) => !a.attending },
    { id: "diet", label: "Strava", test: (a) => a.attending && a.dietary !== "" },
    { id: "kids", label: "S deťmi", test: (a) => a.attending && kidsOf(a) > 0 },
    { id: "note", label: "S odkazom", test: (a) => a.message !== "" },
    ...(invites.length ? [{ id: "unlinked" as const, label: "Bez pozvánky", test: (a: StoredAnswer) => !inviteOf[a.id] }] : []),
  ];

  const visible = useMemo(() => {
    const f = filters.find((x) => x.id === filter)?.test ?? (() => true);
    const q = fold(query);
    const rows = answers.filter(
      (a) => f(a) && (!q || fold(`${a.name} ${a.party.join(" ")} ${a.dietary} ${a.message} ${inviteName.get(inviteOf[a.id]) ?? ""}`).includes(q)),
    );
    const dir = sort.dir === "asc" ? 1 : -1;
    return rows.sort((a, b) => {
      if (sort.key === "name") return dir * a.name.localeCompare(b.name, "sk");
      if (sort.key === "guests") return dir * ((a.attending ? a.guests : -1) - (b.attending ? b.guests : -1));
      return dir * a.submittedAt.localeCompare(b.submittedAt);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, filter, query, sort, inviteOf, inviteName]);

  const current = open && open !== "new" ? answers.find((a) => a.id === open) : undefined;
  const close = () => {
    setOpen(null);
    setEditing(false);
  };

  return (
    <>
      <div className="adm-toolbar">
        <label className="adm-search">
          <Icon name="search" />
          <span className="sr-only">Hľadať</span>
          <input type="search" placeholder="Hľadať meno, stravu, odkaz…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="adm-chips" role="group" aria-label="Filter">
          {filters.map((f) => (
            <button key={f.id} type="button" className="adm-chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
              <span className="adm-chip__count">{answers.filter(f.test).length}</span>
            </button>
          ))}
        </div>
        <div className="adm-toolbar__end">
          <a className="adm-btn" href="/admin/export/odpovede" download>
            <Icon name="download" />
            CSV
          </a>
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => (setOpen("new"), setEditing(true))}>
            <Icon name="plus" />
            Pridať odpoveď
          </button>
        </div>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <caption className="sr-only">
            Odpovede hostí, {visible.length} z {answers.length}
          </caption>
          <thead>
            <tr>
              <SortHeader label="Meno" k="name" sort={sort} onSort={setSort} />
              <th scope="col">Účasť</th>
              <SortHeader label="Hostia" k="guests" sort={sort} onSort={setSort} num />
              {invites.length > 0 && <th scope="col">Pozvánka</th>}
              <th scope="col">Strava a alergie</th>
              <th scope="col">Odkaz</th>
              <SortHeader label="Prijaté" k="submitted" sort={sort} onSort={setSort} />
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => {
              const kids = kidsOf(a);
              return (
                <tr key={a.id} onClick={() => setOpen(a.id)} aria-selected={open === a.id || undefined}>
                  <th scope="row">
                    <button type="button" className="adm-rowlink" onClick={(e) => (e.stopPropagation(), setOpen(a.id))}>
                      {a.name}
                    </button>
                    {a.attending && a.party.length > 1 && <span className="adm-cell__sub">s {a.party.slice(1).join(", ")}</span>}
                  </th>
                  <td data-label="Účasť">
                    <span className={`adm-status adm-status--${a.attending ? "coming" : "declined"}`}>{a.attending ? "Príde" : "Nepríde"}</span>
                  </td>
                  <td className="adm-num" data-label="Hostia">
                    {a.attending ? (
                      <>
                        {a.guests}
                        {kids > 0 && <span className="adm-cell__sub">{kids} {plural(kids, ["dieťa", "deti", "detí"])}</span>}
                      </>
                    ) : (
                      <span className="adm-muted">–</span>
                    )}
                  </td>
                  {invites.length > 0 && (
                    <td data-label="Pozvánka">
                      {inviteOf[a.id] ? (
                        <>
                          {inviteName.get(inviteOf[a.id])}
                          {linkedBy[a.id] === "name" && <span className="adm-cell__sub">podľa mena</span>}
                        </>
                      ) : (
                        <span className="adm-flag">Nepriradená</span>
                      )}
                    </td>
                  )}
                  <td className="adm-clip" data-label="Strava">
                    {a.dietary ? <span className="adm-clamp">{a.dietary}</span> : <span className="adm-muted">–</span>}
                  </td>
                  <td className="adm-clip" data-label="Odkaz">
                    {a.message ? <span className="adm-clamp">{a.message}</span> : <span className="adm-muted">–</span>}
                  </td>
                  <td className="adm-stamp" data-label="Prijaté">
                    <span title={formatStamp(a.submittedAt)}>{formatShort(a.submittedAt)}</span>
                    {a.source === "admin" && <span className="adm-cell__sub">ručne</span>}
                    {a.sheetPending && <span className="adm-dot adm-dot--waiting" title="Čaká na zápis do tabuľky Google" />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {answers.length === 0 ? (
          <div className="adm-empty">
            <h2>Zatiaľ žiadne odpovede</h2>
            <p>Keď hostia odpovedia cez formulár na webe, objavia sa tu aj v tabuľke Google. Odpovede po telefóne pridajte tlačidlom „Pridať odpoveď“.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="adm-empty">
            <p>Tomuto hľadaniu nič nezodpovedá.</p>
            <button type="button" className="adm-btn" onClick={() => (setQuery(""), setFilter("all"))}>
              Zrušiť filter
            </button>
          </div>
        ) : null}
      </div>

      <Drawer
        open={open !== null && (open === "new" || current !== undefined)}
        onClose={close}
        title={open === "new" ? "Nová odpoveď" : current?.name ?? ""}
        sub={
          open === "new"
            ? "Pre hostí, ktorí odpovedali telefonicky alebo osobne."
            : current && `${current.source === "admin" ? "Pridané ručne" : "Z webu"} · ${formatStamp(current.submittedAt)}`
        }
      >
        {open === "new" ? (
          <AnswerEditor invites={invites} onDone={close} />
        ) : current && editing ? (
          <AnswerEditor answer={current} invites={invites} inviteId={inviteOf[current.id]} onDone={() => setEditing(false)} />
        ) : current ? (
          <div className="adm-detail">
            <dl className="adm-dl">
              <div>
                <dt>Účasť</dt>
                <dd>
                  <span className={`adm-status adm-status--${current.attending ? "coming" : "declined"}`}>
                    {current.attending ? "Príde" : "Nepríde"}
                  </span>
                </dd>
              </div>
              {current.attending && (
                <div>
                  <dt>Hostia ({current.guests})</dt>
                  <dd>
                    <ol className="adm-namelist">
                      {current.party.map((n, i) => (
                        <li key={i}>
                          {n}
                          {current.kids[i] && <span className="adm-tag">dieťa</span>}
                        </li>
                      ))}
                    </ol>
                  </dd>
                </div>
              )}
              {current.attending && (
                <div>
                  <dt>Strava a alergie</dt>
                  <dd>{current.dietary || <span className="adm-muted">Nič neuviedli</span>}</dd>
                </div>
              )}
              <div>
                <dt>Odkaz</dt>
                <dd className="adm-pre">{current.message || <span className="adm-muted">Bez odkazu</span>}</dd>
              </div>
              <div>
                <dt>Pozvánka</dt>
                <dd>
                  {inviteOf[current.id] ? (
                    <>
                      {inviteName.get(inviteOf[current.id])}{" "}
                      <span className="adm-muted">({linkedBy[current.id] === "manual" ? "priradená ručne" : "podľa mena"})</span>
                    </>
                  ) : (
                    <span className="adm-muted">Nepriradená</span>
                  )}
                </dd>
              </div>
              {current.updatedAt && current.updatedAt !== current.submittedAt && (
                <div>
                  <dt>Upravené</dt>
                  <dd>{formatStamp(current.updatedAt)}</dd>
                </div>
              )}
            </dl>
            <div className="adm-form__actions">
              <button type="button" className="adm-btn adm-btn--primary" onClick={() => setEditing(true)}>
                <Icon name="edit" />
                Upraviť
              </button>
              <ConfirmDelete id={current.id} what={`odpoveď ${current.name}`} action={removeAnswer} initial={initialAdminState} onDone={close} />
            </div>
          </div>
        ) : null}
      </Drawer>

    </>
  );
}
