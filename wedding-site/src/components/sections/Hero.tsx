import { Fragment, type CSSProperties } from "react";
import Link from "next/link";
import { site } from "@/content";
import { art } from "@/lib/art";
import { tie } from "@/lib/format";
import { Tint } from "../Tint";
import { Names, Write, writeTime } from "../Write";

/** Where each fact of the „where“ line starts: as the one before it is nearly down, so the line is inked in one go. */
const whereAt = (parts: string[], i: number) => parts.slice(0, i).reduce((t, p) => t + Math.round(writeTime(`${tie(p)}\u00a0·`, "line") * 0.6), 0);

export function Hero() {
  const { couple } = site;
  return (
    <section className="hero" id="uvod" aria-labelledby="names">
      <Tint className="sticker hero__bloom hero__bloom--left" src={art("rose-corner", "black")} c="apricot" c2="butter" eager reveal={false} />
      <Tint
        className="sticker hero__art"
        src={art("couple-cool", "black")}
        alt="Kreslená nevesta a ženích v slnečných okuliaroch"
        c="peony"
        c2="butter"
        priority
        reveal={false}
      />
      <Tint className="sticker hero__bloom hero__bloom--right" src={art("ranunculus-bouquet", "black")} c="sage" c2="peony" eager reveal={false} />
      {/* The names are inked, the ampersand last with a flourish; the date is inked under them. */}
      <h1 id="names">
        <Names first={couple.first} second={couple.second} />
      </h1>
      <p className="hero__date">
        <time dateTime={site.date}>
          <Write text={site.dateLabel} mode="line" />
        </time>
      </p>
      {/* Each fact keeps together, so lines break at the dots and never inside the church's name. */}
      <p className="hero__where">
        {site.where.split(" · ").map((part, i, all) => (
          <Fragment key={part}>
            {i > 0 && " "}
            <span>
              <Write mode="line" text={tie(part) + (i < all.length - 1 ? "\u00a0·" : "")} start={whereAt(all, i)} />
            </span>
          </Fragment>
        ))}
      </p>
      <p className="hero__intro">
        <Write mode="prose" text={tie(site.intro)} />
      </p>
      <div className="hero__actions">
        <a className="btn btn--solid" href="#program">
          Pozrieť program
        </a>
        <Link className="btn" href="/rsvp" style={{ "--c": "var(--sage)" } as CSSProperties}>
          Potvrdiť účasť
        </Link>
      </div>
      <div className="hero__road" aria-hidden="true" />
    </section>
  );
}
