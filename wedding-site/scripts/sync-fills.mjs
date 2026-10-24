// Regenerates public/fills/<name>.png: the garment of a figure drawing as a
// white-on-transparent mask, used as a CSS mask so the palette section can
// colour the suit or dress (see PaletteStory).
// Each fill floods the enclosed white areas around the seeds. The pack's
// outlines are filled paths, so the area is bounded by the rendered ink; where a
// drawing is open (the bride's train), `walls` are invisible lines that close it.
// Source and crop come from the drawing's entry in art-manifest.json, so the
// mask lines up with public/art/black/<name>.svg.
// sharp comes with Next.js; it is not a direct dependency.
import { createRequire } from "node:module";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require = createRequire(createRequire(import.meta.url).resolve("next/package.json"));
const sharp = require("sharp");
const packDir = path.resolve(root, "../doodles/whimsical");
const outDir = path.join(root, "public/fills");
const manifest = JSON.parse(await readFile(path.join(root, "art-manifest.json"), "utf8"));
const N = 1080;

const fills = [
  {
    name: "groom-walk",
    // jacket panels, lapels, sleeves, pocket flaps, trousers
    seeds: [[499, 263], [562, 412], [476, 368], [600, 268], [689, 385], [453, 387], [469, 439], [607, 444], [511, 656], [533, 679]],
  },
  {
    name: "bride-bouquet",
    // bodice, skirt, train
    seeds: [[585, 260], [590, 450], [600, 800], [300, 900], [880, 900]],
    // the waist under the arm, the front, the train and hem, the back with its buttons
    walls: [[[526, 352], [580, 358], [620, 366], [625, 378], [637, 440], [647, 500], [662, 550], [697, 620], [752, 690], [790, 742], [845, 774], [898, 786], [940, 798], [950, 820], [918, 834], [892, 850], [882, 870], [897, 890], [940, 902], [964, 917], [954, 937], [900, 939], [864, 947], [854, 966], [850, 987], [820, 997], [795, 992], [745, 1030], [690, 1034], [608, 1037], [570, 1052], [545, 1047], [520, 1017], [470, 1030], [430, 1032], [385, 1037], [340, 1030], [295, 1037], [268, 1014], [225, 1006], [160, 1012], [100, 993], [86, 963], [104, 936], [155, 916], [186, 903], [183, 894], [150, 891], [100, 907], [85, 889], [96, 864], [150, 851], [215, 853], [250, 842], [234, 823], [190, 828], [176, 810], [200, 785], [300, 790], [372, 766], [385, 762], [362, 757], [348, 746], [364, 728], [412, 710], [446, 680], [468, 648], [502, 600], [529, 560], [544, 515], [546, 470], [538, 455], [530, 400], [526, 352]]],
    // below the waist nothing lies outside the outermost strokes of its row
    clipFromY: 560,
  },
  {
    name: "groom-dance",
    // jacket with both sleeves, trousers
    seeds: [[371, 481], [254, 712]],
  },
  {
    name: "groom-portrait",
    // jacket and sleeves
    seeds: [[350, 650], [800, 700], [250, 800], [700, 900]],
    // the sketchy outline is traced instead: shoulders, sleeves, round the cuff and hand, the frame's bottom edge
    walls: [[[410, 442], [360, 458], [298, 490], [278, 500], [265, 560], [252, 630], [240, 690], [225, 750], [210, 800], [197, 850], [190, 900], [198, 935], [240, 958], [300, 992], [352, 1022], [364, 1000], [370, 905], [400, 888], [430, 902], [480, 888], [522, 898], [562, 903], [572, 932], [566, 982], [555, 1000], [560, 1034], [889, 1034], [886, 870], [878, 790], [866, 710], [852, 630], [838, 550], [826, 495], [770, 462], [688, 438], [640, 396], [462, 396], [410, 442]]],
    // the shirt between the lapels, reaching above the top wall so no sliver of it stays at the neck
    erase: [[[444, 370], [645, 370], [630, 398], [615, 470], [595, 560], [585, 640], [575, 720], [552, 815], [545, 815], [515, 740], [478, 600], [458, 500], [456, 410], [446, 404]]],
  },
  {
    name: "bride-champagne",
    // bodice, skirt
    seeds: [[450, 720], [450, 920], [600, 950], [300, 990]],
    // neckline, bodice sides, skirt, the frame's bottom edge
    walls: [[[352, 630], [400, 662], [440, 640], [470, 632], [510, 638], [552, 650], [546, 675], [530, 720], [515, 770], [500, 808], [512, 815], [560, 840], [610, 880], [650, 930], [697, 1000], [705, 1036], [238, 1036], [245, 1000], [270, 950], [310, 890], [350, 850], [380, 822], [375, 800], [358, 740], [350, 690], [352, 630]]],
  },
  {
    name: "bride-stand",
    // gown, bodice
    seeds: [[363, 808], [537, 373]],
  },
];

async function alphaOf(svg) {
  const { data } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const a = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) a[i] = data[i * 4 + 3];
  return a;
}

function dilate(src, r) {
  const tmp = new Uint8Array(N * N), dst = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let v = 0;
    for (let d = -r; d <= r && !v; d++) { const xx = x + d; if (xx >= 0 && xx < N && src[y * N + xx]) v = 1; }
    tmp[y * N + x] = v;
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let v = 0;
    for (let d = -r; d <= r && !v; d++) { const yy = y + d; if (yy >= 0 && yy < N && tmp[yy * N + x]) v = 1; }
    dst[y * N + x] = v;
  }
  return dst;
}

await mkdir(outDir, { recursive: true });
for (const f of fills) {
  const d = manifest.drawings.find((x) => x.name === f.name);
  if (!d) throw new Error(`${f.name} is not in art-manifest.json`);
  const raw = await readFile(path.join(packDir, d.source), "utf8");
  const ink = (await alphaOf(raw.replace(/<svg/, `<svg width="${N}" height="${N}"`))).map((v) => (v > 100 ? 1 : 0));
  const lines = (f.walls ?? []).map((w) => `<polyline points="${w.join(" ")}" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`);
  const walls = (await alphaOf(`<svg xmlns="http://www.w3.org/2000/svg" width="${N}" height="${N}">${lines.join("")}</svg>`)).map((v) => (v > 60 ? 1 : 0));

  // Close hairline gaps in the ink, then flood from the seeds.
  const wall = dilate(ink, 2);
  for (let i = 0; i < N * N; i++) if (walls[i]) wall[i] = 1;
  const fill = new Uint8Array(N * N);
  const stack = new Int32Array(N * N);
  for (const [sx, sy] of f.seeds) {
    const s = sy * N + sx;
    if (wall[s]) throw new Error(`${f.name}: seed ${sx},${sy} is on a line`);
    let sp = 0;
    stack[sp++] = s;
    fill[s] = 1;
    while (sp) {
      const p = stack[--sp], x = p % N, y = (p / N) | 0;
      for (const q of [x > 0 ? p - 1 : -1, x < N - 1 ? p + 1 : -1, y > 0 ? p - N : -1, y < N - 1 ? p + N : -1])
        if (q >= 0 && !wall[q] && !fill[q]) { fill[q] = 1; stack[sp++] = q; }
    }
  }
  // Grow under the lines so no white seam shows, never past them.
  let grown = fill;
  for (let k = 0; k < 5; k++) {
    const d = dilate(grown, 1);
    for (let i = 0; i < N * N; i++) if (d[i] && !grown[i] && !wall[i]) d[i] = 0;
    grown = d;
  }
  if (f.clipFromY != null) {
    for (let y = f.clipFromY; y < N; y++) {
      let l = N, r = -1;
      for (let x = 0; x < N; x++) if (ink[y * N + x]) { if (x < l) l = x; r = x; }
      for (let x = 0; x < N; x++) if (x < l || x > r) grown[y * N + x] = 0;
    }
  }
  if (f.erase) {
    // areas inside the traced outline that are not garment (a shirt front)
    const shapes = f.erase.map((e) => `<polygon points="${e.join(" ")}"/>`);
    const erase = await alphaOf(`<svg xmlns="http://www.w3.org/2000/svg" width="${N}" height="${N}">${shapes.join("")}</svg>`);
    for (let i = 0; i < N * N; i++) if (erase[i] > 60) grown[i] = 0;
  }

  const mask = Buffer.alloc(N * N * 4);
  for (let i = 0; i < N * N; i++) if (grown[i]) mask.writeUInt32BE(0xffffffff, i * 4);
  let img = sharp(mask, { raw: { width: N, height: N, channels: 4 } });
  if (d.crop) {
    const [left, top, width, height] = d.crop.box;
    img = sharp(await img.extract({ left, top, width, height }).png().toBuffer());
  }
  await img
    .png({ compressionLevel: 9, palette: true, colours: 2 })
    .toFile(path.join(outDir, `${f.name}.png`));
}
console.log(`Wrote ${fills.length} fills in public/fills`);
