import { Drawing } from './drawing.js';
import { Ink, type Polygon } from './ink.js';
import { geometry } from './geometry.js';
import { getMotif } from './catalog.js';
import type { CompositionParams, StudyPlacement } from './compositions.js';
import type { FrameResult, MotifId, Point } from './types.js';

export const CEREMONIAL_LAYOUTS = Object.freeze(([
  {id:'keske-treasure-frame',kind:'frame',name:{ru:'Рамка с Кӗскӗ',en:'Kĕskĕ treasury frame'},size:76},
  {id:'horn-gate-frame',kind:'frame',name:{ru:'Рогатые врата',en:'Horn gate frame'},size:76},
  {id:'heart-diadem-frame',kind:'frame',name:{ru:'Сердечная диадема',en:'Heart diadem frame'},size:76},
  {id:'sun-needle-divider',kind:'separator',name:{ru:'Солнечная игла',en:'Sun needle divider'},size:86},
  {id:'wing-knot-divider',kind:'separator',name:{ru:'Крылатый узел',en:'Wing knot divider'},size:86},
  {id:'triple-keske-divider',kind:'separator',name:{ru:'Три Кӗскӗ',en:'Three Kĕskĕ divider'},size:86},
  {id:'sovereign-headpiece',kind:'divider',name:{ru:'Парадный венец',en:'Ceremonial crown headpiece'},size:200},
  {id:'procession-headpiece',kind:'divider',name:{ru:'Дерево и рога',en:'Tree and horns headpiece'},size:200},
  {id:'heart-canopy-headpiece',kind:'divider',name:{ru:'Сердечный полог',en:'Heart canopy headpiece'},size:200},
] as const).map(item=>Object.freeze({...item,name:Object.freeze(item.name)})));
const diamond=(r:number):Polygon=>[[0,-r],[r,0],[0,r],[-r,0]];
const mirror=(poly:Polygon,sx:number,sy=1):Point[]=>poly.map(([x,y])=>[x*sx,y*sy]);
const turn=(poly:Polygon,t:number):Point[]=>poly.map(([x,y])=>t===0?[x,y]:t===1?[-y,x]:t===2?[-x,-y]:[y,-x]);
const quarters=(poly:Polygon):Point[]=>[0,1,2,3].flatMap(t=>turn(poly,t));
const tooth=quarters([[0,-21],[3,-18],[5,-20],[9,-16],[7,-14],[14,-7],[16,-9],[20,-5],[18,-3],[21,0]]);
const star=quarters([[0,-24],[5,-14],[16,-16],[14,-5]]);
const heart:Polygon=[[0,8],[-10,-2],[-10,-8],[-5,-13],[0,-8],[5,-13],[10,-8],[10,-2]];
const heartEye:Polygon=[[0,3],[-7,-3],[-7,-7],[-5,-9],[0,-4],[5,-9],[7,-7],[7,-3]];

/** Nine authored layouts with transparent cut-outs and explicit content insets. */
export function renderCeremonialLayout(d:Drawing,p:CompositionParams,studies:StudyPlacement[]):FrameResult['inset']|undefined{
  const red=new Ink(d,p),gold=new Ink(d,{...p,color:p.accentColor??'#aa8247'}),W=p.width,H=p.height;
  const stamp=(cx:number,cy:number,s:number,t:number,draw:()=>void)=>red.stamp(cx,cy,s,t,()=>gold.stamp(cx,cy,s,t,draw));
  const ring=(ink:Ink,r:number,w:number)=>ink.polygon(diamond(r),[diamond(r-w)]);
  const region=(cx:number,cy:number,w:number,h=w)=>studies.push({kind:'geometric-study',x:cx-w/2,y:cy-h/2,width:w,height:h});
  const source=(id:MotifId,cx:number,cy:number,diameter:number,weight:number)=>{
    const g=geometry(getMotif(id),{...p,strokeWidth:0}),pen=weight*Math.min(2,p.strokeWidth/.26);
    const strokeWidth=Math.min(2,pen*Math.max(g.width,g.height)/Math.max(diameter-8*pen,diameter*.3));
    const local=new Drawing({...p,strokeWidth});
    local.place(id,cx-diameter/2,cy-diameter/2,diameter,diameter,0,'none');
    d.parts.push(...local.parts);d.placements.push(...local.placements);
  };
  const heartSeal=()=>{
    for(const t of [0,1,2,3]){
      red.polygon(turn([[0,-6],[-8,-14],[-8,-19],[-4,-23],[0,-19],[4,-23],[8,-19],[8,-14]],t),[turn([[0,-10],[-5,-15],[-5,-18],[-4,-19],[0,-15],[4,-19],[5,-18],[5,-15]],t)]);
      gold.line(turn([[-2,-14],[0,-12],[2,-14]],t),.45);
    }
    ring(gold,6,1.5);red.diamond(0,0,1.2);
  };
  const fork:Polygon=[[2,10],[2,-1],[9,-8],[9,-18],[13,-18],[13,-12],[18,-12],[18,-18],[22,-18],[22,-6],[14,2],[14,8],[9,13],[5,9]];
  const forkEye:Polygon=[[5,7],[5,0],[12,-7],[12,-8],[16,-8],[11,-3],[11,6],[9,8],[8,6],[8,1],[10,-1],[8,-1]];
  const pairedFork=()=>{
    for(const sx of [-1,1]){
      red.polygon(mirror(fork,sx),[mirror(forkEye,sx)]);
      gold.line(mirror([[17,5],[23,-1],[28,4],[23,9]],sx),.55);
      gold.diamond(sx*26,-12,1.1);
    }
    ring(gold,5.5,1.2);red.diamond(0,0,1);
  };
  const seal=()=>{
    red.polygon(tooth,[diamond(15.6)]);ring(gold,13.5,.8);
    for(const t of [0,1,2,3])gold.diamond(...turn([[0,-18]],t)[0],.7);
  };
  try{
    const meta=CEREMONIAL_LAYOUTS.find(b=>b.id===p.composition)!;
    if(meta.kind==='frame'){
      const depth=Math.min(p.size,W*.2,H*.2);
      if(depth<2)return{top:0,right:0,bottom:0,left:0};
      const a=depth*.64,s=depth/56;
      const corners:[number,number,number][]=[[a,a,0],[W-a,a,1],[W-a,H-a,2],[a,H-a,3]];
      const outline=(ink:Ink,offset:number,cut:number,pen:number)=>ink.line([[offset+cut,offset],[W-offset-cut,offset],[W-offset,offset+cut],[W-offset,H-offset-cut],[W-offset-cut,H-offset],[offset+cut,H-offset],[offset,H-offset-cut],[offset,offset+cut],[offset+cut,offset]],pen);
      outline(gold,Math.max(2.2,depth*.1),depth*.35,s*.35);
      outline(p.composition==='horn-gate-frame'?red:gold,depth*1.03,depth*.45,s*.25);
      for(const [cx,cy,t]of corners){
        stamp(cx,cy,s,t,()=>{
          if(p.composition==='keske-treasure-frame'){
            seal();
            gold.line([[-24,-12],[-24,-24],[-12,-24]],.45);
            for(const v of [-10,0,10])red.diamond(v,-23,.8);
          }else if(p.composition==='horn-gate-frame'){
            red.polygon([[-25,24],[-25,-25],[24,-25],[24,-17],[-17,-17],[-17,24]]);
            gold.line([[-27,19],[-27,-27],[19,-27]],.5);
            red.polygon([[-12,16],[-12,-12],[16,-12],[16,-7],[-7,-7],[-7,16]]);
            gold.diamond(2,2,3.5);ring(red,7,.8);
          }else{
            heartSeal();
            gold.line([[-26,-8],[-26,-26],[-8,-26]],.45);
            gold.diamond(-23,-23,1.3);
          }
        });
        if(p.composition==='keske-treasure-frame')source('snezhinka3',cx,cy,23*s,.42*s);
        region(cx,cy,58*s);
      }
      for(const [length,t]of [[W,0],[H,1],[W,2],[H,3]]){
        const start=depth*1.45,end=length-start,span=end-start;
        const n=Math.max(1,Math.min(64,p.count,Math.floor(span/(depth*.84+p.gap*.24)))),step=span/n;
        const at=(along:number):Point=>t===0?[along,a]:t===1?[W-a,along]:t===2?[W-along,H-a]:[a,H-along];
        for(let i=0;i<n;i++){
          const along=start+(i+.5)*step,[cx,cy]=at(along);
          stamp(cx,cy,s,t,()=>{
            if(p.composition==='keske-treasure-frame'){
              red.polygon(diamond(15),[diamond(11.5)]);ring(gold,9,1);
              for(const sx of [-1,1])for(const sy of [-1,1])red.line(mirror([[1,-4],[4,-7],[7,-4],[5,-2]],sx,sy),.5);
              gold.diamond(0,0,1.7);
            }else if(p.composition==='horn-gate-frame'){
              for(const sx of [-1,1])red.polygon(mirror([[1,8],[1,-2],[7,-8],[7,-14],[11,-14],[11,-10],[15,-10],[15,-14],[19,-14],[19,-6],[9,4],[9,8],[5,12]],sx));
              gold.line([[0,-13],[0,9]],.65);gold.diamond(0,12,1.2);
            }else{
              red.polygon(heart,[heartEye]);
              gold.line([[-3,-3],[0,0],[3,-3]],.5);
              gold.diamond(0,14,1.2);
            }
            for(const x of [-16,-8,0,8,16])red.diamond(x,-24,.8);
            gold.line([[-20,-20],[20,-20]],.35);
          });
          region(cx,cy,42*s,52*s);
          if(i<n-1){
            const [mx,my]=at(along+step/2);
            stamp(mx,my,s,t,()=>{
              gold.diamond(0,0,2);
              for(const sy of [-1,1])red.line([[-2,sy*8],[0,sy*6],[2,sy*8]],.4);
            });
          }
        }
      }
      const inset=depth*1.4;return{top:inset,right:inset,bottom:inset,left:inset};
    }
    if(meta.kind==='separator'){
      const s=Math.min(p.size/64,W*.92/244,H*.78/64),cx=W/2,cy=H/2;
      const arm=Math.max(122,W*.45/s);
      const reach=(x:number)=>Math.sign(x)*(Math.abs(x)<=80?Math.abs(x):80+(Math.abs(x)-80)*(arm-80)/42);
      const tail=(ink:Ink,poly:Polygon,weight:number)=>ink.line(poly.map(([x,y]):Point=>[reach(x),y]),weight);
      stamp(cx,cy,s,0,()=>{
        if(p.composition==='sun-needle-divider'){
          red.polygon(star,[diamond(16.5)]);ring(gold,14,.8);
          for(const sx of [-1,1]){
            tail(gold,mirror([[29,-4],[40,-4],[48,4],[101,4],[110,-5],[119,4]],sx),.55);
            tail(red,mirror([[29,0],[43,0],[49,-6],[105,-6],[111,0],[120,0]],sx),.4);
            red.diamond(reach(sx*122),0,1.4);gold.diamond(sx*35,0,1.1);
          }
          for(const t of [0,1,2,3])gold.line(turn([[-2,-21],[0,-18],[2,-21]],t),.4);
        }else if(p.composition==='wing-knot-divider'){
          for(const sx of [-1,1]){
            gold.diamond(sx*34,0,1.8);
            red.polygon(mirror([[6,0],[17,-11],[25,-11],[30,-6],[25,-1],[21,-5],[18,-5],[13,0],[18,5],[21,5],[25,1],[30,6],[25,11],[17,11]],sx));
            gold.line(mirror([[34,-11],[44,-21],[54,-11],[64,-21],[74,-11],[84,-21],[94,-11]],sx),.5);
            gold.line(mirror([[34,11],[44,21],[54,11],[64,21],[74,11],[84,21],[94,11]],sx),.5);
            tail(red,mirror([[36,0],[51,0],[57,-6],[63,0],[120,0]],sx),.4);
            red.diamond(reach(sx*122),0,1.5);
          }
          ring(red,7,2);ring(gold,3.7,1.1);
        }else{
          seal();
          for(const sx of [-1,1]){
            gold.line(mirror([[24,0],[36,0],[41,-5]],sx),.5);
            tail(red,mirror([[70,0],[102,0],[108,-6],[114,0]],sx),.5);
            gold.diamond(reach(sx*119),0,1.3);
          }
          gold.diamond(0,-27,1.2);gold.diamond(0,27,1.2);
        }
      });
      if(p.composition==='sun-needle-divider')source('snezhinka3',cx,cy,25*s,.45*s);
      if(p.composition==='triple-keske-divider'){
        source('snezhinka1',cx,cy,23*s,.4*s);
        for(const sx of [-1,1]){
          stamp(cx+sx*55*s,cy,s*.64,0,()=>seal());
          source('keske_iz_serdtsa',cx+sx*55*s,cy,15*s,.3*s);
        }
      }
      region(cx,cy,2*(arm+2)*s,64*s);return;
    }
    const s=Math.min(p.size/88,W*.92/264,H*.82/88),cx=W/2,cy=H/2;
    stamp(cx,cy,s,0,()=>{
      if(p.composition==='sovereign-headpiece'){
        red.polygon(diamond(30),[diamond(25.5)]);ring(gold,23,.8);
        for(const sx of [-1,1]){
          stamp(cx+sx*68*s,cy,s*.94,0,()=>pairedFork());
          gold.line(mirror([[33,-19],[42,-28],[51,-19]],sx),.55);
          gold.line(mirror([[33,19],[42,28],[51,19]],sx),.55);
          red.line(mirror([[99,-10],[107,-18],[115,-10],[123,-18]],sx),.65);
          red.line(mirror([[99,10],[107,18],[115,10],[123,18]],sx),.65);
          gold.diamond(sx*127,0,1.7);
          red.diamond(sx*105,0,2.5);
        }
        for(const sy of [-1,1]){
          gold.line([[-12,sy*34],[-6,sy*40],[0,sy*34],[6,sy*40],[12,sy*34]],.6);
          red.diamond(0,sy*43,1);
        }
      }else if(p.composition==='procession-headpiece'){
        for(const sx of [-1,1]){
          gold.line(mirror([[25,12],[38,12],[44,18],[68,18],[74,24],[121,24]],sx),.65);
          stamp(cx+sx*99*s,cy+6*s,s*.62,0,()=>pairedFork());
          gold.line(mirror([[42,-20],[55,-33],[68,-20]],sx),.55);
          red.diamond(sx*76,-7,1.5);gold.diamond(sx*124,15,1.3);
        }
        red.line([[-122,30],[122,30]],.65);gold.line([[-122,34],[122,34]],.3);
        for(let x=-116;x<=116;x+=8)red.diamond(x,39,1.1);
        gold.diamond(0,-42,1.3);
      }else{
        red.polygon(tooth,[diamond(15.6)]);ring(gold,13.5,.8);
        for(const sx of [-1,1]){
          stamp(cx+sx*67*s,cy+5*s,s*.8,0,()=>heartSeal());
          gold.line(mirror([[25,-28],[28,-28],[28,-40],[46,-40],[46,-28],[64,-28],[64,-14],[84,-14],[84,1],[106,1]],sx),.5);
          red.line(mirror([[31,17],[38,24],[46,16]],sx),.65);
          red.polygon(mirror([[99,-10],[108,-19],[117,-10],[113,-6],[108,-11],[104,-7]],sx));
          gold.diamond(sx*126,0,1.5);
        }
        gold.line([[-118,32],[118,32]],.45);
        for(let x=-112;x<=112;x+=8)red.polygon([[x-2,38],[x,36],[x+2,38],[x,40]]);
        gold.diamond(0,-32,1.1);
      }
    });
    if(p.composition==='sovereign-headpiece')source('snezhinka1',cx,cy,41*s,.48*s);
    if(p.composition==='procession-headpiece'){
      source('tree',cx,cy-6*s,54*s,.65*s);
      for(const sx of [-1,1])source('serdtse',cx+sx*55*s,cy-3*s,29*s,.5*s);
    }
    if(p.composition==='heart-canopy-headpiece')source('keske_iz_serdtsa',cx,cy,25*s,.45*s);
    region(cx,cy,264*s,88*s);
  }finally{gold.flush();red.flush();}
}
