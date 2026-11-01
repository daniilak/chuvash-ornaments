import { getMotif } from "./catalog.js";
import { escapeXML, fmt, geometry } from "./geometry.js";
import type { Generated, MotifId, Params, Placement } from "./types.js";

export class Drawing {
  parts: string[] = [];
  placements: Placement[] = [];
  constructor(readonly params: Params) {}
  place(id: MotifId, x: number, y: number, width: number, height: number, rotation = this.params.rotation, reflect = this.params.reflect) {
    if (width <= 0 || height <= 0 || this.placements.length >= 512) return;
    const p = this.params, g = geometry(getMotif(id), p, rotation, reflect);
    const scale = Math.min(width / g.width, height / g.height);
    const w = g.width * scale, h = g.height * scale;
    x += (width - w) / 2; y += (height - h) / 2;
    this.placements.push({ motif: id, x, y, width: w, height: h, rotation, reflect });
    const points = (poly: readonly (readonly number[])[]) => poly.map(q => q.map(fmt).join(',')).join(' ');
    const fills = p.fill ? g.fills.map(poly => `<polygon points="${points(poly)}" fill="${p.color}" fill-opacity="${fmt(p.fillOpacity)}" stroke="none"/>`).join('') : '';
    const lines = g.lines.map(poly => `<polyline points="${points(poly)}" fill="none"/>`).join('');
    this.parts.push(`<g transform="translate(${fmt(x - g.x * scale)} ${fmt(y - g.y * scale)}) scale(${fmt(scale)})" stroke="${p.color}" stroke-width="${fmt(p.strokeWidth)}" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="8">${fills}${lines}</g>`);
  }
  result(): Generated {
    const p = this.params;
    const a11y = p.title ? `role="img" aria-label="${escapeXML(p.title)}"` : 'aria-hidden="true"';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(p.width)}" height="${fmt(p.height)}" viewBox="0 0 ${fmt(p.width || 1)} ${fmt(p.height || 1)}" preserveAspectRatio="xMidYMid meet" fill="none" ${a11y}>${p.title ? `<title>${escapeXML(p.title)}</title>` : ''}${this.parts.join('')}</svg>`;
    return { svg, width: p.width, height: p.height, params: p, placements: this.placements };
  }
}
