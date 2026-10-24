import type { Place } from "./types";

// Hlinné has three churches; the couple confirmed the Sacred Heart one (Roman Catholic).
// `at`: the addresses geocoded on OpenStreetMap (Nominatim), Oct 2026.
export const places: Record<Place["id"], Place> = {
  church: {
    id: "church",
    title: ["Sobáš", "v Hlinnom"],
    town: "Hlinné",
    name: "Kostol Najsvätejšieho Srdca Ježišovho",
    address: "Hlinné 8, 094 35 Hlinné",
    time: null,
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Kostol+Najsv%C3%A4tej%C5%A1ieho+Srdca+Je%C5%BEi%C5%A1ovho+Hlinn%C3%A9+8%2C+094+35+Hlinn%C3%A9",
    at: [48.95217, 21.58077],
  },
  venue: {
    id: "venue",
    title: ["Oslava", "v Zlatníku"],
    town: "Zlatník",
    name: "Stodola Zlatník",
    address: "Zlatník 28, 094 33 Zlatník",
    time: null,
    mapUrl: "https://share.google/ls1YExMm0Hoebozki",
    at: [48.96848, 21.54797],
  },
};
