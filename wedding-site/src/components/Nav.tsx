"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { id: "program", label: "Program" },
  { id: "miesta", label: "Miesta" },
  { id: "farby", label: "Farby" },
  { id: "ubytovanie", label: "Ubytovanie" },
  { id: "otazky", label: "Otázky" },
] as const;

// Sections without a link of their own keep the underline on the link they belong to.
const partOf: Record<string, string> = { prosby: "miesta", mapa: "miesta" };

export function Nav({ mark }: { mark: string }) {
  const pathname = usePathname();
  const home = pathname === "/";
  const onRsvp = pathname === "/rsvp";
  const base = home ? "" : "/";
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const links = useRef<HTMLUListElement>(null);

  // Underline the section in the middle of the viewport.
  useEffect(() => {
    if (!home) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setCurrent(partOf[e.target.id] ?? e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" },
    );
    document.querySelectorAll("main section[id]").forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [home]);

  // One underline slides to the current section's link (motion.css draws it from these values).
  useEffect(() => {
    const ul = links.current;
    if (!ul) return;
    const place = () => {
      const a = current ? ul.querySelector<HTMLElement>(`a[href$="#${current}"]`) : null;
      if (!a) return ul.removeAttribute("data-bar");
      ul.style.setProperty("--bar-x", `${a.offsetLeft}px`);
      ul.style.setProperty("--bar-y", `${a.offsetTop + a.offsetHeight - 5}px`);
      ul.style.setProperty("--bar-w", String(a.offsetWidth));
      ul.setAttribute("data-bar", "");
    };
    place();
    const resize = new ResizeObserver(place);
    resize.observe(ul);
    return () => resize.disconnect();
  }, [current]);

  // Escape closes the menu and returns focus to its button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <nav className="nav" aria-label="Hlavná navigácia">
        <div className="wrap nav__inner">
          <a className="nav__mark" href={home ? "#uvod" : "/"}>
            {mark.split("&").map((part, i) => (
              <Fragment key={i}>
                {i > 0 && <span className="nav__amp">&amp;</span>}
                {part}
              </Fragment>
            ))}
          </a>
          <ul className="nav__links" ref={links}>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`${base}#${s.id}`} aria-current={current === s.id ? "true" : undefined}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <Link className="btn nav__cta" href="/rsvp" aria-current={onRsvp ? "page" : undefined}>
            Potvrdiť účasť
          </Link>
          <button
            ref={menuButton}
            type="button"
            className="btn nav__menu"
            aria-expanded={open}
            aria-controls="menu-panel"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Zavrieť" : "Menu"}
          </button>
        </div>
      </nav>
      <div className="menu-panel" id="menu-panel" hidden={!open}>
        {sections.map((s, i) => (
          <a key={s.id} href={`${base}#${s.id}`} style={{ "--i": i } as CSSProperties} onClick={() => setOpen(false)}>
            {s.label}
          </a>
        ))}
        <Link
          href="/rsvp"
          aria-current={onRsvp ? "page" : undefined}
          style={{ "--i": sections.length } as CSSProperties}
          onClick={() => setOpen(false)}
        >
          Potvrdiť účasť
        </Link>
      </div>
    </>
  );
}
