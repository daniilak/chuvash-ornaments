import { Drawing } from './drawing.js';
import { Ink, type Polygon } from './ink.js';
import { geometry } from './geometry.js';
import { getMotif } from './catalog.js';
import type { CompositionParams, StudyPlacement } from './compositions.js';
import type { FrameResult, MotifId, Point } from './types.js';
import { ATELIER_STUDIES, renderAtelierRecipe } from './atelier-recipes.js';
import { BROCADE_STUDIES, renderBrocadeRecipe } from './brocade-recipes.js';
import { CEREMONIAL_LAYOUTS, renderCeremonialLayout } from './ceremonial-layouts.js';
import { DEER_STUDIES, renderDeerRecipe } from './deer-recipes.js';
import { TEXTILE_STUDIES, renderTextileRecipe } from './textile-recipes.js';

/** Contemporary ceremonial studies; names do not assert historical provenance. */
export const ELITE_STUDIES = Object.freeze(([
  {id:'heirloom-chain',kind:'band',name:{ru:'Парадная цепь',en:'Heirloom chain'},size:88},
  {id:'keske-signet',kind:'rosette',name:{ru:'Печать Кӗскӗ',en:'Kĕskĕ signet'},size:320},
  {id:'winged-headpiece',kind:'divider',name:{ru:'Крылатая заставка',en:'Winged headpiece'},size:200},
  {id:'ceremonial-frame',kind:'frame',name:{ru:'Парадная рамка',en:'Ceremonial frame'},size:64},
  ...ATELIER_STUDIES,
  ...BROCADE_STUDIES,
  ...CEREMONIAL_LAYOUTS,
  ...DEER_STUDIES,
  ...TEXTILE_STUDIES,
] as const).map(item=>Object.freeze({...item,name:Object.freeze(item.name)})));
export type EliteId = typeof ELITE_STUDIES[number]['id'];
export const ELITE_COLOR='#762b32', ELITE_ACCENT='#aa8247';
const diamond=(r:number):Polygon=>[[0,-r],[r,0],[0,r],[-r,0]];
const mirror=(poly:Polygon,sx:number,sy:number):Point[]=>poly.map(([x,y])=>[sx*x,sy*y]);
const stepRing:Polygon=[
  [0,-20],[4,-16],[6,-16],[6,-14],[14,-6],[16,-6],[16,-4],[20,0],
  [16,4],[16,6],[14,6],[6,14],[6,16],[4,16],[0,20],
  [-4,16],[-6,16],[-6,14],[-14,6],[-16,6],[-16,4],[-20,0],
  [-16,-4],[-16,-6],[-14,-6],[-6,-14],[-6,-16],[-4,-16],
];

export function renderEliteRecipe(d:Drawing,p:CompositionParams,studies:StudyPlacement[]):FrameResult['inset']|undefined{
  if(TEXTILE_STUDIES.some(b=>b.id===p.composition))return renderTextileRecipe(d,p,studies);
  if(DEER_STUDIES.some(b=>b.id===p.composition))return renderDeerRecipe(d,p,studies);
  if(CEREMONIAL_LAYOUTS.some(b=>b.id===p.composition))return renderCeremonialLayout(d,p,studies);
  if(BROCADE_STUDIES.some(b=>b.id===p.composition)){renderBrocadeRecipe(d,p,studies);return;}
  if(ATELIER_STUDIES.some(b=>b.id===p.composition)){renderAtelierRecipe(d,p,studies);return;}
  const ink=new Ink(d,p),gold=new Ink(d,{...p,color:p.accentColor??ELITE_ACCENT}),W=p.width,H=p.height;
  const region=(cx:number,cy:number,w:number,h=w)=>studies.push({kind:'geometric-study',x:cx-w/2,y:cy-h/2,width:w,height:h});
  const stamp=(cx:number,cy:number,s:number,draw:()=>void)=>ink.stamp(cx,cy,s,0,()=>gold.stamp(cx,cy,s,0,draw));
  // Match source strokes to the local geometric pen while retaining all source points.
  const source=(id:MotifId,cx:number,cy:number,diameter:number,weight:number)=>{
    const g=geometry(getMotif(id),{...p,strokeWidth:0});
    const desired=weight*Math.min(2,p.strokeWidth/.26);
    const strokeWidth=Math.min(2,desired*Math.max(g.width,g.height)/Math.max(diameter-8*desired,diameter*.3));
    const local=new Drawing({...p,strokeWidth});
    local.place(id,cx-diameter/2,cy-diameter/2,diameter,diameter,0,'none');
    d.parts.push(...local.parts);d.placements.push(...local.placements);
  };
  const seal=(detailed:boolean)=>{
    ink.polygon(stepRing,[diamond(15.7)]);
    gold.polygon(diamond(13.1),[diamond(12.2)]);
    for(const sx of [-1,1])for(const sy of [-1,1]){
      // Mirrored pairs, rather than a rotating spiral, keep both reflection axes.
      if(!detailed)ink.line(mirror([[1.8,-7.5],[4,-9.7],[7.2,-6.5],[5.2,-4.5]],sx,sy),.65);
      if(detailed)gold.diamond(sx*14.3,sy*14.3,1.1);
    }
    if(!detailed){gold.polygon(diamond(2.8),[diamond(1.5)]);ink.diamond(0,0, .65);}
    if(detailed)for(const turn of [0,1,2,3]){
      gold.stamp(gold.cx,gold.cy,gold.scale,turn,()=>{
        gold.polygon([[0,-27],[2,-25],[0,-23],[-2,-25]]);
        gold.line([[-2.8,-22],[0,-19.2],[2.8,-22]],.3);
      });
    }
  };
  try{
    if(p.composition==='keske-signet'){
      const diameter=Math.min(p.size,W*.86,H*.86),s=diameter/58;
      stamp(W/2,H/2,s,()=>seal(true));
      source('snezhinka1',W/2,H/2,25*s,.4*s);
      region(W/2,H/2,diameter);return;
    }
    if(p.composition==='winged-headpiece'){
      const s=Math.min(p.size/52,W*.9/148,H*.8/52),cx=W/2,cy=H/2;
      stamp(cx,cy,s,()=>{
        // Four long heart-derived angular arms taper towards the outer terminals.
        const arm:Polygon=[[24,3],[34,-7],[42,1],[50,-7],[58,1],[65,-6],[69,-2],[65,2],[65,0],[58,7],[50,-1],[42,7],[34,-1],[27,6]];
        for(const side of [-1,1]){
          ink.polygon(mirror(arm,side,1));
          gold.line(mirror([[25,-7],[34,-16],[42,-8],[50,-16],[58,-8],[65,-15],[72,-8]],side,1),.45);
          gold.line(mirror([[29,12],[34,7],[42,15],[50,7],[58,15],[65,8]],side,1),.35);
          gold.diamond(side*72,0,1.6);
          gold.diamond(side*23,0,1.2);
        }
        ink.polygon(diamond(19),[diamond(16.8)]);
        gold.polygon(diamond(22),[diamond(21.3)]);
        gold.diamond(0,-25,1);gold.diamond(0,25,1);
      });
      source('keske_iz_serdtsa',cx,cy,29*s,.48*s);
      region(cx,cy,148*s,52*s);return;
    }
    if(p.composition==='ceremonial-frame'){
      const depth=Math.min(p.size,W*.2,H*.2);
      if(depth<2)return{top:0,right:0,bottom:0,left:0};
      const a=depth*.57,s=depth/29;
      // Chamfered inner and outer rules leave the corner medallions uncluttered.
      for(const [offset,pen]of [[depth*.12,.38*s],[depth*1.02,.2*s]]){
        const cut=depth*.4;
        gold.line([[offset+cut,offset],[W-offset-cut,offset],[W-offset,offset+cut],[W-offset,H-offset-cut],[W-offset-cut,H-offset],[offset+cut,H-offset],[offset,H-offset-cut],[offset,offset+cut],[offset+cut,offset]],pen);
      }
      for(const [cx,cy]of [[a,a],[W-a,a],[a,H-a],[W-a,H-a]]){
        stamp(cx,cy,s*.56,()=>seal(false));region(cx,cy,24*s);
      }
      const edge=(length:number,vertical:boolean)=>{
        const start=depth*1.35,end=length-start,span=end-start;
        if(span<=0)return;
        const n=Math.min(64,p.count,Math.max(1,Math.floor(span/(depth*.95+p.gap*.3))));
        const step=span/n;
        for(const opposite of [false,true]){
          const cross=opposite?(vertical?W:H)-a:a;
          const at=(along:number,across:number):Point=>vertical?[cross+across,along]:[along,cross+across];
          for(let i=0;i<n;i++){
            const mid=start+(i+.5)*step,cx=vertical?cross:mid,cy=vertical?mid:cross;
            const from=i===0?start:mid-step+8.5*s,to=mid-8.5*s;
            if(to>from)ink.line([at(from,0),at(to,0)],s*.28);
            if(i===n-1&&end>mid+8.5*s)ink.line([at(mid+8.5*s,0),at(end,0)],s*.28);
            ink.stamp(cx,cy,s,vertical?1:0,()=>gold.stamp(cx,cy,s,vertical?1:0,()=>{
              ink.polygon(diamond(7.5),[diamond(5.4)]);
              gold.diamond(0,0,2.1);
              for(const sign of [-1,1])gold.line([[sign*8,-2],[sign*10,0],[sign*8,2]],.35);
            }));
            region(cx,cy,22*s);
            if(i<n-1){const along=mid+step/2;for(const sign of [-1,1])ink.line([at(along-1.5*s,sign*3.5*s),at(along,sign*2*s),at(along+1.5*s,sign*3.5*s)],s*.35);}
          }
        }
      };
      edge(W,false);edge(H,true);
      const inset=depth*1.32;return{top:inset,right:inset,bottom:inset,left:inset};
    }
    const h=Math.min(p.size*1.3,H*.8,W*.64),s=h/42,space=p.gap*.2;
    const nominal=46*s,n=Math.min(64,p.count,Math.max(1,Math.floor((W*.9+space)/(nominal+space))));
    const left=(W-n*nominal-(n-1)*space)/2,cy=H/2,right=W-left;
    for(const sign of [-1,1]){
      gold.line([[left,cy+sign*20*s],[right,cy+sign*20*s]],s*.3);
      ink.line([[left,cy+sign*22*s],[right,cy+sign*22*s]],s*.2);
    }
    for(let i=0;i<n;i++){
      const cx=left+(i+.5)*nominal+i*space;
      stamp(cx,cy,s,()=>{
        ink.polygon(diamond(17.5),[diamond(14.2)]);
        gold.polygon(diamond(12.2),[diamond(11.4)]);
        for(const sx of [-1,1])for(const sy of [-1,1])ink.line(mirror([[1.4,-7],[4.1,-9.7],[7.3,-6.5],[4.9,-4.1]],sx,sy),.65);
        gold.polygon(diamond(3.5),[diamond(1.8)]);
        if(p.seed%2)ink.diamond(0,0,.65);
        for(const sign of [-1,1])ink.diamond(0,sign*20,.6);
      });
      region(cx,cy,38*s,46*s);
      if(i<n-1)stamp(cx+nominal/2+space/2,cy,s,()=>{
        gold.diamond(0,0,2.2);
        for(const sign of [-1,1])ink.line([[sign*3.8,-3],[sign*.8,0],[sign*3.8,3]],.4);
      });
    }
  }finally{ink.flush();gold.flush();}
}
