/** Page title row: title, one line of context, and the page's actions on the right. */
export function PageHead({ title, sub, children }: { title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="adm-head">
      <div className="adm-head__text">
        <h1>{title}</h1>
        {sub && <p className="adm-head__sub">{sub}</p>}
      </div>
      {children && <div className="adm-head__actions">{children}</div>}
    </header>
  );
}

/** A problem or a reminder at the top of a page. `tone` picks the colour. */
export function Notice({ tone = "warn", children }: { tone?: "warn" | "info"; children: React.ReactNode }) {
  return (
    <div className={`adm-notice adm-notice--${tone}`} role={tone === "warn" ? "alert" : "status"}>
      {children}
    </div>
  );
}
