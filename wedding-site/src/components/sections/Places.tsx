import type { CSSProperties } from "react";
import { getSiteContent } from "@/lib/content";
import type { Place } from "@/content/types";
import { art } from "@/lib/art";
import { tie } from "@/lib/format";
import { Drawing } from "../Drawing";
import { Write, writeTime } from "../Write";

/** Name, address and time, one per line; the time line waits until there is a time. */
function details(place: Place): string[] {
  const name = place.name ?? (place.id === "church" ? "Kostol upresníme" : "Miesto upresníme");
  return [name, place.address, place.time && `od ${place.time}`].filter((line): line is string => Boolean(line));
}

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

// Panels reveal as groups (the text rises, the cropped drawing is pushed into frame 120 ms later);
// panels that enter together follow each other 120 ms apart (data-rv-stagger).
const group = { "data-rv-group": "", "data-rv-threshold": "0.2" };

function PlacePanel({ place, drawing }: { place: Place; drawing: string }) {
  return (
    <div className="panel" {...group}>
      <div className="rv">
        {/* Lines as blocks, not <br>, so the heading reads „Sobáš v Hlinnom“ and not „Sobášv Hlinnom“. */}
        <h3>
          <span className="panel__line">
            <Write text={place.title[0]} />
          </span>{" "}
          <span className="panel__line">
            <Write text={tie(place.title[1])} start={Math.round(writeTime(place.title[0]) * 0.7)} />
          </span>
        </h3>
        <p className="panel__sub">
          {details(place).map((line, i) => (
            <span className="panel__line" key={line}>
              <Write mode="line" text={line} start={620 + i * 300} />
            </span>
          ))}
        </p>
      </div>
      <Drawing className="panel__art rv" src={drawing} />
      <div className="panel__foot rv rv--brush" style={d(1450)}>
        {place.mapUrl ? (
          <a className="btn" href={place.mapUrl} target="_blank" rel="noopener noreferrer">
            Otvoriť mapu<span className="sr-only"> (otvorí sa v novom okne)</span>
          </a>
        ) : (
          <a className="btn" href="#mapa">
            Pozrieť na mape
          </a>
        )}
        <span className="pill">{place.town}</span>
      </div>
    </div>
  );
}

export async function Places() {
  const { places } = await getSiteContent();
  return (
    <section className="trip" id="miesta" aria-label="Miesta" data-rv-stagger="120">
      <PlacePanel place={places.church} drawing={art("church", "apricot")} />
      <div className="panel panel--mid" style={{ "--c": "var(--apricot)" } as CSSProperties} {...group}>
        <Drawing className="panel__art rv" src={art("couple-kiss", "ivory")} />
      </div>
      <PlacePanel place={places.venue} drawing={art("barn", "sage")} />
    </section>
  );
}
