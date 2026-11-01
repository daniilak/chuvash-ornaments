import { Drawing } from './drawing.js';
import { Ink, type Polygon } from './ink.js';
import { getMotif } from './catalog.js';
import { geometry } from './geometry.js';
import type { CompositionParams, StudyPlacement } from './compositions.js';
import type { MotifId } from './types.js';

export const REFINED_IDS=['stepped-frieze','tree-procession','keske-lace','book-frame','stitch-ribbon','nested-chevrons','forked-frieze','panel-headpiece'] as const;
export function refinedVersion(id:string):3|4|5{
 return (REFINED_IDS as readonly string[]).includes(id)?5:['stitch-ribbon','nested-chevrons','stepped-scrolls','diagonal-scrolls','forked-frieze','panel-headpiece'].includes(id)?4:3;
}
/** Revision 5 balances the composition's ink, without editing source coordinates. */
export function renderRefinedBand(d:Drawing,p:CompositionParams,studies:StudyPlacement[]):void{
 const ink=new Ink(d,p),W=p.width,H=p.height;
 const h=Math.min(H*.76,p.size*1.3,W*.68),space=p.gap*.18;
 const n=Math.max(1,Math.min(64,p.count,Math.floor((W*.9+space)/(h*1.15+space))));
 const cell=Math.min(h*1.15,(W*.9-(n-1)*space)/n),s=cell/32,left=(W-n*cell-(n-1)*space)/2,cy=H/2;
 const source=(id:MotifId,cx:number,diameter:number)=>{
  const g=geometry(getMotif(id),{...p,strokeWidth:0}),raw=Math.max(g.width,g.height);
  const desired=s*.36*Math.min(2,p.strokeWidth/.26);
  const strokeWidth=Math.min(2,desired*raw/Math.max(diameter-8*desired,diameter*.3));
  const local=new Drawing({...p,strokeWidth});local.place(id,cx-diameter/2,cy-diameter/2,diameter,diameter,0,'none');
  d.parts.push(...local.parts);d.placements.push(...local.placements);
 };
 try{
  for(const side of [-1,1]){
   ink.line([[left,cy+side*14.7*s],[W-left,cy+side*14.7*s]],s*.38);
   ink.line([[left,cy+side*16*s],[W-left,cy+side*16*s]],s*.16);
  }
  for(let i=0;i<n;i++){
   const cx=left+(i+.5)*cell+i*space;
   if(p.composition==='stepped-frieze'){
    ink.stamp(cx,cy,s,0,()=>{
     const bracket:Polygon=[[-14,-10],[-6,-10],[-6,-8],[-3,-8],[-3,-5],[0,-5],[0,-2],[-3,-2],[-3,2],[0,2],[0,5],[-3,5],[-3,8],[-6,8],[-6,10],[-14,10],[-14,7],[-10,7],[-10,4],[-7,4],[-7,1],[-10,1],[-10,-1],[-7,-1],[-7,-4],[-10,-4],[-10,-7],[-14,-7]];
     for(const side of [-1,1])ink.polygon(bracket.map(([x,y])=>[side*(x-1),y]));
     if(p.seed%2)for(const y of [-4,0,4])ink.diamond(0,y,.55);else ink.diamond(0,0,1.1);
    });
   }else{
    const id:MotifId=p.composition==='tree-procession'?((i+p.seed)%2?'serdtse':'tree'):(['snezhinka1','snezhinka3','keske_iz_serdtsa'] as const)[p.seed%3];
    source(id,cx,s*25);
    ink.stamp(cx,cy,s,0,()=>{
     for(const side of [-1,1])ink.diamond(side*15,0,.75);
     if(p.composition==='keske-lace')for(const side of [-1,1])ink.diamond(0,side*13,.7);
    });
   }
   studies.push({kind:'geometric-study',x:cx-cell/2,y:cy-17*s,width:cell,height:34*s});
  }
 }finally{ink.flush();}
}
