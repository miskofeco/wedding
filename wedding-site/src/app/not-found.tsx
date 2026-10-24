import Link from "next/link";

export default function NotFound() {
  return (
    <main id="obsah" className="wrap" style={{ display: "grid", gap: 20, justifyItems: "start", padding: "clamp(64px, 12vw, 160px) var(--gutter)" }}>
      <h1 style={{ fontSize: "var(--text-h2)" }}>Táto stránka neexistuje.</h1>
      <p className="lead">Možno ste sa pomýlili v adrese. Pozvánka je o krok späť.</p>
      <Link className="btn btn--solid" href="/">
        Späť na pozvánku
      </Link>
    </main>
  );
}
