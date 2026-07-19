/**
 * Catmull-Rom → cubic Bézier smoothing for SVG line/area paths.
 *
 * Turns a series of points into a soft, Apple-Stocks-style curve. Used by
 * AreaChart and MomentumHero so charts read as one continuous gesture
 * rather than hard polyline joints.
 */

export interface Pt {
  x: number;
  y: number;
}

/** Smooth open path through `pts` (no close). */
export function smoothLine(pts: Pt[]): string {
  if (pts.length === 0) return '';
  if (pts.length < 3) {
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');
  }

  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

/** Smooth line that then closes down to `baseline` to form a filled area. */
export function smoothArea(pts: Pt[], baseline: number): string {
  if (pts.length === 0) return '';
  const line = smoothLine(pts);
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${line} L${last.x.toFixed(2)},${baseline.toFixed(2)} L${first.x.toFixed(2)},${baseline.toFixed(2)} Z`;
}

/** Rough polyline length — good enough to drive the draw-on dash reveal. */
export function pathLength(pts: Pt[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return len;
}
