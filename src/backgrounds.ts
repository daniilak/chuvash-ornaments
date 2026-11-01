import { Drawing } from './drawing.js';
import { Ink, type Polygon } from './ink.js';
import { normalizeParams } from './params.js';
import type { Generated, MotifId, Params, ParamsInput, Point } from './types.js';

export type BackgroundId='lozenge-net'|'keske-field'|'stepped-carpet'|'cross-stitch'|'woven-lattice';
export interface BackgroundParams extends Params{background:BackgroundId;backgroundVersion:1}
export interface BackgroundResult extends Generated{params:BackgroundParams}
export const BACKGROUNDS=Object.freeze(([
 {id:'lozenge-net',name:{ru:'Ромбовая сетка',en:'Diamond lattice'},sizeRatio:.46,size:64},
 {id:'keske-field',name:{ru:'Поле Кӗскӗ',en:'Kĕskĕ field'},sizeRatio:.42,size:60},
 {id:'stepped-carpet',name:{ru:'Зубчатое поле',en:'Stepped carpet'},sizeRatio:.86,size:136},
 {id:'woven-lattice',name:{ru:'Плетёная сетка',en:'Woven lattice'},sizeRatio:.4,size:60},
 {id:'cross-stitch',name:{ru:'Штрихованное плетение',en:'Hatched weave'},sizeRatio:.42,size:60},
] satisfies {id:BackgroundId;name:{ru:string;en:string};sizeRatio:number;size:number}[]).map(b=>Object.freeze({...b,name:Object.freeze(b.name)})));
const diamond=(r:number):Polygon=>[[0,-r],[r,0],[0,r],[-r,0]];
const quadrant:Polygon=[[0,-12],[3,-9],[5,-11],[8,-8],[6,-6],[9,-3],[11,-5],[14,-2],[12,0]];
const teeth:Point[]=Array.from({length:4},(_,turn)=>quadrant.map(([x,y]):Point=>turn===0?[x,y]:turn===1?[-y,x]:turn===2?[-x,-y]:[y,-x])).flat();

/** A self-contained repeat unit. Wrapped edge figures are intentional, identical
 * copies: they complete their neighbors when this SVG is repeated as a CSS image. */
export function generateBackground(input:ParamsInput&{background?:BackgroundId;backgroundVersion?:1}={}):BackgroundResult{
 if(input.backgroundVersion!==undefined&&input.backgroundVersion!==1)throw new RangeError('Unsupported backgroundVersion');
 const recipe=BACKGROUNDS.find(b=>b.id===input.background)??BACKGROUNDS[0];
 const p:BackgroundParams={...normalizeParams({width:160,height:160,size:recipe.size,strokeWidth:.36,fillOpacity:1,seed:42,...input,preset:'tile'}),background:recipe.id,backgroundVersion:1};
 const d=new Drawing(p),ink=new Ink(d,p),W=p.width,H=p.height,m=Math.min(W,H),size=Math.min(p.size,m*recipe.sizeRatio);
 const result=():BackgroundResult=>({...d.result(),params:p});
 if(!W||!H||!size)return result();
 const source=(id:MotifId,x:number,y:number,s:number,mirror=false)=>d.place(id,x-s/2,y-s/2,s,s,0,mirror?'x':'none');
 // Enumerate enough neighbor cells to capture every element crossing an edge.
 // Distant copies are excluded by bounds, keeping the repeat independent of DOM IDs.
 const wrapped=(x:number,y:number,r:number,draw:(cx:number,cy:number)=>void)=>{
  for(const dx of [-W,0,W])for(const dy of [-H,0,H]){
   const cx=x+dx,cy=y+dy;
   if(cx+r>0&&cx-r<W&&cy+r>0&&cy-r<H)draw(cx,cy);
  }
 };
 try{
  if(p.background==='woven-lattice'){
   // Adapted from PatternFills crosshatch (MIT, Irene Ros, 2014):
   // transparent double strands, explicit over/under gaps, intact source motifs.
   const nodes:Point[]=[[W/2,0],[W,H/2],[W/2,H],[0,H/2]];
   const strand=(a:Point,b:Point)=>{
    const dx=b[0]-a[0],dy=b[1]-a[1];
    for(const sign of [-1,1]){
     const ox=sign*(dy>0?W*.012:-W*.012),oy=sign*(dx>0?-H*.012:H*.012);
     ink.line([[a[0]+dx*.1+ox,a[1]+dy*.1+oy],[b[0]-dx*.1+ox,b[1]-dy*.1+oy]],m*.0045);
    }
   };
   for(let i=0;i<4;i++)strand(nodes[i],nodes[(i+1)%4]);
   // Opposite edge nodes are the same wrapped instance, never doubled.
   for(const[x,y]of[[W/2,0],[0,H/2]])wrapped(x,y,m*.1,(cx,cy)=>{
    const direction=p.seed%2?-1:1,u:Point=[W*.05,H*.05*direction],v:Point=[W*.012,-H*.012*direction];
    for(const sign of [-1,1]){
     ink.line([[cx-u[0]+sign*v[0],cy-u[1]+sign*v[1]],[cx+u[0]+sign*v[0],cy+u[1]+sign*v[1]]],m*.0045);
     for(const side of [-1,1])ink.line([[cx+side*u[0]+sign*v[0],cy-side*u[1]-sign*v[1]],[cx+side*u[0]*.5+sign*v[0],cy-side*u[1]*.5-sign*v[1]]],m*.0045);
    }
   });
   source(p.seed%2?'keske_iz_serdtsa':'snezhinka3',W/2,H/2,size);
   wrapped(0,0,size*.28,(x,y)=>source('zvezda',x,y,size*.55));
  }else if(p.background==='lozenge-net'){
   const pen=m*.0035;
   ink.line([[W/2,0],[W,H/2],[W/2,H],[0,H/2],[W/2,0]],pen);
   source(p.seed%2?'snezhinka3':'zvezda',W/2,H/2,size);
   wrapped(0,0,size*.35,(x,y)=>source('serdtse',x,y,size*.7));
   for(const[x,y]of[[W/2,0],[0,H/2]])wrapped(x,y,m*.014,(cx,cy)=>ink.stamp(cx,cy,m/160,0,()=>ink.diamond(0,0,1.6)));
  }else if(p.background==='keske-field'){
   const id:MotifId=p.seed%2?'keske_iz_serdtsa':'snezhinka1';
   for(let row=0;row<2;row++)for(let col=0;col<2;col++){
    const x=(col+(row===0?.5:0))*W/2,y=(row+.5)*H/2;
    wrapped(x,y,size/2,(cx,cy)=>source(id,cx,cy,size));
   }
   for(const y of [0,H/2])for(const x of [W/4,3*W/4])wrapped(x,y,m*.022,(cx,cy)=>ink.stamp(cx,cy,m/160,0,()=>{
    ink.diamond(0,0,1.4);for(const side of [-1,1])ink.diamond(side*3,0,.55);
   }));
  }else if(p.background==='stepped-carpet'){
   const s=size/28;
   ink.stamp(W/2,H/2,s,0,()=>{
    ink.polygon(teeth,[diamond(7)]);
    if(p.seed%2){ink.diamond(-2.8,0,.7);ink.diamond(0,0,1.3);ink.diamond(2.8,0,.7);}else ink.polygon(diamond(3),[diamond(1.2)]);
   });
   // The links and corner diamonds are wrapped, so the repeating field has no
   // isolated half-shapes or doubled seams at the edges of the exported tile.
   for(const[x,y]of[[W/2,0],[0,H/2]])wrapped(x,y,m*.15,(cx,cy)=>ink.stamp(cx,cy,m/32,0,()=>ink.polygon(diamond(4.6),[diamond(1.4)])));
   wrapped(0,0,m*.11,(cx,cy)=>ink.stamp(cx,cy,m/160,0,()=>ink.polygon(diamond(10),[diamond(6)])));
  }else{
   for(let row=0;row<2;row++)for(let col=0;col<2;col++){
    const x=(col+.5)*W/2,y=(row+.5)*H/2;
    ink.stamp(x,y,size/16,0,()=>{
     if((row+col+p.seed)%2===0){ink.hatch(diamond(8),[diamond(4)],.7);ink.diamond(0,0,.6);}
     else{ink.hatch([[-7,-8],[-4,-8],[7,8],[4,8]],[],.7);ink.hatch([[4,-8],[7,-8],[-4,8],[-7,8]],[],.7);}
    });
   }
   for(const x of [0,W/2])for(const y of [0,H/2])wrapped(x,y,m*.025,(cx,cy)=>ink.stamp(cx,cy,m/160,0,()=>{
    ink.line([[-2,0],[2,0]],.3);ink.line([[0,-2],[0,2]],.3);
   }));
  }
 }finally{ink.flush();}
 return result();
}
