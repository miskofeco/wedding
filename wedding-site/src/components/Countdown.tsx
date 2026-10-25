"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { dayWord, daysUntil, todayInSlovakia } from "@/lib/countdown";
import { whenRevealed } from "./RevealObserver";

const ROLL = 24; // the number rolls up from n − 24
const ROLL_MS = 900;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

// Re-check every minute so an open tab rolls over at midnight.
function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(id);
}

/**
 * The number on the milestone. The server (and a browser without JavaScript)
 * shows the date itself; the browser swaps in the days left, which count up
 * once as the milestone comes into view. The end value is the real number, so
 * nothing shifts if the count never runs.
 */
export function Countdown({ date, dateLabel }: { date: string; dateLabel: string }) {
  const today = useSyncExternalStore(subscribe, () => todayInSlovakia(), () => null);
  const n = today === null ? null : daysUntil(date, today);
  const ref = useRef<HTMLParagraphElement>(null);
  const [lag, setLag] = useState(0);
  const counting = n !== null && n > 0;

  useEffect(() => {
    const el = ref.current;
    if (!el || !counting || !document.documentElement.classList.contains("mo") || el.classList.contains("in")) return;
    setLag(ROLL);
    let frame = 0;
    const stop = whenRevealed(el, (instant) => {
      if (instant) return setLag(0);
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / ROLL_MS);
        setLag(Math.round(ROLL * (1 - easeOut(t))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    return () => {
      stop();
      cancelAnimationFrame(frame);
    };
  }, [counting]);

  // One className for every state: RevealObserver's `.in` must survive re-renders.
  if (n === null) {
    return (
      <p className="milestone__count rv" ref={ref}>
        <span className="milestone__num">{dateLabel}</span>
        <span className="milestone__unit">zapíšte si dátum</span>
      </p>
    );
  }
  if (n === 0) {
    return (
      <p className="milestone__count rv" ref={ref} role="status">
        <span className="milestone__num milestone__num--word">Dnes</span>
        <span className="milestone__unit">je ten deň</span>
      </p>
    );
  }
  if (n < 0) {
    return (
      <p className="milestone__count rv" ref={ref}>
        <span className="milestone__num milestone__num--word">Svoji</span>
        <span className="milestone__unit">ďakujeme, že ste boli s&nbsp;nami</span>
      </p>
    );
  }
  return (
    <p className="milestone__count rv" ref={ref}>
      <span className="milestone__num">{Math.max(0, n - lag)}</span>
      <span className="milestone__unit">{n === 1 ? "deň do svadby, už zajtra" : `${dayWord(n)} do svadby`}</span>
    </p>
  );
}
