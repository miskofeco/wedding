import type { CSSProperties } from "react";
import { site } from "@/content";
import { art } from "@/lib/art";
import { googleCalendarUrl } from "@/lib/calendar";
import { getSiteContent } from "@/lib/content";
import { AppleLogo, GoogleLogo } from "../CalendarLogos";
import { Countdown } from "../Countdown";
import { Tint } from "../Tint";

/** Where the road leaves the hero: a milestone with the days left and a way to save the date. */
export async function Milestone() {
  const calendarUrl = googleCalendarUrl(await getSiteContent());
  return (
    <section className="milestone" aria-label="Odpočítavanie do svadby">
      <div className="milestone__stone">
        <Tint className="sticker milestone__art" src={art("save-the-date", "black")} c="peony" c2="butter" />
        <Countdown date={site.date} dateLabel={site.dateLabel} />
        <details className="cal rv" style={{ "--d": "160ms" } as CSSProperties}>
          <summary className="btn cal__toggle">Pridať do kalendára</summary>
          <div className="cal__menu">
            <a className="btn cal__btn cal__btn--google" href={calendarUrl} target="_blank" rel="noopener noreferrer">
              <GoogleLogo />
              Google Kalendár<span className="sr-only"> (otvorí sa v novom okne)</span>
            </a>
            <a className="btn cal__btn cal__btn--apple" href="/svadba.ics" download="svadba-barbora-michal.ics">
              <AppleLogo />
              Apple Kalendár
            </a>
          </div>
          <a className="cal__other" href="/svadba.ics" download="svadba-barbora-michal.ics">
            Outlook a iné kalendáre (.ics)
          </a>
        </details>
      </div>
    </section>
  );
}
