"use client";

import Link from "next/link";

/** Anything that breaks while a page renders. Shows no details; the server log has them. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="obsah" className="wrap" style={{ display: "grid", gap: 20, justifyItems: "start", padding: "clamp(64px, 12vw, 160px) var(--gutter)" }}>
      <h1 style={{ fontSize: "var(--text-h2)" }}>Niečo sa pokazilo.</h1>
      <p className="lead">Stránka sa nenačítala celá. Skúste to, prosím, znova.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <button className="btn btn--solid" type="button" onClick={reset}>
          Skúsiť znova
        </button>
        <Link className="btn" href="/">
          Späť na pozvánku
        </Link>
      </div>
    </main>
  );
}
