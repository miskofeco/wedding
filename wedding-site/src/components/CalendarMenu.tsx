import type { CSSProperties } from "react";
import { googleCalendarUrl } from "@/lib/calendar";
import { getSiteContent } from "@/lib/content";
import { AppleLogo, GoogleLogo } from "./CalendarLogos";
import { Disclosure } from "./Disclosure";

/** The butter „Pridať do kalendára“ disclosure: Google, Apple and an .ics for the rest. */
export async function CalendarMenu({ className, style }: { className?: string; style?: CSSProperties }) {
  const calendarUrl = googleCalendarUrl(await getSiteContent());
  return (
    <Disclosure className={["cal", className].filter(Boolean).join(" ")} style={style}>
      <summary className="btn cal__toggle">Pridať do kalendára</summary>
      <div className="cal__drop">
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
      </div>
    </Disclosure>
  );
}
