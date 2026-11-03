import {Ink,type Polygon} from './ink.js';
import type {Drawing} from './drawing.js';
import type {CompositionParams,StudyPlacement} from './compositions.js';
import type {FrameResult,Point} from './types.js';

/** New textile-inspired geometry; these names do not claim historical provenance. */
export const CORNER_DIVIDER_STUDIES=Object.freeze(([
 {id:'brocade-corners',kind:'frame',name:{ru:'Углы с розетками',en:'Rosette corners'},size:126},
 {id:'garden-corners',kind:'frame',name:{ru:'Ветвистые углы',en:'Branching corners'},size:138},
 {id:'lattice-corners',kind:'frame',name:{ru:'Угловая вязь',en:'Interlaced corners'},size:130},
 {id:'embroidered-knot-divider',kind:'separator',name:{ru:'Вышитый узел',en:'Embroidered knot'},size:96},
 {id:'paired-bloom-divider',kind:'separator',name:{ru:'Цветочная перевязь',en:'Paired blossom divider'},size:96},
 {id:'stepped-lace-divider',kind:'separator',name:{ru:'Ступенчатое кружево',en:'Stepped lace divider'},size:96},
] as const).map(item=>Object.freeze({...item,name:Object.freeze(item.name)})));

const diamond=(r:number):Polygon=>[[0,-r],[r,0],[0,r],[-r,0]];
const flip=(points:Polygon,sx=1,sy=1):Point[]=>points.map(([x,y])=>[x*sx,y*sy]);
const rotate=(points:Polygon,t:number):Point[]=>points.map(([x,y])=>t===0?[x,y]:t===1?[-y,x]:t===2?[-x,-y]:[y,-x]);

export function renderCornerDividerRecipe(d:Drawing,p:CompositionParams,studies:StudyPlacement[]):FrameResult['inset']|undefined{
 const red=new Ink(d,p),accent=new Ink(d,{...p,color:p.accentColor??'#aa8247'});
 const stamp=(x:number,y:number,s:number,t:number,draw:()=>void)=>red.stamp(x,y,s,t,()=>accent.stamp(x,y,s,t,draw));
 const local=(x:number,y:number,s:number,t:number,draw:()=>void)=>{
  const origin=red.map([x,y]);stamp(origin[0],origin[1],red.scale*s,(red.turn+t)%4,draw);
 };
 const ring=(ink:Ink,r:number,w:number)=>ink.polygon(diamond(r),[diamond(r-w)]);
 const eye=(x:number,y:number,r:number)=>local(x,y,1,0,()=>{ring(red,r,Math.max(1.1,r*.16));ring(accent,r*.58,Math.max(.65,r*.08));red.diamond(0,0,r*.13);});
 const cross=(x:number,y:number,r:number,ink=accent)=>{
  const a=r/3;ink.polygon([[x-a,y-r],[x+a,y-r],[x+a,y-a],[x+r,y-a],[x+r,y+a],[x+a,y+a],[x+a,y+r],[x-a,y+r],[x-a,y+a],[x-r,y+a],[x-r,y-a],[x-a,y-a]]);
 };
 const rosette=()=>{
  // Dense stepped envelope with an open diamond center and eight independent tips.
  const q:Polygon=[[0,-31],[5,-26],[8,-29],[12,-25],[10,-21],[21,-10],[25,-12],[29,-8],[26,-5],[31,0]];
  const shell=[0,1,2,3].flatMap(t=>rotate(q.slice(0,-1),t));
  red.polygon(shell,[diamond(26)]);ring(accent,23.5,1);
  for(let t=0;t<4;t++){
   const petal:Polygon=[[-2,-5],[-10,-13],[-10,-17],[-6,-21],[0,-15],[6,-21],[10,-17],[10,-13],[2,-5]];
   const hole:Polygon=[[0,-9],[-7,-15],[-7,-16],[-6,-17],[0,-11],[6,-17],[7,-16],[7,-15]];
   const shrink=(points:Polygon):Point[]=>points.map(([x,y])=>[x*.74,y*.74]);
   red.polygon(rotate(shrink(petal),t),[rotate(shrink(hole),t)]);
   accent.diamond(...rotate([[0,-26]],t)[0],1.2);
  }
  ring(accent,4.3,1);red.diamond(0,0,1);
 };
 const flower=()=>{
  for(let t=0;t<4;t++){
   red.line(rotate([[0,-4],[0,-15],[-8,-23],[-17,-23],[-17,-14],[-11,-14]],t),2);
   red.line(rotate([[0,-15],[8,-23],[17,-23],[17,-14],[11,-14]],t),2);
   accent.line(rotate([[-6,-27],[0,-33],[6,-27]],t),.65);
   accent.diamond(...rotate([[0,-25]],t)[0],1.5);
  }
  ring(red,7.5,1.8);ring(accent,4.2,1);red.diamond(0,0,1.1);
 };
 const seedRow=(start:number,end:number,y:number,step=11)=>{
  const n=Math.max(1,Math.min(32,Math.floor((end-start)/step)));
  for(let i=0;i<n;i++){
   const x=start+(i+.5)*(end-start)/n;
   local(x,y,1,0,()=>{ring(accent,2.5,.7);red.diamond(0,0,.7);});
  }
 };
 const hookedLeaf=(x:number,y:number,t=0)=>local(x,y,1,t,()=>{
  red.polygon([[0,0],[9,-9],[20,-9],[20,1],[15,6],[11,2],[15,-2],[15,-4],[11,-4],[4,3]]);
  accent.line([[3,7],[10,14],[17,7]],.75);
 });
 const corner=()=>{
  if(p.composition==='brocade-corners'){
   // Three unequal nested elbows leave a clear diagonal opening into the page.
   red.line([[10,173],[10,10],[173,10]],1.3);
   accent.line([[17,158],[17,17],[158,17]],.65);
   red.line([[26,142],[26,82]],2.1);red.line([[82,26],[142,26]],2.1);
   seedRow(70,166,18,12);
   local(0,0,1,1,()=>seedRow(70,166,-18,12));
   local(46,46,.86,0,rosette);
   for(const transposed of [false,true]){
    const draw=()=>{
     red.line([[78,40],[88,30],[100,42],[112,30],[124,42],[136,30],[148,42],[164,26]],1.9);
     accent.line([[78,50],[88,60],[100,48],[112,60],[124,48],[136,60],[148,48],[158,58]],.8);
     for(const x of [91,115,139])eye(x,42,5.5);
     red.diamond(169,24,3);accent.diamond(164,61,1.8);
    };
    if(transposed){
     red.line([[40,78],[30,88],[42,100],[30,112],[42,124],[30,136],[42,148],[26,164]],1.9);
     accent.line([[50,78],[60,88],[48,100],[60,112],[48,124],[60,136],[48,148],[58,158]],.8);
     for(const x of [91,115,139])eye(42,x,5.5);
     red.diamond(24,169,3);accent.diamond(61,164,1.8);
    }else draw();
   }
   local(87,87,.65,0,flower);
   accent.line([[59,100],[72,113],[85,100]],.8);
   accent.line([[100,59],[113,72],[100,85]],.8);
  }else if(p.composition==='garden-corners'){
   accent.line([[10,162],[10,10],[162,10]],.8);
   red.line([[22,150],[22,77]],1.7);red.line([[77,22],[150,22]],1.7);
   seedRow(58,158,15,13);
   local(0,0,1,1,()=>seedRow(58,158,-15,13));
   local(44,44,.83,0,rosette);
   red.line([[62,62],[124,124]],2.2);
   accent.line([[70,64],[127,121]],.7);
   // Paired comb-shaped leaves along the diagonal stem.
   for(const v of [76,103]){
    red.line([[v,v],[v+25,v],[v+36,v-11],[v+36,v-23],[v+28,v-23],[v+28,v-16]],1.65);
    red.line([[v,v],[v,v+25],[v-11,v+36],[v-23,v+36],[v-23,v+28],[v-16,v+28]],1.65);
    accent.diamond(v+17,v-5,2);accent.diamond(v-5,v+17,2);
    eye(v+24,v-5,4);eye(v-5,v+24,4);
   }
   local(132,132,.72,0,flower);
   hookedLeaf(82,36);local(0,0,1,1,()=>hookedLeaf(82,-36,2));
   red.diamond(154,34,3);red.diamond(34,154,3);
   accent.line([[140,63],[154,49],[168,63]],.75);
   accent.line([[63,140],[49,154],[63,168]],.75);
  }else{
   red.line([[10,170],[10,10],[170,10]],1.7);
   accent.line([[19,155],[19,19],[155,19]],.7);
   red.line([[29,142],[29,85]],1.1);red.line([[85,29],[142,29]],1.1);
   local(49,49,1,0,()=>{
    ring(red,25,3);ring(accent,20,1);
    local(0,0,.5,0,flower);
   });
   // A lattice of open diamonds, each with split, inward-facing hooks.
   for(const x of [90,126,162]){
    eye(x,42,14);eye(42,x,14);
    for(const sy of [-1,1]){
     red.line([[x-7,42+sy*18],[x,42+sy*25],[x+7,42+sy*18]],1.1);
     red.line([[42+sy*18,x-7],[42+sy*25,x],[42+sy*18,x+7]],1.1);
    }
   }
   local(88,88,.77,0,rosette);
   accent.line([[62,107],[78,123],[93,108]],.8);
   accent.line([[107,62],[123,78],[108,93]],.8);
   cross(120,120,4,red);accent.diamond(134,134,2);
  }
 };
 try{
  const W=p.width,H=p.height;
  if(p.composition.endsWith('-corners')){
   const size=Math.min(p.size,Math.min(W,H)*.38),s=size/180,pad=Math.min(4,W*.03,H*.03);
   for(const [x,y,t]of [[pad,pad,0],[W-pad,pad,1],[W-pad,H-pad,2],[pad,H-pad,3]]){
    stamp(x,y,s,t,corner);
    const reach=size+pad;studies.push({kind:'geometric-study',x:t===1||t===2?W-reach:0,y:t>=2?H-reach:0,width:reach,height:reach});
   }
   const inset=pad+size*1.03;return{top:inset,right:inset,bottom:inset,left:inset};
  }
  const s=Math.min(p.size/96,H*.8/96,W*.9/340),cx=W/2,cy=H/2,reach=W*.46/s;
  stamp(cx,cy,s,0,()=>{
   if(p.composition==='embroidered-knot-divider'){
    ring(red,39,3.5);ring(accent,44,1);
    local(0,0,.88,0,rosette);
    for(const side of [-1,1]){
     red.line(flip([[48,0],[58,-10],[70,2],[82,-10],[94,2],[106,-10],[118,2],[130,-10],[142,2]],side),1.8);
     red.line(flip([[48,0],[58,10],[70,-2],[82,10],[94,-2],[106,10],[118,-2],[130,10],[142,-2]],side),1.8);
     for(const x of [64,88,112,136])eye(side*x,0,4.5);
     for(const sy of [-1,1])accent.line(flip([[50,sy*20],[64,sy*28],[78,sy*20],[92,sy*28],[106,sy*20],[120,sy*28],[134,sy*20]],side),.65);
    }
   }else if(p.composition==='paired-bloom-divider'){
    local(0,0,1.02,0,flower);
    for(const side of [-1,1]){
     local(side*72,0,.69,0,rosette);
     for(const sy of [-1,1]){
      red.line(flip([[30,sy*10],[42,sy*22],[54,sy*10]],side),1.6);
      accent.line(flip([[40,sy*31],[52,sy*39],[66,sy*30],[80,sy*39],[94,sy*30],[108,sy*39],[123,sy*24]],side),.65);
     }
     red.line(flip([[98,0],[108,-10],[118,0],[108,10],[98,0]],side),1.7);
     accent.diamond(side*108,0,2);
     for(const sy of [-1,1])red.line(flip([[122,0],[134,sy*12],[146,0]],side),1.5);
    }
   }else{
    local(0,0,.95,0,rosette);
    for(const side of [-1,1])for(const sy of [-1,1]){
     red.line(flip([[37,sy*18],[49,sy*30],[61,sy*18],[73,sy*30],[85,sy*18],[97,sy*30],[109,sy*18],[121,sy*30],[139,sy*12]],side),1.8);
     accent.line(flip([[34,sy*29],[49,sy*44],[64,sy*29],[79,sy*44],[94,sy*29],[109,sy*44],[124,sy*29]],side),.65);
     for(const x of [49,79,109])accent.diamond(side*x,sy*34,1.6);
    }
    for(const side of [-1,1]){
     red.line([[side*36,0],[side*145,0]],1.2);
     for(const x of [52,82,112])eye(side*x,0,8);
    }
   }
   // Small terminal stitches fill the available width without stretching the centerpiece.
   for(const side of [-1,1]){
    const start=152,end=Math.max(start,reach-7),span=end-start;
    if(span>12){
     const n=Math.min(32,p.count,Math.max(1,Math.floor(span/25))),pitch=span/n;
     red.line([[side*147,0],[side*(end+2),0]],.75);
     if(p.composition==='embroidered-knot-divider')for(const sy of [-1,1])accent.line([[side*152,sy*8],[side*(end-5),sy*8],[side*(end+2),0]],.4);
     for(let i=0;i<n;i++){
      const x=side*(start+(i+.5)*pitch),r=Math.min(4.5,pitch*.25);
      if(p.composition==='paired-bloom-divider'&&i%2===0)local(x,0,.22,0,flower);
      else eye(x,0,p.composition==='embroidered-knot-divider'?r*1.35:r);
      for(const sy of [-1,1])accent.line([[x-r,sy*8],[x,sy*11],[x+r,sy*8]],.55);
      if(p.composition==='stepped-lace-divider')for(const sy of [-1,1])red.line([[x-pitch*.45,sy*3],[x-pitch*.2,sy*9],[x,sy*4],[x+pitch*.2,sy*9],[x+pitch*.45,sy*3]],.7);
     }
    }
    accent.diamond(side*(reach-1),0,2);
   }
  });
  studies.push({kind:'geometric-study',x:cx-reach*s,y:cy-46*s,width:reach*s*2,height:92*s});
 }finally{red.flush();accent.flush();}
}
