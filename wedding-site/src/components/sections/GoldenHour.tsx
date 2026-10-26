import type { CSSProperties } from "react";
import { lightIntro, lightMoments, lightPhases, lightTips, sunDay } from "@/content";
import { art } from "@/lib/art";
import { tie } from "@/lib/format";
import { clock } from "@/lib/sun";
import { SunLive } from "../SunLive";
import { Tint } from "../Tint";
import { Write } from "../Write";

const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k: string) => values[k]);
const celsius = (n: number) => Math.round(n).toLocaleString("sk-SK");

/**
 * „Zlatá hodina v Zlatníku“: the light on the wedding evening at the barn, from real data (content/sun.ts). The
 * sky is the evening to scale, one flat palette field per phase of light; the sun walks the page's dashed road
 * and sets behind the real hill. Between the palette and the night's stay.
 */
export function GoldenHour() {
  const e = sunDay.events;
  const lead = fill(lightIntro.lead, { sunset: clock(e.sunset.at), hill: clock(Math.round(e.behindHill.at / 5) * 5) });
  const where = fill(lightIntro.where, { azimuth: String(Math.round(e.sunset.azimuth)) });
  const values = { at22: celsius(sunDay.evening.at22.median), low22: celsius(sunDay.evening.at22.low), moon: clock(sunDay.moonrise.at) };

  const moments = (
    <ol className="wrap moments" data-rv-stagger="60">
      {lightMoments.map((m) => (
        <li key={m.at} className="moment rv">
          <i style={{ "--c": `var(--${m.colour})` } as CSSProperties} aria-hidden="true" />
          <b>{m.at === "behindHill" ? `≈ ${clock(Math.round(sunDay.events[m.at].at / 5) * 5)}` : clock(sunDay.events[m.at].at)}</b>
          <span>{tie(fill(m.text, values))}</span>
        </li>
      ))}
    </ol>
  );

  return (
    <section className="gold" id="zlata-hodina" aria-labelledby="gold-h">
      <div className="wrap gold__head" data-rv-group="">
        <h2 id="gold-h" className="rv rv--write">
          <Write text={lightIntro.title} />
        </h2>
        <p className="lead rv rv--write" style={{ "--d": "400ms" } as CSSProperties}>
          <Write mode="prose" text={tie(lead)} />
        </p>
      </div>

      <SunLive day={sunDay} phases={lightPhases} sliderLabel={lightIntro.slider} moments={moments} lantern={art("lantern", "white")}>
        <div data-rv-group="">
          <h3 className="rv rv--write">
            <Write text={lightIntro.whereTitle} />
          </h3>
          <p className="rv rv--write" style={{ "--d": "350ms" } as CSSProperties}>
            <Write mode="prose" text={tie(where)} />
          </p>
        </div>
        <ul className="tips" data-rv-stagger="110">
          {lightTips.map((t) => (
            <li key={t.title} className="tip rv">
              <Tint src={art(t.drawing, "black")} c={t.tint[0]} c2={t.tint[1]} />
              <div className="rv rv--write" style={{ "--d": "300ms" } as CSSProperties}>
                <h4>
                  <Write text={tie(t.title)} />
                </h4>
                <p>
                  <Write mode="prose" text={tie(fill(t.text, values))} start={250} />
                </p>
              </div>
            </li>
          ))}
        </ul>
      </SunLive>

      <p className="wrap gold__src">
        Poloha slnka vypočítaná podľa NOAA pre Stodolu Zlatník v letnom čase, časy súhlasia so sunrise-sunset.org
        a&nbsp;U.&nbsp;S. Naval Observatory. Kopec: výškový model Copernicus cez Open-Meteo, odhad ±10&nbsp;minút. Počasie:
        ERA5 cez Open-Meteo, {sunDay.evening.evenings} večerov od 26.&nbsp;5. do 1.&nbsp;6. v rokoch {sunDay.evening.years}
        {sunDay.evening.skipped && ` okrem ${sunDay.evening.skipped}`}. Pôdorys stodoly: ©{" "}
        <a className="link" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          prispievatelia OpenStreetMap
          <span className="sr-only"> (otvorí sa v novom okne)</span>
        </a>
        .
      </p>
    </section>
  );
}
