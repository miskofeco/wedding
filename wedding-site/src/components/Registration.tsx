"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Largest shift of the colour plates, in px. */
const REACH = 6;
/** Pointer distance (px) at which a plate reaches full shift. */
const RANGE = 420;

/**
 * The riso colour under every drawing on screen drifts off register as the mouse moves, away from the
 * pointer, the two plates in opposite directions, like layers of a print a few millimetres apart.
 * Sets `--rx` / `--ry` on each visible `.tint`; the plates' transform (components.css) uses them and its
 * transition smooths the motion. Mouse only, and only while motion is allowed (html.mo).
 */
export function Registration() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains("mo") || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const visible = new Map<HTMLElement, number>(); // tint → 1 or −1 when the drawing is mirrored
    const io = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        const el = target as HTMLElement;
        if (isIntersecting) visible.set(el, new DOMMatrixReadOnly(getComputedStyle(el).transform).a < 0 ? -1 : 1);
        else visible.delete(el);
      });
    });
    document.querySelectorAll<HTMLElement>(".tint").forEach((el) => io.observe(el));

    let x = 0;
    let y = 0;
    let frame = 0;
    const paint = () => {
      frame = 0;
      visible.forEach((mirror, el) => {
        const r = el.getBoundingClientRect();
        const dx = Math.max(-1, Math.min(1, (x - (r.left + r.width / 2)) / RANGE));
        const dy = Math.max(-1, Math.min(1, (y - (r.top + r.height / 2)) / RANGE));
        el.style.setProperty("--rx", `${(-dx * REACH * mirror).toFixed(2)}px`);
        el.style.setProperty("--ry", `${(-dy * REACH).toFixed(2)}px`);
      });
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    window.addEventListener("pointermove", move, { passive: true });

    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
      io.disconnect();
    };
  }, [pathname]);

  return null;
}
