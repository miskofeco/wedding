import type { CSSProperties } from "react";
import { palette, paletteIntro } from "@/content";
import { tie } from "@/lib/format";
import { PaletteStory } from "../PaletteStory";
import { Write } from "../Write";

export function Palette() {
  return (
    <section className="pal" id="farby" aria-labelledby="pal-h">
      <div className="wrap">
        <div className="pal__copy" data-rv-group="">
          <h2 id="pal-h" className="rv rv--write">
            <Write text="Farby nášho dňa" />
          </h2>
          <p className="lead rv rv--write" style={{ "--d": "400ms" } as CSSProperties}>
            <Write mode="prose" text={tie(paletteIntro)} />
          </p>
          <p className="pal__hint rv rv--write" style={{ "--d": "1050ms" } as CSSProperties}>
            <span className="pal__hint--hover">
              <Write mode="prose" text={tie("Prejdite myšou po farbách a vyskúšajte si ich.")} />
            </span>
            <span className="pal__hint--tap">
              <Write mode="prose" text={tie("Ťuknite na farbu a vyskúšajte si ju.")} />
            </span>
          </p>
        </div>
        <PaletteStory palette={palette} />
      </div>
    </section>
  );
}
