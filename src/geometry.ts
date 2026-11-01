import type { MotifData, Params, Point, Segment } from './types.js';
export interface Bounds { x: number; y: number; width: number; height: number }
export function bounds(points: readonly Point[]): Bounds {
  let x = Infinity, y = Infinity, right = -Infinity, bottom = -Infinity;
  for (const p of points) {
    x = Math.min(x, p[0]); y = Math.min(y, p[1]);
    right = Math.max(right, p[0]); bottom = Math.max(bottom, p[1]);
  }
  return points.length ? { x, y, width: right - x, height: bottom - y } : { x: 0, y: 0, width: 0, height: 0 };
}
/** Exact coordinate swaps and signs, then Y-up → SVG Y-down. */
export function transformPoint(p: Point, rotation: Params['rotation'], reflect: Params['reflect']): Point {
  let x = p[0] * (reflect === 'x' || reflect === 'both' ? -1 : 1);
  let y = p[1] * (reflect === 'y' || reflect === 'both' ? -1 : 1);
  if (rotation === 90) [x, y] = [y, -x];
  else if (rotation === 180) [x, y] = [-x, -y];
  else if (rotation === 270) [x, y] = [-y, x];
  return [x === 0 ? 0 : x, y === 0 ? 0 : -y];
}
/** Every source edge appears once, including duplicates. Join only unambiguous continuations. */
export function polylines(segments: readonly Segment[]): Point[][] {
  const key = (p: Point) => `${p[0]},${p[1]}`;
  const adjacency = new Map<string, { index: number; point: Point }[]>();
  segments.forEach(([a, b], index) => {
    for (const [from, point] of [[a, b], [b, a]]) {
      const k = key(from); const edges = adjacency.get(k) ?? [];
      edges.push({ index, point }); adjacency.set(k, edges);
    }
  });
  const used = new Set<number>(); const result: Point[][] = [];
  function trace(index: number) {
    if (used.has(index)) return;
    used.add(index);
    const chain = [...segments[index]];
    let changed = true;
    while (changed) {
      changed = false;
      for (const start of [true, false]) {
        const links = adjacency.get(key(start ? chain[0] : chain[chain.length - 1]))!.filter(e => !used.has(e.index));
        if (links.length === 1) {
          used.add(links[0].index);
          if (start) chain.unshift(links[0].point); else chain.push(links[0].point);
          changed = true;
        }
      }
    }
    result.push(chain);
  }
  for (const links of adjacency.values()) if (links.length === 1) trace(links[0].index);
  segments.forEach((_, index) => trace(index));
  return result;
}
export function geometry(motif: MotifData, p: Params, rotation = p.rotation, reflect = p.reflect) {
  const map = (q: Point) => transformPoint(q, rotation, reflect);
  const lines = polylines(motif.segments).map(line => line.map(map));
  const fills = (motif.fills ?? []).map(poly => poly.map(map));
  const raw = bounds([...lines.flat(), ...fills.flat()]);
  // miterLimit 8 × half stroke width; epsilon protects floating point raster boundaries.
  const padding = 4 * p.strokeWidth + 0.001;
  return { lines, fills, x: raw.x - padding, y: raw.y - padding,
    width: raw.width + padding * 2, height: raw.height + padding * 2 };
}
export const fmt = (v: number): string => String(Object.is(v, -0) ? 0 : v);
export const escapeXML = (s: string): string => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
