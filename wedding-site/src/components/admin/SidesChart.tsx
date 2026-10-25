import type { CSSProperties } from "react";
import { SIDES, type Side, type SideSummary } from "@/lib/records";

const parts = [
  { key: "coming", label: "Prídu", tone: "coming" },
  { key: "declined", label: "Neprídu", tone: "declined" },
  { key: "waiting", label: "Čakáme", tone: "waiting" },
] as const;

/** People per side, split into coming / not coming / no reply yet. Stacked bars on one shared scale. */
export function SidesChart({ sides }: { sides: Record<Side | "none", SideSummary> }) {
  const rows = ([...(Object.keys(SIDES) as Side[]), "none"] as const)
    .map((k) => ({ key: k, label: k === "none" ? "Bez pozvánky" : SIDES[k], ...sides[k] }))
    .filter((r) => r.key !== "none" || r.coming + r.declined > 0);
  const max = Math.max(1, ...rows.map((r) => r.coming + r.declined + r.waiting));

  return (
    <div className="adm-bars">
      <ul className="adm-legend" aria-hidden="true">
        {parts.map((p) => (
          <li key={p.key}>
            <span className={`adm-swatch adm-swatch--${p.tone}`} />
            {p.label}
          </li>
        ))}
      </ul>
      <div className="adm-bars__rows" aria-hidden="true">
        {rows.map((r) => {
          const total = r.coming + r.declined + r.waiting;
          return (
            <div className="adm-bars__row" key={r.key}>
              <span className="adm-bars__label">{r.label}</span>
              <span className="adm-bars__track">
                <span className="adm-bars__fill" style={{ "--w": `${(total / max) * 100}%` } as CSSProperties}>
                  {parts.map((p) =>
                    r[p.key] > 0 ? (
                      <span
                        key={p.key}
                        className={`adm-bars__seg adm-bars__seg--${p.tone}`}
                        style={{ flexGrow: r[p.key] }}
                        title={`${r.label}: ${p.label.toLowerCase()} ${r[p.key]}`}
                      >
                        {r[p.key] / max > 0.07 ? r[p.key] : ""}
                      </span>
                    ) : null,
                  )}
                </span>
              </span>
              <span className="adm-bars__total">{total}</span>
            </div>
          );
        })}
      </div>
      <table className="sr-only">
        <caption>Ľudia podľa strany</caption>
        <thead>
          <tr>
            <th scope="col">Strana</th>
            {parts.map((p) => (
              <th scope="col" key={p.key}>
                {p.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <th scope="row">{r.label}</th>
              <td>{r.coming}</td>
              <td>{r.declined}</td>
              <td>{r.waiting}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
