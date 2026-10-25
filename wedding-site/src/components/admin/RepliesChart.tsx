"use client";

import { useEffect, useRef, useState } from "react";
import type { DayCount } from "@/lib/records";
import { formatDay, plural } from "./format";

const H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 36 };

/** Confirmed guests over time: one line, the invited total as a dashed reference, the RSVP deadline as a marker. */
export function RepliesChart({ days, invited, deadline }: { days: DayCount[]; invited: number; deadline: string | null }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (days.length === 0) {
    return <p className="adm-chart__empty">Graf sa ukáže po prvej odpovedi.</p>;
  }

  const last = days[days.length - 1].people;
  const top = Math.max(4, invited, last);
  const step = top <= 10 ? 2 : top <= 40 ? 10 : top <= 120 ? 20 : 50;
  const yMax = Math.ceil(top / step) * step;
  const iw = w - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const n = Math.max(1, days.length - 1);
  const x = (i: number) => PAD.left + (days.length === 1 ? iw / 2 : (i / n) * iw);
  const y = (v: number) => PAD.top + ih - (v / yMax) * ih;
  const line = days.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.people).toFixed(1)}`).join("");
  const area = `${line}L${x(days.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;
  const ticks = Array.from({ length: yMax / step + 1 }, (_, i) => i * step);
  const labelEvery = Math.ceil(days.length / Math.max(2, Math.floor(iw / 72)));
  const deadlineIndex = deadline ? days.findIndex((d) => d.day === deadline) : -1;
  const h = hover !== null ? days[hover] : null;

  const pick = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    const i = Math.round(((clientX - r.left - PAD.left) / iw) * n);
    setHover(Math.min(days.length - 1, Math.max(0, i)));
  };

  return (
    <div className="adm-chart" ref={box}>
      <svg
        width={w}
        height={H}
        viewBox={`0 0 ${w} ${H}`}
        role="img"
        aria-label={`Potvrdení hostia: ${last} k ${formatDay(days[days.length - 1].day)}, pozvaných ${invited}.`}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className="adm-chart__grid" x1={PAD.left} x2={w - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="adm-chart__tick" x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        {days.map((d, i) =>
          // Every n-th day, plus the last; a regular label too close to the last one gives way.
          (i % labelEvery === 0 && days.length - 1 - i >= labelEvery * 0.7) || i === days.length - 1 ? (
            <text key={d.day} className="adm-chart__tick" x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === days.length - 1 ? "end" : "middle"}>
              {formatDay(d.day).replace(/ \d{4}$/, "")}
            </text>
          ) : null,
        )}
        {invited > 0 && (
          <g>
            <line className="adm-chart__ref" x1={PAD.left} x2={w - PAD.right} y1={y(invited)} y2={y(invited)} />
            <text className="adm-chart__ref-label" x={w - PAD.right} y={y(invited) - 6} textAnchor="end">
              Pozvaných {invited}
            </text>
          </g>
        )}
        {deadlineIndex >= 0 && (
          <g>
            <line className="adm-chart__ref" x1={x(deadlineIndex)} x2={x(deadlineIndex)} y1={PAD.top} y2={y(0)} />
            <text className="adm-chart__ref-label" x={x(deadlineIndex) - 6} y={PAD.top + 10} textAnchor="end">
              Termín
            </text>
          </g>
        )}
        <path className="adm-chart__area" d={area} />
        <path className="adm-chart__line" d={line} />
        <circle className="adm-chart__end" cx={x(days.length - 1)} cy={y(last)} r={5} />
        {h && hover !== null && (
          <g>
            <line className="adm-chart__cross" x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} />
            <circle className="adm-chart__end" cx={x(hover)} cy={y(h.people)} r={5} />
          </g>
        )}
      </svg>
      {h && hover !== null && (
        <div className="adm-tip" style={{ left: Math.min(Math.max(x(hover), 90), w - 90), top: Math.max(0, y(h.people) - 74) }}>
          <strong>{formatDay(h.day)}</strong>
          <span>
            {h.people} {plural(h.people, ["hosť príde", "hostia prídu", "hostí príde"])}
          </span>
          {(h.yes > 0 || h.no > 0) && (
            <span className="adm-tip__soft">
              v ten deň: {h.yes} áno · {h.no} nie
            </span>
          )}
        </div>
      )}
    </div>
  );
}
