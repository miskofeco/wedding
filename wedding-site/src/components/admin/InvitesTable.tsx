"use client";

import { useActionState, useMemo, useState } from "react";
import { removeInvite, toggleReminded } from "@/app/admin/actions";
import { initialInviteState } from "@/lib/admin";
import { fold, inviteStatus, SIDES, type Invite, type InviteStatus, type Side, type StoredAnswer } from "@/lib/records";
import { ConfirmDelete } from "./ConfirmDelete";
import { Drawer } from "./Drawer";
import { ago, formatDay, formatShort, plural } from "./format";
import { Icon } from "./Icon";
import { BulkInvites, InviteEditor } from "./InviteForms";
import { SortHeader, type Sort } from "./SortHeader";

type Status = InviteStatus | "all";
type Key = "household" | "expected" | "status";

interface Props {
  invites: Invite[];
  answers: StoredAnswer[];
  inviteOf: Record<string, string>;
  initialStatus: Status;
  couple: string;
  weddingDay: string;
  deadline: string | null;
  siteUrl: string | null;
}

const STATUS: Record<InviteStatus, string> = { coming: "Prídu", declined: "Neprídu", waiting: "Čakáme" };
const order: Record<InviteStatus, number> = { waiting: 0, coming: 1, declined: 2 };

const isEmail = (c: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);
const phoneDigits = (c: string) => (/^\+?[\d\s/()-]{6,}$/.test(c) ? c.replace(/[^\d+]/g, "") : null);

export function InvitesTable({ invites, answers, inviteOf, initialStatus, couple, weddingDay, deadline, siteUrl }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>(initialStatus);
  const [side, setSide] = useState<Side | "all">("all");
  const [sort, setSort] = useState<Sort<Key>>({ key: "status", dir: "asc" });
  const [open, setOpen] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit" | "remind">("view");

  const answersOf = useMemo(() => {
    const m = new Map<string, StoredAnswer[]>();
    for (const a of answers) {
      const id = inviteOf[a.id];
      if (id) m.set(id, [...(m.get(id) ?? []), a]);
    }
    return m;
  }, [answers, inviteOf]);
  const groups = useMemo(() => [...new Set(invites.map((i) => i.group).filter(Boolean))].sort((a, b) => a.localeCompare(b, "sk")), [invites]);
  const rows = useMemo(() => invites.map((i) => ({ invite: i, ...inviteStatus(answersOf.get(i.id)) })), [invites, answersOf]);

  const visible = useMemo(() => {
    const q = fold(query);
    const dir = sort.dir === "asc" ? 1 : -1;
    return rows
      .filter(
        (r) =>
          (status === "all" || r.status === status) &&
          (side === "all" || r.invite.side === side) &&
          (!q || fold(`${r.invite.household} ${r.invite.members.join(" ")} ${r.invite.group} ${r.invite.note}`).includes(q)),
      )
      .sort((a, b) => {
        if (sort.key === "expected") return dir * (a.invite.expected - b.invite.expected);
        if (sort.key === "status") return dir * (order[a.status] - order[b.status]) || a.invite.household.localeCompare(b.invite.household, "sk");
        return dir * a.invite.household.localeCompare(b.invite.household, "sk");
      });
  }, [rows, query, status, side, sort]);

  const count = (s: Status) => (s === "all" ? rows.length : rows.filter((r) => r.status === s).length);
  const current = open && open !== "new" && open !== "bulk" ? rows.find((r) => r.invite.id === open) : undefined;
  const close = () => {
    setOpen(null);
    setMode("view");
  };
  const link = siteUrl ?? (typeof window !== "undefined" ? window.location.origin : "");

  const message = (i: Invite) =>
    [
      `Ahoj${i.household ? `, ${i.household}` : ""}!`,
      `Budeme veľmi radi, ak nám dáte vedieť, či prídete na našu svadbu ${formatDay(weddingDay)}.`,
      `Odpoveď zaberie minútu: ${link}/rsvp${deadline ? ` (prosíme do ${formatDay(deadline)})` : ""}.`,
      couple,
    ].join(" ");

  return (
    <>
      <div className="adm-toolbar">
        <label className="adm-search">
          <Icon name="search" />
          <span className="sr-only">Hľadať</span>
          <input type="search" placeholder="Hľadať domácnosť, meno, skupinu…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="adm-chips" role="group" aria-label="Stav">
          {(["all", "waiting", "coming", "declined"] as Status[]).map((s) => (
            <button key={s} type="button" className="adm-chip" aria-pressed={status === s} onClick={() => setStatus(s)}>
              {s === "all" ? "Všetci" : STATUS[s]}
              <span className="adm-chip__count">{count(s)}</span>
            </button>
          ))}
        </div>
        <label className="adm-select">
          <span className="sr-only">Strana</span>
          <select value={side} onChange={(e) => setSide(e.target.value as Side | "all")}>
            <option value="all">Obe strany</option>
            {(Object.keys(SIDES) as Side[]).map((s) => (
              <option key={s} value={s}>
                {SIDES[s]}
              </option>
            ))}
          </select>
        </label>
        <div className="adm-toolbar__end">
          <a className="adm-btn" href="/admin/export/pozvani" download>
            <Icon name="download" />
            CSV
          </a>
          <button type="button" className="adm-btn" onClick={() => setOpen("bulk")}>
            Vložiť zoznam
          </button>
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setOpen("new")}>
            <Icon name="plus" />
            Pridať pozvánku
          </button>
        </div>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <caption className="sr-only">Pozvaní, {visible.length} z {rows.length}</caption>
          <thead>
            <tr>
              <SortHeader label="Domácnosť" k="household" sort={sort} onSort={setSort} />
              <th scope="col">Strana</th>
              <th scope="col">Skupina</th>
              <SortHeader label="Pozvaných" k="expected" sort={sort} onSort={setSort} num />
              <SortHeader label="Stav" k="status" sort={sort} onSort={setSort} />
              <th scope="col">Pripomenuté</th>
              <th scope="col">
                <span className="sr-only">Akcie</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ invite: i, status: st, coming }) => (
              <tr key={i.id} onClick={() => (setOpen(i.id), setMode("view"))}>
                <th scope="row">
                  <button type="button" className="adm-rowlink" onClick={(e) => (e.stopPropagation(), setOpen(i.id), setMode("view"))}>
                    {i.household}
                  </button>
                  {i.members.length > 0 && <span className="adm-cell__sub">{i.members.join(", ")}</span>}
                </th>
                <td data-label="Strana">
                  <span className={`adm-sidetag adm-sidetag--${i.side}`}>{SIDES[i.side]}</span>
                </td>
                <td data-label="Skupina">{i.group || <span className="adm-muted">–</span>}</td>
                <td className="adm-num" data-label="Pozvaných">
                  {i.expected}
                </td>
                <td data-label="Stav">
                  <span className={`adm-status adm-status--${st}`}>{STATUS[st]}</span>
                  {st === "coming" && coming !== i.expected && (
                    <span className="adm-cell__sub">
                      {coming} z {i.expected}
                    </span>
                  )}
                </td>
                <td className="adm-stamp" data-label="Pripomenuté">
                  {i.remindedAt ? formatShort(i.remindedAt) : <span className="adm-muted">–</span>}
                </td>
                <td className="adm-row-actions">
                  {st === "waiting" && (
                    <button
                      type="button"
                      className="adm-btn adm-btn--small"
                      onClick={(e) => (e.stopPropagation(), setOpen(i.id), setMode("remind"))}
                    >
                      <Icon name="bell" size={16} />
                      Pripomenúť<span className="sr-only"> {i.household}</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <div className="adm-empty">
            <h2>Zoznam pozvaných je prázdny</h2>
            <p>
              Pridajte domácnosti, ktoré pozývate. Odpovede z webu sa k nim priradia podľa mien a uvidíte, kto ešte neodpovedal. Celý zoznam
              vložíte naraz cez „Vložiť zoznam“.
            </p>
            <button type="button" className="adm-btn adm-btn--primary" onClick={() => setOpen("bulk")}>
              Vložiť zoznam
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="adm-empty">
            <p>Tomuto výberu nič nezodpovedá.</p>
            <button type="button" className="adm-btn" onClick={() => (setQuery(""), setStatus("all"), setSide("all"))}>
              Zrušiť filter
            </button>
          </div>
        ) : null}
      </div>

      <Drawer
        open={open === "new" || open === "bulk" || current !== undefined}
        onClose={close}
        title={open === "new" ? "Nová pozvánka" : open === "bulk" ? "Vložiť zoznam pozvaných" : current?.invite.household ?? ""}
        sub={
          current &&
          `${SIDES[current.invite.side]}${current.invite.group ? ` · ${current.invite.group}` : ""} · ${current.invite.expected} ${plural(current.invite.expected, ["osoba", "osoby", "osôb"])}`
        }
      >
        {open === "new" ? (
          <InviteEditor groups={groups} onDone={close} />
        ) : open === "bulk" ? (
          <BulkInvites groups={groups} onDone={close} />
        ) : current && mode === "edit" ? (
          <InviteEditor invite={current.invite} groups={groups} onDone={() => setMode("view")} />
        ) : current && mode === "remind" ? (
          <Reminder invite={current.invite} text={message(current.invite)} onBack={() => setMode("view")} />
        ) : current ? (
          <div className="adm-detail">
            <dl className="adm-dl">
              <div>
                <dt>Stav</dt>
                <dd>
                  <span className={`adm-status adm-status--${current.status}`}>{STATUS[current.status]}</span>
                  {current.status === "coming" && (
                    <span className="adm-muted">
                      {" "}
                      {current.coming} z {current.invite.expected}
                    </span>
                  )}
                </dd>
              </div>
              {current.invite.members.length > 0 && (
                <div>
                  <dt>Mená</dt>
                  <dd>{current.invite.members.join(", ")}</dd>
                </div>
              )}
              <div>
                <dt>Odpovede</dt>
                <dd>
                  {answersOf.get(current.invite.id)?.length ? (
                    <ul className="adm-namelist">
                      {answersOf.get(current.invite.id)!.map((a) => (
                        <li key={a.id}>
                          <a href={`/admin/odpovede?id=${a.id}`}>{a.name}</a>{" "}
                          <span className="adm-muted">
                            {a.attending ? `${a.guests} ${plural(a.guests, ["osoba", "osoby", "osôb"])}` : "nepríde"} · {ago(a.submittedAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="adm-muted">Zatiaľ žiadna</span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Kontakt</dt>
                <dd>{current.invite.contact || <span className="adm-muted">–</span>}</dd>
              </div>
              {current.invite.note && (
                <div>
                  <dt>Poznámka</dt>
                  <dd className="adm-pre">{current.invite.note}</dd>
                </div>
              )}
              <div>
                <dt>Pripomenuté</dt>
                <dd>{current.invite.remindedAt ? formatShort(current.invite.remindedAt) : <span className="adm-muted">Nie</span>}</dd>
              </div>
            </dl>
            <div className="adm-form__actions">
              <button type="button" className="adm-btn adm-btn--primary" onClick={() => setMode("edit")}>
                <Icon name="edit" />
                Upraviť
              </button>
              {current.status === "waiting" && (
                <button type="button" className="adm-btn" onClick={() => setMode("remind")}>
                  <Icon name="bell" />
                  Pripomenúť
                </button>
              )}
              <ConfirmDelete id={current.invite.id} what={`pozvánku ${current.invite.household}`} action={removeInvite} initial={initialInviteState} onDone={close} />
            </div>
          </div>
        ) : null}
      </Drawer>
    </>
  );
}

/** The reminder: a ready message to copy, or to open in SMS or e-mail, then mark as sent. */
function Reminder({ invite, text, onBack }: { invite: Invite; text: string; onBack: () => void }) {
  const [draft, setDraft] = useState(text);
  const [copied, setCopied] = useState(false);
  const [state, mark, pending] = useActionState(toggleReminded, initialInviteState);
  const phone = phoneDigits(invite.contact);
  const email = isEmail(invite.contact) ? invite.contact : null;

  return (
    <div className="adm-form">
      <div className="adm-field">
        <label htmlFor="remind-text">Správa</label>
        <textarea className="adm-input adm-input--tall" id="remind-text" rows={6} value={draft} onChange={(e) => setDraft(e.target.value)} />
        <p className="adm-field__hint">Upravte ju podľa seba. Odkaz vedie priamo na formulár.</p>
      </div>
      <div className="adm-form__actions">
        <button
          type="button"
          className="adm-btn adm-btn--primary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(draft);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          <Icon name={copied ? "check" : "copy"} />
          {copied ? "Skopírované" : "Kopírovať"}
        </button>
        {phone && (
          <a className="adm-btn" href={`sms:${phone}?&body=${encodeURIComponent(draft)}`}>
            <Icon name="phone" />
            SMS
          </a>
        )}
        {email && (
          <a className="adm-btn" href={`mailto:${email}?subject=${encodeURIComponent("Prídete na našu svadbu?")}&body=${encodeURIComponent(draft)}`}>
            <Icon name="message" />
            E-mail
          </a>
        )}
      </div>
      {!invite.contact && <p className="adm-field__hint">Pridajte kontakt v úprave pozvánky a ponúkne sa aj SMS alebo e-mail.</p>}
      <form action={mark} className="adm-form__actions adm-form__actions--split">
        <input type="hidden" name="id" value={invite.id} />
        <input type="hidden" name="reminded" value={invite.remindedAt ? "no" : "yes"} />
        <button type="submit" className="adm-btn" disabled={pending}>
          <Icon name="check" />
          {invite.remindedAt ? "Zrušiť označenie" : "Označiť ako pripomenuté"}
        </button>
        <button type="button" className="adm-btn adm-btn--ghost" onClick={onBack}>
          Späť
        </button>
        {state.status === "saved" && (
          <span className="adm-field__ok" role="status">
            Uložené
          </span>
        )}
        {state.status === "error" && (
          <span className="adm-field__error" role="alert">
            {state.message}
          </span>
        )}
      </form>
    </div>
  );
}
