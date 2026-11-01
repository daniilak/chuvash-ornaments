import type { Drawing } from './drawing.js';
import { Ink, type Polygon } from './ink.js';
import type { CompositionParams, StudyPlacement } from './compositions.js';
import type { Point } from './types.js';

export const BOOK_STUDIES=Object.freeze(([
 {id:'stitch-ribbon',kind:'band',name:{ru:'Стежковая кайма',en:'Stitched border'},twoTone:false,size:88,units:36},
 {id:'nested-chevrons',kind:'band',name:{ru:'Вложенные шевроны',en:'Nested chevrons'},twoTone:true,size:88,units:48},
 {id:'stepped-scrolls',kind:'band',name:{ru:'Ступенчатые скобы',en:'Stepped brackets'},twoTone:true,size:88,units:40},
 {id:'diagonal-scrolls',kind:'band',name:{ru:'Косые крючки',en:'Diagonal scrolls'},twoTone:true,size:88,units:40},
 {id:'forked-frieze',kind:'band',name:{ru:'Вильчатая кайма',en:'Forked frieze'},twoTone:true,size:88,units:32},
 {id:'panel-headpiece',kind:'divider',name:{ru:'Трёхчастная заставка',en:'Three-panel headpiece'},twoTone:true,size:200,units:150},
] as const).map(b=>Object.freeze({...b,name:Object.freeze(b.name)})));
export type BookStudyId=typeof BOOK_STUDIES[number]['id'];
const rhomb=(x:number,y:number,rx:number,ry=rx):Polygon=>[[x,y-ry],[x+rx,y],[x,y+ry],[x-rx,y]];
const rect=(x:number,y:number,w:number,h:number):Polygon=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
function outline(ink:Ink,points:Polygon,weight=.38){ink.line([...points,points[0]],weight);}
function ring(ink:Ink,cx:number,cy:number,r:number,width=2){ink.polygon(rhomb(cx,cy,r),[rhomb(cx,cy,r-width)]);}
function mirror(points:Polygon,sx:number,sy=1):Point[]{return points.map(([x,y])=>[sx*x,sy*y]);}
function spiral(ink:Ink,points:Polygon,width:number){ink.line(points,width);}
function sun(ink:Ink,accent:Ink,refined=false){
 const outer:Polygon=[[0,-13],[2,-7],[7,-10],[7,-5],[13,-6],[8,0],[13,6],[7,5],[7,10],[2,7],[0,13],[-2,7],[-7,10],[-7,5],[-13,6],[-8,0],[-13,-6],[-7,-5],[-7,-10],[-2,-7]];
 const star:Polygon=refined?[[0,-13],[3,-7],[9,-9],[7,-3],[13,0],[7,3],[9,9],[3,7],[0,13],[-3,7],[-9,9],[-7,3],[-13,0],[-7,-3],[-9,-9],[-3,-7]]:outer;
 accent.polygon(star,refined?[rhomb(0,0,4.2)]:[]);outline(ink,star,.4);ring(ink,0,0,refined?4.1:3.4,.7);
}

/** Separate, newly authored recipes for the latest six distinct book references.
 * No existing recipe or original source figure is replaced. */
export function renderReferenceRecipe(d:Drawing,p:CompositionParams,studies:StudyPlacement[]):void{
 const spec=BOOK_STUDIES.find(b=>b.id===p.composition)!;
 const ink=new Ink(d,p),accent=new Ink(d,{...p,color:p.accentColor??(p.composition==='nested-chevrons'?'#c4a56d':'#a64c38')}),W=p.width,H=p.height;
 const region=(x:number,y:number,width:number,height:number)=>studies.push({kind:'geometric-study',x,y,width,height});
 try{
  if(p.composition==='panel-headpiece'){
   const s=Math.min(W*.9/150,H*.82/38,p.size/30),cx=W/2,cy=H/2;
   const draw=()=>{
    // Three framed compartments, not an indefinitely repeated band.
    for(const y of [-18,18])ink.line([[-75,y],[75,y]],.55);
    for(const y of [-16.2,16.2])accent.line([[-73,y],[73,y]],.9);
    for(const x of [-75,75])ink.line([[x,-18],[x,18]],.55);
    for(const x of [-71,-29,-24,24,29,71])ink.line([[x,-15],[x,15]],.65);
    for(const side of [-1,1]){
     // A neutral angular sun replaces the incidental emblem in the photograph.
     ink.stamp(cx+side*50*s,cy,s,0,()=>accent.stamp(cx+side*50*s,cy,s,0,()=>sun(ink,accent,p.compositionVersion>=5)));
     for(const top of [-1,1]){
      const hook:Polygon=[[side*68,top*5],[side*58,top*15],[side*54,top*11],[side*58,top*7],[side*61,top*10],[side*59,top*12]];
      accent.line(hook,1.4);ink.line(hook,.4);
     }
     for(let y=-13;y<=13;y+=4)accent.line([[side*27,y],[side*25,y+2]],.8);
    }
    const boundary:Polygon=[[0,-15],[7,-10],[14,-15],[23,-6],[18,0],[23,6],[14,15],[7,10],[0,15],[-7,10],[-14,15],[-23,6],[-18,0],[-23,-6],[-14,-15],[-7,-10]];
    accent.polygon(boundary,[rhomb(0,0,5.5)]);outline(ink,boundary,.6);
    ring(ink,0,0,5.2,.9);
    for(const sx of [-1,1])for(const sy of [-1,1]){
     spiral(ink,mirror([[3,-8],[10,-15],[16,-9],[12,-5],[8,-9],[11,-12],[13,-10]],sx,sy),.6);
    }
    if(p.seed%2)ink.polygon(rhomb(0,0,1.6));
   };
   // Nested stamps are absolute coordinate frames; both inks must enter them.
   ink.stamp(cx,cy,s,0,()=>accent.stamp(cx,cy,s,0,draw));
   region(cx-76*s,cy-19*s,152*s,38*s);return;
  }
  const h=Math.min(H*.8,p.size*1.4,W*.65),pitch=h*spec.units/36,space=p.gap*.12;
  const n=Math.max(1,Math.min(64,p.count,Math.floor((W*.9+space)/(pitch+space))));
  const cell=Math.min(pitch,(W*.9-(n-1)*space)/n),s=cell/spec.units,left=(W-n*cell-(n-1)*space)/2,right=W-left,cy=H/2;
  const primaryRule=(y:number,width:number)=>ink.line([[left,cy+y*s],[right,cy+y*s]],width*s);
  if(p.composition!=='stitch-ribbon'){
   for(const side of [-1,1]){
    primaryRule(side*16,.45);accent.line([[left,cy+side*14.8*s],[right,cy+side*14.8*s]],s*1.1);
    primaryRule(side*17.4,.2);
   }
  }
  for(let i=0;i<n;i++){
   const x=left+(i+.5)*cell+i*space;
   const draw=()=>{
    if(p.composition==='stitch-ribbon'){
     // Short horizontal bricks reproduce the construction of the print,
     // rather than decorating an ordinary continuous line with a texture.
     for(let row=-8;row<=8;row++)for(let col=-9;col<=9;col++){
      const xx=col*1.8+(Math.abs(row)%2?.9:0),yy=row*1.55,distance=Math.abs(xx)/1.25+Math.abs(yy);
      const diamond=(distance>=11&&distance<=14)||(distance>=5.2&&distance<=7.8);
      const cross=Math.abs(Math.abs(xx)-Math.abs(yy)*1.1)<1.75;
      if((i+p.seed)%2===0?diamond:cross){
       const brick=rect(xx-.7,yy-.48,1.4,.96);
       if(p.compositionVersion>=5&&!p.fill)outline(ink,brick,.12);else ink.polygon(brick);
      }
     }
     for(const side of [-1,1])for(let j=-8;j<=8;j++){
      const brick=rect(j*2-.55,side*15-.48,1.1,.96);
      if(p.compositionVersion>=5&&!p.fill)outline(ink,brick,.12);else ink.polygon(brick);
     }
     if((i+p.seed)%2===0)ink.polygon(rhomb(0,0,1.1));
    }else if(p.composition==='nested-chevrons'){
     // Nested chevrons run into the lozenges on a shared baseline.
     accent.polygon(rect(-24,-13.5,48,27));
     for(const side of [-1,1])for(const offset of [0,5,10]){
      const outer=side*(24-offset),tip=side*(14-offset);
      ink.line([[outer,-12.6],[tip,0],[outer,12.6]],.75);
     }
     ink.polygon(rhomb(0,0,3.6,6.2),[rhomb(0,0,2.2,3.8)]);
     if(p.seed%2)ink.polygon(rhomb(0,0,.8,1.5));
     for(const side of [-1,1])ink.polygon(rect(side<0?-24:22,-13.5,2,27),[rect(side<0?-23.5:22.5,-1.4,1,2.8)]);
    }else if(p.composition==='stepped-scrolls'){
     const bracket:Polygon=[[-19,-11],[-8,-11],[-8,-9],[-5,-9],[-5,-6],[-2,-6],[-2,-3],[-5,-3],[-5,0],[-3,0],[-3,3],[-6,3],[-6,6],[-9,6],[-9,8],[-6,8],[-6,11],[-19,11],[-19,8],[-16,8],[-16,5],[-13,5],[-13,3],[-16,3],[-16,0],[-18,0],[-18,-3],[-15,-3],[-15,-5],[-18,-5],[-18,-8],[-19,-8]];
     for(const side of [-1,1]){
      const shape=mirror(bracket,side);accent.polygon(shape,[rhomb(side*-11,-2,2.8)]);outline(ink,shape,.3);outline(ink,rhomb(side*-11,-2,2.8),.3);
     }
     for(const side of [-1,1])ink.line([[-2,side*12],[0,side*10],[2,side*12]],.4);
     if(p.seed%2)ink.polygon(rhomb(0,0,1.2));
    }else if(p.composition==='diagonal-scrolls'){
     // A square spiral rotated onto the diagonal; two opposed ribbons per cell.
     const hook:Polygon=[[-8,8],[-8,-8],[6,-8],[6,6],[-3,6],[-3,-2],[1,-2],[1,2]];
     for(const side of [-1,1]){
      const points=hook.map(([xx,yy]):Point=>[side*((xx-yy)*.7-9),side*(xx+yy)*.7]);
      ink.line(points,p.fill?2.7:.4);
      if(p.fill)accent.line(points,1.65,p.fillOpacity);
     }
     for(let j=-18;j<=18;j+=2.5)for(const side of [-1,1])accent.line([[j-.6,side*18.1],[j+.6,side*19.4]],.3);
     if(p.seed%2)ink.polygon(rhomb(0,0,1.2));
    }else if(p.composition==='forked-frieze'){
     const cup:Polygon=[[-12,-9],[-12,-4],[-9,-1],[-5,-1],[-2,-4],[-2,-9]];
     for(const side of [-1,1]){
      ink.line(mirror(cup,side),.55);
      ink.line(mirror([[-13,-9],[-10,-9],[-10,-6]],side),.45);
      ink.line(mirror([[-4,-9],[-4,-6],[-1,-6]],side),.45);
      ink.line(mirror([[-8,-6],[-8,-3],[-5,-3]],side),.45);
     }
     accent.line([[0,-13],[0,-9],[0,-6]],.65);
     for(const side of [-1,1])accent.line([[0,-10],[side*3,-10],[side*3,-13]],.55);
     accent.polygon([[-16,13],[-16,3],[-12,3],[-12,5],[-9,5],[-9,8],[-6,8],[-6,10],[-3,10],[-3,13],[0,13],[0,10],[3,10],[3,8],[6,8],[6,5],[9,5],[9,3],[16,3],[16,13]]);
     ink.line([[-16,3],[-12,3],[-12,5],[-9,5],[-9,8],[-6,8],[-6,10],[-3,10],[-3,13],[0,13],[0,10],[3,10],[3,8],[6,8],[6,5],[9,5],[9,3],[16,3]],.45);
     if(p.seed%2)ink.line([[-1,0],[1,2],[-1,4],[1,6]],.35);else ink.line([[-1,1],[1,3]],.35);
    }
   };
   ink.stamp(x,cy,s,0,()=>accent.stamp(x,cy,s,0,draw));
   const extent=p.composition==='diagonal-scrolls'?20:18;
   region(x-cell*.5,cy-extent*s,cell,2*extent*s);
  }
 }finally{ink.flush();accent.flush();}
}
