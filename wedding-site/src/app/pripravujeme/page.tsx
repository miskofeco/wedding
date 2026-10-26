import { site } from "@/content";
import { art } from "@/lib/art";
import { CalendarMenu } from "@/components/CalendarMenu";
import { Drawing } from "@/components/Drawing";
import { Tint } from "@/components/Tint";
import { Names, Write } from "@/components/Write";
import "@/styles/soon.css";

/**
 * „Pripravujeme“: one screen that production shows in place of every guest page
 * while content/launch.ts says so (next.config.ts does the rewrite). A save-the-date
 * in the hero's language; the road draws itself and the wedding car drives in.
 */
export default function ComingSoon() {
  const { couple } = site;
  return (
    <main id="obsah" className="soon">
      <Tint className="sticker soon__bloom soon__bloom--left" src={art("rose-corner", "black")} c="apricot" c2="butter" eager reveal={false} />
      <Tint
        className="sticker soon__art"
        src={art("couple-cool", "black")}
        alt="Kreslená nevesta a ženích v slnečných okuliaroch"
        c="peony"
        c2="butter"
        priority
        reveal={false}
      />
      <Tint className="sticker soon__bloom soon__bloom--right" src={art("ranunculus-bouquet", "black")} c="sage" c2="peony" eager reveal={false} />
      {/* The page says what it is: the kicker is typed, then the names are written in. */}
      <p className="soon__kicker">
        <Write text="Pozvánka sa ešte kreslí" mode="type" caret />
      </p>
      <h1>
        <Names first={couple.first} second={couple.second} />
      </h1>
      <p className="soon__date">
        <time dateTime={site.date}>
          <Write text={site.dateLabel} mode="type" />
        </time>
      </p>
      <p className="soon__where">
        <Write mode="prose" text={site.where} />
      </p>
      <p className="soon__intro">
        <Write mode="prose" text="Program, miesta aj potvrdenie účasti sem pridáme čoskoro. Dovtedy si, prosím, nechajte tento deň voľný." />
      </p>
      <CalendarMenu className="soon__cal" />
      <div className="soon__road" aria-hidden="true">
        <span className="soon__car">
          <Drawing src={art("car-vintage", "black")} eager />
        </span>
      </div>
    </main>
  );
}
