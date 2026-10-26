import type { CSSProperties } from "react";
import { site } from "@/content";
import { getSiteContent } from "@/lib/content";
import { art } from "@/lib/art";
import { tie } from "@/lib/format";
import { Drawing } from "../Drawing";
import { Tint } from "../Tint";
import { RouteTimeline } from "../RouteTimeline";
import { Write, writeTime } from "../Write";

// A row's title is written first (at most 800 ms); its time, place and description are typed after it.
const titleTime = (title: string) => writeTime(tie(title), "pen", undefined, 600);

export async function Programme() {
  const { events } = await getSiteContent();
  return (
    <section className="prog" id="program" aria-labelledby="prog-h">
      <header className="prog__head" data-rv-group="">
        <h2 id="prog-h" className="rv rv--write">
          <Write text="Chvíle nášho dňa" />
        </h2>
        <Drawing className="sprig rv rv--ink" src={art("rose-border", "black")} style={{ "--d": "650ms" } as CSSProperties} />
        <p className="lead rv rv--write" style={{ "--d": "600ms" } as CSSProperties}>
          <Write mode="prose" text={tie("Jedna cesta, jeden deň: z kostola v Hlinnom do záhrady v Zlatníku. Časy doplníme, len čo budú isté.")} />
        </p>
      </header>
      <RouteTimeline>
        <ol className="tl">
          {events.map((e, i) => (
            // Each row waits for the road: it reveals as it crosses 70 % of the viewport, where the road's drawn end is.
            <li className="ev" key={e.id} data-rv-group="" data-rv-margin="0px 0px -30% 0px" data-rv-threshold="0">
              <div className={`ev__txt rv ${i % 2 ? "rv--right" : "rv--left"}`} style={{ "--d": "90ms" } as CSSProperties}>
                <h3>
                  <Write text={tie(e.title)} budget={600} />
                </h3>
                {/* Without a time the lead's „Časy doplníme“ speaks for every row; only a relative time is shown. */}
                {e.time ? (
                  <p className="ev__time">
                    <time dateTime={`${site.date}T${e.time}`}>
                      <Write text={e.time} mode="type" start={titleTime(e.title) + 120} />
                    </time>
                  </p>
                ) : (
                  e.relativeTime && (
                    <p className="ev__time ev__time--pending">
                      <Write text={tie(e.relativeTime)} mode="type" pace={34} start={titleTime(e.title) + 120} />
                    </p>
                  )
                )}
                <p className="ev__place">
                  <Write mode="prose" text={tie(e.place)} start={titleTime(e.title) + 300} />
                </p>
                <p className="ev__desc">
                  <Write mode="prose" text={tie(e.description)} budget={850} start={titleTime(e.title) + 550} />
                </p>
              </div>
              {e.playlist && (
                <div className={`ev__playlist rv rv--brush ${i % 2 ? "rv--left" : "rv--right"}`} style={{ "--d": "700ms" } as CSSProperties}>
                  <h4>{e.playlist.title}</h4>
                  <p>{tie(e.playlist.note)}</p>
                  <a className="btn ev__playlist-btn" href={e.playlist.url} target="_blank" rel="noopener noreferrer">
                    <SpotifyLogo />
                    {e.playlist.label}
                  </a>
                </div>
              )}
              <div className="ev__mark">
                <div className="ev__disc" data-landmark>
                  <Tint className="sticker" src={art(e.drawing, "black")} c={e.tint[0]} c2={e.tint[1]} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </RouteTimeline>
    </section>
  );
}

function SpotifyLogo() {
  return (
    <svg className="ev__playlist-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
      />
    </svg>
  );
}
