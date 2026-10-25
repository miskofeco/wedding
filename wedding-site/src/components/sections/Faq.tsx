import type { CSSProperties } from "react";
import Link from "next/link";
import { getSiteContent } from "@/lib/content";
import { art } from "@/lib/art";
import { Drawing } from "../Drawing";

export async function Faq() {
  const { faq } = await getSiteContent();
  return (
    <section className="faq" id="otazky" aria-labelledby="faq-h">
      <div className="wrap">
        <div className="sec-head rv">
          <h2 id="faq-h">Časté otázky</h2>
          <Drawing className="sprig" src={art("rose-border", "black")} />
          <p className="lead">Ak tu odpoveď nenájdete, napíšte nám. Radi odpovieme.</p>
          <p className="rv" style={{ "--d": "240ms" } as CSSProperties}>
            <Link className="btn" href="/rsvp#odkaz" style={{ "--c": "var(--peony)" } as CSSProperties}>
              Napísať nám
            </Link>
          </p>
        </div>
        <div className="faq__list" data-rv-stagger="50">
          {faq.map((q) => (
            <details className="rv" key={q.question}>
              <summary>{q.question}</summary>
              <p>{q.answer ?? "Odpoveď doplníme."}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
