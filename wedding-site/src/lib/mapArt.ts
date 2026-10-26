import type { Point } from "./geo";

/** [x0, y0, x1, y1] in map units. */
export type Box = [number, number, number, number];
/** A house or town block seen from above, centred on (x, y), turned `a` degrees. */
export type Plan = { x: number; y: number; w: number; h: number; a: number };
export type Tree = { x: number; y: number; r: number };

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A small seeded generator (mulberry32), so the server draws the same map every time. */
function random(seed: string) {
  let s = 0;
  for (const ch of seed) s = (Math.imul(s ^ ch.charCodeAt(0), 2654435761) + 1) | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toSegment([px, py]: Point, [ax, ay]: Point, [bx, by]: Point): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

/**
 * Where background drawing may go: outside the labels and landmarks, off the
 * roads and rivers, inside the frame, and clear of what is already drawn.
 */
export class Clearance {
  private taken: { x: number; y: number; r: number }[] = [];

  constructor(
    private boxes: Box[],
    private lines: { points: Point[]; gap: number }[],
    private frame: Box = [0, 0, 1200, 1000],
  ) {}

  ok(x: number, y: number, r = 0): boolean {
    const [fx0, fy0, fx1, fy1] = this.frame;
    if (x < fx0 + r || y < fy0 + r || x > fx1 - r || y > fy1 - r) return false;
    if (this.boxes.some(([x0, y0, x1, y1]) => x > x0 - r && x < x1 + r && y > y0 - r && y < y1 + r)) return false;
    if (this.lines.some(({ points, gap }) => points.some((p, i) => i > 0 && toSegment([x, y], points[i - 1], p) < gap + r)))
      return false;
    return !this.taken.some((t) => Math.hypot(t.x - x, t.y - y) < t.r + r);
  }

  boxClear([x0, y0, x1, y1]: Box): boolean {
    const step = 8;
    for (let x = x0; x <= x1; x += step) for (let y = y0; y <= y1; y += step) if (!this.ok(x, y)) return false;
    return true;
  }

  take(x: number, y: number, r: number) {
    this.taken.push({ x, y, r });
  }

  block(box: Box) {
    this.boxes.push(box);
  }
}

/** A straight street through `at` along `bearing` (degrees from north), long enough for `houses`. */
export function street(at: Point, bearing: number, houses: number): Point[] {
  const a = (bearing * Math.PI) / 180;
  const half = houses * 2.2;
  const [dx, dy] = [Math.sin(a) * half, -Math.cos(a) * half];
  // a gentle bend, the way village streets follow a brook
  return [
    [at[0] - dx, at[1] - dy],
    [at[0] - dy * 0.12, at[1] + dx * 0.12],
    [at[0] + dx, at[1] + dy],
  ];
}

/**
 * A village: houses on both sides of its streets, gable to the street, the
 * ones nearest `at` first. `offset` is how far they stand from the street's
 * centre (more along a drawn road, to clear its white band). Each house is
 * checked against `room`.
 */
export function village(name: string, at: Point, streets: Point[][], count: number, offset: number, room: Clearance): Plan[] {
  const rand = random(name);
  const reach = 16 + count * 2.6; // a village stays round its centre, even along a long road
  const spots: (Plan & { d: number })[] = [];
  for (const line of streets) {
    for (let i = 1; i < line.length; i++) {
      const [ax, ay] = line[i - 1];
      const [bx, by] = line[i];
      const len = Math.hypot(bx - ax, by - ay);
      const [ux, uy] = [(bx - ax) / len, (by - ay) / len];
      const deg = (Math.atan2(uy, ux) * 180) / Math.PI;
      for (let s = 0; s < len; s += 9 + rand() * 5) {
        for (const side of [-1, 1]) {
          // a front row on the street and, here and there, a barn or a second house behind it
          for (const row of [0, 1]) {
            if (rand() < (row ? 0.6 : 0.15)) continue;
            const off = side * (offset + row * 14 + rand() * 4);
            const along = s + (rand() - 0.5) * 4;
            const x = ax + ux * along - uy * off;
            const y = ay + uy * along + ux * off;
            const d = Math.hypot(x - at[0], y - at[1]);
            if (d > reach) continue;
            spots.push({ x, y, w: 9 + rand() * 4, h: 7 + rand() * 3, a: deg + (rand() - 0.5) * 14, d });
          }
        }
      }
    }
  }
  const out: Plan[] = [];
  for (const p of spots.sort((a, b) => a.d - b.d)) {
    if (out.length >= count) break;
    if (!room.ok(p.x, p.y, 5)) continue;
    room.take(p.x, p.y, 5);
    out.push({ x: r1(p.x), y: r1(p.y), w: r1(p.w), h: r1(p.h), a: Math.round(p.a) });
  }
  return out;
}

/**
 * A town plan: a grid of blocks turned along the valley, thinning towards an
 * irregular edge, with a wider street every few blocks.
 */
export function townPlan(name: string, at: Point, rx: number, ry: number, angle: number, room: Clearance): Plan[] {
  const rand = random(name);
  const a = (angle * Math.PI) / 180;
  const [cos, sin] = [Math.cos(a), Math.sin(a)];
  const out: Plan[] = [];
  const cell = 19;
  const reach = Math.max(rx, ry) * 1.6;
  for (let i = -reach; i <= reach; i += cell) {
    for (let j = -reach; j <= reach; j += cell * 0.8) {
      const gi = Math.round(i / cell);
      const gj = Math.round(j / (cell * 0.8));
      if (gi % 5 === 0 || gj % 4 === 0) continue; // main streets
      const x = at[0] + i * cos - j * sin;
      const y = at[1] + i * sin + j * cos;
      const e = ((x - at[0]) / rx) ** 2 + ((y - at[1]) / ry) ** 2;
      if (e > 1 + (rand() - 0.5) * 0.5 || rand() < e * 0.3) continue;
      if (!room.ok(x, y, 6)) continue;
      room.take(x, y, 6);
      out.push({ x: r1(x), y: r1(y), w: r1(12 + rand() * 4), h: r1(9 + rand() * 4), a: Math.round(angle + (rand() - 0.5) * 6) });
    }
  }
  return out;
}

/**
 * A wood on a hill: crowns that overlap into one canopy around the top, a few
 * lone trees at its edge. Within the wood crowns may overlap; other drawing
 * keeps off the whole wood.
 */
export function grove(name: string, at: Point, count: number, spread: number, room: Clearance): Tree[] {
  const rand = random(name + at.join());
  const out: Tree[] = [];
  const turn = rand() * Math.PI;
  for (let tries = 0; tries < count * 14 && out.length < count; tries++) {
    const lone = out.length > count * 0.8;
    const d = spread * (lone ? 0.8 + rand() * 0.5 : Math.sqrt(rand()) * 0.75);
    const t = rand() * Math.PI * 2;
    const r = lone ? 6 + rand() * 3 : 10 + rand() * 7;
    // an oval wood, turned its own way
    const [ex, ey] = [Math.cos(t) * d, Math.sin(t) * d * 0.6];
    const x = at[0] + ex * Math.cos(turn) - ey * Math.sin(turn);
    const y = at[1] + ex * Math.sin(turn) + ey * Math.cos(turn);
    if (!room.ok(x, y, r)) continue;
    if (out.some((o) => Math.hypot(o.x - x, o.y - y) < (lone ? o.r + r + 4 : (o.r + r) * 0.55))) continue;
    out.push({ x: r1(x), y: r1(y), r: r1(r) });
  }
  for (const o of out) room.take(o.x, o.y, o.r + 2);
  return out;
}

/**
 * A spot for a `w` × `h` mark that stands for a cluster: beside it, above or
 * below, or by its centre when the cluster straddles a road; null if nowhere.
 * Returns the mark's top-left corner.
 */
export function placeMark(centre: Point, plans: Plan[], w: number, h: number, room: Clearance): Point | null {
  if (!plans.length) return null;
  const xs = plans.map((p) => p.x);
  const ys = plans.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const [mx, my] = [(x0 + x1) / 2, (y0 + y1) / 2];
  const tries: Point[] = [
    [x1 + 8, my - h / 2],
    [x0 - 8 - w, my - h / 2],
    [mx - w / 2, y0 - 8 - h],
    [mx - w / 2, y1 + 8],
    ...[14, 30, 46].flatMap((g): Point[] => [
      [centre[0] + g, centre[1] - h / 2],
      [centre[0] - g - w, centre[1] - h / 2],
    ]),
  ];
  for (const [x, y] of tries) {
    const box: Box = [x, y, x + w, y + h];
    if (room.boxClear(box)) {
      room.block(box);
      return [r1(x), r1(y)];
    }
  }
  return null;
}

/** All plans as one path of turned rectangles. */
export function plansPath(plans: Plan[]): string {
  return plans
    .map(({ x, y, w, h, a }) => {
      const t = (a * Math.PI) / 180;
      const [c, s] = [Math.cos(t), Math.sin(t)];
      const corners = [
        [-w / 2, -h / 2],
        [w / 2, -h / 2],
        [w / 2, h / 2],
        [-w / 2, h / 2],
      ].map(([u, v]) => `${r1(x + u * c - v * s)} ${r1(y + u * s + v * c)}`);
      return `M${corners.join("L")}Z`;
    })
    .join("");
}

/** All crowns as one path of circles. */
export function treesPath(trees: Tree[]): string {
  return trees.map(({ x, y, r }) => `M${r1(x - r)} ${y}a${r} ${r} 0 1 0 ${r1(2 * r)} 0a${r} ${r} 0 1 0 ${r1(-2 * r)} 0Z`).join("");
}

/** A closed outline through the points. */
export function areaPath(points: Point[]): string {
  return `M${points.map(([x, y]) => `${r1(x)} ${r1(y)}`).join("L")}Z`;
}
