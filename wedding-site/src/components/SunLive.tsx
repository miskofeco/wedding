"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import type { LightPhase } from "@/content/light";
import type { SunDay } from "@/content/types";
import { clock, shadowLength } from "@/lib/sun";
import { Drawing } from "./Drawing";
import { Write } from "./Write";

const PARKED = 19 * 60 + 45; // without JavaScript or motion: deep in the golden hour
const EL_TOP = 17; // the sky's vertical scale, degrees
const EL_BOTTOM = -8;
const SCROLL_FROM = 18 * 60 + 45; // scroll walks the sun through the evening as the sky crosses the screen
const SCROLL_TO = 21 * 60;
const FOLLOW = 0.12; // share of the gap closed per frame, as the map's car
const TZ = "Europe/Bratislava";

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const ease = (t: number) => t * t * (3 - 2 * t);
const decimal = new Intl.NumberFormat("sk-SK", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const degrees = (n: number) => `${decimal.format(n).replace("-", "−")}°`;
const COMPASS = ["S", "SV", "V", "JV", "J", "JZ", "Z", "SZ"];
const compassWord = (az: number) => COMPASS[Math.round(az / 45) % 8];
/** Elevation to the sky's height, 0 at the top and 100 at the bottom. */
const y = (el: number) => ((EL_TOP - el) / (EL_TOP - EL_BOTTOM)) * 100;

const everyHalfMinute = (change: () => void) => {
  const tick = window.setInterval(change, 30000);
  return () => window.clearInterval(tick);
};
const never = () => () => {};

/** Minutes after midnight in Slovakia right now, or null on any other day than the wedding. */
function weddingNow(date: string): number | null {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}` === date ? +parts.hour * 60 + +parts.minute : null;
}

interface SunLiveProps {
  day: SunDay;
  phases: LightPhase[];
  sliderLabel: string;
  /** The moments as a list: shown on phones, for screen readers everywhere (the sky itself is hidden from them). */
  moments: ReactNode;
  /** White lantern drawing for the night field. */
  lantern: string;
  /** The words beside the compass. */
  children: ReactNode;
}

/**
 * The live part of „Zlatá hodina v Zlatníku“: the evening sky to scale, the slider under it, the readout and the
 * compass. The sun walks its road with scroll (smoothed, like the map's car) until the guest takes the slider; on
 * the wedding day itself, between the first and last minute shown, it stands where the real sun is. Without
 * JavaScript or motion it waits at 19:45.
 */
export function SunLive({ day, phases, sliderLabel, moments, lantern, children }: SunLiveProps) {
  const skyRef = useRef<HTMLDivElement>(null);
  // on the wedding day, while the evening shown is on, the real minute; null on every other day and on the server
  const live = useSyncExternalStore(
    everyHalfMinute,
    () => {
      const now = weddingNow(day.date);
      return now !== null && now >= day.from && now <= day.to ? now : null;
    },
    () => null,
  );
  const motion = useSyncExternalStore(never, () => document.documentElement.classList.contains("mo"), () => false);
  const [scrolled, setScrolled] = useState<number | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  // the guest's own choice wins, then the real time on the day, then scroll, then the parked sun
  const minute = chosen ?? live ?? (motion ? (scrolled ?? SCROLL_FROM) : PARKED);
  const following = chosen === null && live === null && motion;

  const span = day.to - day.from;
  const x = (m: number) => ((m - day.from) / span) * 100;
  const startOf = (p: LightPhase) => (p.from === "start" ? day.from : day.events[p.from].at);

  // the drawing, in the sky's own units: x 0…span minutes, y 0…100 of its height
  const shapes = useMemo(() => {
    const pts = day.track.map(([el], i) => `${i},${y(el).toFixed(2)}`);
    const road = `M${pts.join(" L")}`;
    const hill = `M0,100 L${day.horizon.map((h, i) => `${i},${y(h).toFixed(2)}`).join(" L")} L${day.to - day.from},100 Z`;
    return { road, hill };
  }, [day]);

  // scroll walks the sun through the evening, eased towards where the sky stands on screen
  useEffect(() => {
    const sky = skyRef.current;
    if (!following || !sky) return;
    const target = () => {
      const box = sky.getBoundingClientRect();
      const vh = window.innerHeight;
      const t = ease(clamp((vh * 0.92 - (box.top + box.height / 2)) / (vh * 0.84)));
      return SCROLL_FROM + t * (SCROLL_TO - SCROLL_FROM);
    };
    let now: number | null = null;
    let goal = target();
    let frame = 0;
    const step = () => {
      frame = 0;
      now ??= goal; // the first frame lands where the page opened, without a sweep
      const gap = goal - now;
      const done = Math.abs(gap) < 0.05;
      now = done ? goal : now + gap * FOLLOW;
      setScrolled(now);
      if (!done) frame = requestAnimationFrame(step);
    };
    const schedule = () => {
      goal = target();
      if (!frame) frame = requestAnimationFrame(step);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [following]);

  const i = clamp(Math.round(minute) - day.from, 0, span);
  const [el, az] = day.track[i];
  const lit = el > day.horizon[i];
  const phase = phases.reduce((p, ph) => (Math.round(minute) >= startOf(ph) ? ph : p), phases[0]);
  const shadow = lit ? `${Math.round(shadowLength(el))} m` : "žiadny";
  const exact = Math.round(minute);
  const valueText = `${clock(exact)}, ${phase.name.toLowerCase()}, slnko ${el >= 0 ? "" : "pod obzorom, "}${degrees(el)}, ${compassWord(az)}`;
  const ticks = [19, 20, 21, 22].map((h) => h * 60).filter((m) => m > day.from && m < day.to);

  return (
    <>
      <div className="sky rv rv--brush" data-rv-group="" ref={skyRef} aria-hidden="true">
        <svg className="sky__back" viewBox={`0 0 ${span} 100`} preserveAspectRatio="none">
          {phases.map((p, n) => {
            const a = startOf(p) - day.from;
            const b = n + 1 < phases.length ? startOf(phases[n + 1]) - day.from : span;
            return <rect key={p.name} x={a} y={0} width={b - a + 0.2} height={100} style={{ fill: `var(--${p.colour})` }} />;
          })}
          <path className="sky__road" d={shapes.road} />
        </svg>
        <span className="sky__sun" style={{ "--x": `${x(minute)}%`, "--y": `${y(el)}%` } as CSSProperties} />
        <svg className="sky__land" viewBox={`0 0 ${span} 100`} preserveAspectRatio="none">
          <defs>
            <clipPath id="sky-land">
              <path d={shapes.hill} />
            </clipPath>
          </defs>
          <path className="sky__hill" d={shapes.hill} />
          <path className="sky__road sky__road--under" d={shapes.road} clipPath="url(#sky-land)" />
        </svg>
        {[5, 10].map((d) => (
          <span key={d} className="sky__deg" style={{ top: `${y(d)}%` }}>
            {d}°
          </span>
        ))}
        {(["goldenEnd", "civilDusk"] as const).map((k, n) => {
          const m = day.events[k].at;
          return (
            <span key={k} className="sky__depth" style={{ left: `${x(m)}%`, top: `${y(day.track[m - day.from][0])}%` }}>
              {n === 0 ? "−4°" : "−6°"}
            </span>
          );
        })}
        <span className="sky__ground" style={{ top: `${y(-1.5)}%` }}>
          Kopec na severozápade, asi {Math.round(day.horizon[day.events.behindHill.at - day.from])}° nad obzorom
        </span>
        {phases.map((p, n) => {
          if (!p.label) return null;
          const a = startOf(p);
          const b = n + 1 < phases.length ? startOf(phases[n + 1]) : day.to;
          const style = { left: `${x(a)}%`, maxWidth: `${x(b) - x(a)}%`, "--d": `${Math.round(250 + 700 * (x(a) / 100))}ms` } as CSSProperties;
          return (
            <p key={p.name} className={`sky__lab rv rv--write${p.colour === "olive" ? " sky__lab--night" : ""}`} style={style}>
              <b>
                <Write mode="line" text={p.from === "behindHill" ? `≈ ${clock(Math.round(a / 5) * 5)}` : clock(a)} />
              </b>
              <Write mode="line" text={p.label} start={200} />
            </p>
          );
        })}
        <Drawing
          className="sky__lantern rv rv--ink"
          src={lantern}
          style={{ left: `${x(day.events.civilDusk.at + 22)}%`, "--d": "1000ms" } as CSSProperties}
        />
        <p className="sky__moon rv rv--write" style={{ "--d": "1100ms" } as CSSProperties}>
          <Write mode="line" text={`Úplná tma o ${clock(day.events.night.at)}. Mesiac vyjde až o ${clock(day.moonrise.at)}.`} />
        </p>
      </div>

      <div className="scrub rv" style={{ "--d": "200ms" } as CSSProperties}>
        <label className="scrub__label wrap" htmlFor="sun-time">
          {sliderLabel}
        </label>
        <input
          id="sun-time"
          type="range"
          min={day.from}
          max={day.to}
          step={1}
          value={exact}
          aria-valuetext={valueText}
          onChange={(e) => setChosen(+e.currentTarget.value)}
        />
        <div className="scrub__ticks" aria-hidden="true">
          {ticks.map((m) => (
            <span key={m} style={{ left: `${x(m)}%` }}>
              {clock(m)}
            </span>
          ))}
        </div>
      </div>

      <div className="wrap read" data-rv-group="">
        <p className="read__time rv">
          {chosen === null && live !== null && <span className="read__now">Práve teraz</span>}
          {clock(exact)}
        </p>
        <div className="rv" style={{ "--d": "120ms" } as CSSProperties}>
          <p className="read__phase">{phase.name}</p>
          <p className="read__say">{phase.say}</p>
        </div>
        <dl className="read__facts rv" style={{ "--d": "240ms" } as CSSProperties}>
          <div>
            <dt>Výška slnka</dt>
            <dd>{degrees(el)}</dd>
          </div>
          <div>
            <dt>Smer</dt>
            <dd>
              {compassWord(az)} · {Math.round(az)}°
            </dd>
          </div>
          <div>
            <dt>Váš tieň</dt>
            <dd>{shadow}</dd>
          </div>
        </dl>
      </div>

      {moments}

      <div className="wrap where">
        <Compass day={day} azimuth={az} lit={lit} up={el > -0.833} />
        <div className="where__copy">{children}</div>
      </div>
    </>
  );
}

const xy = ([x, y]: number[]) => ({ x, y });
const S = 520;
const C = S / 2;
const R = 214;
const point = (az: number, r: number) => [C + r * Math.sin((az * Math.PI) / 180), C - r * Math.cos((az * Math.PI) / 180)];
const arc = (from: number, to: number, r: number) => {
  const [x0, y0] = point(from, r);
  const [x1, y1] = point(to, r);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};

/** The barn from above, north up, to scale; the day's arc of the sun around it and the light on the glass wall. */
function Compass({ day, azimuth, lit, up }: { day: SunDay; azimuth: number; lit: boolean; up: boolean }) {
  const e = day.events;
  const barn = useMemo(() => {
    const lat0 = day.barn.reduce((s, p) => s + p[0], 0) / day.barn.length;
    const lng0 = day.barn.reduce((s, p) => s + p[1], 0) / day.barn.length;
    const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
    const ky = 110540;
    const px = 4.4; // per metre
    return day.barn.map(([lat, lng]) => [C + (lng - lng0) * kx * px, C - (lat - lat0) * ky * px]);
  }, [day]);
  const [sx, sy] = point(azimuth, R);
  const ux = Math.sin((azimuth * Math.PI) / 180);
  const uy = -Math.cos((azimuth * Math.PI) / 180);
  const label = `Stodola zhora, sever hore. Slnko vychádza na severovýchode o ${clock(e.sunrise.at)} (${Math.round(e.sunrise.azimuth)}°) a zapadá na severozápade o ${clock(e.sunset.at)} (${Math.round(e.sunset.azimuth)}°). Počas zlatej hodiny svieti zo smeru ${Math.round(e.goldenStart.azimuth)}° až ${Math.round(e.behindHill.azimuth)}° na presklenú západnú stenu.`;

  return (
    <div className="compass rv rv--ink">
      <svg viewBox={`0 0 ${S} ${S}`} role="img" aria-label={label}>
        <circle className="compass__ground" cx={C} cy={C} r={R + 34} />
        <path className="compass__day" d={arc(e.sunrise.azimuth, e.sunset.azimuth, R)} />
        <path className="compass__gold" d={arc(e.goldenStart.azimuth, e.behindHill.azimuth, R)} />
        <path className="compass__late" d={arc(e.behindHill.azimuth, e.sunset.azimuth, R)} />
        {lit &&
          [-2, -1, 0, 1, 2].map((k) => {
            const ox = C - uy * k * 18;
            const oy = C + ux * k * 18;
            return <line key={k} className="compass__ray" x1={ox + ux * 180} y1={oy + uy * 180} x2={ox} y2={oy} />;
          })}
        <polygon className="compass__barn" points={barn.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")} />
        <line className="compass__glass" x1={barn[0][0]} y1={barn[0][1]} x2={barn[1][0]} y2={barn[1][1]} />
        <g className={`compass__sun${up ? "" : " compass__sun--down"}`} transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)})`}>
          <circle className="compass__plate" cx={4} cy={4} r={16} />
          <circle className="compass__disc" r={17.5} />
        </g>
        {(
          [
            [0, "S"],
            [90, "V"],
            [180, "J"],
            [270, "Z"],
          ] as const
        ).map(([a, t]) => {
          const [lx, ly] = point(a, R + 62);
          return (
            <text key={t} className="compass__cardinal" x={lx} y={ly}>
              {t}
            </text>
          );
        })}
        <text className="compass__note" {...xy(point(e.sunrise.azimuth, R - 30))} textAnchor="end">
          východ {clock(e.sunrise.at)}
        </text>
        <text className="compass__note" {...xy(point(e.sunset.azimuth + 7, R - 34))} textAnchor="start">
          západ {clock(e.sunset.at)}
        </text>
        <text className="compass__note" x={C} y={C + 46} textAnchor="middle">
          stodola
        </text>
        <text className="compass__note" x={barn[1][0] - 6} y={barn[1][1] + 40} textAnchor="end">
          presklená stena
        </text>
      </svg>
    </div>
  );
}
