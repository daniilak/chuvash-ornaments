import { ELITE_STUDIES, BOOK_STUDIES, BACKGROUNDS, type BackgroundId, type CompositionId, type Params, type ParamsInput } from '@daniilak/chuvash-ornaments';
import {chuvashDesignNames,type Language} from './i18n';
type Copy = {name:string};
export interface DesignInfo {
  ru:Copy;en:Copy;
  fill:'outline'|'hatch'|'fixed'|'none';
  opacity:boolean;
}
/** Short interface names; the library retains the original catalog and recipe names. */
export const designInfo:Record<CompositionId,DesignInfo>={
 ...Object.fromEntries(ELITE_STUDIES.map(b=>[b.id,{ru:{name:b.name.ru},en:{name:b.name.en},fill:'outline',opacity:true}])) as Record<typeof ELITE_STUDIES[number]['id'],DesignInfo>,
 ...Object.fromEntries(BOOK_STUDIES.map(b=>[b.id,{ru:{name:b.name.ru},en:{name:b.name.en},fill:'outline',opacity:true}])) as Record<typeof BOOK_STUDIES[number]['id'],DesignInfo>,
 'diamond-ribbon':{ru:{name:'Ромбы'},en:{name:'Diamonds'},fill:'outline',opacity:true},
 'stepped-frieze':{ru:{name:'Ступени'},en:{name:'Steps'},fill:'outline',opacity:true},
 'paired-birds':{ru:{name:'Птицы'},en:{name:'Birds'},fill:'outline',opacity:true},
 'keske-lace':{ru:{name:'Кӗскӗ'},en:{name:'Kĕskĕ'},fill:'fixed',opacity:true},
 'sun-weave':{ru:{name:'Солнца'},en:{name:'Suns'},fill:'outline',opacity:true},
 'tree-procession':{ru:{name:'Сердца и деревья'},en:{name:'Hearts & trees'},fill:'outline',opacity:true},
 'hooked-meander':{ru:{name:'Крючки'},en:{name:'Hooks'},fill:'outline',opacity:false},
 'hatched-diamonds':{ru:{name:'Штриховка'},en:{name:'Hatching'},fill:'hatch',opacity:false},
 'ceremonial-tree':{ru:{name:'Дерево'},en:{name:'Tree'},fill:'none',opacity:false},
 'book-frame':{ru:{name:'Звёздная рамка'},en:{name:'Star frame'},fill:'outline',opacity:true},
 'comb-rosette':{ru:{name:'Гребни'},en:{name:'Combs'},fill:'outline',opacity:true},
 'lozenge-ligature':{ru:{name:'Вязь'},en:{name:'Ligature'},fill:'outline',opacity:true},
 'toothed-diamonds':{ru:{name:'Зубцы'},en:{name:'Teeth'},fill:'outline',opacity:true},
 'horn-band':{ru:{name:'Рога'},en:{name:'Horns'},fill:'outline',opacity:true},
 'comb-band':{ru:{name:'Гребёнка'},en:{name:'Comb border'},fill:'hatch',opacity:false},
 'branch-medallion':{ru:{name:'Медальон'},en:{name:'Medallion'},fill:'outline',opacity:true},
 'lozenge-frame':{ru:{name:'Ромбовая рамка'},en:{name:'Diamond frame'},fill:'outline',opacity:true},
 'hooked-rosette':{ru:{name:'Ветви'},en:{name:'Branches'},fill:'outline',opacity:true},
};
export const backgroundInfo:Record<BackgroundId,Pick<DesignInfo,'fill'|'opacity'>>={
 'woven-lattice':{fill:'none',opacity:false},
 'lozenge-net':{fill:'none',opacity:false},'keske-field':{fill:'none',opacity:false},
 'stepped-carpet':{fill:'outline',opacity:true},'cross-stitch':{fill:'hatch',opacity:false},
};
export const designCopy=(id:CompositionId,lang:Language)=>lang==='cv'?{name:chuvashDesignNames[id]}:designInfo[id][lang];

/** Limits mirror the actual renderer, so sliders do not extend into ranges with no effect. */
export function sizeLimit(design:string,p:Pick<Params,'width'|'height'|'gap'|'layout'>):number{
 const W=p.width,H=p.height;
 let maximum:number;
 const background=BACKGROUNDS.find(b=>b.id===design);
 if(design.endsWith('-corners'))maximum=Math.min(W,H)*.38;
 else if(['embroidered-knot-divider','paired-bloom-divider','stepped-lace-divider'].includes(design))maximum=96*Math.min(H*.8/96,W*.9/340);
 else if(design==='wedding-cloth-frame')maximum=Math.min(W,H)*.16;
 else if(design==='masmak-tiered-band')maximum=Math.min(H*.86,W*1.5);
 else if(design==='sara-paired-tailpiece')maximum=680*Math.min(W*.94/1100,H*.9/680);
 else if(design==='winged-headpiece')maximum=52*Math.min(W*.9/148,H*.8/52);
 else if(design==='deer-guardians'||design==='deer-crest')maximum=132*Math.min(W*.92/360,H*.82/132);
 else if(design==='deer-sun-divider')maximum=104*Math.min(W*.92/288,H*.8/104);
 else if(['sovereign-headpiece','procession-headpiece','heart-canopy-headpiece'].includes(design))maximum=88*Math.min(W*.92/264,H*.82/88);
 else if(ELITE_STUDIES.some(b=>b.id===design&&b.kind==='separator'))maximum=64*Math.min(W*.92/244,H*.78/64);
 else if(design==='regal-headpiece')maximum=78*Math.min(W*.92/244,H*.82/82);
 else if(ELITE_STUDIES.some(b=>b.id===design&&b.kind==='rosette'))maximum=Math.min(W,H)*.86;
 else if(ELITE_STUDIES.some(b=>b.id===design&&b.kind==='frame'))maximum=Math.min(W,H)*.2;
 else if(ELITE_STUDIES.some(b=>b.id===design&&b.kind==='band'))maximum=Math.min(H*.8,W*.64)/1.3;
 else if(design==='panel-headpiece')maximum=30*Math.min(W*.9/150,H*.82/38);
 else if(BOOK_STUDIES.some(b=>b.id===design))maximum=Math.min(H*.8,W*.65)/1.4;
 else if(background)maximum=Math.min(W,H)*background.sizeRatio;
 else if(design==='comb-rosette'||design==='hooked-rosette'||design==='branch-medallion')maximum=Math.min(W,H)*.88;
 else if(design==='book-frame'||design==='lozenge-frame')maximum=Math.min(W,H)*.22;
 else if(design==='border'||design==='corners')maximum=Math.min(W,H)*.24;
 else if(design==='tile')maximum=Math.min(W,H)/(p.layout==='checkerboard'?2:1)-p.gap;
 else if(design==='ceremonial-tree')maximum=30*Math.min(H*.8/26,W*.48/40);
 else if(design==='hooked-meander'||design==='hatched-diamonds')maximum=Math.min(H*.72,W*.7)/1.2;
 else if(['lozenge-ligature','toothed-diamonds','horn-band','comb-band'].includes(design))maximum=Math.min(H*.8,W*.7)/1.3;
 else if(design in designInfo){
  const pad=Math.min(6,H*.08,W*.04),ratio=design==='paired-birds'?2.5:design==='diamond-ribbon'?1.55:1.1;
  maximum=Math.min(H*.8,(W-2*pad)/ratio)/1.35;
 }else maximum=Math.min(W,H);
 return Math.max(8,Math.floor(maximum));
}
export function fitUiParams(design:string,current:ParamsInput,patch:ParamsInput):ParamsInput{
 const p={...current,...patch};
 const W=p.width??720,H=p.height??160,layout=p.layout??'grid';
 if(design==='tile')p.gap=Math.min(p.gap??12,Math.max(0,Math.min(W,H)/(layout==='checkerboard'?2:1)-8));
 p.size=Math.min(p.size??80,sizeLimit(design,{width:W,height:H,gap:p.gap??12,layout}));
 return p;
}
