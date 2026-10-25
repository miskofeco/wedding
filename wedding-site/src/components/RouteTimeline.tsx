"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const round = (n: number) => Math.round(n * 10) / 10;

/**
 * Draws the dashed road through the centre of every programme landmark.
 * Geometry comes from the real layout, so it follows any number of events and
 * any viewport. Without JavaScript the programme reads the same, minus the road.
 */
export function RouteTimeline({ children }: { children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState({ box: "0 0 1 1", d: "" });

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let frame = 0;
    const draw = () => {
      const r = el.getBoundingClientRect();
      const pts = Array.from(el.querySelectorAll<HTMLElement>("[data-landmark]")).map((m) => {
        const b = m.getBoundingClientRect();
        return { x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height / 2 };
      });
      if (pts.length < 2) return;
      const lead = window.innerWidth <= 900 ? 40 : 110;
      const first = pts[0];
      const last = pts[pts.length - 1];
      let d = `M ${round(first.x)} ${round(first.y - lead)} L ${round(first.x)} ${round(first.y)}`;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const k = (b.y - a.y) / 2;
        d += ` C ${round(a.x)} ${round(a.y + k)}, ${round(b.x)} ${round(b.y - k)}, ${round(b.x)} ${round(b.y)}`;
      }
      d += ` L ${round(last.x)} ${round(last.y + lead)}`;
      setGeometry({ box: `0 0 ${round(r.width)} ${round(r.height)}`, d });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };
    schedule();
    const resize = new ResizeObserver(schedule);
    resize.observe(el);
    document.fonts?.ready.then(schedule);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
    };
  }, []);

  return (
    <div className="route-wrap" ref={wrap}>
      <svg className="route" viewBox={geometry.box} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {geometry.d && <path className="route__line" d={geometry.d} />}
      </svg>
      {children}
    </div>
  );
}
