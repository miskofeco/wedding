"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    __revealReady?: boolean;
  }
}

const DEFAULT_MARGIN = "0px 0px -10% 0px";
const DEFAULT_THRESHOLD = 0.15;

/**
 * Adds `.in` to each `.rv` element once it scrolls into view, once.
 *
 * - `data-rv-margin` / `data-rv-threshold` override the observer options
 *   (tall figures, rows that wait for the road).
 * - `data-rv-group` reveals as one: the group is observed, and it and every
 *   `.rv` inside it get `.in` together; their `--d` delays set the order.
 * - `data-rv-stagger="50"` on a list: items that enter in the same frame get
 *   `--g` of 0, 50, 100 ms… (added to their own `--d`), so a long list reveals
 *   row by row and a group keeps its inner order.
 * - Two seconds after a reveal `data-rv-done` drops the delays, so later hovers
 *   on a revealed element answer at once.
 * - On a landing below the top (`html.land`), whatever is already on screen
 *   is shown at once, marked `data-rv-instant`, and only the rest animates.
 * - The first scroll sets `html.scrolled` (stops the hero road's march).
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    window.__revealReady = true;
    const html = document.documentElement;
    const observers = new Map<string, IntersectionObserver>();

    const timers: number[] = [];
    const reveal = (el: Element, instant = false) => {
      const targets = el.hasAttribute("data-rv-group") ? [el, ...el.querySelectorAll(".rv")] : [el];
      targets.forEach((t) => {
        if (instant) t.setAttribute("data-rv-instant", "");
        t.classList.add("in");
      });
      timers.push(window.setTimeout(() => targets.forEach((t) => t.setAttribute("data-rv-done", "")), 2000));
    };

    const onEntries = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      const shown = entries.filter((e) => e.isIntersecting).map((e) => e.target);
      const step = new Map<Element, number>();
      shown.forEach((el) => {
        const list = el.parentElement?.closest("[data-rv-stagger]");
        if (list) {
          const k = step.get(list) ?? 0;
          step.set(list, k + 1);
          (el as HTMLElement).style.setProperty("--g", `${k * Number(list.getAttribute("data-rv-stagger"))}ms`);
        }
        reveal(el);
        observer.unobserve(el);
      });
    };

    const observe = (el: Element) => {
      const margin = el.getAttribute("data-rv-margin") ?? DEFAULT_MARGIN;
      const threshold = Number(el.getAttribute("data-rv-threshold") ?? DEFAULT_THRESHOLD);
      const key = `${margin}|${threshold}`;
      let observer = observers.get(key);
      if (!observer) {
        observer = new IntersectionObserver((entries) => onEntries(entries, observer!), { rootMargin: margin, threshold });
        observers.set(key, observer);
      }
      observer.observe(el);
    };

    const pending = [
      ...document.querySelectorAll("[data-rv-group]:not(.in)"),
      ...[...document.querySelectorAll(".rv:not(.in)")].filter((el) => !el.closest("[data-rv-group]")),
    ];

    // Wait one frame so the browser (or the router) has scrolled to the hash.
    const frame = requestAnimationFrame(() => {
      const landed = html.classList.contains("land");
      const vh = window.innerHeight;
      pending.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (landed && r.bottom > 0 && r.top < vh) reveal(el, true);
        else observe(el);
      });
      html.classList.remove("land");
    });

    const scrolled = () => html.classList.add("scrolled");
    window.addEventListener("scroll", scrolled, { once: true, passive: true });

    return () => {
      cancelAnimationFrame(frame);
      timers.forEach((t) => window.clearTimeout(t));
      observers.forEach((o) => o.disconnect());
      window.removeEventListener("scroll", scrolled);
    };
  }, [pathname]);

  return null;
}

/**
 * Calls `onReveal` once the element gets `.in`; `instant` is true when it was
 * shown without animation (a landing below the top). Returns a cleanup.
 */
export function whenRevealed(el: Element, onReveal: (instant: boolean) => void): () => void {
  const check = () => {
    if (!el.classList.contains("in")) return false;
    onReveal(el.hasAttribute("data-rv-instant"));
    return true;
  };
  if (check()) return () => {};
  const mo = new MutationObserver(() => check() && mo.disconnect());
  mo.observe(el, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}
