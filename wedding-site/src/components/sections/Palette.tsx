import { palette, paletteIntro } from "@/content";
import { tie } from "@/lib/format";
import { PaletteStory } from "../PaletteStory";

export function Palette() {
  return (
    <section className="pal" id="farby" aria-labelledby="pal-h">
      <div className="wrap">
        <div className="pal__copy rv">
          <h2 id="pal-h">Farby nášho dňa</h2>
          <p className="lead">{tie(paletteIntro)}</p>
          <p className="pal__hint">
            <span className="pal__hint--hover">Prejdite myšou po farbách a&nbsp;vyskúšajte si ich.</span>
            <span className="pal__hint--tap">Ťuknite na farbu a&nbsp;vyskúšajte si ju.</span>
          </p>
        </div>
        <PaletteStory palette={palette} />
      </div>
    </section>
  );
}
