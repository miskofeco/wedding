import Link from "next/link";
import { site } from "@/content";
import { readContent } from "@/lib/content";
import { daysUntil, inviteStatus, linkAnswers, repliesByDay } from "@/lib/records";
import { formatDay, plural, ago } from "@/components/admin/format";
import { Icon } from "@/components/admin/Icon";
import { Notice, PageHead } from "@/components/admin/PageHead";
import { RepliesChart } from "@/components/admin/RepliesChart";
import { SidesChart } from "@/components/admin/SidesChart";
import { loadBoard } from "../data";

/** The couple's first screen: where the replies stand, what is still missing, what changed lately. */
export default async function OverviewPage() {
  const board = await loadBoard();
  const { content } = await readContent();
  const s = board.summary;
  const deadline = content.details.deadline;
  const left = deadline ? daysUntil(deadline) : null;
  const replyRate = s.invitedHouseholds ? Math.round(((s.invitedHouseholds - s.waitingHouseholds) / s.invitedHouseholds) * 100) : null;
  const linked = linkAnswers(board.answers, board.invites);
  const waiting = board.invites.filter((i) => inviteStatus(linked.answersOf.get(i.id)).status === "waiting");

  const gaps = [
    ...(deadline ? [] : [{ href: "/admin/obsah/udaje", text: "Termín na odpovede nie je nastavený" }]),
    ...(content.details.contact ? [] : [{ href: "/admin/obsah/udaje", text: "Chýba kontakt pre hostí na stránke odpovede" }]),
    ...(content.details.churchTime ? [] : [{ href: "/admin/obsah/udaje", text: "Čas obradu na paneli Sobáš" }]),
    ...content.programme
      .filter((e) => !e.time && !e.relativeTime)
      .map((e) => ({ href: "/admin/obsah/program", text: `Čas v programe: ${e.title}` })),
    ...content.faq.filter((q) => !q.answer).map((q) => ({ href: "/admin/obsah/otazky", text: `Odpoveď: ${q.question}` })),
  ];

  return (
    <main className="adm-page">
      <PageHead
        title="Prehľad"
        sub={`${site.weekday[0].toUpperCase()}${site.weekday.slice(1)} ${formatDay(site.date)} · ${board.answers.length} ${plural(board.answers.length, ["odpoveď", "odpovede", "odpovedí"])}`}
      >
        <Link className="adm-btn adm-btn--primary" href="/admin/odpovede?nova=1">
          <Icon name="plus" />
          Pridať odpoveď
        </Link>
      </PageHead>

      {board.db !== "ok" && (
        <Notice>
          <strong>{board.db === "not_configured" ? "Databáza nie je pripojená." : "Databáza neodpovedá."}</strong>{" "}
          {board.db === "not_configured"
            ? "Nastavte TURSO_DATABASE_URL a TURSO_AUTH_TOKEN podľa README. Odpovede sa zatiaľ neukladajú."
            : "Údaje sa nepodarilo načítať. Skúste obnoviť stránku."}
        </Notice>
      )}

      <section className="adm-kpis" aria-label="Súhrn">
        <div className="adm-kpi adm-kpi--lead">
          <p className="adm-kpi__label">Prídu</p>
          <p className="adm-kpi__value">{s.guests}</p>
          <p className="adm-kpi__meta">
            {s.adults} {plural(s.adults, ["dospelý", "dospelí", "dospelých"])} · {s.kids} {plural(s.kids, ["dieťa", "deti", "detí"])}
          </p>
        </div>
        <div className="adm-kpi">
          <p className="adm-kpi__label">Odpovedalo</p>
          <p className="adm-kpi__value">
            {s.invitedHouseholds ? (
              <>
                {s.invitedHouseholds - s.waitingHouseholds}
                <span className="adm-kpi__of"> z {s.invitedHouseholds}</span>
              </>
            ) : (
              s.answers
            )}
          </p>
          {replyRate !== null ? (
            <div className="adm-meter" role="img" aria-label={`${replyRate} % pozvaných odpovedalo`}>
              <span style={{ width: `${replyRate}%` }} />
            </div>
          ) : (
            <p className="adm-kpi__meta">
              <Link href="/admin/pozvani">Pridajte zoznam pozvaných</Link> a uvidíte, kto chýba
            </p>
          )}
        </div>
        <div className="adm-kpi">
          <p className="adm-kpi__label">Čakáme na</p>
          <p className="adm-kpi__value">{s.waitingHouseholds}</p>
          <p className="adm-kpi__meta">
            {s.waitingHouseholds ? (
              <Link href="/admin/pozvani?stav=caka">
                {s.waitingPeople} {plural(s.waitingPeople, ["človek", "ľudia", "ľudí"])} bez odpovede
              </Link>
            ) : (
              "domácností"
            )}
          </p>
        </div>
        <div className="adm-kpi">
          <p className="adm-kpi__label">Termín odpovedí</p>
          {deadline && left !== null ? (
            <>
              <p className="adm-kpi__value">{left >= 0 ? left : "Po"}</p>
              <p className="adm-kpi__meta">
                {left >= 0 ? `${plural(left, ["deň", "dni", "dní"])} do ${formatDay(deadline)}` : `termíne ${formatDay(deadline)}`}
              </p>
            </>
          ) : (
            <>
              <p className="adm-kpi__value adm-kpi__value--muted">—</p>
              <p className="adm-kpi__meta">
                <Link href="/admin/obsah/udaje">Nastaviť termín</Link>
              </p>
            </>
          )}
        </div>
      </section>

      <div className="adm-grid">
        <section className="adm-panel adm-grid__wide" aria-labelledby="chart-h">
          <header className="adm-panel__head">
            <div>
              <h2 id="chart-h">Potvrdení hostia v čase</h2>
              <p className="adm-panel__sub">Súčet ľudí z odpovedí „áno“ podľa dňa odoslania</p>
            </div>
          </header>
          <RepliesChart days={repliesByDay(board.answers)} invited={s.invitedPeople} deadline={deadline} />
        </section>

        <section className="adm-panel" aria-labelledby="sides-h">
          <header className="adm-panel__head">
            <div>
              <h2 id="sides-h">Podľa strany</h2>
              <p className="adm-panel__sub">Ľudia, nie domácnosti</p>
            </div>
          </header>
          {s.invitedPeople + s.guests === 0 ? (
            <p className="adm-chart__empty">Zatiaľ nie sú pozvaní ani odpovede.</p>
          ) : (
            <SidesChart sides={s.sides} />
          )}
        </section>

        <section className="adm-panel" aria-labelledby="recent-h">
          <header className="adm-panel__head">
            <h2 id="recent-h">Posledné odpovede</h2>
            <Link className="adm-panel__link" href="/admin/odpovede">
              Všetky
              <Icon name="chevron" size={16} />
            </Link>
          </header>
          {board.answers.length === 0 ? (
            <p className="adm-chart__empty">Keď hostia odpovedia cez formulár, objavia sa tu.</p>
          ) : (
            <ul className="adm-feed">
              {board.answers.slice(0, 6).map((a) => (
                <li key={a.id}>
                  <span className={`adm-status adm-status--${a.attending ? "coming" : "declined"}`}>{a.attending ? "Áno" : "Nie"}</span>
                  <Link href={`/admin/odpovede?id=${a.id}`} className="adm-feed__name">
                    {a.name}
                  </Link>
                  <span className="adm-feed__meta">
                    {a.attending ? `${a.guests} ${plural(a.guests, ["osoba", "osoby", "osôb"])}` : "nepríde"} · {ago(a.submittedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="adm-panel" aria-labelledby="waiting-h">
          <header className="adm-panel__head">
            <h2 id="waiting-h">Ešte neodpovedali</h2>
            {waiting.length > 0 && (
              <Link className="adm-panel__link" href="/admin/pozvani?stav=caka">
                Pripomenúť
                <Icon name="chevron" size={16} />
              </Link>
            )}
          </header>
          {board.invites.length === 0 ? (
            <p className="adm-chart__empty">
              <Link href="/admin/pozvani">Pridajte pozvaných</Link>, aby ste videli, kto ešte neodpovedal.
            </p>
          ) : waiting.length === 0 ? (
            <p className="adm-chart__empty">Odpovedali všetci pozvaní.</p>
          ) : (
            <ul className="adm-feed">
              {waiting.slice(0, 6).map((i) => (
                <li key={i.id}>
                  <span className="adm-status adm-status--waiting">Čaká</span>
                  <span className="adm-feed__name">{i.household}</span>
                  <span className="adm-feed__meta">
                    {i.expected} {plural(i.expected, ["osoba", "osoby", "osôb"])}
                    {i.remindedAt ? ` · pripomenuté ${ago(i.remindedAt)}` : ""}
                  </span>
                </li>
              ))}
              {waiting.length > 6 && <li className="adm-feed__more">a ďalších {waiting.length - 6}</li>}
            </ul>
          )}
        </section>

        <section className="adm-panel" aria-labelledby="gaps-h">
          <header className="adm-panel__head">
            <h2 id="gaps-h">Na doplnenie na webe</h2>
            <Link className="adm-panel__link" href="/admin/obsah">
              Obsah webu
              <Icon name="chevron" size={16} />
            </Link>
          </header>
          {gaps.length === 0 ? (
            <p className="adm-chart__empty">Všetko podstatné je vyplnené.</p>
          ) : (
            <ul className="adm-todo">
              {gaps.slice(0, 8).map((g) => (
                <li key={g.text}>
                  <Link href={g.href}>{g.text}</Link>
                </li>
              ))}
              {gaps.length > 8 && <li className="adm-feed__more">a ďalších {gaps.length - 8}</li>}
            </ul>
          )}
        </section>

        <section className="adm-panel" aria-labelledby="kitchen-h">
          <header className="adm-panel__head">
            <h2 id="kitchen-h">Pre kuchyňu</h2>
            <Link className="adm-panel__link" href="/admin/zoznam#kuchyna">
              Zoznam
              <Icon name="chevron" size={16} />
            </Link>
          </header>
          <dl className="adm-facts">
            <div>
              <dt>Porcie pre dospelých</dt>
              <dd>{s.adults}</dd>
            </div>
            <div>
              <dt>Detské porcie</dt>
              <dd>{s.kids}</dd>
            </div>
            <div>
              <dt>Domácnosti so stravou alebo alergiou</dt>
              <dd>{s.diets}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
