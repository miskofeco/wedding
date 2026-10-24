import type { PaletteColour } from "./types";

// Meanings and the dress-code stance in `paletteIntro` are proposals to confirm.
export const paletteIntro =
  "Volá sa Májová záhrada. Každá farba v nej má na svadbe svoje miesto. Ak sa chcete zladiť, budeme radi. Podmienka to nie je.";

export const palette: PaletteColour[] = [
  { colour: "sage", name: "Šalviová", meaning: "Zeleň záhrady a obrúsky na stoloch.", figure: "groom-walk" },
  { colour: "peony", name: "Pivonková", meaning: "Kvety v kyticiach a na stoloch.", figure: "bride-bouquet" },
  { colour: "apricot", name: "Marhuľová", meaning: "Fasáda kostola v Hlinnom.", figure: "bride-champagne" },
  { colour: "butter", name: "Masložltá", meaning: "Májové slnko a lúčne kvety.", figure: "bride-stand" },
  { colour: "linen", name: "Prírodný ľan", meaning: "Drevo stodoly a ľanové obrusy.", figure: "groom-dance" },
  { colour: "blue", name: "Holubia modrá", meaning: "Večerná obloha nad stodolou.", figure: "groom-portrait" },
];
