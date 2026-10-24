"use client";

import { useEffect } from "react";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 4); // close to --ease-out
const CANCEL = ["wheel", "touchstart", "keydown", "mousedown"] as const;

/**
 * In-page links scroll with one eased curve in every browser: 500–1100 ms by
 * distance, cancelled by any wheel, touch or key input. The hash updates on
 * arrival. With reduced motion or ?static the browser's instant jump stays.
 */
export function AnchorScroll() {
  useEffect(() => {
    const html = document.documentElement;
    let stop: (() => void) | null = null;

    const scrollTo = (target: HTMLElement, hash: string) => {
      stop?.();
      const offset =
        (parseFloat(getComputedStyle(html).scrollPaddingTop) || 0) +
        (parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
      const max = html.scrollHeight - window.innerHeight;
      const from = window.scrollY;
      const to = Math.min(max, Math.max(0, target.getBoundingClientRect().top + from - offset));
      const duration = Math.min(1100, Math.max(500, Math.abs(to - from) * 0.6));
      const start = performance.now();
      let frame = 0;

      const end = (arrived: boolean) => {
        cancelAnimationFrame(frame);
        CANCEL.forEach((t) => window.removeEventListener(t, cancel));
        stop = null;
        if (!arrived) return;
        history.replaceState(history.state, "", hash);
        // Move keyboard focus to the target, as a native anchor jump would.
        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "-1");
          target.setAttribute("data-anchor-focus", "");
          target.addEventListener(
            "blur",
            () => {
              target.removeAttribute("tabindex");
              target.removeAttribute("data-anchor-focus");
            },
            { once: true },
          );
        }
        target.focus({ preventScroll: true });
      };
      const cancel = () => end(false);
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        window.scrollTo({ top: from + (to - from) * easeOut(t), behavior: "instant" });
        if (t < 1) frame = requestAnimationFrame(tick);
        else end(true);
      };
      CANCEL.forEach((t) => window.addEventListener(t, cancel, { passive: true }));
      stop = cancel;
      frame = requestAnimationFrame(tick);
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (html.classList.contains("static") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const link = (e.target as Element | null)?.closest?.("a");
      const href = link?.getAttribute("href");
      if (!link || !href?.includes("#") || link.classList.contains("skip")) return;
      const url = new URL(href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      scrollTo(target, url.hash);
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      stop?.();
    };
  }, []);

  return null;
}
