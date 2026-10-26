"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import type { LightPhase } from "@/content/light";
import type { SunDay } from "@/content/types";
import { clock, shadowLength } from "@/lib/sun";
import { Drawing } from "./Drawing";
import { Write } from "./Write";

const PARKED = 19 * 60 + 45; // without JavaScript or motion: deep in the golden hour
const EL_TOP = 17; // the sky's vertical scale, degrees
const EL_BOTTOM = -8;
const SCROLL_FROM = 18 * 60 + 45; // scroll walks the sun through the evening while the stage holds still
const SCROLL_TO = 21 * 60 + 17; // the lantern lit, ten minutes into the dusk
const HOLD = 0.05; // share of the walk spent still at each end, so the first and last minute read
const RELEASE = 0.03; // scroll that hands the sun back from the slider, as a share of the walk
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
 * compass. The sky, slider and readout are one stage that holds still under the nav while scroll walks the sun
 * through the evening, each phase of light getting the same stretch of scroll (smoothed, like the map's car). The
 * slider takes over until the guest scrolls the stage on; on the wedding day itself, between the first and last
 * minute shown, the sun stands where the real one is. Without JavaScript or motion it waits at 19:45.
 */
export function SunLive({ day, phases, sliderLabel, moments, lantern, children }: SunLiveProps) {
  const runRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0); // how far through the walk the page is, 0…1
  const choice = useRef<{ minute: number; at: number } | null>(null); // the slider's minute and the progress it was set at
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
  const [touched, setTouched] = useState(false);
  // the guest's own choice wins, then the real time on the day, then scroll, then the parked sun
  const minute = chosen ?? live ?? (motion ? (scrolled ?? SCROLL_FROM) : PARKED);
  const scrolling = live === null && motion;
  const choose = (m: number) => {
    choice.current = { minute: m, at: progress.current };
    setChosen(m);
    setTouched(true);
  };

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

  // the walk's stops: every phase of light from the first to the dusk gets the same stretch of scroll
  const stops = useMemo(() => {
    const e = day.events;
    return [SCROLL_FROM, e.goldenStart.at, e.behindHill.at, e.sunset.at, e.goldenEnd.at, e.civilDusk.at, SCROLL_TO];
  }, [day]);

  // scroll walks the sun through the evening while the stage holds still under the nav; where the stage is taller
  // than the screen it isn't held, and the walk follows the sky across the screen instead
  useEffect(() => {
    const run = runRef.current;
    const stage = stageRef.current;
    const sky = skyRef.current;
    if (!scrolling || !run || !stage || !sky) return;
    const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 0;
    // the small viewport, which stays put while a phone's toolbar comes and goes, so the stage isn't let go mid-scroll
    const small = document.createElement("div");
    small.style.cssText = "position: fixed; top: 0; height: 100svh; visibility: hidden; pointer-events: none";
    run.append(small);
    let held = false;
    let top = 0;
    const fit = () => {
      const vh = small.offsetHeight || window.innerHeight;
      const h = stage.offsetHeight;
      held = h <= vh - nav;
      top = nav + Math.max(0, (vh - nav - h) / 2);
      run.toggleAttribute("data-held", held);
      run.style.setProperty("--stage-top", `${Math.round(top)}px`);
    };
    const through = () => {
      if (held) return clamp((top - run.getBoundingClientRect().top) / Math.max(1, run.offsetHeight - stage.offsetHeight));
      const box = sky.getBoundingClientRect();
      const vh = window.innerHeight;
      return ease(clamp((vh * 0.92 - (box.top + box.height / 2)) / (vh * 0.84)));
    };
    const target = (t: number) => {
      const s = clamp((t - HOLD) / (1 - 2 * HOLD)) * (stops.length - 1);
      const n = Math.min(stops.length - 2, Math.floor(s));
      return stops[n] + (s - n) * (stops[n + 1] - stops[n]);
    };
    let now: number | null = null;
    let goal = SCROLL_FROM;
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
      const t = through();
      progress.current = t;
      // scrolling the stage on hands the sun back from the slider; it glides on from the guest's minute
      if (choice.current && Math.abs(t - choice.current.at) > RELEASE) {
        now = choice.current.minute;
        choice.current = null;
        setChosen(null);
      }
      goal = target(t);
      if (!frame) frame = requestAnimationFrame(step);
    };
    const resize = () => {
      fit();
      schedule();
    };
    resize();
    const watch = new ResizeObserver(resize);
    watch.observe(stage);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      watch.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", resize);
      run.removeAttribute("data-held");
      small.remove();
    };
  }, [scrolling, stops]);

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
      <div className="sun-run" ref={runRef}>
        <div className="sun-stage" ref={stageRef}>
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

          <div className="scrub rv" data-idle={touched ? undefined : ""} style={{ "--d": "200ms" } as CSSProperties}>
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
              onChange={(e) => choose(+e.currentTarget.value)}
              onPointerDown={() => setTouched(true)}
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
            {/* every phase's words in one cell, the current one shown: the readout keeps the height of the longest */}
            <div className="read__phases rv" style={{ "--d": "120ms" } as CSSProperties}>
              {phases.map((p) => (
                <div key={p.name} className={p === phase ? "on" : undefined}>
                  <p className="read__phase">{p.name}</p>
                  <p className="read__say">{p.say}</p>
                </div>
              ))}
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
            <Compass day={day} phases={phases} azimuth={az} lit={lit} up={el > -0.833} onPick={choose} />
          </div>
        </div>
      </div>

      {moments}

      <div className="wrap where">{children}</div>
    </>
  );
}

const S = 520;
const C = S / 2;
const R = 206;
const PX = 4.4; // the barn's scale, per metre
const point = (az: number, r: number) => [C + r * Math.sin((az * Math.PI) / 180), C - r * Math.cos((az * Math.PI) / 180)];
const arc = (from: number, to: number, r: number) => {
  const [x0, y0] = point(from, r);
  const [x1, y1] = point(to, r);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};
/** A point in the drawing as a share of its box, for the labels set over it in HTML. */
const at = ([px, py]: number[]) => ({ left: `${((px / S) * 100).toFixed(2)}%`, top: `${((py / S) * 100).toFixed(2)}%` });

interface CompassProps {
  day: SunDay;
  phases: LightPhase[];
  azimuth: number;
  lit: boolean;
  up: boolean;
  /** The minute whose sun is nearest where the guest drags it on the ring. */
  onPick: (minute: number) => void;
}

/**
 * The barn from above, north up, to scale (its OpenStreetMap footprint), the day's arc of the sun around it and the
 * light on the glass wall. The evening's stretch of the arc wears the sky's fields, and the sun can be dragged along
 * it; the slider above stays the control for the keyboard.
 */
function Compass({ day, phases, azimuth, lit, up, onPick }: CompassProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const e = day.events;
  const barn = useMemo(() => {
    const lat0 = day.barn.reduce((s, p) => s + p[0], 0) / day.barn.length;
    const lng0 = day.barn.reduce((s, p) => s + p[1], 0) / day.barn.length;
    const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
    const ky = 110540;
    const m = day.barn.map(([lat, lng]) => [(lng - lng0) * kx, (lat - lat0) * ky]);
    // the first edge is the glazed gable; the barn's length runs square to it
    const [g0, g1] = m;
    const glass = Math.hypot(g1[0] - g0[0], g1[1] - g0[1]);
    const ax = [(g1[1] - g0[1]) / glass, -(g1[0] - g0[0]) / glass];
    const along = m.map((p) => p[0] * ax[0] + p[1] * ax[1]);
    return {
      points: m.map(([x, y]) => [C + x * PX, C - y * PX]),
      glass: Math.round(glass),
      length: Math.round(Math.max(...along) - Math.min(...along)),
    };
  }, [day]);
  const [g0, g1] = barn.points;
  const glassMid = [(g0[0] + g1[0]) / 2, (g0[1] + g1[1]) / 2];
  const north = Math.min(...barn.points.map((p) => p[1]));
  const south = Math.max(...barn.points.map((p) => p[1]));
  const azOf = (m: number) => day.track[m - day.from][1];
  const startOf = (p: LightPhase) => (p.from === "start" ? day.from : e[p.from].at);
  const [sx, sy] = point(azimuth, R);
  const ux = Math.sin((azimuth * Math.PI) / 180);
  const uy = -Math.cos((azimuth * Math.PI) / 180);
  const label = `Stodola zhora, sever hore, dlhá ${barn.length} metrov. Slnko vychádza na severovýchode o ${clock(e.sunrise.at)} (${Math.round(e.sunrise.azimuth)}°) a zapadá na severozápade o ${clock(e.sunset.at)} (${Math.round(e.sunset.azimuth)}°). Počas zlatej hodiny svieti zo smeru ${Math.round(e.goldenStart.azimuth)}° až ${Math.round(e.behindHill.azimuth)}° šikmo na presklenú západnú stenu sály, širokú ${barn.glass} metrov.`;

  // dragging: the pointer's direction from the barn picks the evening minute whose sun stands nearest it
  const pick = (ev: PointerEvent) => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return;
    const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse());
    const want = ((Math.atan2(p.x - C, C - p.y) * 180) / Math.PI + 360) % 360;
    let best = day.from;
    let gap = Infinity;
    for (let t = day.from; t <= day.to; t++) {
      const d = Math.abs(((azOf(t) - want + 540) % 360) - 180);
      if (d < gap) [best, gap] = [t, d];
    }
    onPick(best);
  };
  const grab = (ev: PointerEvent) => {
    if (ev.button !== 0) return;
    ev.preventDefault();
    svgRef.current?.setPointerCapture(ev.pointerId);
    pick(ev);
  };
  const drag = (ev: PointerEvent) => {
    if (svgRef.current?.hasPointerCapture(ev.pointerId)) pick(ev);
  };

  return (
    <div className="compass rv rv--ink" style={{ "--d": "300ms" } as CSSProperties}>
      <svg ref={svgRef} viewBox={`0 0 ${S} ${S}`} role="img" aria-label={label} onPointerMove={drag}>
        <circle className="compass__ground" cx={C} cy={C} r={R + 34} />
        <path className="compass__day" d={arc(e.sunrise.azimuth, azOf(e.goldenStart.at), R)} />
        {/* the evening in the sky's colours, from the golden hour to the end of the sky */}
        {phases.map((p, n) => {
          const a = Math.max(startOf(p), e.goldenStart.at);
          const b = n + 1 < phases.length ? startOf(phases[n + 1]) : day.to;
          return b > a ? <path key={p.name} className="compass__phase" d={arc(azOf(a), azOf(b), R)} style={{ stroke: `var(--${p.colour})` }} /> : null;
        })}
        {lit &&
          [-2, -1, 0, 1, 2].map((k) => {
            const ox = C - uy * k * 16;
            const oy = C + ux * k * 16;
            return <line key={k} className="compass__ray" x1={ox + ux * 170} y1={oy + uy * 170} x2={ox} y2={oy} />;
          })}
        <polygon className="compass__barn" points={barn.points.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")} />
        <line className="compass__glass" x1={g0[0]} y1={g0[1]} x2={g1[0]} y2={g1[1]} />
        {/* the rail the sun is dragged along: wide and invisible, the whole evening */}
        <path className="compass__rail" d={arc(azOf(day.from), azOf(day.to), R)} onPointerDown={grab} />
        <g className={`compass__sun${up ? "" : " compass__sun--down"}`} transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)})`} onPointerDown={grab}>
          <circle className="compass__plate" cx={5} cy={5} r={21} />
          <circle className="compass__disc" r={23} />
          <path className="compass__grip" d="M-5 -6 -11 0 -5 6 M5 -6 11 0 5 6" transform={`rotate(${azimuth.toFixed(1)})`} />
        </g>
      </svg>
      <div className="compass__labels" aria-hidden="true">
        {(
          [
            [0, "S"],
            [90, "V"],
            [180, "J"],
            [270, "Z"],
          ] as const
        ).map(([a, t]) => (
          <span key={t} className="compass__cardinal" style={at(point(a, R + 58))}>
            {t}
          </span>
        ))}
        <span className="compass__note compass__note--rise" style={at(point(e.sunrise.azimuth - 5, R - 34))}>
          východ {clock(e.sunrise.at)}
        </span>
        <span className="compass__note compass__note--set" style={at(point(e.sunset.azimuth, R + 46))}>
          západ {clock(e.sunset.at)}
        </span>
        <span className="compass__note compass__note--barn" style={at([C + 10, north - 12])}>
          <b>Stodola</b> · {barn.length}&nbsp;m
        </span>
        <span className="compass__note compass__note--glass" style={at([glassMid[0], south + 14])}>
          presklená
          <br />
          stena sály
        </span>
      </div>
    </div>
  );
}
