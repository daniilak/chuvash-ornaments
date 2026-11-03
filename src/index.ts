import { Drawing } from './drawing.js';
import { normalizeParams, pick } from './params.js';
import type { FrameResult, Generated, MotifId, Params, ParamsInput } from './types.js';
export { MOTIFS, getMotif } from './catalog.js';
export { GENERATOR_VERSION, PRESETS, normalizeParams } from './params.js';
export type * from './types.js';

function flipped(reflect: Params['reflect']): Params['reflect'] {
  return ({ none: 'x', x: 'none', y: 'both', both: 'y' } as const)[reflect];
}

function variant(p: Params, index: number): { id: MotifId; reflect: Params['reflect'] } {
  const id = p.sequence === 'repeat' || p.sequence === 'mirror' ? p.motif :
    p.motifs[p.sequence === 'alternate' ? index % p.motifs.length : pick(p.seed, index, p.motifs.length)];
  const mirror = p.sequence === 'mirror' ? index % 2 : p.sequence === 'seeded' ? pick(p.seed, index + 503, 2) : 0;
  return { id, reflect: mirror ? flipped(p.reflect) : p.reflect };
}
/** Output size defaults to 160×160; all geometry scales uniformly to fit. */
export function generateMotif(input: ParamsInput = {}): Generated {
  const p = normalizeParams({ width: 160, height: 160, ...input, preset: 'motif' });
  const d = new Drawing(p);
  d.place(p.motif, 0, 0, p.width, p.height);
  return d.result();
}
/** Divider, band, motif, tile or a fitted frame, selected by preset. */
export function generateOrnament(input: ParamsInput = {}): Generated {
  const p = normalizeParams(input);
  if (p.preset === 'motif') return generateMotif(p);
  if (p.preset === 'tile') return generateTile(p);
  if (p.preset === 'border' || p.preset === 'corners') return fitFrame(p, p.width, p.height);
  const d = new Drawing(p);
  const size = Math.min(p.size, p.height, p.width);
  if (!size) return d.result();
  // A shared cell accommodates the widest/longest possible source motif, preserving its proportions.
  let n = Math.min(p.count, Math.floor((p.width + p.gap) / (size + p.gap)));
  if (p.preset === 'divider' && n % 2 === 0) n--;
  if (n < 1) return d.result();
  const left = (p.width - n * size - (n - 1) * p.gap) / 2;
  for (let i = 0; i < n; i++) {
    const center = (n - 1) / 2;
    const v = variant(p, p.preset === 'divider' ? Math.abs(i - center) : i);
    const main = p.preset === 'divider' && i === center;
    d.place(main ? p.motif : v.id, left + i * (size + p.gap), (p.height - size) / 2, size, size,
      p.rotation, main ? p.reflect : p.preset === 'divider' && i < center ? flipped(v.reflect) : v.reflect);
  }
  return d.result();
}
/** A complete repeat unit. Checkerboard uses a 2×2 supercell, so CSS repeat never breaks parity. */
export function generateTile(input: ParamsInput = {}): Generated {
  const p = normalizeParams({ width: 96, height: 96, ...input, preset: 'tile' });
  const d = new Drawing(p);
  const n = p.layout === 'checkerboard' ? 2 : 1;
  const cw = p.width / n, ch = p.height / n;
  const size = Math.min(p.size, cw - p.gap, ch - p.gap);
  if (size <= 0) return d.result();
  const baseReflect = variant(p, 0).reflect;
  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
    const v = variant(p, (row + col) % n);
    d.place(v.id, col * cw + (cw - size) / 2, row * ch + (ch - size) / 2, size, size,
      p.rotation, (row + col) % 2 ? flipped(baseReflect) : baseReflect);
  }
  return d.result();
}
/** size is maximum ornament depth; dimensions, gap and insets share the container's units. */
export function fitFrame(input: ParamsInput = {}, width: number, height: number): FrameResult {
  const p = normalizeParams({ ...input, preset: input.preset === 'corners' ? 'corners' : 'border', width, height });
  const d = new Drawing(p);
  const depth = Math.min(p.size, Math.min(p.width, p.height) * 0.24);
  if (depth < 2 || !p.width || !p.height) return { ...d.result(), inset: { top: 0, right: 0, bottom: 0, left: 0 } };
  const margin = Math.min(2, depth * 0.08), s = depth - margin * 2;
  // Four reserved square corner cells. Corner-only frames pair the main motif with a compatible accent on the other diagonal.
  const corners = [[0, 0, p.reflect], [p.width - depth, 0, flipped(p.reflect)],
    [0, p.height - depth, ({ none: 'y', x: 'both', y: 'none', both: 'x' } as const)[p.reflect]],
    [p.width - depth, p.height - depth, ({ none: 'both', x: 'y', y: 'x', both: 'none' } as const)[p.reflect]]] as const;
  const accent = variant(p, 0);
  corners.forEach(([x, y, reflect], index) => {
    const id = p.preset === 'corners' && (index === 1 || index === 2) ? accent.id : p.motif;
    d.place(id, x + margin, y + margin, s, s, p.rotation, reflect);
  });
  if (p.preset === 'border') {
    const edge = (length: number, vertical: boolean) => {
      const n = Math.min(124, Math.max(0, Math.floor((length - 2 * depth + p.gap) / (depth + p.gap))));
      if (!n) return;
      const step = (length - 2 * depth) / n;
      for (let i = 0; i < n; i++) {
        const v = variant(p, i);
        const along = depth + i * step + (step - s) / 2;
        if (vertical) {
          const rotation = ((p.rotation + 90) % 360) as Params['rotation'];
          d.place(v.id, margin, along, s, s, rotation, v.reflect);
          d.place(v.id, p.width - depth + margin, along, s, s, rotation, flipped(v.reflect));
        } else {
          d.place(v.id, along, margin, s, s, p.rotation, v.reflect);
          d.place(v.id, along, p.height - depth + margin, s, s, ((p.rotation + 180) % 360) as Params['rotation'], v.reflect);
        }
      }
    };
    edge(p.width, false); edge(p.height, true);
  }
  const inset = Math.min(depth + Math.min(p.gap, depth * 0.2), Math.min(p.width, p.height) * 0.3);
  return { ...d.result(), inset: { top: inset, right: inset, bottom: inset, left: inset } };
}

export { COMPOSITIONS, generateComposition } from "./compositions.js";
export type { CompositionId, CompositionKind, CompositionParams, CompositionResult } from "./compositions.js";

export { BACKGROUNDS, generateBackground } from './backgrounds.js';
export type { BackgroundId, BackgroundParams, BackgroundResult } from './backgrounds.js';

export { BOOK_STUDIES } from './reference-recipes.js';
export type { BookStudyId } from './reference-recipes.js';
export { ELITE_STUDIES } from './elite-recipes.js';
export type { EliteId } from './elite-recipes.js';
export { CEREMONIAL_LAYOUTS } from './ceremonial-layouts.js';
export { DEER_STUDIES, DEER_OUTLINE } from './deer-recipes.js';

export { TEXTILE_STUDIES } from './textile-recipes.js';
export { CORNER_DIVIDER_STUDIES } from './corner-divider-recipes.js';
