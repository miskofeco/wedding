import type { CSSProperties } from "react";
import { getSiteContent } from "@/lib/content";
import { art } from "@/lib/art";
import { tie } from "@/lib/format";
import { Drawing } from "../Drawing";
import { Tint } from "../Tint";
import { Write } from "../Write";

// Each request reveals as one (drawing stamps, text rises 90 ms after it); requests that enter together
// follow each other 110 ms apart (data-rv-stagger).
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** A few friendly requests, told in the order of the day, between the places and the map that leads to them. */
export async function Requests() {
  const { requests, requestsIntro } = await getSiteContent();
  return (
    <section className="asks" id="prosby" aria-labelledby="asks-h">
      <div className="wrap">
        <header className="asks__head" data-rv-group="">
          <h2 id="asks-h" className="rv rv--write">
            <Write text="Pár prosieb" />
          </h2>
          <Drawing className="sprig rv rv--ink" src={art("rose-border", "black")} style={d(800)} />
          <p className="lead rv rv--write" style={d(650)}>
            <Write mode="prose" text={tie(requestsIntro)} />
          </p>
        </header>
        <ol className="asks__list" data-rv-stagger="110">
          {requests.map((r) => (
            <li className="ask" key={r.id} data-rv-group="" data-rv-threshold="0.25">
              <Tint className="ask__art" src={art(r.drawing, "black")} c={r.tint[0]} c2={r.tint[1]} />
              <p className="ask__when rv rv--brush" style={d(1300)}>
                {tie(r.when)}
              </p>
              <h3 className="rv rv--write" style={d(1500)}>
                <Write text={tie(r.title)} budget={900} />
              </h3>
              <p className="ask__text rv rv--write" style={d(2300)}>
                <Write mode="prose" text={tie(r.text)} budget={1300} />
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
