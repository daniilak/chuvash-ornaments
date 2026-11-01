'use client';
import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { fitFrame, generateMotif, generateOrnament, generateTile, generateComposition, generateBackground, normalizeParams } from './index.js';
import type { CompositionId, BackgroundId, Generated, ParamsInput } from './index.js';

export interface ArtProps extends ParamsInput {
  className?: string;
  style?: CSSProperties;
}
function Art({ art, className, style }: { art: Generated; className?: string; style?: CSSProperties }) {
  const svg = art.svg.replace(/width="[^"]*" height="[^"]*"/, 'width="100%" height="100%" style="display:block"');
  return <div className={className} style={{ width: '100%', aspectRatio: `${art.width || 1} / ${art.height || 1}`, ...style }}
    dangerouslySetInnerHTML={{ __html: svg }} />;
}
/** Decorative by default; title makes the SVG an independently named image. */
export function Motif({ className, style, ...params }: ArtProps) {
  return <Art art={generateMotif(params)} className={className} style={style} />;
}
export function Ornament({ className, style, ...params }: ArtProps) {
  return <Art art={generateOrnament(params)} className={className} style={style} />;
}
export interface CompositionProps extends ArtProps {
  composition?: CompositionId;
  compositionVersion?: 1 | 2 | 3 | 4 | 5;
  accentColor?: string;
}
/** Newly authored book-inspired compositions; original source motifs stay intact. */
export function Composition({ className, style, ...params }: CompositionProps) {
  return <Art art={generateComposition(params)} className={className} style={style} />;
}
export interface PatternBackgroundProps extends ArtProps {
  background?: BackgroundId;
  backgroundVersion?: 1;
  children?: ReactNode;
}
/** CSS image documents cannot inherit currentColor: use an explicit hex ink (default #8b1a1a). */
export function PatternBackground({ className, style, children, ...params }: PatternBackgroundProps) {
  const normalized = normalizeParams(params);
  const tile = (params.background?generateBackground:generateTile)({ ...params, color: normalized.color === 'currentColor' ? '#8b1a1a' : normalized.color });
  return <div className={className} style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(tile.svg)}")`,
    backgroundSize: `${tile.width}px ${tile.height}px`, ...style }}>{children}</div>;
}
export interface FramedProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  preset?: 'border' | 'corners';
  motif?: ParamsInput['motif'];
  motifs?: ParamsInput['motifs'];
  seed?: number;
  size?: number;
  gap?: number;
  strokeWidth?: number;
  fill?: boolean;
  fillOpacity?: number;
  rotation?: ParamsInput['rotation'];
  reflect?: ParamsInput['reflect'];
  sequence?: ParamsInput['sequence'];
  color?: string;
  children?: ReactNode;
}
/** Padding is independent of measurements, so observing the box cannot create a padding/resize loop. */
export function Framed({ preset = 'border', motif, motifs, seed, size = 32, gap, strokeWidth, fill,
  fillOpacity, rotation, reflect, sequence, color, children, style, ...rest }: FramedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth, height = el.clientHeight;
      setBox(old => old?.width === width && old.height === height ? old : { width, height });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const p = normalizeParams({ preset, motif, motifs, seed, size, gap, strokeWidth, fill, fillOpacity, rotation, reflect, sequence, color });
  const frame = box ? fitFrame(p, box.width, box.height) : null;
  const pad = p.size + Math.min(p.gap, p.size * 0.2);
  return <div {...rest} ref={ref} style={{ ...style, boxSizing: 'border-box',
    position: style?.position && style.position !== 'static' ? style.position : 'relative', isolation: 'isolate', padding: pad }}>
    {frame && <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: -1 }}
      dangerouslySetInnerHTML={{ __html: frame.svg.replace(/width="[^"]*" height="[^"]*"/, 'width="100%" height="100%" style="display:block"') }} />}
    {children}
  </div>;
}
