"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * A native <details> that also closes on Escape (focus back to its summary) and on a press outside it,
 * and scrolls its last item into view when it opens near the fold. Without JavaScript it stays a plain <details>.
 */
export function Disclosure({ className, style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const close = (refocus: boolean) => {
      el.open = false;
      if (refocus) el.querySelector("summary")?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && el.open) close(el.contains(document.activeElement));
    };
    const onDown = (e: PointerEvent) => {
      if (el.open && !el.contains(e.target as Node)) close(false);
    };
    const onToggle = () => {
      if (!el.open) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.lastElementChild?.lastElementChild?.scrollIntoView({ block: "nearest", behavior: reduce ? "instant" : "smooth" });
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    el.addEventListener("toggle", onToggle);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      el.removeEventListener("toggle", onToggle);
    };
  }, []);

  return (
    <details ref={ref} className={className} style={style}>
      {children}
    </details>
  );
}
