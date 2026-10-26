import type { PaletteColour } from "./types";

// Meanings and the dress-code stance in `paletteIntro` are proposals to confirm.
export const paletteIntro =
  "Volá sa Májová záhrada. Každá farba v nej má na svadbe svoje miesto. Ak sa chcete zladiť, budeme radi. Podmienka to nie je.";

// In this order the colours dress the women in public/gowns.svg from the left, the bride third.
export const palette: PaletteColour[] = [
  { colour: "sage", name: "Šalviová", meaning: "Zeleň záhrady a obrúsky na stoloch." },
  { colour: "peony", name: "Pivonková", meaning: "Kvety v kyticiach a na stoloch." },
  { colour: "apricot", name: "Marhuľová", meaning: "Fasáda kostola v Hlinnom." },
  { colour: "butter", name: "Masložltá", meaning: "Májové slnko a lúčne kvety." },
  { colour: "linen", name: "Prírodný ľan", meaning: "Drevo stodoly a ľanové obrusy." },
  { colour: "blue", name: "Holubia modrá", meaning: "Večerná obloha nad stodolou." },
];
