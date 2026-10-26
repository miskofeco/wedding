import type { SunDay } from "./types";

// Words for the golden-hour section („Zlatá hodina v Zlatníku“). The times and directions come from the generated
// content/sun.ts, so the sentences hold only what doesn't change with the data.

type Moment = Exclude<keyof SunDay["events"], "sunrise" | "noon">;

export interface LightPhase {
  /** Where the phase begins: the first minute of the section, or one of the evening's moments. */
  from: "start" | Moment;
  name: string;
  /** Shorter name on the sky's own label; null for none. */
  label: string | null;
  /** The phase's flat field in the sky, a colour token. */
  colour: "ivory" | "butter" | "apricot" | "peony" | "blue" | "olive";
  /** What it means for the guests, under the time in the readout. */
  say: string;
}

export const lightPhases: LightPhase[] = [
  { from: "start", name: "Podvečer", label: null, colour: "ivory", say: "Slnko je ešte vysoko nad sadom a hreje." },
  { from: "goldenStart", name: "Zlatá hodina", label: "Zlatá hodina", colour: "butter", say: "Slnko je nízko, tiene sú dlhé a teplé. Najkrajšie svetlo dňa." },
  { from: "behindHill", name: "Za kopcom", label: "Za kopcom", colour: "apricot", say: "Slnko zašlo za kopec na severozápade. Na dvore je mäkké svetlo bez tieňov a obloha ešte žiari." },
  { from: "sunset", name: "Západ slnka", label: "Západ", colour: "peony", say: "Slnko zapadá aj za rovným obzorom. Obloha na severozápade ešte svieti." },
  { from: "goldenEnd", name: "Modrá hodina", label: "Modrá hodina", colour: "blue", say: "Krátka chvíľa, keď je všetko modré." },
  { from: "civilDusk", name: "Súmrak", label: "Súmrak", colour: "olive", say: "Zotmie sa a v sade sa rozsvietia svetielka." },
];

/** The moments of the evening, listed on phones and for screen readers; `{moon}` is the moonrise. */
export const lightMoments: { at: Moment; colour: LightPhase["colour"]; text: string }[] = [
  { at: "goldenStart", colour: "butter", text: "Začína zlatá hodina, slnko je 6° nad obzorom." },
  { at: "behindHill", colour: "apricot", text: "Slnko zájde za kopec nad Zlatníkom (odhad podľa terénu)." },
  { at: "sunset", colour: "peony", text: "Západ slnka za rovným obzorom, na severozápade." },
  { at: "goldenEnd", colour: "blue", text: "Začína modrá hodina." },
  { at: "civilDusk", colour: "olive", text: "Zotmie sa, v sade sa rozsvietia svetielka." },
  { at: "night", colour: "olive", text: "Úplná tma. Mesiac vyjde až o {moon}, a ak bude jasno, uvidíte hviezdy." },
];

export const lightIntro = {
  title: "Zlatá hodina v Zlatníku",
  /** {sunset} and {hill} are filled in from the data. */
  lead: "Zlatník má zlato už v mene. 29. mája zapadá slnko o {sunset}, no za kopcom nad dedinou sa schová už okolo {hill}. Polhodina pred tým je najkrajšie svetlo celého dňa.",
  slider: "Posuňte čas a pozrite sa, kde bude slnko",
  whereTitle: "Odkiaľ bude svietiť",
  /** {azimuth} is the sunset's direction in degrees. */
  where: "Koncom mája zapadá slnko ďaleko na severozápade, na azimute {azimuth}°. Stodola má presklenú západnú stenu, takže do nej večer svieti a svetlo prejde šikmo cez sálu. Okolo ôsmej zájde slnko za kopec a dvor ostane v mäkkom svetle bez tieňov.",
};

/** Practical tips under the compass; {at22} and {low22} are the usual and the cool temperature at ten. */
export const lightTips: { title: string; text: string; drawing: "couple-cool" | "camera" | "lantern"; tint: ["peony" | "butter" | "blue", "butter" | "apricot" | "sage"] }[] = [
  { title: "Okuliare sa zídu", text: "Podvečer bude slnko nízko a priamo v očiach, keď sa pozriete na západ k jazierku a sadu.", drawing: "couple-cool", tint: ["peony", "butter"] },
  { title: "Fotky medzi 19:30 a 20:00", text: "Vtedy sú tiene dlhé a teplé. Po ôsmej je svetlo mäkké, dobré na portréty.", drawing: "camera", tint: ["butter", "apricot"] },
  { title: "Sveter do auta", text: "O desiatej večer býva v Zlatníku okolo {at22}\u00a0°C, v chladnejšie večery aj {low22}\u00a0°C.", drawing: "lantern", tint: ["blue", "sage"] },
];
