import type { CSSProperties } from "react";
import { stays } from "@/content";
import { art } from "@/lib/art";
import { formatKm, tie } from "@/lib/format";
import { Drawing } from "../Drawing";
import { Write } from "../Write";

// Each stop waits for the road, which draws with scroll and ends at 70 % of the viewport:
// its pin drops as the road reaches it and the card slides in 90 ms later.
const stop = { "data-rv-group": "", "data-rv-margin": "0px 0px -30% 0px", "data-rv-threshold": "0" };
const card = { "--d": "90ms" } as CSSProperties;

export function Stay() {
  return (
    <section className="stay" id="ubytovanie" aria-labelledby="stay-h">
      <div className="wrap stay__grid">
        <div className="stay__copy" data-rv-group="">
          <Drawing className="stay__lantern rv rv--ink" src={art("lantern", "white")} />
          <h2 id="stay-h" className="rv rv--write" style={{ "--d": "400ms" } as CSSProperties}>
            <Write text={tie("Cesta domov môže počkať")} />
          </h2>
          <p className="lead rv rv--write" style={{ "--d": "1050ms" } as CSSProperties}>
            <Write
              mode="prose"
              text={tie("Zábava potrvá do noci, a tak sme pre vás vybrali zopár miest na prespanie blízko stodoly. Ráno sa potom nikam neponáhľajte.")}
            />
          </p>
        </div>
        <ol className="stops">
          {stays.length > 0 ? (
            stays.map((s) => (
              <li className="stop" key={s.name} {...stop}>
                <span className="stop__pin rv" aria-hidden="true" />
                <div className="stop__card rv rv--right rv--brush" style={card}>
                  <h3>
                    <Write text={tie(s.name)} budget={600} start={200} />
                  </h3>
                  {s.address && <p className="stop__addr">{s.address}</p>}
                  {s.distanceKm !== null && <p className="stop__dist">{formatKm(s.distanceKm)} od Stodoly Zlatník</p>}
                  {s.note && <p>{tie(s.note)}</p>}
                  {s.url && (
                    <a className="link" href={s.url} target="_blank" rel="noopener noreferrer">
                      Webová stránka<span className="sr-only"> {s.name} (otvorí sa v novom okne)</span>
                    </a>
                  )}
                </div>
              </li>
            ))
          ) : (
            <li className="stop" {...stop}>
              <span className="stop__pin rv" aria-hidden="true" />
              <div className="stop__card rv rv--right rv--brush" style={card}>
                <h3>
                  <Write text="Miesta práve vyberáme" budget={600} start={200} />
                </h3>
                <p>Zoznam ubytovania so vzdialenosťou od stodoly a&nbsp;kontaktmi doplníme čoskoro.</p>
              </div>
            </li>
          )}
          <li className="stop stop--morning" {...stop}>
            <span className="stop__pin rv" aria-hidden="true" />
            <div className="stop__morning">
              <Drawing className="rv rv--ink" src={art("coffee", "white")} />
              <p className="rv rv--write" style={card}>
                <Write text="Ráno bez ponáhľania." pace={40} start={400} />
              </p>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
