import type { Drawing } from './drawing.js';
import { Ink, type Polygon } from './ink.js';
import type { CompositionParams, StudyPlacement } from './compositions.js';
import type { FrameResult, Point } from './types.js';

/** Clean vector interpretation of the deer drawing supplied by the user. */
export const DEER_OUTLINE:Polygon=Object.freeze(([
  [0,38],[20,28],[25,27],[27,26],[38,18],[31,16],[25,17],[24,15],
  [31,7],[34,9],[30,13],[33,13],[40,16],[49,4],[52,5],[46,14],
  [51,14],[63,1],[66,3],[56,14],[64,14],[77,0],[80,2],[66,18],
  [50,18],[43,20],[34,27],[35,44],[51,53],[87,54],[89,60],
  [100,77],[100,109],[86,111],[85,82],[49,82],[49,112],[35,113],
  [35,79],[20,60],[19,45],[9,48],[1,46],
] as const).map(([x,y])=>Object.freeze([x-50,y-56.5]) as Point));

export const DEER_STUDIES=Object.freeze(([
  {id:'deer-procession',kind:'band',name:{ru:'Олений ход',en:'Deer procession'},size:92},
  {id:'deer-and-suns',kind:'band',name:{ru:'Олени и солнца',en:'Deer and suns'},size:92},
  {id:'deer-guardians',kind:'divider',name:{ru:'Олени у дерева',en:'Deer guardians'},size:200},
  {id:'deer-crest',kind:'divider',name:{ru:'Олений герб',en:'Deer crest'},size:200},
  {id:'deer-sun-divider',kind:'separator',name:{ru:'Олений разделитель',en:'Deer sun divider'},size:86},
  {id:'deer-tapestry-frame',kind:'frame',name:{ru:'Рамка с оленями',en:'Deer tapestry frame'},size:82},
] as const).map(b=>Object.freeze({...b,name:Object.freeze(b.name)})));

const diamond=(r:number):Polygon=>[[0,-r],[r,0],[0,r],[-r,0]];
const mirror=(poly:Polygon,sx:number):Point[]=>poly.map(([x,y])=>[x*sx,y]);
const sun:Polygon=[[-4,-10],[0,-16],[4,-10],[10,-10],[10,-4],[16,0],[10,4],[10,10],[4,10],[0,16],[-4,10],[-10,10],[-10,4],[-16,0],[-10,-4],[-10,-10]];

export function renderDeerRecipe(d:Drawing,p:CompositionParams,studies:StudyPlacement[]):FrameResult['inset']|undefined{
  const red=new Ink(d,p),gold=new Ink(d,{...p,color:p.accentColor??'#aa8247'}),W=p.width,H=p.height;
  const stamp=(cx:number,cy:number,s:number,t:number,draw:()=>void)=>red.stamp(cx,cy,s,t,()=>gold.stamp(cx,cy,s,t,draw));
  const deer=(cx:number,cy:number,h:number,facing:'left'|'right')=>{
    red.stamp(cx,cy,h/120,0,()=>red.polygon(facing==='left'?DEER_OUTLINE:mirror(DEER_OUTLINE,-1)));
    studies.push({kind:'geometric-study',x:cx-h*.44,y:cy-h*.49,width:h*.88,height:h*.98});
  };
  const seal=()=>{
    red.polygon(sun,[diamond(8.5)]);gold.polygon(diamond(6.3),[diamond(4.7)]);red.diamond(0,0,1.8);
  };
  const tree=()=>{
    red.line([[0,26],[0,-24]],1);
    for(const sx of [-1,1]){
      red.line([[0,-12],[sx*11,-23],[sx*18,-16],[sx*12,-10],[sx*9,-13]],.8);
      gold.line([[0,6],[sx*13,-7],[sx*20,0],[sx*13,7]],.75);
      red.line([[0,15],[sx*10,25]],.65);
    }
    gold.diamond(0,-29,2.5);
  };
  try{
    const meta=DEER_STUDIES.find(b=>b.id===p.composition)!;
    if(meta.kind==='frame'){
      const depth=Math.min(p.size,W*.2,H*.2);
      if(depth<2)return{top:0,right:0,bottom:0,left:0};
      const a=depth*.65,s=depth/52;
      const perimeter=(offset:number,cut:number,weight:number)=>gold.line([[offset+cut,offset],[W-offset-cut,offset],[W-offset,offset+cut],[W-offset,H-offset-cut],[W-offset-cut,H-offset],[offset+cut,H-offset],[offset,H-offset-cut],[offset,offset+cut],[offset+cut,offset]],weight);
      perimeter(Math.max(2.4,depth*.1),depth*.35,s*.4);
      perimeter(depth*1.04,depth*.45,s*.27);
      for(const [cx,cy,facing]of [[a,a,'right'],[W-a,a,'left'],[a,H-a,'right'],[W-a,H-a,'left']] as const){
        deer(cx,cy,depth*.88,facing);
        gold.line([[cx-depth*.31,cy+depth*.44],[cx+depth*.31,cy+depth*.44]],s*.5);
      }
      for(const [length,t]of [[W,0],[H,1],[W,2],[H,3]]){
        const start=depth*1.5,end=length-start,span=end-start;
        const n=Math.max(1,Math.min(64,p.count,Math.floor(span/(depth*.88+p.gap*.25)))),step=span/n;
        const at=(along:number):Point=>t===0?[along,a]:t===1?[W-a,along]:t===2?[W-along,H-a]:[a,H-along];
        for(let i=0;i<n;i++){
          const along=start+(i+.5)*step,[cx,cy]=at(along);
          stamp(cx,cy,s*.72,t,()=>seal());
          studies.push({kind:'geometric-study',x:cx-18*s,y:cy-18*s,width:36*s,height:36*s});
          if(i<n-1){
            const [mx,my]=at(along+step/2);
            stamp(mx,my,s,t,()=>{
              gold.line([[-7,0],[7,0]],.4);
              red.diamond(0,0,1.5);
              for(const sy of [-1,1])red.line([[-3,sy*10],[0,sy*7],[3,sy*10]],.5);
            });
          }
        }
      }
      const inset=depth*1.45;return{top:inset,right:inset,bottom:inset,left:inset};
    }
    if(meta.kind==='band'){
      const h=Math.min(p.size*1.3,H*.8,W*.7),s=h/136,space=p.gap*.25;
      const mixed=p.composition==='deer-and-suns',cw=(mixed?164:128)*s;
      const n=Math.max(1,Math.min(64,p.count,Math.floor((W*.92+space)/(cw+space))));
      const left=(W-n*cw-(n-1)*space)/2,cy=H/2,right=W-left;
      for(const sy of [-1,1]){
        gold.line([[left,cy+sy*64*s],[right,cy+sy*64*s]],s*.55);
        red.line([[left,cy+sy*68*s],[right,cy+sy*68*s]],s*.28);
      }
      for(let i=0;i<n;i++){
        const cx=left+(i+.5)*cw+i*space;
        deer(mixed?cx-20*s:cx,cy,120*s,mixed&&i%2?'right':'left');
        if(mixed)gold.stamp(cx+60*s,cy+5*s,s*.66,0,()=>{
          gold.polygon(sun,[diamond(8)]);gold.diamond(0,0,2.1);
        });
        for(const sy of [-1,1])stamp(cx,cy+sy*64*s,s,0,()=>red.diamond(0,0,1.2));
        if(!mixed&&i<n-1)gold.stamp(cx+cw/2+space/2,cy+13*s,s,0,()=>gold.diamond(0,0,2));
      }
      return;
    }
    if(meta.kind==='separator'){
      const s=Math.min(p.size/104,W*.92/288,H*.8/104),cx=W/2,cy=H/2;
      deer(cx-61*s,cy,90*s,'right');deer(cx+61*s,cy,90*s,'left');
      stamp(cx,cy+3*s,s*.9,0,()=>seal());
      const end=W*.45;
      for(const sx of [-1,1]){
        gold.diamond(cx+sx*102*s,cy+9*s,2.2*s);
        red.line([[cx+sx*106*s,cy+9*s],[cx+sx*(end-12*s),cy+9*s],[cx+sx*(end-6*s),cy+3*s],[cx+sx*end,cy+9*s]],s*.45);
        gold.line([[cx+sx*105*s,cy+14*s],[cx+sx*end,cy+14*s]],s*.3);
      }
      return;
    }
    const s=Math.min(p.size/132,W*.92/360,H*.82/132),cx=W/2,cy=H/2;
    if(p.composition==='deer-guardians'){
      deer(cx-86*s,cy,120*s,'right');deer(cx+86*s,cy,120*s,'left');
      stamp(cx,cy+8*s,s,0,()=>{
        tree();
        gold.line([[-149,53],[149,53]],.5);
        for(const sx of [-1,1])red.line(mirror([[19,36],[26,43],[33,36]],sx),.7);
        red.polygon(diamond(7),[diamond(4.8)]);
      });
      stamp(cx,cy-46*s,s*.58,0,()=>seal());
    }else{
      deer(cx,cy,112*s,'left');
      stamp(cx,cy,s,0,()=>{
        gold.polygon([[-48,-65],[48,-65],[62,-51],[62,51],[48,65],[-48,65],[-62,51],[-62,-51]],[[[-47,-63],[47,-63],[60,-50],[60,50],[47,63],[-47,63],[-60,50],[-60,-50]]]);
        for(const sx of [-1,1]){
          red.line(mirror([[77,-15],[88,-26],[99,-15],[92,-8]],sx),1);
          gold.line(mirror([[76,14],[88,26],[99,15],[110,26],[121,15],[132,26],[143,15]],sx),.7);
          red.line(mirror([[79,6],[145,6],[154,-3],[165,8]],sx),.6);
          gold.diamond(sx*173,8,2);
        }
      });
    }
  }finally{gold.flush();red.flush();}
}
