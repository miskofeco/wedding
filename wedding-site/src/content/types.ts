import type { StaticImageData } from "next/image";
import type { DrawingName } from "@/lib/art";

/** Palette „Májová záhrada“ colour names, as CSS token names. */
export type Colour = "white" | "ivory" | "sage" | "peony" | "apricot" | "butter" | "linen" | "blue";

/** Unconfirmed facts are `null`; components render a Slovak placeholder for them. */
export type Pending<T> = T | null;

/** [latitude, longitude] in decimal degrees (WGS 84). */
export type LatLng = [number, number];

export interface Couple {
  first: string;
  second: string;
  /** Short mark for the navigation, e.g. "B & M". */
  mark: string;
}

export interface Site {
  couple: Couple;
  /** ISO date of the wedding. */
  date: string;
  dateLabel: string;
  weekday: string;
  intro: string;
  /** Calendar event title, declined Slovak. */
  calendarTitle: string;
  /** Meta description, declined Slovak. */
  description: string;
  /** One line under the date in the hero. */
  where: string;
}

export interface ProgrammeEvent {
  id: string;
  title: string;
  /** "14:00" once confirmed. */
  time: Pending<string>;
  /** Shown instead of a time when the moment is relative, e.g. "Po obrade". */
  relativeTime?: string;
  place: string;
  description: string;
  drawing: DrawingName;
  /** Large and small tint behind the drawing. */
  tint: [Colour, Colour];
  /** Shared Spotify playlist shown beside the event, in the empty column. */
  playlist?: Playlist;
}

export interface Playlist {
  title: string;
  note: string;
  /** Button text. */
  label: string;
  /** Collaborative invite link; keep the `pt` token or guests can't add songs. */
  url: string;
}

export interface Place {
  id: "church" | "venue";
  /** Two-line panel title. */
  title: [string, string];
  town: string;
  name: Pending<string>;
  address: Pending<string>;
  time: Pending<string>;
  /** Verified map link only; never a guess. */
  mapUrl: Pending<string>;
  /** Geocoded address; places the landmark on the drawn map. */
  at: LatLng;
}

export interface PaletteColour {
  colour: Colour;
  name: string;
  meaning: string;
  /** The figure that tries the colour on in the palette section. Needs a garment mask from `npm run fills`. */
  figure: DrawingName;
}

export interface Photo {
  src: StaticImageData;
  alt: string;
  caption: Pending<string>;
}

export interface Stay {
  name: string;
  /** Short name on the drawn map. */
  mapName: string;
  town: string;
  address: Pending<string>;
  /** Driving distance to the barn. */
  distanceKm: Pending<number>;
  note: Pending<string>;
  url: Pending<string>;
  /** Geocoded address; `null` for beds in the barn's own grounds (shown on the venue plan instead). */
  at: Pending<LatLng>;
}

export interface Question {
  question: string;
  answer: Pending<string>;
}

/** One of the few things we ask of guests, in the order of the day. */
export interface Request {
  id: string;
  /** When in the day it applies, e.g. "Počas obradu". */
  when: string;
  title: string;
  text: string;
  drawing: DrawingName;
  /** Large and small tint behind the drawing. */
  tint: [Colour, Colour];
}

export interface Rsvp {
  /** ISO date; after it the form closes. */
  deadline: Pending<string>;
  /** How to reach the couple directly, e.g. a phone number or e-mail shown on the RSVP page. */
  contact: Pending<string>;
  /**
   * Under the send button: who sees the answer, who else gets part of it, where it is kept and when
   * it is deleted. The form adds how to ask for a correction or an earlier deletion, with `contact`.
   */
  privacy: string;
}
