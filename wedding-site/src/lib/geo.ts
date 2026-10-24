import type { LatLng } from "@/content/types";

export type Point = [number, number];

const KM_PER_DEG_LAT = 111.2;

/**
 * A flat projection for a few kilometres around `origin`: north up, true
 * distances and bearings. `origin` lands on `at`, `pxPerKm` sets the scale.
 */
export function projection(origin: LatLng, at: Point, pxPerKm: number) {
  const kmPerDegLng = KM_PER_DEG_LAT * Math.cos((origin[0] * Math.PI) / 180);
  return ([lat, lng]: LatLng): Point => [
    at[0] + (lng - origin[1]) * kmPerDegLng * pxPerKm,
    at[1] - (lat - origin[0]) * KM_PER_DEG_LAT * pxPerKm,
  ];
}

const n = (v: number) => Math.round(v * 10) / 10;

/**
 * A smooth SVG path through the points (Catmull-Rom as cubic Béziers), the way
 * a hand would draw a road. Points closer than `minGap` to the last kept one
 * are dropped so little kinks at junctions don't wobble the line.
 */
export function smoothPath(points: Point[], minGap = 6): string {
  const pts = points.filter((p, i) => {
    if (i === 0 || i === points.length - 1) return true;
    const q = points[i - 1];
    return Math.hypot(p[0] - q[0], p[1] - q[1]) >= minGap;
  });
  if (pts.length < 2) return "";
  let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
  }
  return d;
}
