import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content";
import { art } from "@/lib/art";
import { googleCalendarUrl } from "@/lib/calendar";
import { getSiteContent } from "@/lib/content";
import { formatDayMonth, tie } from "@/lib/format";
import { isPastDeadline } from "@/lib/rsvp";
import { Tint } from "@/components/Tint";
import { RsvpForm } from "@/components/RsvpForm";
import { Closing } from "@/components/sections/Closing";
import "@/styles/rsvp.css";
import { Write } from "@/components/Write";

export const metadata: Metadata = {
  title: `Potvrdiť účasť · ${site.couple.first} & ${site.couple.second}`,
  description: `Dajte nám vedieť, či prídete na svadbu ${site.dateLabel}.`,
};

// Re-check the deadline hourly.
export const revalidate = 3600;

/** The last stop of the invitation's road: a short cover, the answer in steps, the invitation beside it. */
export default async function RsvpPage() {
  const content = await getSiteContent();
  const { places, rsvp } = content;
  const closed = isPastDeadline(rsvp.deadline);
  const until = rsvp.deadline ? formatDayMonth(rsvp.deadline) : null;
  return (
    <>
      <main id="obsah" className="reply">
        <header className="reply__cover wrap">
          <div className="reply__intro">
            <p className="reply__kicker">
              <Write text="Posledná zastávka na ceste" mode="type" pace={34} />
            </p>
            <h1>
              <Write text="Prídete?" pace={70} />
            </h1>
            <p className="lead">
              <Write
                mode="prose"
                text={tie("Pozvánku už máte. Teraz je rad na vás: jedna odpoveď za celú domácnosť a my budeme vedieť, koľko stoličiek pristaviť k stolu. Zaberie to minútu.")}
              />
            </p>
            {until && <p className="reply__until">Odpoveď prosíme do {until}</p>}
          </div>
          <div className="reply__art" aria-hidden="true">
            <Tint className="sticker reply__envelope" src={art("sealed-envelope", "black")} c="peony" c2="butter" priority reveal={false} />
            <Tint className="sticker reply__bloom" src={art("rose-corner", "black")} c="apricot" c2="butter" eager reveal={false} />
          </div>
        </header>

        <section className="reply__body wrap" aria-label="Vaša odpoveď">
          <div className="reply__main">
            {closed ? (
              <div className="reply-end" role="status">
                <h2>Termín na odpoveď už uplynul.</h2>
                <p className="lead">
                  {rsvp.contact ? `Ozvite sa nám, prosím, priamo: ${rsvp.contact}.` : "Ozvite sa nám, prosím, priamo."}
                </p>
              </div>
            ) : (
              <RsvpForm contact={rsvp.contact} calendarUrl={googleCalendarUrl(content)} privacy={rsvp.privacy} />
            )}
          </div>

          <aside className="invite" aria-label="Na čo odpovedáte">
            <p className="invite__date">
              <span>{site.weekday}</span>
              <time dateTime={site.date}>{site.dateLabel}</time>
            </p>
            <dl className="invite__facts">
              <div>
                <dt>Sobáš</dt>
                <dd>
                  {places.church.name ?? "Kostol"}, {places.church.town}
                  {places.church.time && ` · ${places.church.time}`}
                </dd>
              </div>
              <div>
                <dt>Oslava</dt>
                <dd>
                  {places.venue.name ?? "Stodola"}, {places.venue.town}
                  {places.venue.time && ` · ${places.venue.time}`}
                </dd>
              </div>
              <div>
                <dt>Odpoveď</dt>
                <dd>{until ? `do ${until}, jedna za domácnosť` : "jedna za domácnosť"}</dd>
              </div>
            </dl>
            <Link className="link invite__link" href="/#program">
              Pozrieť program dňa
            </Link>
          </aside>
        </section>
      </main>
      <Closing />
    </>
  );
}
