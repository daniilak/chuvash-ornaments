import type { Drawing } from './drawing.js';
import { Ink, type Polygon } from './ink.js';
import type { CompositionParams, StudyPlacement } from './compositions.js';
import type { Point } from './types.js';

export const ATELIER_STUDIES = [
  {id:'keske-crown',kind:'rosette',name:{ru:'Венец Кӗскӗ',en:'Kĕskĕ crown'},size:320},
  {id:'heart-knot',kind:'rosette',name:{ru:'Сердечный узел',en:'Heart knot'},size:320},
  {id:'sun-chamber',kind:'rosette',name:{ru:'Солнечный чертог',en:'Sun chamber'},size:320},
  {id:'braided-hearts',kind:'band',name:{ru:'Сердечная вязь',en:'Braided hearts'},size:88},
  {id:'double-horn',kind:'band',name:{ru:'Двойные рога',en:'Double horns'},size:88},
  {id:'scarlet-lattice',kind:'band',name:{ru:'Алая решётка',en:'Scarlet lattice'},size:88},
] as const;
const diamond=(r:number):Polygon=>[[0,-r],[r,0],[0,r],[-r,0]];
const reflect=(p:Polygon,sx:number,sy:number):Point[]=>p.map(([x,y])=>[x*sx,y*sy]);
const rotate=(p:Polygon,turn:number):Point[]=>p.map(([x,y])=>turn===0?[x,y]:turn===1?[-y,x]:turn===2?[-x,-y]:[y,-x]);
const quarters=(p:Polygon):Point[]=>[0,1,2,3].flatMap(t=>rotate(p,t));

export function renderAtelierRecipe(d:Drawing,p:CompositionParams,studies:StudyPlacement[]):void{
  const red=new Ink(d,p),gold=new Ink(d,{...p,color:p.accentColor??'#aa8247'});
  const stamp=(cx:number,cy:number,s:number,draw:()=>void)=>red.stamp(cx,cy,s,0,()=>gold.stamp(cx,cy,s,0,draw));
  const isRosette=ATELIER_STUDIES.some(b=>b.id===p.composition&&b.kind==='rosette');
  const core=()=>{gold.polygon(diamond(4.2),[diamond(2.2)]);red.diamond(0,0,.8);};
  try{
    if(isRosette){
      const diameter=Math.min(p.size,p.width*.86,p.height*.86),s=diameter/64;
      stamp(p.width/2,p.height/2,s,()=>{
        if(p.composition==='keske-crown'){
          const horn:Polygon=[[3,-6],[3,-14],[8,-19],[8,-26],[12,-26],[12,-21],[16,-21],[16,-26],[20,-26],[20,-17],[13,-10],[10,-10],[10,-6]];
          const eye:Polygon=[[5.3,-8],[5.3,-13],[10.3,-18],[10.3,-17],[14,-17],[10,-13],[7.5,-13],[7.5,-8]];
          for(const sx of [-1,1])for(const sy of [-1,1]){
            red.polygon(reflect(horn,sx,sy),[reflect(eye,sx,sy)]);
            gold.line(reflect([[12,-7],[15,-7],[23,-15],[23,-22]],sx,sy),.5);
            gold.diamond(sx*25,sy*25,1.25);
          }
          for(const turn of [0,1,2,3]){
            red.polygon(rotate([[-1.5,-10],[-1.5,-22],[0,-25],[1.5,-22],[1.5,-10]],turn));
            gold.polygon(rotate([[-2,-29],[0,-31],[2,-29],[0,-27]],turn));
          }
          red.polygon(diamond(9),[diamond(6.5)]);core();
        }else if(p.composition==='heart-knot'){
          const heart:Polygon=[[0,-10],[-10,-17],[-10,-23],[-5,-28],[0,-23],[5,-28],[10,-23],[10,-17]];
          const eye:Polygon=[[0,-13.2],[-7,-18.5],[-7,-22],[-5,-24],[0,-19],[5,-24],[7,-22],[7,-18.5]];
          for(const turn of [0,1,2,3]){
            red.polygon(rotate(heart,turn),[rotate(eye,turn)]);
            gold.line(rotate([[-3,-17],[0,-14],[3,-17]],turn),.6);
            gold.polygon(rotate([[13,-17],[15,-19],[19,-15],[17,-13]],turn));
            gold.line(rotate([[14,-22],[22,-14]],turn),.35);
          }
          red.polygon(diamond(8.5),[diamond(6.2)]);core();
        }else{
          const star=quarters([[0,-29],[6,-17],[20,-20],[17,-6]]);
          const inner=quarters([[0,-20],[4.5,-12],[13,-13],[12,-4.5]]);
          red.polygon(star,[inner]);
          gold.polygon(diamond(12.3),[diamond(11.3)]);
          for(const sx of [-1,1])for(const sy of [-1,1]){
            red.line(reflect([[1.3,-6],[3.8,-8.5],[7.5,-4.8],[5,-2.3]],sx,sy),.8);
            gold.diamond(sx*11,sy*11,.8);
          }
          for(const turn of [0,1,2,3])gold.line(rotate([[-1.6,-24],[0,-21],[1.6,-24]],turn),.5);
          core();
        }
      });
      studies.push({kind:'geometric-study',x:(p.width-diameter)/2,y:(p.height-diameter)/2,width:diameter,height:diameter});return;
    }
    const h=Math.min(p.height*.8,p.size*1.3,p.width*.64),s=h/44,space=p.gap*.2;
    const cw=(p.composition==='scarlet-lattice'?44:48)*s;
    const n=Math.max(1,Math.min(p.count,64,Math.floor((p.width*.9+space)/(cw+space))));
    const left=(p.width-n*cw-(n-1)*space)/2,cy=p.height/2,right=p.width-left;
    for(const sign of [-1,1]){
      gold.line([[left,cy+sign*21*s],[right,cy+sign*21*s]],s*.35);
      red.line([[left,cy+sign*23*s],[right,cy+sign*23*s]],s*.22);
    }
    for(let i=0;i<n;i++){
      const cx=left+(i+.5)*cw+i*space;
      stamp(cx,cy,s,()=>{
        if(p.composition==='braided-hearts'){
          const heart:Polygon=[[0,1],[-17,-12],[-11,-18],[-5,-18],[0,-13],[5,-18],[11,-18],[17,-12]];
          const eye:Polygon=[[0,-3],[-12,-12],[-9,-15],[-6,-15],[0,-9],[6,-15],[9,-15],[12,-12]];
          for(const sy of [-1,1]){
            red.polygon(reflect(heart,1,sy),[reflect(eye,1,sy)]);
            gold.line(reflect([[-3,-10],[0,-7],[3,-10]],1,sy),.5);
          }
          gold.polygon(diamond(3),[diamond(1.5)]);
          for(const sx of [-1,1])gold.line(reflect([[15,-5],[19,-9],[23,-5],[19,-1],[23,3],[19,7],[15,3]],sx,1),.5);
        }else if(p.composition==='double-horn'){
          const horn:Polygon=[[2,1],[2,-5],[8,-11],[8,-17],[12,-17],[12,-13],[16,-13],[16,-17],[20,-17],[20,-9],[11,0],[11,4],[7,8],[3,4]];
          const eye:Polygon=[[6,0],[6,-3],[12,-9],[16,-9],[9,-2],[9,2],[7,4],[6,3]];
          for(const sx of [-1,1])for(const sy of [-1,1]){
            red.polygon(reflect(horn,sx,sy),[reflect(eye,sx,sy)]);
            gold.diamond(sx*20,sy*3,1);
          }
          gold.polygon([[-1,-15],[0,-17],[1,-15],[1,15],[0,17],[-1,15]]);
          red.diamond(0,0,2);
        }else{
          const ring:Polygon=quarters([[0,-19],[4,-15],[7,-15],[7,-12],[12,-7],[15,-7],[15,-4],[19,0]]);
          red.polygon(ring,[diamond(12)]);
          gold.polygon(diamond(9),[diamond(7.4)]);
          for(const sx of [-1,1])for(const sy of [-1,1])red.polygon(reflect([[1,-4],[4,-7],[7,-4],[4,-1]],sx,sy));
          gold.diamond(0,0,1.2);
          for(const sign of [-1,1])gold.line([[sign*17,-10],[sign*21,-6],[sign*17,-2]],.45);
        }
      });
      studies.push({kind:'geometric-study',x:cx-cw/2,y:cy-24*s,width:cw,height:48*s});
      if(i<n-1){
        const mid=cx+cw/2+space/2;
        stamp(mid,cy,s,()=>{
          if(p.composition==='scarlet-lattice'){
            for(const sy of [-1,1])red.polygon([[0,sy*2],[-3,sy*5],[0,sy*8],[3,sy*5]]);
          }else gold.diamond(0,0,1.4);
        });
      }
    }
  }finally{red.flush();gold.flush();}
}
