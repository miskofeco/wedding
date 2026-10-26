// Draws six women in evening gowns as ink line art, in the style of the site's drawings.
//
//   node planning/illustrations/women-dresses.mjs [outDir]
//
// Writes next to this script (and, given outDir, one SVG per woman into outDir):
//   women-dresses.svg        the line-up, dresses filled with the site palette
//   women-dresses-lines.svg  the line-up, lines only
//
// Each figure stands on a skeleton (head, shoulders, hips, knees, ankles, elbows, wrists)
// posed in contrapposto; arms and legs are outlined from that skeleton with anatomical
// width profiles, and every contour is a smooth spline. Lines are tapered brush strokes in
// currentColor (black by default). Each dress is a set of `class="dress"` shapes under the
// lines: recolour one by changing its fill here, in a vector editor, or with CSS, e.g.
// `#woman-2 .dress { fill: var(--sage) }`. Whatever lies in front of a part (hair over a
// shoulder, an arm over a skirt) hides it through a mask, so the figures stay transparent.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const INK = '#111111';

// Line weights.
const BOLD = 4.2;
const MAIN = 3.4;
const FINE = 2.2;
const HAIRLINE = 1.6;

// ---------------------------------------------------------------- geometry

const fmt = (n) => +n.toFixed(1);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Catmull-Rom spline through points as cubic Béziers. A point [x, y, 1] is a corner.
function spline(pts, closed = false) {
  const n = pts.length;
  const get = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  let d = `M${fmt(pts[0][0])},${fmt(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p1 = get(i);
    const p2 = get(i + 1);
    const p0 = p1[2] ? p1 : get(i - 1);
    const p3 = p2[2] ? p2 : get(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${fmt(c1[0])},${fmt(c1[1])} ${fmt(c2[0])},${fmt(c2[1])} ${fmt(p2[0])},${fmt(p2[1])}`;
  }
  return closed ? `${d} Z` : d;
}
const shape = (pts) => spline(pts, true);
const open = (d) => d.replace(/\s*Z\s*$/, '');

const mapPts = (pts, fn) => pts.map(([x, y, c]) => [...fn(x, y), ...(c ? [c] : [])]);
const flipPts = (pts) => mapPts(pts, (x, y) => [-x, y]);
const rotate = (x, y, deg, cx, cy) => {
  const r = (deg * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * Math.cos(r) - dy * Math.sin(r), cy + dx * Math.sin(r) + dy * Math.cos(r)];
};

// Samples an M/L/C/Z path into polylines, one per subpath, about every 3 units.
function sample(d) {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+/g);
  const lines = [];
  let pts = null;
  let cmd = null;
  let i = 0;
  let cur = [0, 0];
  let start = [0, 0];
  const num = () => +tokens[i++];
  while (i < tokens.length) {
    if (/[MLCZ]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === 'M') {
      cur = [num(), num()];
      start = cur;
      pts = [cur];
      lines.push(pts);
      cmd = 'L';
    } else if (cmd === 'L') {
      const p = [num(), num()];
      const n = Math.max(2, Math.ceil(Math.hypot(p[0] - cur[0], p[1] - cur[1]) / 3));
      for (let k = 1; k <= n; k++) pts.push([lerp(cur[0], p[0], k / n), lerp(cur[1], p[1], k / n)]);
      cur = p;
    } else if (cmd === 'C') {
      const a = [num(), num()];
      const b = [num(), num()];
      const p = [num(), num()];
      const approx = Math.hypot(a[0] - cur[0], a[1] - cur[1]) + Math.hypot(b[0] - a[0], b[1] - a[1]) + Math.hypot(p[0] - b[0], p[1] - b[1]);
      const n = Math.max(3, Math.ceil(approx / 3));
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        const u = 1 - t;
        pts.push([0, 1].map((j) => u * u * u * cur[j] + 3 * u * u * t * a[j] + 3 * u * t * t * b[j] + t * t * t * p[j]));
      }
      cur = p;
    } else if (cmd === 'Z') {
      pts.push(start);
      cur = start;
      cmd = null;
    }
  }
  return lines;
}

// A polyline resampled by arc length: at(u) gives the point and unit tangent at u in [0, 1].
function track(pts) {
  const s = [0];
  for (let k = 1; k < pts.length; k++) s.push(s[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  const len = s.at(-1);
  return (u) => {
    const target = clamp(u, 0, 1) * len;
    let k = 1;
    while (k < pts.length - 1 && s[k] < target) k++;
    const t = (target - s[k - 1]) / (s[k] - s[k - 1] || 1);
    const a = pts[k - 1];
    const b = pts[k];
    const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return { p: [lerp(a[0], b[0], t), lerp(a[1], b[1], t)], t: [(b[0] - a[0]) / tl, (b[1] - a[1]) / tl] };
  };
}

// Tapered brush strokes: thin at both ends, full in the middle, with a slow swell in width.
function brush(d, w) {
  return sample(d).flatMap((pts) => {
    const s = [0];
    for (let k = 1; k < pts.length; k++) s.push(s[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    const len = s.at(-1);
    if (len < 1) return [];
    const lead = Math.min(len * 0.3, 8 + w * 3);
    const tail = Math.min(len * 0.4, 14 + w * 4);
    const left = [];
    const right = [];
    pts.forEach((p, k) => {
      const a = pts[Math.max(0, k - 1)];
      const b = pts[Math.min(pts.length - 1, k + 1)];
      const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = -(b[1] - a[1]) / tl;
      const ny = (b[0] - a[0]) / tl;
      const k1 = Math.sqrt(clamp(Math.min(s[k] / lead, (len - s[k]) / tail), 0, 1));
      const half = (w / 2) * (0.18 + 0.82 * k1) * (0.86 + 0.28 * (0.5 + 0.5 * Math.sin(s[k] / 41 + p[0] / 37 + p[1] / 53)));
      left.push([p[0] + nx * half, p[1] + ny * half]);
      right.push([p[0] - nx * half, p[1] - ny * half]);
    });
    const f = ([x, y]) => `${fmt(x)},${fmt(y)}`;
    return [`M${left.map(f).join('L')}L${right.reverse().map(f).join('L')}Z`];
  });
}

// ---------------------------------------------------------------- parts
// A part is { region, ink, fill, solid }: `region` hides whatever lies behind the part,
// `ink` is a list of [path, width] strokes, `fill` a dress shape, `solid` filled ink shapes.
// Local coordinates: figure centred near x = 0, top of the head at y = 0, soles near y = 770.

const part = (region, ink = [], extra = {}) => ({ region: [].concat(region ?? []), ink, ...extra });

// Limb outline along a spline through `joints`. `widths` rows are [u, a, b]: half widths on
// the a side (+x for a limb running down the page) and the b side, at u along the limb.
function limb(joints, widths, n = 30) {
  const at = track(sample(spline(joints))[0]);
  const prof = (u) => {
    let k = 1;
    while (k < widths.length - 1 && widths[k][0] < u) k++;
    const [u0, a0, b0] = widths[k - 1];
    const [u1, a1, b1] = widths[k];
    const t = clamp((u - u0) / (u1 - u0), 0, 1);
    const e = t * t * (3 - 2 * t);
    return [lerp(a0, a1, e), lerp(b0, b1, e)];
  };
  const A = [];
  const B = [];
  for (let k = 0; k <= n; k++) {
    const { p, t } = at(k / n);
    const [wa, wb] = prof(k / n);
    A.push([p[0] + t[1] * wa, p[1] - t[0] * wa]);
    B.push([p[0] - t[1] * wb, p[1] + t[0] * wb]);
  }
  return { A, B, end: at(1) };
}

// Hand outlines in a wrist frame: u runs along the hand, v (in wrist half-widths) across it,
// from the a side round the fingertips to the b side; the thumb sits on the b side.
const HANDS = {
  open: [[5, 1.05], [13, 1.25], [22, 1.2], [31, 0.85], [38, 0.35], [40.5, -0.15], [37.5, -0.7], [30, -1.05], [22, -1.25], [16, -1.75], [10, -1.7], [4, -1.1]],
  rest: [[5, 1.05], [13, 1.25], [21, 1.15], [28, 0.8], [32, 0.25], [33, -0.3], [30, -0.85], [24, -1.15], [17, -1.6], [11, -1.65], [4, -1.1]],
  fist: [[5, 1.1], [12, 1.5], [19, 1.45], [24, 0.9], [25.5, 0], [24, -0.9], [19, -1.5], [12, -1.6], [5, -1.15]],
};
const HAND_HINT = { open: [[9, -1.05], [15, -0.95], [21, -1.2]], rest: [[9, -1.05], [14, -0.95], [19, -1.15]], fist: [[13, -1.2], [16, 0], [13, 1.2]] };

// Rows are [u, inner, outer] for the viewer's left arm.
const ARM_WIDTHS = [[0, 9.5, 11], [0.14, 8.6, 10], [0.3, 8, 8.6], [0.47, 6, 6.4], [0.6, 7, 7.2], [0.84, 4.8, 5], [1, 4.3, 4.5]];

// side: -1 for the viewer's left arm, 1 for the right. Returns the part and the shoulder tip.
function arm({ joints, hand = 'open', side }) {
  const widths = side < 0 ? ARM_WIDTHS : ARM_WIDTHS.map(([u, a, b]) => [u, b, a]);
  const { A, B, end } = limb(joints, widths);
  const hw = 4.9;
  const thumb = side < 0 ? -1 : 1; // thumb towards the body
  const n = [end.t[1], -end.t[0]];
  const toWorld = ([u, v]) => [end.p[0] + end.t[0] * u + n[0] * v * hw * thumb, end.p[1] + end.t[1] * u + n[1] * v * hw * thumb];
  let pts = HANDS[hand].map(toWorld);
  if (thumb < 0) pts = pts.reverse();
  const outline = [...A, ...pts, ...[...B].reverse()];
  const d = spline(outline);
  return {
    part: part(shape(outline), [[d, MAIN], [spline(HAND_HINT[hand].map(toWorld)), HAIRLINE]]),
    tip: side < 0 ? B[0] : A[0],
    A,
    B,
  };
}

// Pump seen from the front, relative to the ankle; turned by `angle` for a foot pointing out.
const PUMP = [[-8.5, 14, 1], [0, 19.5], [8.5, 14, 1], [9.6, 30], [5.5, 46], [0, 57, 1], [-5.5, 46], [-9.6, 30]];
const INSTEP = [[5.5, 0], [7.2, 9], [8.2, 17], [-8.2, 17], [-7.2, 9], [-5.5, 0]];
// Rows are [u, inner, outer] for the viewer's left leg; the calf swells on the outer side.
const LEG_WIDTHS = [[0, 17, 17], [0.2, 15, 15.5], [0.42, 10.5, 11], [0.5, 8.6, 9], [0.6, 9, 10.6], [0.8, 6.6, 7], [1, 5, 5.2]];

function leg({ joints, angle = 0, side }) {
  const widths = side < 0 ? LEG_WIDTHS : LEG_WIDTHS.map(([u, a, b]) => [u, b, a]);
  const { A, B, end } = limb(joints, widths);
  const [ax, ay] = end.p;
  const place = (pts) => mapPts(pts, (x, y) => rotate(ax + x, ay + y, angle, ax, ay));
  const instep = place(INSTEP);
  const outline = [...A, ...instep, ...[...B].reverse()];
  const pump = shape(place(PUMP));
  return part([shape(outline), pump], [[spline(outline), MAIN]], { solid: [pump] });
}

// Neck, shoulder slopes and collarbones, joining the head to the two shoulder tips.
function body(pose, tips) {
  const [px, py] = pose.pit;
  const jaw = (s) => headPoint(pose.head, s * 9.5, 74);
  const neck = (s) => [jaw(s), [px + s * 10.5, py - 22], [px + s * 12, py - 5]];
  const slope = (s, tip) => [[px + s * 12, py - 5], [lerp(px + s * 12, tip[0], 0.45), py + 3], [tip[0] - s * 7, tip[1] - 11], [tip[0] - s * 1.5, tip[1] - 4], tip];
  const collar = (s) => [[px + s * 5, py + 12], [px + s * 16, py + 15], [px + s * 28, py + 13]];
  const region = shape([jaw(-1), [px - 12, py - 5], tips[0], [tips[0][0] + 4, py + 60], [px - 38, py + 100], [px + 38, py + 100], [tips[1][0] - 4, py + 60], tips[1], [px + 12, py - 5], jaw(1)]);
  return part(region, [
    [spline(neck(-1)), MAIN],
    [spline(neck(1)), MAIN],
    [spline(slope(-1, tips[0])), MAIN],
    [spline(slope(1, tips[1])), MAIN],
    [spline(collar(-1)), HAIRLINE],
    [spline(collar(1)), HAIRLINE],
  ]);
}

// ---------------------------------------------------------------- head and hair
// The head is drawn in its own frame (top 0, chin 84, centred on x = 0), then tilted around
// the neck and moved to pose.head.x. `turn` (-1..1) swings the face towards the viewer's
// left or right. Hair below the jaw tilts less than the head, so long hair hangs down.

function headPoint(h, x, y, gravity = false) {
  const k = gravity ? clamp((150 - y) / 90, 0, 1) : 1;
  const [rx, ry] = rotate(x, y, h.tilt * k, 0, 96);
  return [rx + h.x, ry];
}
const headPts = (h, pts, gravity) => mapPts(pts, (x, y) => headPoint(h, x, y, gravity));

// Swings a frontal face point by `turn`: features slide over, the far side narrows.
const swing = (turn, x) => {
  const far = x * turn > 0 ? 1 - 0.14 * Math.abs(turn) : 1;
  return x * far + turn * 5 * (1 - (x / 32) ** 2);
};

function face(h) {
  const t = h.turn;
  const sw = (pts) => headPts(h, mapPts(pts, (x, y) => [swing(t, x), y]));
  const side = [[-31, 34], [-30.5, 50], [-26, 63], [-18, 74], [-9, 81.5], [0, 84]];
  const contour = [...side, ...[...side].reverse().slice(1).map(([x, y]) => [-x, y])];
  const eye = (s) => {
    const k = s * t > 0 ? 0.86 : 1;
    const e = (pts) => sw(pts.map(([x, y]) => [s * (12 + (x - 12) * k), y]));
    return [
      [spline(e([[19.5, 44.5], [15, 40.4], [9.5, 40.2], [5, 43]])), FINE],
      [spline(e([[19.5, 44.5], [22, 42.4]])), HAIRLINE],
      [spline(e([[21, 35.4], [16, 31.4], [10, 31], [5.5, 32.8]])), HAIRLINE],
    ];
  };
  const iris = (s) => shape(sw([[s * 15.2, 42.2], [s * 12.1, 45.8], [s * 9, 42.2], [s * 12.1, 41]]));
  const nose = t >= 0 ? [[1.5, 47], [2.6, 53], [4.4, 57], [1.6, 59.6]] : [[-1.5, 47], [-2.6, 53], [-4.4, 57], [-1.6, 59.6]];
  const earring = (s) => {
    const [ex, ey] = headPoint(h, swing(t, s * 31.5), 58);
    return [spline([[ex, ey], [ex, ey + 6]]), shape([[ex, ey + 5.5], [ex + 2.6, ey + 11], [ex, ey + 15.5], [ex - 2.6, ey + 11]])];
  };
  return part(shape(sw(contour)), [
    [spline(sw(side.slice(1).concat([[9, 81.5], [18, 74], [26, 63], [30.5, 50]]))), FINE],
    ...eye(-1),
    ...eye(1),
    [spline(sw(nose)), HAIRLINE],
    [spline(sw([[-7.4, 67.6], [-3.4, 65.6], [0, 66.6], [3.4, 65.6], [7.4, 67.6]])), HAIRLINE],
    [spline(sw([[-7.4, 67.8], [0, 69.4], [7.4, 67.8]])), FINE],
    [spline(sw([[-4.2, 71.6], [0, 73.2], [4.2, 71.6]])), HAIRLINE],
    ...(h.earrings ? [earring(-1)[0], earring(1)[0]].map((d) => [d, HAIRLINE]) : []),
  ], { solid: [iris(-1), iris(1), ...(h.earrings ? [earring(-1)[1], earring(1)[1]] : [])] });
}

// Hair styles in the head frame: closed `locks` (the area the hair covers) and open
// `strokes` ([points, weight]). Drawn for a parting on the viewer's right; `mirror` flips it.
const LONG = {
  locks: [
    [[8, -1], [-14, 0], [-30, 10], [-38, 30], [-40, 52], [-42, 74], [-48, 94], [-56, 114], [-56, 134], [-47, 154], [-45, 174], [-52, 194], [-53, 214], [-45, 229], [-37, 226], [-34, 208], [-31, 188], [-30, 168], [-33, 146], [-30, 124], [-32, 104], [-30, 84], [-29, 62], [-28, 44], [-22, 26], [-8, 14], [8, 4]],
    [[8, -1], [26, 0], [39, 12], [42, 32], [42, 54], [44, 76], [50, 96], [56, 116], [54, 138], [46, 158], [46, 178], [53, 198], [51, 218], [43, 228], [36, 222], [36, 204], [33, 184], [30, 162], [34, 140], [35, 118], [31, 98], [30, 76], [30.5, 54], [29, 34], [22, 18], [10, 12]],
  ],
  strokes: [
    [[[8, -1], [-14, 0], [-30, 10], [-38, 30], [-40, 52], [-42, 74], [-48, 94], [-56, 114], [-56, 134], [-47, 154], [-45, 174], [-52, 194], [-53, 214], [-45, 229], [-37, 227]], 'outer'],
    [[[8, 4], [-8, 14], [-22, 26], [-28, 44], [-29, 62], [-30, 84], [-32, 104], [-30, 124], [-33, 146], [-30, 168], [-31, 186]], 'outer'],
    [[[-12, 6], [-28, 20], [-35, 44], [-38, 70], [-44, 94], [-48, 118], [-44, 140], [-40, 162], [-44, 186], [-46, 204]], 'strand'],
    [[[-40, 100], [-47, 118], [-49, 136]], 'strand'],
    [[[8, -1], [26, 0], [39, 12], [42, 32], [42, 54], [44, 76], [50, 96], [56, 116], [54, 138], [46, 158], [46, 178], [53, 198], [51, 218], [43, 228]], 'outer'],
    [[[10, 12], [22, 18], [29, 34], [30.5, 54], [30, 76], [31, 98], [35, 118], [34, 140], [30, 162], [33, 182]], 'outer'],
    [[[18, 6], [32, 18], [37, 40], [38, 64], [42, 90], [48, 112], [48, 134], [43, 156], [44, 180], [48, 200]], 'strand'],
  ],
};

// Fuller: pushes the hair outside the face outwards and lifts the crown.
const fuller = (pts) => mapPts(pts, (x, y) => [Math.abs(x) > 29 ? Math.sign(x) * (29 + (Math.abs(x) - 29) * 1.6) : x, y < 100 ? y - 10 * (1 - y / 100) : y]);

// Over one shoulder: the right-hand lock ends behind the shoulder.
const SWEPT = {
  locks: [LONG.locks[0], [[8, -1], [26, 0], [39, 12], [42, 32], [43, 54], [47, 76], [54, 96], [58, 112], [50, 120], [40, 112], [33, 96], [30, 76], [30.5, 54], [29, 34], [22, 18], [10, 12]]],
  strokes: [
    ...LONG.strokes.slice(0, 4),
    [[[8, -1], [26, 0], [39, 12], [42, 32], [43, 54], [47, 76], [54, 96], [58, 112], [52, 120]], 'outer'],
    [[[10, 12], [22, 18], [29, 34], [30.5, 54], [30, 76], [32, 94], [36, 106]], 'outer'],
    [[[18, 6], [32, 18], [37, 40], [39, 64], [44, 88], [50, 104]], 'strand'],
  ],
};

const HAIR = {
  long: LONG,
  swept: SWEPT,
  volume: { locks: LONG.locks.map(fuller), strokes: LONG.strokes.map(([p, k]) => [fuller(p), k]) },
  bob: {
    locks: [
      [[7, -1], [-16, 0], [-32, 12], [-40, 32], [-42, 54], [-44, 76], [-50, 94], [-54, 110], [-48, 124], [-38, 128], [-33, 120], [-32, 104], [-30, 86], [-29, 64], [-28, 44], [-22, 26], [-8, 14], [8, 4]],
      [[7, -1], [27, 0], [41, 13], [44, 34], [45, 56], [47, 78], [53, 96], [55, 112], [48, 124], [38, 127], [34, 118], [32, 100], [31, 80], [30.5, 56], [29, 34], [22, 18], [9, 12]],
    ],
    strokes: [
      [[[7, -1], [-16, 0], [-32, 12], [-40, 32], [-42, 54], [-44, 76], [-50, 94], [-54, 110], [-48, 124], [-38, 128], [-34, 120]], 'outer'],
      [[[8, 4], [-8, 14], [-22, 26], [-28, 44], [-29, 64], [-30, 86], [-32, 104], [-34, 116]], 'outer'],
      [[[-12, 6], [-28, 20], [-35, 42], [-37, 66], [-42, 88], [-46, 106]], 'strand'],
      [[[7, -1], [27, 0], [41, 13], [44, 34], [45, 56], [47, 78], [53, 96], [55, 112], [48, 124], [38, 127], [35, 119]], 'outer'],
      [[[9, 12], [22, 18], [29, 34], [30.5, 56], [31, 80], [32, 100], [34, 114]], 'outer'],
      [[[18, 6], [32, 18], [37, 40], [38, 64], [43, 88], [47, 104]], 'strand'],
    ],
  },
  // Low chignon at the back of the head, with one loose wave by the face.
  updo: {
    back: [[40, 34], [52, 38], [58, 52], [54, 66], [42, 70], [34, 60]],
    backStrokes: [[[[38, 40], [50, 40], [56, 52], [52, 64], [42, 68]], 'outer'], [[[44, 46], [50, 52], [46, 60]], 'strand']],
    locks: [
      [[6, -2], [-16, -1], [-31, 9], [-37, 28], [-37, 46], [-33, 40], [-29, 30], [-20, 20], [-6, 13], [8, 4]],
      [[6, -2], [26, -1], [38, 11], [41, 30], [40, 46], [34, 42], [30, 30], [22, 17], [10, 11]],
      [[-29, 38], [-33, 56], [-30, 76], [-34, 96], [-30, 100], [-27, 80], [-29, 58], [-27, 42]],
    ],
    strokes: [
      [[[6, -2], [-16, -1], [-31, 9], [-37, 28], [-37, 46]], 'outer'],
      [[[8, 4], [-6, 13], [-20, 20], [-28, 32], [-30, 40]], 'outer'],
      [[[6, -2], [26, -1], [38, 11], [41, 30], [40, 46]], 'outer'],
      [[[10, 11], [22, 17], [30, 30], [33, 40]], 'outer'],
      [[[-10, 2], [-24, 10], [-31, 24]], 'strand'],
      [[[14, 2], [28, 8], [35, 22]], 'strand'],
      [[[-29, 38], [-33, 56], [-30, 76], [-34, 96]], 'strand'],
    ],
  },
};

function hair(h) {
  const style = HAIR[h.hair];
  const m = (pts) => headPts(h, h.mirror ? flipPts(pts) : pts, true);
  const strokes = (list) => list.map(([pts, k]) => [spline(m(pts)), k === 'outer' ? MAIN - 0.6 : HAIRLINE]);
  return {
    back: style.back ? part(shape(m(style.back)), strokes(style.backStrokes)) : null,
    front: part(style.locks.map((p) => shape(m(p))), strokes(style.strokes)),
  };
}

// ---------------------------------------------------------------- dress helpers

// Scalloped hem from (x0, y0) to (x1, y1), each scallop bulging `depth` down, as points.
function scallops(x0, y0, x1, y1, n, depth) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const x = lerp(x0, x1, i / n);
    const y = lerp(y0, y1, i / n) + (i % 2 ? 1.5 : -1.5) * (i > 0 && i < n ? 1 : 0);
    out.push([x, y, 1]);
    if (i < n) for (const [f, k] of [[0.2, 0.78], [0.5, 1], [0.8, 0.78]]) out.push([lerp(x0, x1, (i + f) / n), lerp(y0, y1, (i + f) / n) + depth * k]);
  }
  return out;
}

// Folds rising from the valleys of a scalloped hem towards the waist.
function ruffleFolds(x0, y0, x1, y1, n, rise, toX = 0) {
  const out = [];
  for (let i = 1; i < n; i++) {
    const x = lerp(x0, x1, i / n);
    const y = lerp(y0, y1, i / n);
    const tx = lerp(x, toX, 0.18);
    out.push([[x, y], [lerp(x, tx, 0.45) - 1, y - rise * 0.5], [tx, y - rise]]);
  }
  return out;
}

const dress = (pts, folds, color) => {
  const d = shape(pts);
  return part(d, [[open(d), BOLD], ...folds.map((f) => [spline(f), FINE])], { fill: { d, color } });
};

// ---------------------------------------------------------------- the six women
// Each pose: head { x, tilt, turn, hair, mirror }, the neck pit, and joints for the limbs.
// Weight sits on one leg under the neck pit; that hip rides high, that shoulder drops.

function woman1(color) {
  const pose = { head: { x: 4, tilt: -4, turn: 0.3, hair: 'long', earrings: true }, pit: [2, 110] };
  const L = arm({ side: -1, hand: 'rest', joints: [[-52, 136], [-94, 232], [-48, 274]] });
  const R = arm({ side: 1, hand: 'open', joints: [[56, 146], [69, 250], [57, 348]] });
  const hd = hair(pose.head);
  return [
    leg({ side: -1, angle: -18, joints: [[-20, 350], [-20, 542], [-38, 718]] }),
    leg({ side: 1, angle: 6, joints: [[20, 338], [12, 545], [6, 724]] }),
    dress(
      [[-44, 348, 1], [-50, 420], [-56, 500], [-64, 580], [-80, 654], [-106, 714], [-144, 762, 1], [-110, 773], [-76, 775], [-48, 770, 1], [-45, 720], [-40, 640], [-28, 540], [-14, 470], [0, 432, 1], [-22, 398]],
      [[[-62, 600], [-80, 672], [-100, 724], [-122, 758]], [[-50, 652], [-56, 702], [-62, 740], [-68, 768]]],
      color,
    ),
    body(pose, [L.tip, R.tip]),
    dress(
      [[-46, 162, 1], [-38, 154], [-24, 153], [-12, 158], [-2, 171, 1], [8, 160], [24, 157], [38, 160], [48, 172, 1], [46, 198], [38, 226], [32, 254], [38, 284], [48, 312], [51, 342], [47, 410], [41, 480], [37, 550], [39, 620], [47, 686], [58, 734], [68, 768, 1], [40, 773], [10, 772], [-14, 768, 1], [-10, 700], [-6, 620], [-2, 540], [2, 470], [0, 432, 1], [-14, 410], [-30, 384], [-44, 354, 1], [-48, 330], [-44, 300], [-34, 272], [-31, 252], [-38, 222], [-46, 192]],
      [[[-2, 171], [-2, 192], [-1, 212]], [[-40, 302], [-10, 292], [14, 278], [32, 258]], [[-42, 342], [-12, 330], [18, 312], [44, 290]], [[12, 440], [15, 540], [21, 650], [31, 764]]],
      color,
    ),
    L.part,
    R.part,
    face(pose.head),
    hd.front,
  ];
}

function woman2(color) {
  const pose = { head: { x: -2, tilt: 4, turn: -0.35, hair: 'updo', earrings: true }, pit: [-2, 110] };
  const L = arm({ side: -1, hand: 'open', joints: [[-56, 140], [-70, 246], [-74, 342]] });
  const R = arm({ side: 1, hand: 'rest', joints: [[54, 134], [64, 238], [46, 330]] });
  const hd = hair(pose.head);
  return [
    hd.back,
    leg({ side: -1, angle: -6, joints: [[-20, 334], [-12, 540], [-4, 722]] }),
    leg({ side: 1, angle: 14, joints: [[20, 350], [16, 542], [26, 716]] }),
    dress(
      [[30, 256, 1], [38, 300], [44, 380], [50, 470], [58, 570], [70, 670], [92, 770, 1], [70, 776], [46, 774, 1], [44, 690], [40, 590], [34, 480], [26, 410], [16, 376, 1]],
      [[[38, 340], [44, 470], [54, 610], [70, 760]]],
      color,
    ),
    body(pose, [L.tip, R.tip]),
    dress(
      [[-46, 172, 1], [-38, 162], [-24, 158], [-12, 162], [-2, 174, 1], [8, 162], [24, 155], [38, 156], [46, 164, 1], [46, 190], [38, 222], [30, 254, 1], [29, 290], [24, 330], [16, 376, 1], [10, 450], [4, 540], [-2, 640], [-6, 770, 1], [-40, 777], [-90, 779], [-132, 772], [-178, 760, 1], [-138, 702], [-106, 624], [-84, 530], [-64, 430], [-46, 336], [-32, 262, 1], [-40, 230], [-48, 198]],
      [[[-44, 192], [-18, 200], [8, 214], [28, 238]], [[-38, 222], [-14, 232], [10, 242], [28, 252]], [[-31, 262], [-6, 258], [28, 256]], [[-14, 300], [-26, 420], [-46, 560], [-70, 690], [-90, 774]], [[-2, 300], [-6, 430], [-18, 580], [-34, 772]], [[-56, 470], [-74, 590], [-108, 700], [-148, 764]]],
      color,
    ),
    L.part,
    R.part,
    face(pose.head),
    hd.front,
  ];
}

function woman3(color) {
  const pose = { head: { x: 6, tilt: -5, turn: 0.35, hair: 'bob', earrings: true }, pit: [4, 110] };
  const L = arm({ side: -1, hand: 'open', joints: [[-52, 134], [-64, 240], [-62, 344]] });
  const R = arm({ side: 1, hand: 'rest', joints: [[56, 146], [96, 236], [52, 278]] });
  const hd = hair(pose.head);
  const bag = [[68, 300, 1], [118, 296, 1], [124, 340], [118, 350, 1], [72, 352, 1], [64, 342]];
  return [
    leg({ side: -1, angle: -24, joints: [[-20, 350], [-14, 546], [-30, 720]] }),
    leg({ side: 1, angle: 6, joints: [[20, 336], [10, 544], [4, 724]] }),
    dress(
      [[-42, 356, 1], [-46, 430], [-46, 520], [-46, 600], [-50, 680], [-60, 740], [-76, 770, 1], [-56, 774], [-40, 772, 1], [-37, 700], [-31, 600], [-20, 500], [2, 440, 1], [-18, 400]],
      [],
      color,
    ),
    body(pose, [L.tip, R.tip]),
    dress(
      [[-46, 166, 1], [-24, 161], [0, 162], [24, 165], [48, 172, 1], [48, 200], [40, 228], [32, 256], [42, 286], [52, 316], [52, 350], [46, 420], [40, 500], [36, 580], [40, 660], [50, 720], [62, 768, 1], [40, 772], [14, 772], [-6, 770, 1], [-4, 700], [-2, 600], [0, 500], [2, 440, 1], [-12, 416], [-28, 388], [-42, 362, 1], [-46, 340], [-42, 306], [-34, 276], [-32, 254], [-40, 226], [-48, 196]],
      [[[-22, 168], [-18, 200], [-16, 236]], [[24, 171], [20, 200], [17, 236]], [[-36, 372], [-22, 392], [-8, 416]], [[12, 450], [16, 560], [19, 660], [26, 766]]],
      color,
    ),
    L.part,
    R.part,
    part(shape(bag), [[open(shape(bag)), MAIN], [spline([[78, 300], [80, 270], [88, 250], [98, 246], [106, 256], [110, 278], [108, 298]]), FINE], [spline([[66, 314], [94, 318], [120, 312]]), HAIRLINE], [spline([[90, 314, 1], [91, 322, 1], [99, 321, 1], [98, 314, 1]]), HAIRLINE]]),
    face(pose.head),
    hd.front,
  ];
}

function woman4(color) {
  const pose = { head: { x: -4, tilt: 7, turn: -0.35, hair: 'volume', mirror: true }, pit: [-4, 110] };
  const L = arm({ side: -1, hand: 'open', joints: [[-58, 142], [-70, 250], [-66, 350]] });
  const R = arm({ side: 1, hand: 'open', joints: [[52, 132], [68, 240], [42, 328]] });
  const hd = hair(pose.head);
  const straps = [[[-36, 168], [-37, 148], [-38, 128]], [[34, 166], [36, 146], [36, 126]]];
  return [
    leg({ side: -1, angle: -6, joints: [[-20, 334], [-10, 544], [-4, 724]] }),
    leg({ side: 1, angle: 22, joints: [[20, 350], [16, 546], [30, 718]] }),
    dress(
      [[30, 256, 1], [40, 300], [46, 380], [52, 470], [60, 570], [74, 670], [96, 762, 1], [74, 772], [56, 768], [40, 772, 1], [36, 680], [32, 580], [26, 470], [16, 376, 1]],
      [[[40, 340], [46, 480], [58, 640], [80, 760]]],
      color,
    ),
    body(pose, [L.tip, R.tip]),
    part(null, straps.map((p) => [spline(p), FINE])),
    dress(
      [[-44, 170, 1], [-34, 162], [-20, 164], [-10, 176], [0, 204, 1], [10, 174], [22, 162], [34, 160], [42, 166, 1], [44, 192], [38, 224], [30, 254, 1], [32, 300], [26, 340], [16, 376, 1], [10, 460], [6, 560], [4, 660], [2, 772, 1], [-20, 776], [-44, 770], [-66, 778], [-90, 770], [-112, 774], [-136, 758, 1], [-104, 690], [-80, 600], [-62, 500], [-48, 400], [-38, 320], [-30, 256, 1], [-38, 228], [-46, 196]],
      [[[-26, 236], [-14, 246], [0, 254]], [[26, 236], [14, 246], [0, 254]], [[-10, 272], [-20, 400], [-34, 560], [-58, 760]], [[-24, 282], [-40, 420], [-64, 600], [-104, 760]]],
      color,
    ),
    L.part,
    R.part,
    face(pose.head),
    hd.front,
  ];
}

function woman5(color) {
  const pose = { head: { x: 4, tilt: -3, turn: 0.4, hair: 'swept', earrings: true }, pit: [2, 110] };
  const L = arm({ side: -1, hand: 'fist', joints: [[-54, 136], [-80, 236], [-92, 316]] });
  const R = arm({ side: 1, hand: 'open', joints: [[56, 144], [69, 250], [62, 348]] });
  const hd = hair(pose.head);
  const pinch = [-98, 338, 1];
  const lower = [[-30, 256, 1], [-60, 300], pinch, [-108, 420], [-116, 520], [-122, 630], [-120, 726, 1], ...scallops(-120, 726, 118, 748, 9, 15).slice(1, -1), [118, 748, 1], [114, 680], [106, 600], [94, 520], [80, 440], [62, 350], [30, 256, 1]];
  const upper = [[-30, 256, 1], [-60, 300], pinch, [-106, 400], [-112, 470], [-114, 524, 1], ...scallops(-114, 524, 104, 552, 7, 17).slice(1, -1), [104, 552, 1], [96, 500], [86, 440], [70, 360], [50, 300], [30, 256, 1]];
  const bodice = [[-58, 148, 1], [-40, 146], [-20, 153], [0, 161, 1], [20, 154], [40, 150], [58, 154, 1], [56, 186], [44, 222], [32, 256, 1], [-30, 256, 1], [-42, 220], [-56, 184]];
  // Puffed off-shoulder ruffle around the top of an arm, with a scalloped lower edge.
  const sleeve = (a, side) => {
    const [outer, inner] = side < 0 ? [a.B, a.A] : [a.A, a.B];
    const [o0, o1, i0, i1] = [outer[1], outer[7], inner[1], inner[7]];
    const pad = (p, q, d) => [p[0] + (p[0] - q[0]) * d, p[1] + (p[1] - q[1]) * d];
    const down = (p, d) => [p[0] + (o1[0] - o0[0]) * d, p[1] + (o1[1] - o0[1]) * d];
    return [
      [...pad(i0, o0, 0.1), 1],
      pad(o0, i0, 0.28),
      pad(lerp2(o0, o1, 0.5), lerp2(i0, i1, 0.5), 0.42),
      [...pad(o1, i1, 0.3), 1],
      down(lerp2(pad(o1, i1, 0.3), pad(i1, o1, 0.1), 0.25), 0.16),
      [...lerp2(pad(o1, i1, 0.3), pad(i1, o1, 0.1), 0.5), 1],
      down(lerp2(pad(o1, i1, 0.3), pad(i1, o1, 0.1), 0.75), 0.16),
      [...pad(i1, o1, 0.1), 1],
    ];
  };
  const sleeveFold = (a, side) => {
    const [outer, inner] = side < 0 ? [a.B, a.A] : [a.A, a.B];
    return [lerp2(outer[2], inner[2], 0.45), lerp2(outer[4], inner[4], 0.5), lerp2(outer[7], inner[7], 0.5)];
  };
  return [
    leg({ side: -1, angle: -18, joints: [[-20, 348], [-18, 546], [-30, 720]] }),
    leg({ side: 1, angle: 8, joints: [[20, 336], [12, 544], [6, 724]] }),
    body(pose, [L.tip, R.tip]),
    dress(lower, ruffleFolds(-120, 734, 118, 756, 9, 70), color),
    dress(upper, [...ruffleFolds(-114, 532, 104, 560, 7, 90), [[-96, 342], [-80, 400], [-66, 460]], [[-96, 342], [-94, 410], [-92, 470]]], color),
    dress(bodice, [[[0, 161], [0, 200], [0, 248]]], color),
    L.part,
    R.part,
    dress(sleeve(L, -1), [sleeveFold(L, -1)], color),
    dress(sleeve(R, 1), [sleeveFold(R, 1)], color),
    face(pose.head),
    hd.front,
  ];
}
const lerp2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];

function woman6(color) {
  const pose = { head: { x: -2, tilt: 3, turn: -0.25, hair: 'long', mirror: true }, pit: [-2, 110] };
  const L = arm({ side: -1, hand: 'open', joints: [[-54, 140], [-70, 246], [-74, 344]] });
  const R = arm({ side: 1, hand: 'fist', joints: [[54, 134], [74, 236], [88, 318]] });
  const hd = hair(pose.head);
  return [
    dress(
      [[-34, 250, 1], [-50, 330], [-70, 450], [-88, 580], [-102, 700], [-112, 770, 1], [-60, 778], [0, 780], [60, 778], [106, 768, 1], [106, 680], [98, 560], [94, 440], [92, 340, 1], [64, 300], [34, 250, 1]],
      [[[-80, 600], [-78, 680], [-72, 772]], [[70, 580], [74, 680], [76, 772]]],
      color,
    ),
    leg({ side: -1, angle: -8, joints: [[-20, 334], [-12, 544], [-6, 724]] }),
    leg({ side: 1, angle: 16, joints: [[20, 346], [24, 538], [18, 726]] }),
    body(pose, [L.tip, R.tip]),
    dress(
      [[-40, 128, 1], [-29, 123, 1], [-22, 148], [-12, 174], [0, 198, 1], [12, 172], [22, 146], [28, 118, 1], [40, 122, 1], [48, 150], [46, 190], [40, 224], [35, 252, 1], [-35, 252, 1], [-42, 222], [-46, 186], [-46, 154]],
      [[[-34, 244], [0, 248], [34, 244]], [[0, 198], [0, 216], [0, 238]]],
      color,
    ),
    dress(
      [[-34, 250, 1], [-46, 320], [-58, 400], [-76, 468, 1], [-62, 500], [-40, 540], [-12, 566, 1], [12, 556], [44, 520], [72, 460], [92, 338, 1], [64, 296], [34, 250, 1]],
      [[[90, 342], [62, 420], [34, 498], [12, 552]], [[90, 342], [44, 380], [4, 432], [-28, 500]], [[-28, 282], [-40, 380], [-56, 462]]],
      color,
    ),
    L.part,
    R.part,
    face(pose.head),
    hd.front,
  ];
}

// Dress colours: the site palette (wedding-site/src/styles/tokens.css).
const WOMEN = [
  { name: 'butter-wrap-column', draw: woman1, color: '#e4c765' },
  { name: 'blue-draped-sweep', draw: woman2, color: '#7c9cbc' },
  { name: 'linen-strapless-column', draw: woman3, color: '#c7b69a' },
  { name: 'peony-slip-wrap', draw: woman4, color: '#d8a0a6' },
  { name: 'sage-tiered-ruffle', draw: woman5, color: '#93a17f' },
  { name: 'apricot-high-low', draw: woman6, color: '#d98962' },
];

// ---------------------------------------------------------------- output

const SLOT = 280;
const TOP = 70;
const BOX = 'x="-320" y="-160" width="640" height="1080"';

function figure(i, filled, at) {
  const w = WOMEN[i];
  const id = `woman-${i + 1}`;
  const parts = w.draw(w.color).filter(Boolean);
  const defs = [];
  const layers = parts.map((p, k) => {
    const above = parts.slice(k + 1).flatMap((q) => q.region);
    const fill = p.fill ? `<path class="dress" fill="${filled ? p.fill.color : 'none'}" d="${p.fill.d}"/>` : '';
    const ink = [...p.ink.flatMap(([d, wd]) => brush(d, wd)), ...(p.solid ?? [])].map((d) => `<path d="${d}"/>`).join('');
    const layer = `${fill}<g class="ink" fill="currentColor">${ink}</g>`;
    if (!above.length) return layer;
    const mid = `${id}-m${k}`;
    defs.push(`<mask id="${mid}" maskUnits="userSpaceOnUse" ${BOX}><rect ${BOX} fill="#fff"/>${above.map((d) => `<path d="${d}"/>`).join('')}</mask>`);
    return `<g mask="url(#${mid})">${layer}</g>`;
  });
  return `<g id="${id}"${at ? ` transform="translate(${at[0]} ${at[1]})"` : ''}><defs>${defs.join('')}</defs>${layers.join('')}</g>`;
}

const doc = (viewBox, title, body) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" color="${INK}">
<title>${title}</title>
${body}
</svg>
`;

const here = dirname(fileURLToPath(import.meta.url));
const lineup = (filled) => doc(`0 0 ${SLOT * WOMEN.length} 900`, 'Six women in evening gowns', WOMEN.map((_, i) => figure(i, filled, [SLOT * i + SLOT / 2, TOP])).join('\n'));
for (const [name, filled] of [['women-dresses.svg', true], ['women-dresses-lines.svg', false]]) {
  const out = lineup(filled);
  writeFileSync(join(here, name), out);
  console.log(`wrote ${name} (${(out.length / 1024).toFixed(0)} kB)`);
}

const outDir = process.argv[2] && resolve(process.argv[2]);
if (outDir) {
  mkdirSync(outDir, { recursive: true });
  WOMEN.forEach((w, i) => {
    const file = `${String(i + 1).padStart(2, '0')}-${w.name}.svg`;
    writeFileSync(join(outDir, file), doc('-190 -30 380 830', w.name.replaceAll('-', ' '), figure(i, true)));
  });
  console.log(`wrote ${WOMEN.length} figures to ${outDir}`);
}
