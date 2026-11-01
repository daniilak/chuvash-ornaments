export type Point = readonly [number, number];
export type Segment = readonly [Point, Point];
export type MotifId = 'wing_r' | 'chelovech' | 'chelovek' | 'snezhinka1' | 'snezhinka2' | 'snezhinka3' | 'krab' | 'keske_iz_serdtsa' | 'zvezda' | 'serdtse' | 'bolshoe_serdtse' | 'vzaimoponimanie' | 'kuritsa' | 'kuritsa_fill' | 'tsvetok' | 'tree';
export interface MotifData {
  readonly id: MotifId;
  readonly name: string;
  readonly tag: string;
  readonly segments: readonly Segment[];
  readonly fills?: readonly (readonly Point[])[];
}
export type Preset = 'motif' | 'divider' | 'band' | 'tile' | 'border' | 'corners';
export type Sequence = 'repeat' | 'alternate' | 'mirror' | 'seeded';
export interface Params {
  schemaVersion: 1;
  preset: Preset;
  motif: MotifId;
  /** Explicit compatible pool; normalized defaults derive from motif. */
  motifs: readonly MotifId[];
  seed: number;
  width: number;
  height: number;
  /** Maximum outer motif size, in output/container units. */
  size: number;
  /** Minimum gap between padded motif boxes, in output/container units. */
  gap: number;
  /** Maximum placements for a band/divider; capped at 128. */
  count: number;
  /** Stroke thickness in original motif coordinates, before uniform scaling. */
  strokeWidth: number;
  fill: boolean;
  fillOpacity: number;
  /** Clockwise quarter turns in screen coordinates. */
  rotation: 0 | 90 | 180 | 270;
  reflect: 'none' | 'x' | 'y' | 'both';
  sequence: Sequence;
  layout: 'grid' | 'checkerboard';
  /** currentColor or a CSS hex color (#RGB, #RGBA, #RRGGBB, #RRGGBBAA). */
  color: string;
  /** Nonempty title makes the standalone SVG accessible. */
  title: string;
}
export type ParamsInput = Partial<Params>;
export interface Placement {
  motif: MotifId;
  /** Conservative ink bounds, including miter safety padding, in SVG units. */
  x: number; y: number; width: number; height: number;
  rotation: Params['rotation']; reflect: Params['reflect'];
}
export interface Generated {
  svg: string;
  width: number;
  height: number;
  params: Params;
  /** Useful for inspecting layout; boxes include all stroke and fill ink. */
  placements: readonly Placement[];
}
export interface FrameResult extends Generated {
  inset: { top: number; right: number; bottom: number; left: number };
}
