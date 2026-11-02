import { Drawing } from './drawing.js';
import { Ink, type Polygon } from './ink.js';
import { geometry } from './geometry.js';
import { getMotif } from './catalog.js';
import type { CompositionParams, StudyPlacement } from './compositions.js';
import type { MotifId, Point } from './types.js';

export const BROCADE_STUDIES = [
  {id:'imperial-keske',kind:'rosette',name:{ru:'Большой Кӗскӗ',en:'Grand Kĕskĕ'},size:340},
  {id:'eightfold-brooch',kind:'rosette',name:{ru:'Восьмилучевая брошь',en:'Eightfold brooch'},size:340},
  {id:'heart-tapestry',kind:'rosette',name:{ru:'Сердечный ковёр',en:'Heart tapestry'},size:340},
  {id:'embroidered-treasury',kind:'band',name:{ru:'Парадное шитьё',en:'Ceremonial embroidery'},size:94},
  {id:'horn-lace',kind:'band',name:{ru:'Рогатое кружево',en:'Horn lace'},size:94},
  {id:'regal-headpiece',kind:'divider',name:{ru:'Большая заставка',en:'Grand headpiece'},size:200},
] as const;
const diamond=(r:number):Polygon=>[[0,-r],[r,0],[0,r],[-r,0]];
const mirror=(poly:Polygon,sx:number,sy:number):Point[]=>poly.map(([x,y])=>[sx*x,sy*y]);
const turn=(poly:Polygon,t:number):Point[]=>poly.map(([x,y])=>t===0?[x,y]:t===1?[-y,x]:t===2?[-x,-y]:[y,-x]);
const quarters=(poly:Polygon):Point[]=>[0,1,2,3].flatMap(t=>turn(poly,t));
const stepped=quarters([[0,-38],[4,-34],[7,-37],[12,-32],[10,-30],[18,-22],[20,-24],[24,-20],[22,-18],[30,-10],[32,-12],[37,-7],[34,-4],[38,0]]);
const star=quarters([[0,-31],[5,-23],[9,-23],[9,-19],[20,-20],[19,-9],[23,-9],[23,-5]]);

export function renderBrocadeRecipe(d:Drawing,p:CompositionParams,studies:StudyPlacement[]):void{
  const red=new Ink(d,p),gold=new Ink(d,{...p,color:p.accentColor??'#aa8247'});
  const stamp=(cx:number,cy:number,s:number,draw:()=>void)=>red.stamp(cx,cy,s,0,()=>gold.stamp(cx,cy,s,0,draw));
  const source=(id:MotifId,cx:number,cy:number,diameter:number,weight:number)=>{
    const g=geometry(getMotif(id),{...p,strokeWidth:0}),pen=weight*Math.min(2,p.strokeWidth/.26);
    const strokeWidth=Math.min(2,pen*Math.max(g.width,g.height)/Math.max(diameter-8*pen,diameter*.3));
    const local=new Drawing({...p,strokeWidth});
    local.place(id,cx-diameter/2,cy-diameter/2,diameter,diameter,0,'none');
    d.parts.push(...local.parts);d.placements.push(...local.placements);
  };
  const region=(cx:number,cy:number,w:number,h=w)=>studies.push({kind:'geometric-study',x:cx-w/2,y:cy-h/2,width:w,height:h});
  const ring=(ink:Ink,r:number,weight:number)=>ink.polygon(diamond(r),[diamond(r-weight)]);
  const stitch=(ink:Ink,x:number,y:number,r=1)=>ink.diamond(x,y,r);
  const brooch=(r=1)=>{
    const scaled=(poly:Polygon):Point[]=>poly.map(([x,y])=>[x*r,y*r]);
    red.polygon(scaled(star),[scaled(diamond(19))]);
    gold.polygon(scaled(diamond(16.7)),[scaled(diamond(15.6))]);
    for(const t of [0,1,2,3]){
      gold.line(scaled(turn([[-3,-25],[0,-21],[3,-25]],t)),.5);
      red.line(scaled(turn([[-6,-12],[0,-17],[6,-12]],t)),.6);
    }
  };
  try{
    const meta=BROCADE_STUDIES.find(b=>b.id===p.composition)!;
    if(meta.kind==='rosette'){
      const diameter=Math.min(p.size,p.width*.86,p.height*.86),s=diameter/100,cx=p.width/2,cy=p.height/2;
      stamp(cx,cy,s,()=>{
        if(p.composition==='imperial-keske'){
          const windows=[0,1,2,3].flatMap(t=>[4,12,20,28].map(x=>turn(diamond(1.5).map(([dx,dy]):Point=>[x+dx,x-32+dy]),t)));
          red.polygon(stepped,[diamond(27.8),...windows]);
          ring(gold,30.1,.45);
          ring(gold,25,1);ring(red,22.8,.7);
          for(const sx of [-1,1])for(const sy of [-1,1]){
            red.polygon(mirror([[24,-26],[24,-35],[28,-39],[31,-36],[31,-33],[28,-30],[26,-32],[28,-34],[27,-35],[26,-34],[26,-27]],sx,sy));
            gold.line(mirror([[30,-27],[36,-33],[33,-36],[29,-32]],sx,sy),.5);
            stitch(gold,sx*37,sy*37,1.1);
          }
          for(const t of [0,1,2,3]){
            red.line(turn([[-6,-40],[-3,-43],[0,-40],[3,-43],[6,-40]],t),.65);
            gold.polygon(turn([[0,-48],[2,-46],[0,-44],[-2,-46]],t));
            for(const x of [-7,0,7])gold.polygon(turn([[x,-31],[x+1,-30],[x,-29],[x-1,-30]],t));
          }
        }else if(p.composition==='eightfold-brooch'){
          const windows=[0,1,2,3].flatMap(t=>[
            turn(diamond(1.8).map(([x,y]):Point=>[x,y-25]),t),
            turn(diamond(1.5).map(([x,y]):Point=>[x+16,y-16]),t),
          ]);
          red.polygon(star,[diamond(19),...windows]);
          const inset=star.map(([x,y]):Point=>[x*.92,y*.92]);
          gold.line([...inset,inset[0]],.38);
          ring(gold,16.7,1.1);
          for(const t of [0,1,2,3])red.line(turn([[-6,-12],[0,-17],[6,-12]],t),.6);
          for(const sx of [-1,1])for(const sy of [-1,1]){
            red.polygon(mirror([[18,-26],[18,-34],[23,-39],[28,-34],[28,-30],[24,-26],[22,-28],[25,-31],[25,-33],[23,-35],[21,-33],[21,-27]],sx,sy));
            gold.line(mirror([[30,-28],[34,-32],[40,-26],[34,-20]],sx,sy),.55);
            gold.line(mirror([[21,-42],[23,-44],[26,-41]],sx,sy),.4);
          }
          for(const t of [0,1,2,3]){
            red.polygon(turn([[-2,-34],[-2,-40],[0,-43],[2,-40],[2,-34],[0,-32]],t));
            gold.line(turn([[-6,-34],[-6,-39],[-3,-42]],t),.5);
            gold.line(turn([[6,-34],[6,-39],[3,-42]],t),.5);
          }
        }else{
          const heart:Polygon=[[0,-13],[-13,-26],[-13,-34],[-6,-41],[0,-35],[6,-41],[13,-34],[13,-26]];
          const eye:Polygon=[[0,-18],[-9,-27],[-9,-32],[-6,-35],[0,-29],[6,-35],[9,-32],[9,-27]];
          for(const t of [0,1,2,3]){
            red.polygon(turn(heart,t),[turn(eye,t)]);
            gold.line(turn([[-5,-25],[0,-20],[5,-25]],t),.7);
            gold.line(turn([[-7,-30],[-6,-31],[0,-25],[6,-31],[7,-30]],t),.45);
            red.polygon(turn([[18,-16],[18,-27],[23,-32],[28,-27],[25,-24],[23,-26],[23,-28],[21,-26],[21,-19]],t));
            red.polygon(turn([[16,-18],[27,-18],[32,-23],[27,-28],[24,-25],[26,-23],[28,-23],[26,-21],[19,-21]],t));
            gold.polygon(turn([[29,-31],[31,-33],[33,-31],[31,-29]],t));
            gold.line(turn([[30,-36],[36,-30]],t),.4);
            for(const x of [-10,-5,0,5,10])gold.polygon(turn([[x,-44],[x+.8,-43.2],[x,-42.4],[x-.8,-43.2]],t));
          }
          ring(red,12,2.7);ring(gold,7.6,1.6);red.diamond(0,0,2.5);
        }
      });
      if(p.composition==='imperial-keske')source('snezhinka1',cx,cy,39*s,.43*s);
      if(p.composition==='eightfold-brooch')source('snezhinka3',cx,cy,27*s,.48*s);
      region(cx,cy,diameter);return;
    }
    if(meta.kind==='divider'){
      const s=Math.min(p.size/78,p.width*.92/244,p.height*.82/82),cx=p.width/2,cy=p.height/2;
      stamp(cx,cy,s,()=>{
        brooch();
        for(const sx of [-1,1]){
          const body:Polygon=[[35,1],[45,-9],[52,-2],[59,-9],[66,-2],[73,-9],[81,-1],[88,-8],[95,-1],[102,-8],[109,-1],[114,-6],[118,-2],[114,2],[114,0],[109,5],[102,-2],[95,5],[88,-2],[81,5],[73,-2],[66,5],[59,-2],[52,5],[45,-2],[38,5]];
          red.polygon(mirror(body,sx,1));
          gold.line(mirror([[36,-9],[45,-18],[52,-11],[59,-18],[66,-11],[73,-18],[81,-10],[88,-17],[95,-10],[102,-17],[109,-10],[116,-17]],sx,1),.55);
          gold.line(mirror([[40,13],[45,8],[52,15],[59,8],[66,15],[73,8],[81,16],[88,9],[95,16],[102,9],[109,16]],sx,1),.45);
          for(let x=44;x<=109;x+=13)for(const sy of [-1,1])stitch(red,sx*x,sy*24,1);
          gold.diamond(sx*121,0,1.5);
        }
        for(const sy of [-1,1]){
          gold.line([[-15,sy*34],[-10,sy*29],[0,sy*39],[10,sy*29],[15,sy*34]],.5);
          red.diamond(0,sy*40,1.1);
        }
      });
      source('snezhinka3',cx,cy,27*s,.48*s);
      region(cx,cy,244*s,84*s);return;
    }
    const h=Math.min(p.size*1.3,p.height*.8,p.width*.64),s=h/76,space=p.gap*.22;
    const cw=74*s,n=Math.max(1,Math.min(64,p.count,Math.floor((p.width*.92+space)/(cw+space))));
    const left=(p.width-n*cw-(n-1)*space)/2,cy=p.height/2,right=p.width-left;
    for(const sy of [-1,1]){
      red.line([[left,cy+sy*36*s],[right,cy+sy*36*s]],s*.35);
      gold.line([[left,cy+sy*33*s],[right,cy+sy*33*s]],s*.55);
      red.line([[left,cy+sy*26*s],[right,cy+sy*26*s]],s*.3);
    }
    for(let i=0;i<n;i++){
      const cx=left+(i+.5)*cw+i*space;
      stamp(cx,cy,s,()=>{
        for(const sy of [-1,1])for(let x=-30;x<=30;x+=6){
          red.polygon([[x,sy*28],[x+2,sy*30],[x,sy*32],[x-2,sy*30]]);
          gold.line([[x,sy*34],[x,sy*35]],.35);
        }
        if(p.composition==='embroidered-treasury'){
          const outer=quarters([[0,-23],[4,-19],[7,-19],[7,-16],[13,-10],[16,-10],[16,-7],[23,0]]);
          red.polygon(outer,[diamond(17.5)]);
          ring(gold,15.3,.8);
          for(const sx of [-1,1])for(const sy of [-1,1]){
            gold.line(mirror([[18,-16],[22,-20],[29,-13],[25,-9],[22,-12]],sx,sy),.55);
            red.diamond(sx*32,sy*13,1.25);
          }
        }else{
          const horn:Polygon=[[2,-2],[2,-9],[8,-15],[8,-21],[12,-21],[12,-17],[16,-17],[16,-21],[21,-21],[21,-12],[14,-5],[14,-1],[9,4],[5,0]];
          const eye:Polygon=[[5,-3],[5,-8],[11,-14],[17,-14],[11,-8],[11,-3],[9,-1],[7,-3],[8,-4],[8,-7],[10,-9],[8,-9]];
          for(const sx of [-1,1])for(const sy of [-1,1]){
            red.polygon(mirror(horn,sx,sy),[mirror(eye,sx,sy)]);
            gold.line(mirror([[22,-6],[27,-11],[31,-7],[27,-3],[31,1]],sx,sy),.6);
            red.line(mirror([[24,-16],[29,-21],[34,-16]],sx,sy),.5);
          }
          ring(gold,5.5,1.5);red.diamond(0,0,1.5);
          for(const sy of [-1,1])gold.polygon([[-1,sy*9],[0,sy*7],[1,sy*9],[1,sy*22],[0,sy*24],[-1,sy*22]]);
        }
      });
      if(p.composition==='embroidered-treasury')source('keske_iz_serdtsa',cx,cy,26*s,.5*s);
      region(cx,cy,cw,76*s);
      if(i<n-1)stamp(cx+cw/2+space/2,cy,s,()=>{
        red.polygon([[0,-5],[4,-1],[0,3],[-4,-1]]);gold.diamond(0,-1,1.2);
      });
    }
  }finally{gold.flush();red.flush();}
}
