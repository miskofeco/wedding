import type { CSSProperties } from "react";
import Link from "next/link";
import { getSiteContent } from "@/lib/content";
import { art } from "@/lib/art";
import { tie } from "@/lib/format";
import { Drawing } from "../Drawing";
import { Write } from "../Write";

export async function Faq() {
  const { faq } = await getSiteContent();
  return (
    <section className="faq" id="otazky" aria-labelledby="faq-h">
      <div className="wrap">
        <div className="sec-head" data-rv-group="">
          <h2 id="faq-h" className="rv rv--write">
            <Write text="Časté otázky" />
          </h2>
          <Drawing className="sprig rv rv--ink" src={art("rose-border", "black")} style={{ "--d": "760ms" } as CSSProperties} />
          <p className="lead rv rv--write" style={{ "--d": "600ms" } as CSSProperties}>
            <Write mode="prose" text="Ak tu odpoveď nenájdete, napíšte nám. Radi odpovieme." />
          </p>
          <p className="rv rv--brush" style={{ "--d": "1500ms" } as CSSProperties}>
            <Link className="btn" href="/rsvp#odkaz" style={{ "--c": "var(--peony)" } as CSSProperties}>
              Napísať nám
            </Link>
          </p>
        </div>
        <div className="faq__list" data-rv-stagger="50">
          {faq.map((q) => (
            <details className="rv rv--brush" key={q.question}>
              <summary>{tie(q.question)}</summary>
              <p>
                <Write mode="prose" text={q.answer ? tie(q.answer) : "Odpoveď doplníme."} budget={1100} />
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
