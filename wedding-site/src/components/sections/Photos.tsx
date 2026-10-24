import Image from "next/image";
import type { CSSProperties } from "react";
import { photos } from "@/content";
import { art } from "@/lib/art";
import { Drawing } from "../Drawing";

export function Photos() {
  return (
    <section className="photos" id="fotky" aria-labelledby="ph-h">
      <div className="wrap">
        <div className="photos__head rv">
          <h2 id="ph-h">Naše chvíle doteraz</h2>
          <Drawing className="sprig" src={art("rose-border", "black")} />
          <p className="lead">Pár momentov z cesty, ktorá nás priviedla až sem.</p>
          <Drawing className="photos__cam rv rv--stamp" src={art("camera", "black")} />
        </div>
        <div className="photos__row">
          {photos.map((p, i) => (
            // The cards land one after another, the dropped middle one last.
            <figure className="rv" key={p.alt} style={{ "--d": `${[0, 280, 140][i] ?? i * 140}ms` } as CSSProperties}>
              <div className="photos__frame">
                <Image
                  src={p.src}
                  alt={p.alt}
                  placeholder="blur"
                  sizes={i === 2 ? "(max-width: 760px) 100vw, 33vw" : "(max-width: 760px) 50vw, 33vw"}
                  quality={80}
                />
              </div>
              <figcaption>{p.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
