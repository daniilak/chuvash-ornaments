import { MOTIFS } from './catalog.js';
import type { MotifId, Params, Preset } from './types.js';
export const GENERATOR_VERSION = 1 as const;
export const PRESETS: readonly Readonly<{ id: Preset; name: string }>[] = Object.freeze(([
  { id: 'motif', name: 'Мотив' }, { id: 'divider', name: 'Разделитель' },
  { id: 'band', name: 'Полоса' }, { id: 'tile', name: 'Плитка' },
  { id: 'border', name: 'Рамка' }, { id: 'corners', name: 'Углы' },
] satisfies { id: Preset; name: string }[]).map(p => Object.freeze(p)));
const families: readonly (readonly MotifId[])[] = [
  ['serdtse', 'bolshoe_serdtse', 'keske_iz_serdtsa'], ['kuritsa', 'kuritsa_fill'],
  ['snezhinka1', 'snezhinka2', 'snezhinka3'], ['zvezda', 'snezhinka3'],
  ['tree', 'tsvetok'], ['chelovech', 'chelovek', 'vzaimoponimanie'],
];
const isMotif = (v: unknown): v is MotifId => MOTIFS.some(m => m.id === v);
const number = (v: unknown, fallback: number, min: number, max: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
function choice<T extends string | number>(v: unknown, options: readonly T[], fallback: T): T {
  return options.includes(v as T) ? v as T : fallback;
}
/** Accepts JSON-like unknown input. Unknown fields are discarded; explicit future schemas are rejected. */
export function normalizeParams(input: unknown = {}): Params {
  const p = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  if (p.schemaVersion !== undefined && p.schemaVersion !== 1) throw new RangeError('Unsupported ornament schemaVersion');
  const motif = isMotif(p.motif) ? p.motif : 'serdtse';
  const pool = Array.isArray(p.motifs) ? p.motifs.slice(0, 16).filter(isMotif) : [];
  return {
    schemaVersion: 1,
    preset: choice(p.preset, ['motif', 'divider', 'band', 'tile', 'border', 'corners'], 'divider'),
    motif, motifs: pool.length ? [...new Set(pool)] : [...(families.find(f => f.includes(motif)) ?? [motif])],
    seed: Math.floor(number(p.seed, 1, 0, 4294967295)),
    width: number(p.width, 640, 0, 16384), height: number(p.height, 120, 0, 16384),
    size: number(p.size, 48, 0, 1024), gap: number(p.gap, 8, 0, 1024),
    count: Math.floor(number(p.count, 9, 1, 128)),
    strokeWidth: number(p.strokeWidth, 0.18, 0, 2),
    fill: typeof p.fill === 'boolean' ? p.fill : true,
    fillOpacity: number(p.fillOpacity, 0.82, 0, 1),
    rotation: choice(p.rotation, [0, 90, 180, 270], 0),
    reflect: choice(p.reflect, ['none', 'x', 'y', 'both'], 'none'),
    sequence: choice(p.sequence, ['repeat', 'alternate', 'mirror', 'seeded'], 'seeded'),
    layout: choice(p.layout, ['grid', 'checkerboard'], 'grid'),
    color: typeof p.color === 'string' && /^(?:currentColor|#[\da-f]{3}|#[\da-f]{4}|#[\da-f]{6}|#[\da-f]{8})$/i.test(p.color) ? p.color : 'currentColor',
    title: typeof p.title === 'string' ? p.title.slice(0, 200).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '') : '',
  };
}
/** A stateless integer mixer: bounded choices are independent of rendering order. */
export function pick(seed: number, index: number, length: number): number {
  let n = (seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  n = Math.imul(n ^ n >>> 16, 0x21f0aaad);
  n = Math.imul(n ^ n >>> 15, 0x735a2d97);
  return ((n ^ n >>> 15) >>> 0) % length;
}
