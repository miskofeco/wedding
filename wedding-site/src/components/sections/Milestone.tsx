import type { CSSProperties } from "react";
import { site } from "@/content";
import { art } from "@/lib/art";
import { CalendarMenu } from "../CalendarMenu";
import { Countdown } from "../Countdown";
import { Tint } from "../Tint";

/** Where the road leaves the hero: a milestone with the days left and a way to save the date. */
export function Milestone() {
  return (
    <section className="milestone" aria-label="Odpočítavanie do svadby">
      <div className="milestone__stone">
        <Tint className="sticker milestone__art" src={art("save-the-date", "black")} c="peony" c2="butter" />
        <Countdown date={site.date} dateLabel={site.dateLabel} />
        <CalendarMenu className="rv" style={{ "--d": "160ms" } as CSSProperties} />
      </div>
    </section>
  );
}
