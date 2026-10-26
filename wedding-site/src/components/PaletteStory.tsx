"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { PaletteColour } from "@/content/types";
import { tie } from "@/lib/format";

const CYCLE_MS = 4000;

/**
 * The list of palette colours and the bride with five bridesmaids
 * (public/gowns.svg) beside it: the n-th colour dresses the n-th woman from the
 * left. Only one dress is coloured at a time: the one under the mouse (desktop,
 * over its colour or over the woman herself) or the last one tapped or clicked.
 * Each new colour pours into the dress from the top.
 * Until the guest touches the palette (hover, tap, click or focus), the colour
 * moves to the next woman every four seconds while the section is on screen, so
 * phones see all six. Without JavaScript, or with reduced motion, the first
 * dress stays coloured.
 */
export function PaletteStory({ palette }: { palette: PaletteColour[] }) {
  const [picked, setPicked] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  const fit = useRef<HTMLElement>(null);
  const shown = hovered ?? picked;

  // Auto-cycle while the women are on screen, until the first touch.
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
      <figure className="gowns rv" ref={fit} style={{ "--d": "200ms" } as CSSProperties}>
        {palette.map((p, i) => (
          <span
            className="gowns__fill"
            key={p.colour}
            data-on={i === shown || undefined}
            style={{ "--c": `var(--${p.colour})`, "--mask": `url(/fills/gown-${i + 1}.png)` } as CSSProperties}
          />
        ))}
        <Image
          src="/gowns.svg"
          alt="Nevesta a päť družičiek v dlhých šatách, každá s kyticou."
          width={1150}
          height={880}
          unoptimized
          loading="lazy"
          draggable={false}
        />
        {/* The women answer the mouse like their dabs; keyboards and screen readers use the dabs. */}
        <span className="gowns__hit" aria-hidden="true">
          {palette.map((p, i) => (
            <span key={p.colour} onClick={() => pick(i)} onPointerEnter={preview(i)} onPointerLeave={preview(null)} />
          ))}
        </span>
      </figure>
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
            <p>{tie(p.meaning)}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
