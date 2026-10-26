// Regenerates public/fills/gown-<n>.png: the dress of the n-th woman (from the
// left) in public/gowns.svg as a white-on-transparent mask, used as a CSS mask
// so the palette section can colour one dress at a time (see PaletteStory).
// Each fill floods the enclosed white areas around the seeds. The drawing's
// outlines are filled paths, so the area is bounded by the rendered ink, thickened
// to close the small gaps between strokes; where a gap is wider, `walls` are
// invisible lines that close it. Seeds are in the drawing's own coordinates. A
// dress is split into pieces by arms, ribbons and bouquet, so each piece has one.
// sharp comes with Next.js; it is not a direct dependency.
import { createRequire } from "node:module";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require = createRequire(createRequire(import.meta.url).resolve("next/package.json"));
const sharp = require("sharp");
const outDir = path.join(root, "public/fills");
const source = await readFile(path.join(root, "public/gowns.svg"), "utf8");
const [ox, oy, vw, vh] = source.match(/viewBox="([^"]+)"/)[1].split(" ").map(Number);
// Rendered at twice the drawing's size so the mask edge stays sharp on retina screens.
const K = 2, W = vw * K, H = vh * K;
const CLOSE = 6;

const gowns = [
  // skirt, bodice with sleeves, between arm and bouquet, through the bouquet, under it, at the hip
  { seeds: [[190, 719], [188, 377], [150, 433], [180, 443], [230, 488], [276, 490]] },
  // skirt, bodice, beside both arms, through the bouquet, at the hip, the back panel of the skirt
  { seeds: [[349, 713], [338, 384], [307, 425], [363, 451], [384, 479], [342, 491], [415, 435], [427, 502], [441, 671]] },
  // the bride: skirt and train, bodice, beside the arm, through the bouquet, between the ribbons
  { seeds: [[545, 783], [516, 400], [569, 427], [494, 468], [523, 484], [554, 491], [542, 459], [505, 508], [529, 564], [506, 575]] },
  // skirt, bodice, beside both arms, through the bouquet, between the ribbons
  { seeds: [[700, 700], [675, 377], [731, 413], [617, 429], [667, 457], [637, 473], [649, 556]] },
  // skirt, bodice, beside both arms, through the bouquet, at the hip
  { seeds: [[840, 700], [838, 389], [786, 425], [893, 427], [811, 453], [811, 493], [849, 489], [759, 486]] },
  // dress, between arm and bouquet, through the bouquet
  { seeds: [[1022, 652], [1081, 433], [1050, 444]] },
];
// The fold between the fourth and fifth skirts stops short of the hem.
const walls = [[[821, 876], [818, 900]]];

async function alphaOf(svg) {
  const { data } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const a = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) a[i] = data[i * 4 + 3];
  return a;
}

function dilate(src, r) {
  const tmp = new Uint8Array(W * H), dst = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = 0;
    for (let d = -r; d <= r && !v; d++) { const xx = x + d; if (xx >= 0 && xx < W && src[y * W + xx]) v = 1; }
    tmp[y * W + x] = v;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = 0;
    for (let d = -r; d <= r && !v; d++) { const yy = y + d; if (yy >= 0 && yy < H && tmp[yy * W + x]) v = 1; }
    dst[y * W + x] = v;
  }
  return dst;
}

const neighbours = (p) => {
  const x = p % W, y = (p / W) | 0;
  return [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1];
};
// With the corners too, so the growth reaches as far as the square dilation did.
const around = (p) => {
  const x = p % W, y = (p / W) | 0, out = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const xx = x + dx, yy = y + dy;
    if ((dx || dy) && xx >= 0 && xx < W && yy >= 0 && yy < H) out.push(yy * W + xx);
  }
  return out;
};

const ink = (await alphaOf(source.replace(/width="[^"]+" height="[^"]+"/, `width="${W}" height="${H}"`))).map((v) => (v > 100 ? 1 : 0));
const lines = walls.map((w) => `<polyline points="${w.join(" ")}" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`);
const drawn = await alphaOf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ox} ${oy} ${vw} ${vh}" width="${W}" height="${H}">${lines.join("")}</svg>`);
const line = ink.map((v, i) => (v || drawn[i] > 60 ? 1 : 0));
const wall = dilate(line, CLOSE);

await mkdir(outDir, { recursive: true });
const stack = new Int32Array(W * H);
for (const [n, g] of gowns.entries()) {
  const fill = new Uint8Array(W * H);
  for (const [sx, sy] of g.seeds) {
    const s = Math.round((sy - oy) * K) * W + Math.round((sx - ox) * K);
    if (wall[s]) throw new Error(`gown ${n + 1}: seed ${sx},${sy} is on a line`);
    let sp = 0;
    stack[sp++] = s;
    fill[s] = 1;
    while (sp) for (const q of neighbours(stack[--sp])) if (q >= 0 && !wall[q] && !fill[q]) { fill[q] = 1; stack[sp++] = q; }
  }
  // Grow back out to the strokes and one pixel under them, so no white seam shows;
  // colour spreads from open paper only, never across a stroke.
  let edge = [];
  for (let p = 0; p < W * H; p++) if (fill[p]) edge.push(p);
  for (let k = 0; k <= CLOSE; k++) {
    const next = [];
    for (const p of edge) {
      if (line[p]) continue;
      for (const q of around(p)) if (!fill[q]) { fill[q] = 1; next.push(q); }
    }
    edge = next;
  }

  const mask = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) if (fill[i]) mask.writeUInt32BE(0xffffffff, i * 4);
  await sharp(mask, { raw: { width: W, height: H, channels: 4 } })
    .png({ compressionLevel: 9, palette: true, colours: 2 })
    .toFile(path.join(outDir, `gown-${n + 1}.png`));
}
console.log(`Wrote ${gowns.length} fills in public/fills`);
