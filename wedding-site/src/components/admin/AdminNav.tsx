"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

const items: { href: string; label: string; short: string; icon: IconName }[] = [
  { href: "/admin", label: "Prehľad", short: "Prehľad", icon: "overview" },
  { href: "/admin/odpovede", label: "Odpovede", short: "Odpovede", icon: "answers" },
  { href: "/admin/pozvani", label: "Pozvaní", short: "Pozvaní", icon: "invites" },
  { href: "/admin/zoznam", label: "Hostia a kuchyňa", short: "Hostia", icon: "people" },
  { href: "/admin/obsah", label: "Obsah webu", short: "Web", icon: "content" },
];

/** Section links; the same list is the sidebar on desktop and the tab bar on phones. */
export function AdminNav({ badges }: { badges: Record<string, number> }) {
  const path = usePathname();
  const current = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  return (
    <nav className="adm-nav" aria-label="Sekcie">
      <ul>
        {items.map((it) => (
          <li key={it.href}>
            <Link href={it.href} aria-current={current(it.href) ? "page" : undefined}>
              <Icon name={it.icon} />
              <span className="adm-nav__label">{it.label}</span>
              <span className="adm-nav__short" aria-hidden="true">
                {it.short}
              </span>
              {badges[it.href] ? <span className="adm-nav__badge">{badges[it.href]}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
