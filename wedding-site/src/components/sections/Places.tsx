import type { CSSProperties } from "react";
import { places } from "@/content";
import type { Place } from "@/content/types";
import { art } from "@/lib/art";
import { Drawing } from "../Drawing";

function details(place: Place): string {
  const name = place.name ?? (place.id === "church" ? "Kostol upresníme" : "Miesto upresníme");
  const parts = [name];
  if (place.address) parts.push(place.address);
  parts.push(place.time ? `od ${place.time}` : "Čas upresníme");
  return parts.join(" · ");
}

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

// Panels reveal as groups (the text rises, the cropped drawing is pushed into frame 120 ms later);
// panels that enter together follow each other 120 ms apart (data-rv-stagger).
const group = { "data-rv-group": "", "data-rv-threshold": "0.2" };

function PlacePanel({ place, drawing }: { place: Place; drawing: string }) {
  return (
    <div className="panel" {...group}>
      <div className="rv">
        <h3>
          {place.title[0]}
          <br />
          {place.title[1]}
        </h3>
        <p className="panel__sub">{details(place)}</p>
      </div>
      <Drawing className="panel__art rv" src={drawing} />
      <div className="panel__foot rv" style={d(60)}>
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

export function Places() {
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
