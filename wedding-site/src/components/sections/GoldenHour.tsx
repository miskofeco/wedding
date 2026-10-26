import type { CSSProperties } from "react";
import { lightIntro, lightMoments, lightPhases, lightTips, sunDay, weather } from "@/content";
import { art } from "@/lib/art";
import { tie } from "@/lib/format";
import { clock } from "@/lib/sun";
import { Disclosure } from "../Disclosure";
import { SunLive } from "../SunLive";
import { Tint } from "../Tint";
import { Write } from "../Write";

const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k: string) => values[k]);
// the weather chart's scale, °C: every range of the day fits between
const WX_LO = 9;
const WX_HI = 26;
const wxY = (t: number) => ((WX_HI - t) / (WX_HI - WX_LO)) * 100;

/**
 * „Zlatá hodina v Zlatníku“: the light on the wedding evening at the barn, from real data (content/sun.ts). The
 * sky is the evening to scale, one flat palette field per phase of light; the sun walks the page's dashed road
 * and sets behind the real hill. Between the palette and the night's stay.
 */
export function GoldenHour() {
  const e = sunDay.events;
  const lead = fill(lightIntro.lead, { sunset: clock(e.sunset.at), hill: clock(Math.round(e.behindHill.at / 5) * 5) });
  const where = fill(lightIntro.where, { azimuth: String(Math.round(e.sunset.azimuth)) });
  const values = { moon: clock(sunDay.moonrise.at) };
  const wxRoad = weather.slots.map((w, n) => `${(n + 0.5) * 100},${wxY((w.lo + w.hi) / 2).toFixed(1)}`).join(" ");

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
        <div className="where__copy" data-rv-group="">
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
              <Tint className="sticker" src={art(t.drawing, "black")} c={t.tint[0]} c2={t.tint[1]} />
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

      {/* the day's weather: each time of day a capsule of its usual range on one scale, the evening cooling
          along the page's dashed road */}
      <div className="wrap wx">
        <div className="wx__copy" data-rv-group="">
          <h3 className="rv rv--write">
            <Write text={weather.title} />
          </h3>
          <p className="rv rv--write" style={{ "--d": "300ms" } as CSSProperties}>
            <Write mode="prose" text={tie(weather.lead)} />
          </p>
          <p className="wx__watch rv" style={{ "--d": "450ms" } as CSSProperties}>
            <b>{weather.watch[0]}</b> {tie(weather.watch[1])}
          </p>
          <ul className="wx__pack rv" style={{ "--d": "650ms" } as CSSProperties} aria-label="Čo si pribaliť">
            {weather.pack.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="wx__chart">
          <svg className="wx__road" viewBox={`0 0 ${weather.slots.length * 100} 100`} preserveAspectRatio="none" aria-hidden="true">
            <polyline points={wxRoad} />
          </svg>
          <ol className="wx__slots" data-rv-stagger="90">
            {weather.slots.map((w) => (
              <li key={w.at} className="wx__slot rv">
                <span>{w.at}</span>
                <b>
                  {w.lo}–{w.hi}
                  <span className="sr-only">&nbsp;°C</span>
                  <span aria-hidden="true">°</span>
                </b>
                <i
                  aria-hidden="true"
                  style={{ "--top": `${wxY(w.hi)}%`, "--h": `${wxY(w.lo) - wxY(w.hi)}%`, "--c": `var(--${w.colour})` } as CSSProperties}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>

      <Disclosure className="wrap gold__src">
        <summary>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="10" cy="10" r="8.6" />
            <path d="M10 9v5" />
            <circle cx="10" cy="6" r="0.4" fill="currentColor" />
          </svg>
          <span>Vypočítané zo skutočných údajov</span>
        </summary>
        <div className="gold__tip">
          <ul>
            <li>
              <b>Slnko:</b> výpočet NOAA pre Stodolu Zlatník v letnom čase, časy súhlasia so sunrise-sunset.org a&nbsp;U.&nbsp;S. Naval
              Observatory.
            </li>
            <li>
              <b>Kopec:</b> výškový model Copernicus cez Open-Meteo, odhad ±10&nbsp;minút.
            </li>
            <li>
              <b>Počasie:</b> ERA5 cez Open-Meteo pre mapový bod stodoly, 225 dní od 22.&nbsp;5. do 5.&nbsp;6. v&nbsp;rokoch 2012–2026.
              Model s&nbsp;rozlíšením asi 25&nbsp;km, nie meranie priamo na mieste, takže krátku prehánku či búrku nemusí zachytiť.
            </li>
            <li>
              <b>Pôdorys stodoly:</b> ©{" "}
              <a className="link" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
                prispievatelia OpenStreetMap
                <span className="sr-only"> (otvorí sa v novom okne)</span>
              </a>
              .
            </li>
          </ul>
        </div>
      </Disclosure>
    </section>
  );
}
