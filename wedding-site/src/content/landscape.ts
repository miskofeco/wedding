import type { LatLng } from "./types";

// What lies around the route, for the drawn map's background, [lat, lng].
// OpenStreetMap via Nominatim, Oct 2026: village and town nodes, named hills
// (natural=peak), the Ondava and the two Domaša reservoirs, simplified.

/**
 * Villages in the frame, drawn as grey house plans along a street. `street` is
 * the bearing the houses line up along (degrees from north): drawn, not
 * surveyed. Villages on a mapped road take their street from the road instead.
 */
export const villages: { name: string; at: LatLng; houses: number; street: number; onRoad?: boolean }[] = [
  { name: "Hlinné", at: [48.9510051, 21.5788503], houses: 34, street: 0, onRoad: true },
  { name: "Soľ", at: [48.9269553, 21.5982919], houses: 26, street: 150, onRoad: true },
  { name: "Rudlov", at: [48.9226749, 21.5745746], houses: 16, street: 120 },
  { name: "Jastrabie n. T.", at: [48.9387276, 21.6064609], houses: 14, street: 160 },
  { name: "Čaklov", at: [48.9074038, 21.6280664], houses: 20, street: 130, onRoad: true },
  { name: "Komárany", at: [48.9204103, 21.642176], houses: 12, street: 100 },
  { name: "Nižný Kručov", at: [48.9113648, 21.6533614], houses: 14, street: 60 },
  { name: "Čičava", at: [48.9237326, 21.66352], houses: 16, street: 20 },
  { name: "Merník", at: [48.9479265, 21.6417173], houses: 14, street: 170 },
  { name: "Vyšný Kazimír", at: [48.9392197, 21.6810547], houses: 14, street: 140 },
  { name: "Benkovce", at: [48.9497032, 21.7100035], houses: 12, street: 10 },
  { name: "Slovenská Kajňa", at: [48.9666667, 21.7], houses: 18, street: 160 },
  { name: "Kvakovce", at: [48.9882392, 21.6720918], houses: 12, street: 120 },
  { name: "Michalok", at: [48.991714, 21.6330735], houses: 12, street: 30 },
  { name: "Vyšný Žipov", at: [48.9845673, 21.5884591], houses: 14, street: 100 },
];

/** The town whose plan fills the bottom right; the Topľa runs through it. */
export const town = { name: "Vranov nad Topľou", at: [48.8891513, 21.6822318] as LatLng };

/** Named hills; the ridges around the valley are wooded, so each carries a grove. */
export const hills: { name: string; at: LatLng }[] = [
  { name: "Barvienky", at: [48.9841227, 21.5316618] },
  { name: "Byrotka", at: [48.9763043, 21.5140563] },
  { name: "Ivanov vrch", at: [48.9474085, 21.5051472] },
  { name: "Hlavačka", at: [48.9357898, 21.5422144] },
  { name: "Čulkov", at: [48.9219949, 21.5091171] },
  { name: "Bartáková", at: [48.8989784, 21.5318341] },
  { name: "Oblá", at: [48.8852801, 21.5173469] },
  { name: "Valenčica", at: [48.891044, 21.5568001] },
  { name: "Drina", at: [48.8860921, 21.570183] },
  { name: "Vrch hory", at: [48.9992759, 21.5917478] },
  { name: "Krajná hora", at: [48.9934683, 21.6059218] },
  { name: "Húšťavy", at: [48.972323, 21.6006165] },
  { name: "Krajná hora", at: [48.9860973, 21.63038] },
  { name: "Stráň", at: [48.9550987, 21.618257] },
  { name: "Lipová", at: [48.9344527, 21.6280829] },
  { name: "Na horu", at: [48.9772914, 21.696349] },
  { name: "Hrebovka", at: [48.941515, 21.6983128] },
  { name: "Lysá hora", at: [48.9270976, 21.6930068] },
  { name: "Chrasť", at: [48.9150408, 21.6844844] },
  { name: "Inovec", at: [48.9259558, 21.7258852] },
];

/** The Ondava below the Domaša dam, north to south; it leaves the frame on the east. */
export const ondavaRiver: LatLng[] = [
  [48.9994014, 21.6971728],
  [48.9926122, 21.7065502],
  [48.9811514, 21.6986678],
  [48.9751496, 21.7043875],
  [48.9625624, 21.7080206],
  [48.9592534, 21.7128092],
  [48.962583, 21.7213871],
  [48.9558967, 21.7174904],
  [48.9475238, 21.7229256],
  [48.9468333, 21.7169995],
  [48.9395262, 21.7296579],
  [48.9395929, 21.7224256],
  [48.9368608, 21.7205026],
  [48.9226995, 21.7402869],
];

/** Malá Domaša, the small reservoir under the dam. */
export const malaDomasa: LatLng[] = [
  [48.9820949, 21.6977697],
  [48.9670633, 21.7042687],
  [48.9680321, 21.7084375],
  [48.9861029, 21.7001197],
];

/** The southern tip of Veľká Domaša, closed off beyond the top edge. */
export const velkaDomasa: LatLng[] = [
  [49.0263283, 21.7050603],
  [49.0201805, 21.6853363],
  [49.0184839, 21.6726283],
  [49.0149708, 21.6854427],
  [49.0006948, 21.695125],
  [49.0051487, 21.7103134],
  [49.0160121, 21.7118195],
];
