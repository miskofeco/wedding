import type { CSSProperties } from "react";
import Link from "next/link";
import { getSiteContent } from "@/lib/content";
import { art } from "@/lib/art";
import { formatDayMonth } from "@/lib/format";
import { Drawing } from "../Drawing";

export async function RsvpCta() {
  const { rsvp } = await getSiteContent();
  return (
    // The band reveals as one: the envelope slides in from its cropped corner, the rose follows, the text rises.
    <section className="rsvp" id="rsvp" aria-labelledby="rsvp-h" data-rv-group="" data-rv-threshold="0.25">
      <Drawing className="corner rv rv--fade" src={art("rose-corner", "white")} />
      <Drawing className="rsvp__envelope rv" src={art("sealed-envelope", "white")} />
      <div className="wrap">
        <h2 id="rsvp-h" className="rv">
          Prídete?
        </h2>
        <p className="lead rv" style={{ "--d": "100ms" } as CSSProperties}>
          {rsvp.deadline
            ? `Dajte nám, prosím, vedieť do ${formatDayMonth(rsvp.deadline)}. Potvrdenie zaberie minútu.`
            : "Dajte nám, prosím, vedieť, či prídete. Potvrdenie zaberie minútu."}
        </p>
        <p className="rv" style={{ "--d": "200ms" } as CSSProperties}>
          <Link className="btn btn--solid" href="/rsvp">
            Potvrdiť účasť
          </Link>
        </p>
      </div>
    </section>
  );
}
