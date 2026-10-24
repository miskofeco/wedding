import type { Stay } from "./types";

// Nearest first; `distanceKm: null` hides the distance line. Addresses from the
// places' own sites, `at` geocoded on OpenStreetMap and distances by car to the
// barn (OSRM), Oct 2026.
export const stays: Stay[] = [
  {
    name: "Priamo v Stodole Zlatník",
    mapName: "V areáli",
    town: "Zlatník",
    address: "Zlatník 28",
    distanceKm: null,
    note: "Chatka (8 miest), maringotka (4 miesta) a izby v pôvodnom gazdovskom dome, primárne pre rodinu.",
    url: null,
    at: null,
  },
  {
    name: "Penzión Škorpión",
    mapName: "Penzión Škorpión",
    town: "Hlinné",
    address: "Hlinné 176, 094 35 Hlinné",
    distanceKm: 4.4,
    note: "Pár krokov od kostola.",
    url: "https://www.sakala.sk/penzion-skorpion/",
    at: [48.95385, 21.58269],
  },
  {
    name: "Hotel Patriot",
    mapName: "Hotel Patriot",
    town: "Vranov nad Topľou",
    address: "B. Němcovej 1, 093 01 Vranov nad Topľou",
    distanceKm: 15.8,
    note: null,
    url: "https://hotelpatriot.sk/",
    at: [48.88613, 21.67623],
  },
];
