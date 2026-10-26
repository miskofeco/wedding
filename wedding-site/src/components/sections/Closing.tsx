import type { CSSProperties } from "react";
import { site } from "@/content";
import { art } from "@/lib/art";
import { Drawing } from "../Drawing";
import { Names, Write } from "../Write";

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
      <Drawing className="close__garland rv rv--ink" src={art("garland", "white")} />
      <p className="close__thanks rv rv--write" style={d(300)}>
        <Write text="Tešíme sa na vás." pace={40} />
      </p>
      {/* The names are signed slowly, the ampersand last; the date is typed under the signature. */}
      <h2 className="close__names rv rv--write" style={d(900)}>
        <Names first={couple.first} second={couple.second} pace={64} />
      </h2>
      <p className="close__date rv rv--write" style={d(2300)}>
        <Write text={`${site.dateLabel} · Hlinné · Zlatník`} mode="type" pace={34} />
      </p>
      <ul className="close__links rv rv--brush" style={d(2900)}>
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
