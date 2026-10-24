"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { PaletteColour } from "@/content/types";
import { art } from "@/lib/art";
import { Drawing } from "./Drawing";

const CYCLE_MS = 4000;

/**
 * The palette dabs and, for each colour, a figure dressed in it: the figure
 * under the mouse (desktop) or the last one tapped or clicked is shown. Each
 * new colour pours into the garment from the top.
 * Until the guest touches the palette (hover, tap, click or focus), the figure
 * moves to the next colour every four seconds while the section is on screen,
 * so phones see all six. Without JavaScript, or with reduced motion, the first
 * figure stays.
 */
export function PaletteStory({ palette }: { palette: PaletteColour[] }) {
  const [picked, setPicked] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  const fit = useRef<HTMLElement>(null);
  const shown = hovered ?? picked;

  // Auto-cycle while the figure is on screen, until the first touch.
  useEffect(() => {
    const el = fit.current;
    if (!el || touched || !document.documentElement.classList.contains("mo")) return;
    let timer = 0;
    const observer = new IntersectionObserver(([e]) => {
      window.clearInterval(timer);
      if (e.isIntersecting) timer = window.setInterval(() => setPicked((p) => (p + 1) % palette.length), CYCLE_MS);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [touched, palette.length]);

  // Touch and pen taps also fire pointerenter; only a mouse previews.
  const preview = (i: number | null) => (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    setHovered(i);
    setTouched(true);
  };
  const pick = (i: number) => {
    setPicked(i);
    setTouched(true);
  };

  return (
    <>
      <ol className="story" data-rv-stagger="60">
        {palette.map((p, i) => (
          <li
            className="dab rv"
            key={p.colour}
            data-on={i === shown || undefined}
            data-picked={(touched && i === picked) || undefined}
            style={{ "--c": `var(--${p.colour})` } as CSSProperties}
          >
            <span className="dab__shape" aria-hidden="true" />
            <h3>
              <button
                type="button"
                className="dab__btn"
                aria-pressed={i === picked}
                onClick={() => pick(i)}
                onFocus={() => setTouched(true)}
                onPointerEnter={preview(i)}
                onPointerLeave={preview(null)}
              >
                {p.name}
              </button>
            </h3>
            <p>{p.meaning}</p>
          </li>
        ))}
      </ol>
      <figure className="fit rv" ref={fit} style={{ "--d": "200ms" } as CSSProperties}>
        <div className="fit__stage">
          {palette.map((p, i) => (
            <span
              className="fit__fig"
              key={p.colour}
              data-on={i === shown || undefined}
              style={{ "--c": `var(--${p.colour})`, "--mask": `url(/fills/${p.figure}.png)` } as CSSProperties}
            >
              <span className="fit__fill" />
              <Drawing src={art(p.figure, "black")} />
            </span>
          ))}
        </div>
        <figcaption className="fit__label">{palette[shown].name}</figcaption>
      </figure>
    </>
  );
}
