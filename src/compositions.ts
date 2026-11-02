import { refinedVersion, renderRefinedBand } from './refinements.js';
import { ELITE_STUDIES, ELITE_COLOR, ELITE_ACCENT, renderEliteRecipe, type EliteId } from './elite-recipes.js';
import { BOOK_STUDIES, renderReferenceRecipe, type BookStudyId } from './reference-recipes.js';
import { ADDITIONAL_IDS, renderAdditionalRecipe, type AdditionalId } from './additional-recipes.js';
import type { CompositionId as LegacyId } from './legacy-compositions.js';
import { generateComposition as generateLegacyComposition } from './legacy-compositions.js';
import { renderBookRecipe } from './book-recipes.js';
import { Drawing } from './drawing.js';
import { escapeXML, fmt } from './geometry.js';
import { normalizeParams, pick } from './params.js';
import type { FrameResult, Generated, Params, ParamsInput, Point } from './types.js';

export type CompositionId = 'diamond-ribbon' | 'stepped-frieze' | 'paired-birds' | 'keske-lace' | 'sun-weave' | 'tree-procession' | 'hooked-meander' | 'hatched-diamonds' | 'ceremonial-tree' | 'comb-rosette' | 'hooked-rosette' | 'book-frame' | AdditionalId | BookStudyId | EliteId;
export interface CompositionParams extends Params {
  composition: CompositionId;
  compositionVersion: 1 | 2 | 3 | 4 | 5;
  accentColor?: string;
}
export interface StudyPlacement {
  kind: 'rule' | 'geometric-study';
  x: number; y: number; width: number; height: number;
}
export interface CompositionResult extends Generated {
  params: CompositionParams;
  /** Newly authored geometric decorations, separate from untouched source motif placements. */
  studies: readonly StudyPlacement[];
  /** Safe content margins for frame recipes. */
  inset?: FrameResult['inset'];
}
export type CompositionKind = 'band' | 'divider' | 'separator' | 'rosette' | 'frame' | 'tailpiece';
export const COMPOSITIONS = Object.freeze(([
  { id: 'diamond-ribbon', kind: 'band', name: Object.freeze({ ru: 'Цепь ромбов', en: 'Diamond ribbon' }) },
  { id: 'stepped-frieze', kind: 'band', name: Object.freeze({ ru: 'Ступенчатая кайма', en: 'Stepped frieze' }) },
  { id: 'paired-birds', kind: 'band', name: Object.freeze({ ru: 'Парные птицы', en: 'Paired birds' }) },
  { id: 'keske-lace', kind: 'band', name: Object.freeze({ ru: 'Кайма с Кӗскӗ', en: 'Kĕskĕ lace' }) },
  { id: 'sun-weave', kind: 'band', name: Object.freeze({ ru: 'Солнечное плетение', en: 'Sun weave' }) },
  { id: 'tree-procession', kind: 'band', name: Object.freeze({ ru: 'Деревья и сердца', en: 'Trees and hearts' }) },
  { id: 'hooked-meander', kind: 'band', name: Object.freeze({ ru: 'Крючковый меандр', en: 'Hooked meander' }) },
  { id: 'hatched-diamonds', kind: 'band', name: Object.freeze({ ru: 'Штрихованные ромбы', en: 'Hatched lozenges' }) },
  { id: 'ceremonial-tree', kind: 'divider', name: Object.freeze({ ru: 'Дерево на линии', en: 'Tree headpiece' }) },
  { id: 'book-frame', kind: 'frame', name: Object.freeze({ ru: 'Книжная рамка', en: 'Book frame' }) },
  { id: 'comb-rosette', kind: 'rosette', name: Object.freeze({ ru: 'Гребенчатая розетка', en: 'Comb rosette' }) },
  { id: 'hooked-rosette', kind: 'rosette', name: Object.freeze({ ru: 'Розетка с крючками', en: 'Hooked rosette' }) },
  { id: 'lozenge-ligature', kind: 'band', name: Object.freeze({ ru: 'Ромбовая вязь', en: 'Lozenge ligature' }) },
  { id: 'toothed-diamonds', kind: 'band', name: Object.freeze({ ru: 'Зубчатые ромбы', en: 'Toothed diamonds' }) },
  { id: 'horn-band', kind: 'band', name: Object.freeze({ ru: 'Рогатая кайма', en: 'Horn border' }) },
  { id: 'comb-band', kind: 'band', name: Object.freeze({ ru: 'Гребенчатая полоса', en: 'Comb band' }) },
  { id: 'branch-medallion', kind: 'rosette', name: Object.freeze({ ru: 'Ветвистый медальон', en: 'Branch medallion' }) },
  { id: 'lozenge-frame', kind: 'frame', name: Object.freeze({ ru: 'Ромбовая рамка', en: 'Lozenge frame' }) },
  ...BOOK_STUDIES.map(({id,kind,name})=>({id,kind,name})),
  ...ELITE_STUDIES.map(({id,kind,name})=>({id,kind,name})),
] satisfies { id: CompositionId; kind: CompositionKind; name: { ru: string; en: string } }[]).map(item => Object.freeze({...item,version:refinedVersion(item.id)})));

/** Contemporary geometric compositions inspired by the supplied book examples; not historical tracings. */
export function generateComposition(input: ParamsInput & { composition?: CompositionId; compositionVersion?: 1 | 2 | 3 | 4 | 5; accentColor?: string } = {}): CompositionResult {
  const elite=ELITE_STUDIES.find(b=>b.id===input.composition);
  if(elite&&input.compositionVersion!==undefined&&input.compositionVersion!==3)throw new RangeError('This composition requires compositionVersion 3');
  const book=BOOK_STUDIES.find(b=>b.id===input.composition);
  if(book&&input.compositionVersion!==undefined&&input.compositionVersion!==4&&!(input.compositionVersion===5&&refinedVersion(book.id)===5))throw new RangeError('This composition requires compositionVersion 4 or its supported revision 5');
  const additional=(ADDITIONAL_IDS as readonly string[]).includes(input.composition??'');
  if(additional&&input.compositionVersion!==undefined&&input.compositionVersion<3)throw new RangeError('This composition requires compositionVersion 3');
  if (input.compositionVersion === 1) return generateLegacyComposition({...input,composition:input.composition as LegacyId,compositionVersion:1});
  if (input.compositionVersion !== undefined && input.compositionVersion !== 2 && input.compositionVersion !== 3 && !(book && input.compositionVersion === 4) && !(input.compositionVersion===5&&refinedVersion(input.composition??'diamond-ribbon')===5)) throw new RangeError('Unsupported compositionVersion');
  const composition = COMPOSITIONS.some(c => c.id === input.composition) ? input.composition! : 'diamond-ribbon';
  const kind=COMPOSITIONS.find(c=>c.id===composition)!.kind;
  const version=input.compositionVersion??refinedVersion(composition);
  const p: CompositionParams = { ...normalizeParams({ width: kind==='rosette'?400:720, height: kind==='rosette'?400:kind==='frame'?400:kind==='tailpiece'?440:kind==='divider'?220:kind==='separator'?120:160, size: elite?elite.size:book?book.size:kind==='rosette'?320:kind==='frame'?72:kind==='divider'?200:80, count: 128, strokeWidth: 0.36, fillOpacity: 1, ...(book?{color:book.twoTone?'#292824':'#a64c38'}:{}), ...(elite?{color:ELITE_COLOR}:{}), ...(version===5&&['nested-chevrons','forked-frieze'].includes(composition)?{gap:0}:{}), ...input, preset: 'band' }), composition, compositionVersion: version, ...(elite||book?.twoTone?{accentColor:normalizeParams({color:input.accentColor??(elite?ELITE_ACCENT:book?.id==='nested-chevrons'?'#c4a56d':'#a64c38')}).color}:{}) };
  const d = new Drawing(p), studies: StudyPlacement[] = [];
  let inset: FrameResult['inset']|undefined;
  const result = (): CompositionResult => ({ ...d.result(), params: p, studies, ...(inset?{inset}:{}) });
  if (p.width <= 0 || p.height <= 0 || p.size <= 0) return result();
  if(elite){inset=renderEliteRecipe(d,p,studies);return result();}
  if(version===5&&['stepped-frieze','tree-procession','keske-lace'].includes(composition)){renderRefinedBand(d,p,studies);return result();}
  if(book){renderReferenceRecipe(d,p,studies);return result();}
  if(additional){inset=renderAdditionalRecipe(d,p,studies);return result();}
  if(['hooked-meander','hatched-diamonds','ceremonial-tree','comb-rosette','hooked-rosette','book-frame'].includes(composition)){
    inset=renderBookRecipe(d,p,studies);return result();
  }
  const pad = Math.min(6, p.height * 0.08, p.width * 0.04);
  const ratio = composition === 'paired-birds' ? 2.5 : composition === 'diamond-ribbon' ? 1.55 : 1.1;
  const h = Math.min(p.height * 0.8, p.size * 1.35, (p.width-2*pad)/ratio);
  if (h <= 0 || p.width <= 2 * pad) return result();
  const y = (p.height - h) / 2;
  const nominalWidth = h * ratio;
  const n = Math.min(p.count, 64, Math.max(1, Math.floor((p.width - 2 * pad + p.gap) / (nominalWidth + p.gap))));
  const cw = Math.min(nominalWidth, (p.width - 2 * pad - (n - 1) * p.gap) / n);
  const left = (p.width - n * cw - (n - 1) * p.gap) / 2;
  const pen = Math.min(h * 0.035, p.strokeWidth * h / 10);
  const polygon = (points: readonly Point[], fill = true, stroke = true) => {
    d.parts.push(`<polygon points="${points.map(q => q.map(fmt).join(',')).join(' ')}" fill="${fill ? escapeXML(p.color) : 'none'}" fill-opacity="${fmt(p.fillOpacity)}" stroke="${stroke ? p.color : 'none'}" stroke-width="${fmt(pen)}" stroke-linejoin="miter" stroke-miterlimit="8"/>`);
  };
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    // Lines are inset far enough that their half-stroke never leaves the drawing.
    d.parts.push(`<path d="M${fmt(x1)} ${fmt(y1)}L${fmt(x2)} ${fmt(y2)}" stroke="${p.color}" stroke-width="${fmt(pen)}" stroke-linecap="butt"/>`);
    studies.push({kind:'rule',x:Math.min(x1,x2)-pen/2,y:Math.min(y1,y2)-pen/2,width:Math.abs(x2-x1)+pen,height:Math.abs(y2-y1)+pen});
  };
  const rhomb = (cx: number, cy: number, r: number, filled = true) => {
    polygon([[cx,cy-r],[cx+r,cy],[cx,cy+r],[cx-r,cy]], filled && p.fill, !(filled && p.fill));
    studies.push({kind:'geometric-study',x:cx-r-pen,y:cy-r-pen,width:2*r+2*pen,height:2*r+2*pen});
  };
  const reflected = (index: number): Params['reflect'] => (index + pick(p.seed, 31, 2)) % 2 ? 'x' : 'none';
  for (let i = 0; i < n; i++) {
    const x = left + i * (cw + p.gap), cx = x + cw / 2;
    if (composition === 'diamond-ribbon') {
      // Double outlined lozenges, with the source sun kept intact at the center.
      for (const inset of [0.07,0.17]) {
        const rx = cw * (0.5-inset), ry = h * (0.5-inset);
        polygon([[cx-rx,y+h/2],[cx,y+h/2-ry],[cx+rx,y+h/2],[cx,y+h/2+ry]],false);
      }
      d.place((['zvezda','snezhinka3'] as const)[p.seed%2],cx-h*0.25,y+h*0.25,h*0.5,h*0.5,0,'none');
      rhomb(cx,y+h*0.08,h*0.025);rhomb(cx,y+h*0.92,h*0.025);
    } else if (composition === 'stepped-frieze') {
      // A new explicit filled stepped-hook silhouette on a 16×16 grid.
      // This is not an inferred fill or a replacement of an original source motif.
      const hook: readonly Point[] = [[1,1],[7,1],[7,3],[9,3],[9,5],[11,5],[11,7],[9,7],[9,9],[6,9],[6,7],[7,7],[7,5],[5,5],[5,12],[8,12],[8,10],[10,10],[10,14],[7,14],[7,16],[3,16],[3,14],[1,14]];
      const scale = Math.min(cw/26,h/20), w = scale*26, ht = scale*16;
      for (const mirror of [false,true]) {
        const pts: Point[] = hook.map(([px,py]) => [x+(cw-w)/2+(mirror?26-px:px)*scale,y+(h-ht)/2+((p.seed%2?17-py:py)-(p.compositionVersion>=3?.5:0))*scale]);
        polygon(pts,p.fill,!p.fill);
      }
      studies.push({kind:'geometric-study',x:x+(cw-w)/2,y:y+(h-ht)/2,width:w,height:ht});
      rhomb(cx,y+h*0.1,h*0.035);rhomb(cx,y+h*0.9,h*0.035);
    } else if (composition === 'paired-birds') {
      const s = Math.min(h*.95,cw*.42), cy=y+(h-s)/2;
      const pairMirror = p.seed%2 ? 'x' : 'none';
      d.place('kuritsa_fill',x+cw*0.04,cy,s,s,0,pairMirror);
      d.place('kuritsa_fill',x+cw-s-cw*0.04,cy,s,s,0,pairMirror==='x'?'none':'x');
      d.place('tree',cx-h*.16,y+h*.29,h*.32,h*.42,0,'none');
      rhomb(cx,y+h*0.85,h*0.035);
    } else if (composition === 'keske-lace') {
      const s = Math.min(h*.85,cw*.84);
      const id = (['snezhinka1','snezhinka3','keske_iz_serdtsa'] as const)[p.seed%3];
      d.place(id,cx-s/2,y+(h-s)/2,s,s,0,reflected(i));
      rhomb(cx,y+h*0.09,h*0.04,false);rhomb(cx,y+h*0.91,h*0.04,false);
      for (const side of [-1,1]) {
        const xx=cx+side*cw*0.42;
        polygon([[xx-h*0.04,y+h*0.46],[xx,y+h*0.42],[xx+h*0.04,y+h*0.46],[xx,y+h*0.54]],true,false);
      }
    } else if (composition === 'sun-weave') {
      const size=Math.min(cw*.86,h*.86), ox=cx-size/2, oy=y+(h-size)/2;
      // An explicitly authored stepped ring with a cut-out center, inspired by the book border rhythms.
      const ring: readonly Point[]=[[0,8],[2,6],[1,5],[4,2],[5,3],[6,2],[8,0],[10,2],[11,3],[12,2],[15,5],[14,6],[16,8],[14,10],[15,11],[12,14],[11,13],[10,14],[8,16],[6,14],[5,13],[4,14],[1,11],[2,10]];
      const path=(scale:number)=>ring.map(([px,py],j)=>`${j?'L':'M'}${fmt(ox+(8+(px-8)*scale)*size/16)} ${fmt(oy+(8+(py-8)*scale)*size/16)}`).join('')+'Z';
      d.parts.push(`<path d="${path(1)}${path(.64)}" fill="${p.fill?p.color:'none'}" fill-rule="evenodd" fill-opacity="${fmt(p.fillOpacity)}" stroke="${p.fill?'none':p.color}" stroke-width="${fmt(pen)}" stroke-linejoin="miter"/>`);
      const s=size*.44;
      d.place(p.seed%2?'snezhinka3':'zvezda',cx-s/2,y+h/2-s/2,s,s,0,'none');
      studies.push({kind:'geometric-study',x:ox,y:oy,width:size,height:size});
    } else {
      const s=Math.min(h*.88,cw*.86), id=(i+p.seed)%2?'serdtse':'tree';
      d.place(id,cx-s/2,y+(h-s)/2,s,s,0,reflected(i));
      rhomb(cx,y+h*.09,h*.035);rhomb(cx,y+h*.91,h*.035);
    }
  }
  if (composition !== 'paired-birds') {
    const right = left + n*cw + (n-1)*p.gap;
    line(left,y+h*.015,right,y+h*.015);line(left,y+h*.985,right,y+h*.985);
  }
  return result();
}
