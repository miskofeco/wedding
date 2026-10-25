import type { CSSProperties } from "react";
import { getSiteContent } from "@/lib/content";
import { art } from "@/lib/art";
import { tie } from "@/lib/format";
import { Drawing } from "../Drawing";
import { Tint } from "../Tint";

// Each request reveals as one (drawing stamps, text rises 90 ms after it); requests that enter together
// follow each other 110 ms apart (data-rv-stagger).
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** A few friendly requests, told in the order of the day, between the places and the map that leads to them. */
export async function Requests() {
  const { requests, requestsIntro } = await getSiteContent();
  return (
    <section className="asks" id="prosby" aria-labelledby="asks-h">
      <div className="wrap">
        <header className="asks__head rv">
          <h2 id="asks-h">Pár prosieb</h2>
          <Drawing className="sprig" src={art("rose-border", "black")} />
          <p className="lead">{tie(requestsIntro)}</p>
        </header>
        <ol className="asks__list" data-rv-stagger="110">
          {requests.map((r) => (
            <li className="ask" key={r.id} data-rv-group="" data-rv-threshold="0.25">
              <Tint className="ask__art" src={art(r.drawing, "black")} c={r.tint[0]} c2={r.tint[1]} />
              <p className="ask__when rv" style={d(90)}>
                {tie(r.when)}
              </p>
              <h3 className="rv" style={d(130)}>
                {tie(r.title)}
              </h3>
              <p className="ask__text rv" style={d(190)}>
                {tie(r.text)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
