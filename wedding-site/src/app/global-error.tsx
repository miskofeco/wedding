"use client";

/** When the root layout itself fails: no fonts or site styles, so it carries its own. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="sk">
      <body style={{ margin: 0, background: "#ffffff", color: "#111111", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ display: "grid", gap: 20, justifyItems: "start", maxWidth: 640, padding: "clamp(64px, 12vw, 160px) 24px" }}>
          <h1 style={{ margin: 0, fontSize: "2rem" }}>Niečo sa pokazilo.</h1>
          <p style={{ margin: 0, fontSize: "1.125rem" }}>Stránka sa nenačítala. Skúste to, prosím, znova.</p>
          <button
            type="button"
            onClick={reset}
            style={{ minHeight: 48, padding: "12px 24px", border: 0, borderRadius: 999, background: "#111111", color: "#ffffff", font: "inherit", cursor: "pointer" }}
          >
            Skúsiť znova
          </button>
        </main>
      </body>
    </html>
  );
}
