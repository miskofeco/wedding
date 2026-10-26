import type { CSSProperties } from "react";
import Link from "next/link";
import { getSiteContent } from "@/lib/content";
import { art } from "@/lib/art";
import { formatDayMonth, tie } from "@/lib/format";
import { Drawing } from "../Drawing";
import { Write } from "../Write";

export async function RsvpCta() {
  const { rsvp } = await getSiteContent();
  return (
    // The band reveals as one: the envelope slides in from its cropped corner, the rose follows, the text rises.
    <section className="rsvp" id="rsvp" aria-labelledby="rsvp-h" data-rv-group="" data-rv-threshold="0.25">
      <Drawing className="corner rv rv--ink" src={art("rose-corner", "white")} />
      <Drawing className="rsvp__envelope rv" src={art("sealed-envelope", "white")} />
      <div className="wrap">
        <h2 id="rsvp-h" className="rv rv--write" style={{ "--d": "350ms" } as CSSProperties}>
          <Write text="Prídete?" />
        </h2>
        <p className="lead rv rv--write" style={{ "--d": "600ms" } as CSSProperties}>
          <Write
            mode="prose"
            text={
              rsvp.deadline
                ? tie(`Dajte nám, prosím, vedieť do ${formatDayMonth(rsvp.deadline)}. Potvrdenie zaberie minútu.`)
                : "Dajte nám, prosím, vedieť, či prídete. Potvrdenie zaberie minútu."
            }
          />
        </p>
        <p className="rv rv--brush" style={{ "--d": "1350ms" } as CSSProperties}>
          <Link className="btn btn--solid" href="/rsvp">
            Potvrdiť účasť
          </Link>
        </p>
      </div>
    </section>
  );
}
