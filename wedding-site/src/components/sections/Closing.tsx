import type { CSSProperties } from "react";
import { site } from "@/content";
import { art } from "@/lib/art";
import { Drawing } from "../Drawing";

const links = [
  { href: "/#program", label: "Program" },
  { href: "/#miesta", label: "Miesta" },
  { href: "/#ubytovanie", label: "Ubytovanie" },
  { href: "/#otazky", label: "Otázky" },
  { href: "/rsvp", label: "Potvrdiť účasť" },
];

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** The last page of the book: the garland stamps, the rest rises in one short chain. */
export function Closing() {
  const { couple } = site;
  return (
    // The page ends here, so the chain starts as soon as a fifth of the footer shows.
    <footer className="close" data-rv-group="" data-rv-margin="0px" data-rv-threshold="0.2">
      <Drawing className="corner" src={art("rose-corner", "white")} />
      <Drawing className="close__garland rv rv--stamp" src={art("garland", "white")} />
      <p className="close__thanks rv" style={d(80)}>
        Tešíme sa na vás.
      </p>
      <h2 className="close__names rv" style={d(160)}>
        {couple.first} <span className="amp">&amp;</span> {couple.second}
      </h2>
      <p className="close__date rv" style={d(240)}>
        {site.dateLabel} · Hlinné · Zlatník
      </p>
      <ul className="close__links rv" style={d(320)}>
        {links.map((l) => (
          <li key={l.href}>
            <a className="link" href={l.href}>
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
