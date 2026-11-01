import type { Drawing } from './drawing.js';
import { Ink, type Polygon } from './ink.js';
import type { CompositionParams, StudyPlacement } from './compositions.js';
import type { FrameResult, Point } from './types.js';

export const ADDITIONAL_IDS = ['lozenge-ligature','toothed-diamonds','horn-band','comb-band','branch-medallion','lozenge-frame'] as const;
export type AdditionalId = typeof ADDITIONAL_IDS[number];
const quarter = (points:Polygon):Point[] => Array.from({length:4},(_,turn)=>points.map(([x,y]):Point=>turn===0?[x,y]:turn===1?[-y,x]:turn===2?[-x,-y]:[y,-x])).flat();
const toothed = quarter([[0,-12],[3,-9],[5,-11],[8,-8],[6,-6],[9,-3],[11,-5],[14,-2],[12,0]]);
const stepped = quarter([[0,-10],[2,-10],[2,-8],[4,-8],[4,-6],[6,-6],[6,-4],[8,-4],[8,-2],[10,-2],[10,0]]);

function medallion(ink:Ink){
  const wing:Polygon=[[3,-3],[3,-10],[7,-14],[7,-18],[10,-18],[10,-15],[13,-15],[13,-19],[15,-19],[15,-15],[17,-15],[17,-18],[19,-18],[19,-13],[15,-9],[12,-9],[12,-6],[8,-2]];
  const eye:Polygon=[[5,-5],[5,-9],[9,-13],[9,-11],[13,-11],[10,-8],[8,-8],[8,-5]];
  for(const sx of [-1,1])for(const sy of [-1,1]){
    const reflect=(points:Polygon):Point[]=>points.map(([x,y])=>[x*sx,y*sy]);
    ink.polygon(reflect(wing),[reflect(eye)]);
  }
  ink.polygon([[-21,-.7],[21,-.7],[21,.7],[-21,.7]]);
  ink.polygon([[-.7,-20],[.7,-20],[.7,20],[-.7,20]]);
  for(const side of [-1,1]){
    for(const shift of [0,4])ink.polygon([[side*(11+shift),-4],[side*(12.5+shift),-5.5],[side*(18+shift),0],[side*(12.5+shift),5.5],[side*(11+shift),4],[side*(15+shift),0]]);
    ink.diamond(0,side*17,2.2);ink.diamond(0,side*21,1.6);
  }
  ink.diamond(0,0,2.1);
}
function nestedDiamond(ink:Ink,r=10,solidCenter=false){
  const rhomb=(radius:number):Polygon=>[[0,-radius],[radius,0],[0,radius],[-radius,0]];
  ink.polygon(rhomb(r),[rhomb(r*.67)]);
  ink.polygon(rhomb(r*.35),solidCenter?[]:[rhomb(r*.13)]);
}

/** New regular-grid vector studies from the supplied book borders; not historical tracings. */
export function renderAdditionalRecipe(d:Drawing,p:CompositionParams,studies:StudyPlacement[]):FrameResult['inset']|undefined{
  const ink=new Ink(d,p),W=p.width,H=p.height;
  const region=(x:number,y:number,width:number,height:number)=>studies.push({kind:'geometric-study',x,y,width,height});
  try{
    if(p.composition==='branch-medallion'){
      const diameter=Math.min(p.size,Math.min(W,H)*.88),s=diameter/48;
      ink.stamp(W/2,H/2,s,0,()=>medallion(ink));
      region((W-diameter)/2,(H-diameter)/2,diameter,diameter);return;
    }
    if(p.composition==='lozenge-frame'){
      const depth=Math.min(p.size,Math.min(W,H)*.22);
      if(depth<2)return{top:0,right:0,bottom:0,left:0};
      const a=depth*.6,s=depth/28,points:Point[]=[[a,a],[W-a,a],[W-a,H-a],[a,H-a]];
      for(const[cx,cy]of points){ink.stamp(cx,cy,s,0,()=>nestedDiamond(ink,10,!!(p.seed%2)));region(cx-10*s,cy-10*s,20*s,20*s);}
      // Double rules enclose the outer edge; they never cross the text inset.
      for(const offset of [Math.max(2,depth*.09),Math.max(2.8,depth*.18)])ink.line([[offset,offset],[W-offset,offset],[W-offset,H-offset],[offset,H-offset],[offset,offset]],Math.min(s*.3,depth*.02));
      const edge=(length:number,vertical:boolean)=>{
        const span=length-2*a,n=Math.min(64,Math.max(1,Math.round(span/(depth*.88+p.gap*.25)))),step=span/n;
        for(let i=1;i<=n;i++)for(const opposite of [false,true]){
          const axis=opposite?(vertical?W:H)-a:a,along=a+i*step,prior=along-step;
          // The diamond-shaped links retain their thickness as the side changes length.
          const from=prior+8*s,to=along-8*s,mid=(from+to)/2;
          if(to>from){
            ink.polygon(vertical?[[axis,from],[axis+2*s,mid],[axis,to],[axis-2*s,mid]]:[[from,axis],[mid,axis-2*s],[to,axis],[mid,axis+2*s]]);
            if(vertical)region(axis-2*s,from,4*s,to-from);else region(from,axis-2*s,to-from,4*s);
          }
          if(i<n){const cx=vertical?axis:along,cy=vertical?along:axis;ink.stamp(cx,cy,s,0,()=>nestedDiamond(ink,10,!!(p.seed%2)));region(cx-10*s,cy-10*s,20*s,20*s);}
        }
        const stitches=Math.min(192,Math.max(1,Math.floor(span/(3*s+p.gap*.05))));
        for(let i=0;i<=stitches;i++)for(const opposite of [false,true]){
          const at=a+i*span/stitches,start=opposite?(vertical?W:H)-depth*.2:depth*.2,end=start+(opposite?-1:1)*s*1.5;
          ink.line(vertical?[[start,at],[end,at]]:[[at,start],[at,end]],s*.18);
        }
      };
      edge(W,false);edge(H,true);const inset=depth*1.15;return{top:inset,right:inset,bottom:inset,left:inset};
    }
    const h=Math.min(H*.8,p.size*1.3,W*.7),nominal=h*1.15,space=p.gap*.2;
    const n=Math.max(1,Math.min(64,p.count,Math.floor((W*.9+space)/(nominal+space))));
    const cell=Math.min(nominal,(W*.9-(n-1)*space)/n),s=cell/32,left=(W-n*cell-(n-1)*space)/2,cy=H/2,right=W-left;
    const rail=p.composition==='lozenge-ligature'?14:15;
    if(p.composition!=='lozenge-ligature'){
      for(const y of [cy-rail*s,cy+rail*s])ink.line([[left,y],[right,y]],s*.45);
      for(const y of [cy-(rail+1.1)*s,cy+(rail+1.1)*s])ink.line([[left,y],[right,y]],s*.2);
    }
    for(let i=0;i<n;i++){
      const cx=left+(i+.5)*cell+i*space;
      ink.stamp(cx,cy,s,0,()=>{
        if(p.composition==='lozenge-ligature'){
          if(i===0)ink.line([[-16,-7],[-9,-12],[-4,-12],[8,0],[-4,12],[-9,12],[-16,7]],.8);
          if(i===n-1)ink.line([[16,-7],[9,-12],[4,-12],[-8,0],[4,12],[9,12],[16,7]],.8);
          else{
            // One continuous loop across each join, instead of three butt-ended
            // strokes meeting at a corner and leaving tiny dark seam artifacts.
            const next=32+space/s;
            ink.line([[12.5,-9.5],[9,-12],[4,-12],[-8,0],[4,12],[9,12],[16,7],[next-16,7],[next-9,12],[next-4,12],[next+8,0],[next-4,-12],[next-9,-12],[next-16,-7],[16,-7],[12.5,-9.5]],.8);
          }
          ink.diamond(0,0,2.2,false);
          for(const sign of [-1,1]){
            ink.polygon([[-2.4,sign*11],[0,sign*8.6],[2.4,sign*11]]);
            ink.line([[sign*10,-2],[sign*12,0],[sign*10,2]],.4);
          }
          if(p.seed%2)ink.diamond(0,0,.7);
        }else if(p.composition==='toothed-diamonds'){
          ink.polygon(toothed,[[[0,-6.8],[6.8,0],[0,6.8],[-6.8,0]]]);
          if(p.seed%2){ink.diamond(0,0,1.2);ink.diamond(-3,0,.6);ink.diamond(3,0,.6);}
          else ink.diamond(0,0,2.1);
          for(const side of [-1,1])for(const top of [-1,1])ink.line([[side*12,top*10],[side*15,top*7],[side*18,top*10]],.55);
        }else if(p.composition==='horn-band'){
          const horn:Polygon=[[-16,0],[-12,-5],[-10,-8],[-8,-6],[-10,-4],[-8,-2],[-5,-5],[-3,-3],[-8,3],[-11,0],[-12,1],[-7,6],[-2,1],[0,3],[-6,9],[-9,9]];
          ink.polygon(horn);ink.polygon(horn.map(([x,y])=>[-x,y]));
          ink.line([[0,9],[0,-8]],.5);
          if(p.seed%2)ink.diamond(0,-2,1.2,false);
          for(const side of [-1,1]){
            ink.line([[0,-6],[side*2,-8],[side*3,-6]],.4);
            ink.line([[0,4],[side*4,8]],.4);
          }
          ink.line([[-16,11],[16,11]],.4);
          for(let j=-13;j<=13;j+=4)ink.polygon([[j,13],[j+1,12],[j+3,13],[j+2,14]]);
        }else if(p.composition==='comb-band'){
          ink.hatch(stepped,[],p.seed%2?.65:.85);ink.diamond(0,0,1.3);
          for(const x of i===n-1?[-16,16]:[-16]){
            ink.line([[x,-12],[x,12]],.45);
            for(let y=-10;y<=10;y+=3)ink.line([[x-1.5,y],[x+1.5,y]],.3);
          }
          for(let x=-12;x<=12;x+=3)for(const side of [-1,1])ink.line([[x,side*13],[x,side*14.3]],.25);
        }
      });
      region(cx-cell*.57,cy-17*s,cell*1.14,34*s);
    }
  }finally{ink.flush();}
}
