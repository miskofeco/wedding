import type { CSSProperties } from "react";
import Link from "next/link";
import { site } from "@/content";
import { art } from "@/lib/art";
import { tie } from "@/lib/format";
import { Tint } from "../Tint";

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
      <h1 id="names">
        {couple.first} <span className="amp">&amp;</span> {couple.second}
      </h1>
      <p className="hero__date">
        <time dateTime={site.date}>{site.dateLabel}</time>
      </p>
      <p className="hero__where">{tie(site.where)}</p>
      <p className="hero__intro">{tie(site.intro)}</p>
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
