"use client";

import { useEffect, useRef, type CSSProperties } from "react";

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const ease = (t: number) => t * t * (3 - 2 * t); // smoothstep: pull away gently, arrive gently
const MAX_TILT = 18;
const FOLLOW = 0.12; // share of the gap closed per frame: the car coasts instead of jumping with each scroll tick
const AHEAD = 0.035; // the road is drawn this far ahead of the car
const BOB = 1.5; // dirt-road bounce at full speed, in map units

/**
 * The wedding car on the drawn map. It drives the road from the church to the
 * barn as the map scrolls through the screen, drawing the road just ahead of
 * itself; the side road draws in the second half. Each road `#id` is drawn
 * through `<mask id="id-mask">` holding a `pathLength="1"` path `#id-reveal`.
 * At the barn its pin pulses once. Without
 * JavaScript, or with reduced motion, the roads are whole and the car is
 * parked halfway.
 */
export function MapCar({
  pathId,
  sideRoadId,
  src,
  size = 164,
  parked,
}: {
  pathId: string;
  /** A second road that draws once the car is halfway. */
  sideRoadId?: string;
  src: string;
  size?: number;
  /** Where the car waits on the road before JavaScript runs. */
  parked: [number, number];
}) {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const car = ref.current;
    const svg = car?.ownerSVGElement;
    const road = svg?.querySelector<SVGPathElement>(`#${pathId}`);
    if (!car || !svg || !road) return;
    const length = road.getTotalLength();

    const place = (t: number, bob = 0) => {
      const at = t * length;
      const p = road.getPointAtLength(at);
      const q = road.getPointAtLength(Math.min(length, at + 2));
      const r = road.getPointAtLength(Math.max(0, at - 2));
      // The drawing faces left, the way it travels; tilt it with the road.
      let angle = (Math.atan2(q.y - r.y, q.x - r.x) * 180) / Math.PI - 180;
      if (angle < -180) angle += 360;
      angle = Math.max(-MAX_TILT, Math.min(MAX_TILT, angle));
      car.setAttribute("transform", `translate(${p.x.toFixed(1)} ${(p.y + bob).toFixed(2)}) rotate(${angle.toFixed(1)})`);
    };

    if (!document.documentElement.classList.contains("mo")) {
      place(0.5);
      return;
    }

    // Draw the roads by scroll: each mask path shows [0, share] of its road.
    const masked = (id?: string) => {
      const path = id ? svg.querySelector(`#${id}`) : null;
      const reveal = id ? svg.querySelector<SVGPathElement>(`#${id}-reveal`) : null;
      if (!path || !reveal) return null;
      path.setAttribute("mask", `url(#${id}-mask)`);
      return reveal;
    };
    const main = masked(pathId);
    const minor = masked(sideRoadId);
    const draw = (t: number) => {
      main?.style.setProperty("stroke-dashoffset", String(1 - clamp(t + AHEAD)));
      minor?.style.setProperty("stroke-dashoffset", String(1 - clamp((t - 0.5) * 2)));
    };

    const target = () => {
      const box = svg.getBoundingClientRect();
      const vh = window.innerHeight;
      // Halfway when the map is centred on screen; at the barn as it leaves.
      const centre = box.top + box.height / 2;
      return ease(clamp((vh * 0.92 - centre) / (vh * 0.84)));
    };

    let now = target();
    let goal = now;
    let phase = 0;
    let frame = 0;
    let arrived = now > 0.999; // landed past the map: no arrival to show
    place(now);
    draw(now);

    const step = () => {
      frame = 0;
      const gap = goal - now;
      const done = Math.abs(gap) < 0.001;
      const move = done ? gap : gap * FOLLOW;
      now += move;
      // Bounce in proportion to speed; the phase advances with distance, so faster means bumpier.
      const speed = Math.abs(move) * length;
      phase += speed * 0.35;
      place(now, done ? 0 : Math.sin(phase) * Math.min(BOB, speed * 0.4));
      draw(now);
      if (!arrived && now > 0.999) {
        arrived = true;
        svg.classList.add("arrived");
      }
      if (!done) frame = requestAnimationFrame(step);
    };
    const schedule = () => {
      goal = target();
      if (!frame) frame = requestAnimationFrame(step);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathId, sideRoadId]);

  return (
    <g
      ref={ref}
      className="map__car map__fade"
      style={{ "--d": "150ms" } as CSSProperties}
      transform={`translate(${parked[0].toFixed(1)} ${parked[1].toFixed(1)})`}
      aria-hidden="true"
    >
      <image href={src} x={-size / 2} y={-size * 0.76} width={size} height={size} className="map__img" />
    </g>
  );
}
