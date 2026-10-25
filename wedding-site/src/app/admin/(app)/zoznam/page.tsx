import type { Metadata } from "next";
import { site } from "@/content";
import { peopleComing, SIDES } from "@/lib/records";
import { formatDay, plural } from "@/components/admin/format";
import { Icon } from "@/components/admin/Icon";
import { PageHead } from "@/components/admin/PageHead";
import { PrintButton } from "@/components/admin/PrintButton";
import { loadBoard } from "../../data";

export const metadata: Metadata = { title: "Hostia a kuchyňa" };

/** Everyone coming, one row per person, and the kitchen list: for the venue, the caterer and the seating plan. */
export default async function PeoplePage() {
  const board = await loadBoard();
  const s = board.summary;
  const people = peopleComing(board.answers, board.invites).sort(
    (a, b) => a.household.localeCompare(b.household, "sk") || Number(a.kid) - Number(b.kid),
  );
  const kitchen = board.answers.filter((a) => a.attending && a.dietary.trim() !== "").sort((a, b) => a.name.localeCompare(b.name, "sk"));

  return (
    <main className="adm-page adm-print">
      <PageHead title="Hostia a kuchyňa" sub={`Stav k ${formatDay(new Date().toISOString().slice(0, 10))} · svadba ${site.dateLabel}`}>
        <PrintButton />
      </PageHead>

      <section className="adm-strip" aria-label="Súhrn">
        <p>
          <strong>{s.guests}</strong> {plural(s.guests, ["hosť", "hostia", "hostí"])}
        </p>
        <p>
          <strong>{s.adults}</strong> {plural(s.adults, ["dospelý", "dospelí", "dospelých"])}
        </p>
        <p>
          <strong>{s.kids}</strong> {plural(s.kids, ["dieťa", "deti", "detí"])}
        </p>
        <p>
          <strong>{s.diets}</strong> so stravou alebo alergiou
        </p>
      </section>

      <section className="adm-panel adm-panel--flush" aria-labelledby="people-h">
        <header className="adm-panel__head">
          <h2 id="people-h">Všetci hostia</h2>
          <a className="adm-btn adm-btn--small adm-noprint" href="/admin/export/hostia" download>
            <Icon name="download" size={16} />
            CSV
          </a>
        </header>
        {people.length === 0 ? (
          <p className="adm-chart__empty">Zatiaľ nikto nepotvrdil účasť.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table adm-table--dense">
              <thead>
                <tr>
                  <th scope="col" className="adm-num">
                    #
                  </th>
                  <th scope="col">Meno</th>
                  <th scope="col">Vek</th>
                  <th scope="col">Domácnosť</th>
                  {board.invites.length > 0 && <th scope="col">Strana</th>}
                  {board.invites.length > 0 && <th scope="col">Skupina</th>}
                </tr>
              </thead>
              <tbody>
                {people.map((p, i) => (
                  <tr key={`${p.answerId}-${i}`}>
                    <td className="adm-num adm-muted" data-label="#">
                      {i + 1}
                    </td>
                    <th scope="row">{p.name}</th>
                    <td data-label="Vek">{p.kid ? <span className="adm-tag">dieťa</span> : "dospelý"}</td>
                    <td data-label="Domácnosť">{p.household}</td>
                    {board.invites.length > 0 && <td data-label="Strana">{p.side ? SIDES[p.side] : <span className="adm-muted">–</span>}</td>}
                    {board.invites.length > 0 && <td data-label="Skupina">{p.group || <span className="adm-muted">–</span>}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="adm-panel adm-panel--flush adm-break" id="kuchyna" aria-labelledby="kitchen-h">
        <header className="adm-panel__head">
          <div>
            <h2 id="kitchen-h">Pre kuchyňu</h2>
            <p className="adm-panel__sub">
              {s.adults} {plural(s.adults, ["porcia", "porcie", "porcií"])} pre dospelých, {s.kids} {plural(s.kids, ["detská", "detské", "detských"])}
            </p>
          </div>
          <a className="adm-btn adm-btn--small adm-noprint" href="/admin/export/kuchyna" download>
            <Icon name="download" size={16} />
            CSV
          </a>
        </header>
        {kitchen.length === 0 ? (
          <p className="adm-chart__empty">Nikto neuviedol stravu ani alergiu.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table adm-table--dense">
              <thead>
                <tr>
                  <th scope="col">Domácnosť</th>
                  <th scope="col" className="adm-num">
                    Ľudí
                  </th>
                  <th scope="col">Strava a alergie</th>
                </tr>
              </thead>
              <tbody>
                {kitchen.map((a) => {
                  const kids = a.kids.filter(Boolean).length;
                  return (
                    <tr key={a.id}>
                      <th scope="row">
                        {a.name}
                        {a.party.length > 1 && <span className="adm-cell__sub">s {a.party.slice(1).join(", ")}</span>}
                      </th>
                      <td className="adm-num" data-label="Ľudí">
                        {a.guests}
                        {kids > 0 && <span className="adm-cell__sub">{kids} {plural(kids, ["dieťa", "deti", "detí"])}</span>}
                      </td>
                      <td className="adm-pre" data-label="Strava">
                        {a.dietary}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
