import type { CSSProperties } from "react";
import { churchToBarn, churchToVranov, stays, toplaRiver } from "@/content";
import { getSiteContent } from "@/lib/content";
import type { Place, Stay } from "@/content/types";
import { art } from "@/lib/art";
import { formatKm, tie } from "@/lib/format";
import { projection, smoothPath } from "@/lib/geo";
import { MapCar } from "../MapCar";
import { Write } from "../Write";

// A verified link when the couple confirms it; until then, the village itself
// (a real place, not a guessed address).
const mapsSearch = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const mapHref = (p: Place) => p.mapUrl ?? mapsSearch(`${p.town}, okres Vranov nad Topľou`);
const mapLabel = (p: Place, what: string) => (p.mapUrl ? `Navigovať ${what}` : `${p.town} v Mapách Google`);

// 70 px per km with the church at (428, 427) fits barn (NW) and Vranov (SE) in the frame.
const PX_PER_KM = 70;
const SCALE_KM = 1;

/**
 * The drawn map, to scale and north up: every landmark sits on its geocoded
 * address and the roads follow the real driving routes (see content/routes.ts).
 * Penzión Škorpión is 250 m from the church, so it gets a leader line.
 */
export async function Journey() {
  const { events, places } = await getSiteContent();
  const { church, venue } = places;
  const ceremony = events[0];
  const project = projection(church.at, [428, 427], PX_PER_KM);
  const [cx, cy] = project(church.at);
  const [bx, by] = project(venue.at);
  const mapped = stays.filter((s): s is Stay & { at: NonNullable<Stay["at"]> } => s.at !== null);
  const pension = mapped.find((s) => s.town === "Hlinné");
  const hotel = mapped.find((s) => s.town !== "Hlinné");
  const road = smoothPath(churchToBarn.map(project));
  const vranovRoad = smoothPath(churchToVranov.map(project));
  const river = smoothPath(toplaRiver.map(project), 4);

  return (
    <section className="journey" id="mapa" aria-labelledby="journey-h">
      <div className="wrap">
        <div className="journey__head" data-rv-group="">
          <h2 id="journey-h" className="rv rv--write">
            <Write text={tie("Z Hlinného do Zlatníka")} />
          </h2>
          <p className="lead rv rv--write" style={{ "--d": "900ms" } as CSSProperties}>
            <Write
              mode="prose"
              text={tie(
                "Po obrade sa presunieme z kostola v Hlinnom do Stodoly Zlatník, 4,5 km autom. Mapa je v mierke: kostol, stodola aj miesta na prespanie ležia tam, kde naozaj sú. Na cestu si aj tak zapnite navigáciu.",
              )}
            />
          </p>
        </div>
      </div>

      {/* The figure reveals as one chain: labels fade, then church, barn, lanterns, north and scale stamp in turn. */}
      <figure className="journey__map" data-rv-group="" data-rv-threshold="0.1">
        <svg
          className="map"
          viewBox="0 0 1200 1000"
          role="group"
          aria-label="Mapa v mierke: kostol v Hlinnom, cesta autom do stodoly v Zlatníku a miesta na prespanie v Hlinnom a vo Vranove nad Topľou"
        >
          {/* MapCar draws both roads by scroll through these masks; without it they are never applied. */}
          <defs>
            <mask id="journey-road-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="1000">
              <path className="map__reveal" id="journey-road-reveal" d={road} pathLength={1} />
            </mask>
            <mask id="journey-minor-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="1000">
              <path className="map__reveal" id="journey-minor-reveal" d={vranovRoad} pathLength={1} />
            </mask>
          </defs>
          <path className="map__river map__fade" d={river} />
          <text className="map__note map__note--river map__fade" x="640" y="560">
            Topľa
          </text>

          {/* roads: white band, dashed centre, like the programme's road */}
          <path className="map__road-band map__road-band--minor" d={vranovRoad} />
          <path className="map__road map__road--minor" id="journey-minor" d={vranovRoad} />
          <path className="map__road-band" d={road} />
          <path className="map__road" id="journey-road" d={road} />

          <text className="map__note map__fade" x={cx + 26} y={cy - 172}>
            4,5 km
          </text>
          <text className="map__note map__fade" x="566" y="716" textAnchor="end">
            11,7 km
          </text>

          {/* north and scale, top right and bottom left where the land is empty */}
          <g className="map__north map__fade" aria-hidden="true" style={{ "--d": "750ms" } as CSSProperties}>
            <path d="M1110 150 L1110 64 M1094 84 L1110 64 L1126 84" />
            <text x="1110" y="186" textAnchor="middle">
              S
            </text>
          </g>
          <g className="map__scale map__fade" aria-hidden="true" style={{ "--d": "750ms" } as CSSProperties}>
            <path d={`M70 930 v-12 M70 924 h${SCALE_KM * PX_PER_KM} M${70 + SCALE_KM * PX_PER_KM} 930 v-12`} />
            <text x={70 + SCALE_KM * PX_PER_KM + 14} y="932">
              1 km
            </text>
          </g>

          <a data-stop="barn" href={mapHref(venue)} target="_blank" rel="noopener noreferrer" aria-label={`Zlatník, stodola: ${mapLabel(venue, "do stodoly")}`}>
            <ellipse className="map__hit" cx={bx} cy={by - 110} rx="140" ry="150" />
            <image
              href={art("barn", "black")}
              x={bx - 105}
              y={by - 212}
              width="210"
              height="210"
              className="map__img map__lm map__lm--barn map__stamp"
              style={{ "--d": "300ms" } as CSSProperties}
            />
            <text className="map__town map__fade" x={bx} y={by - 236} textAnchor="middle">
              Zlatník
            </text>
            <text className="map__sub map__fade" x={bx} y={by + 40} textAnchor="middle">
              stodola · oslava
            </text>
          </a>
          <circle className="map__pulse" cx={bx} cy={by} r="14" aria-hidden="true" />
          <circle className="map__pin map__drop" data-stop="barn" cx={bx} cy={by} r="8" style={{ "--d": "300ms" } as CSSProperties} />

          <a data-stop="church" href={mapHref(church)} target="_blank" rel="noopener noreferrer" aria-label={`Hlinné, kostol: ${mapLabel(church, "ku kostolu")}`}>
            <ellipse className="map__hit" cx={cx - 100} cy={cy + 70} rx="130" ry="110" />
            <image
              href={art("church", "black")}
              x={cx - 196}
              y={cy - 12}
              width="170"
              height="170"
              className="map__img map__lm map__stamp"
              style={{ "--d": "150ms" } as CSSProperties}
            />
            <text className="map__town map__fade" x={cx - 206} y={cy + 52} textAnchor="end">
              Hlinné
            </text>
            <text className="map__sub map__fade" x={cx - 206} y={cy + 86} textAnchor="end">
              kostol · obrad
            </text>
          </a>
          <circle className="map__pin map__drop" data-stop="church" cx={cx} cy={cy} r="8" style={{ "--d": "150ms" } as CSSProperties} />

          {pension && <StayMark stay={pension} at={project(pension.at)} offset={[70, -82]} delay={450} />}
          {hotel && <StayMark stay={hotel} at={project(hotel.at)} offset={[-40, -170]} short="Vranov n. T." delay={600} />}

          <MapCar
            pathId="journey-road"
            sideRoadId="journey-minor"
            src={art("car-vintage", "black")}
            size={116}
            parked={project(churchToBarn[6])}
          />
        </svg>
        <figcaption className="sr-only">
          Mapa je v mierke, sever hore. Kostol v Hlinnom, stodola v Zlatníku 4,5 km severozápadne, Penzión Škorpión pri
          kostole v Hlinnom a Hotel Patriot vo Vranove nad Topľou 11,7 km juhovýchodne.
        </figcaption>
      </figure>

      <div className="wrap">
        <ul className="journey__stops" data-rv-stagger="90">
          <li className="rv" data-stop="church" style={{ "--c": "var(--apricot)" } as CSSProperties}>
            <h3>
              <Write text="Hlinné" />
            </h3>
            <p>
              {church.name ?? "Kostol"}
              {church.address && <span className="journey__addr">{church.address}</span>}
            </p>
            <p className="journey__when">Obrad{ceremony?.time && ` · ${ceremony.time}`}</p>
            <a className="link" href={mapHref(church)} target="_blank" rel="noopener noreferrer">
              {mapLabel(church, "ku kostolu")}
              <span className="sr-only"> (otvorí sa v novom okne)</span>
            </a>
          </li>
          <li className="rv" data-stop="barn" style={{ "--c": "var(--sage)" } as CSSProperties}>
            <h3>
              <Write text="Zlatník" />
            </h3>
            <p>
              {venue.name ?? "Stodola"}
              {venue.address && <span className="journey__addr">{venue.address}</span>}
            </p>
            <p className="journey__when">Oslava, záhrada a&nbsp;jazierko · {venue.time ? `od ${venue.time}` : "po obrade"}</p>
            <a className="link" href={mapHref(venue)} target="_blank" rel="noopener noreferrer">
              {mapLabel(venue, "do stodoly")}
              <span className="sr-only"> (otvorí sa v novom okne)</span>
            </a>
          </li>
          <li className="rv" data-stop="stay" style={{ "--c": "var(--white)" } as CSSProperties}>
            <h3>
              <Write text="Nocľah" />
            </h3>
            {stays.map((s) => (
              <p key={s.name}>
                {s.name}
                <span className="journey__addr">
                  {s.address ?? s.town}
                  {s.distanceKm !== null && ` · ${formatKm(s.distanceKm)} od stodoly`}
                </span>
              </p>
            ))}
            <a className="link" href="#ubytovanie">
              Pozrieť ubytovanie
            </a>
          </li>
        </ul>
      </div>

    </section>
  );
}

/** A place to sleep: a pin on its address, a lantern beside it and a dotted leader between them. */
function StayMark({
  stay,
  at: [x, y],
  offset: [dx, dy],
  short,
  delay,
}: {
  stay: Stay;
  at: [number, number];
  offset: [number, number];
  short?: string;
  /** When its lantern stamps in the map's reveal chain, in ms. */
  delay: number;
}) {
  const lx = x + dx;
  const ly = y + dy;
  const d = { "--d": `${delay}ms` } as CSSProperties;
  return (
    <>
      <path className="map__leader map__fade" d={`M${x} ${y} L${lx + 14} ${ly + 70}`} style={d} />
      <a data-stop="stay" href="#ubytovanie" aria-label={`Nocľah: ${stay.name}, ${stay.town}. Pozrieť ubytovanie`}>
        <ellipse className="map__hit" cx={lx + 120} cy={ly + 40} rx="150" ry="70" />
        <image
          href={art("lantern", "black")}
          x={lx - 30}
          y={ly - 20}
          width="96"
          height="96"
          className="map__img map__lm map__stamp"
          style={d}
        />
        {short && (
          <text className="map__town map__town--small map__fade" x={lx + 62} y={ly + 4}>
            {short}
          </text>
        )}
        <text
          className={short ? "map__sub map__sub--strong map__fade" : "map__town map__town--small map__fade"}
          x={lx + 62}
          y={short ? ly + 38 : ly + 22}
        >
          {stay.mapName}
        </text>
        <text className="map__sub map__fade" x={lx + 62} y={short ? ly + 68 : ly + 54}>
          nocľah{stay.distanceKm !== null && ` · ${formatKm(stay.distanceKm)}`}
        </text>
      </a>
      <circle className="map__pin map__pin--stay map__drop" data-stop="stay" cx={x} cy={y} r="7" style={d} />
    </>
  );
}
