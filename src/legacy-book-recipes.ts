import { Drawing } from './drawing.js';
import { fmt } from './geometry.js';
import type { CompositionParams, StudyPlacement } from './legacy-compositions.js';
import type { FrameResult, Point } from './types.js';

type Polygon = readonly Point[];
/** A local, exact quarter-turn coordinate frame. No resource IDs, clipping or trigonometry. */
class Ink {
  cx=0; cy=0; scale=1; turn=0;
  constructor(readonly drawing:Drawing, readonly params:CompositionParams) {}
  map([x,y]:Point): Point {
    if(this.turn===1)[x,y]=[-y,x];else if(this.turn===2)[x,y]=[-x,-y];else if(this.turn===3)[x,y]=[y,-x];
    return[this.cx+x*this.scale,this.cy+y*this.scale];
  }
  stamp(cx:number,cy:number,scale:number,turn:number,draw:()=>void){
    const old=[this.cx,this.cy,this.scale,this.turn];[this.cx,this.cy,this.scale,this.turn]=[cx,cy,scale,turn];draw();
    [this.cx,this.cy,this.scale,this.turn]=old;
  }
  path(points:Polygon,close=false){return points.map((p,i)=>`${i?'L':'M'}${this.map(p).map(fmt).join(' ')}`).join('')+(close?'Z':'');}
  polygon(outer:Polygon,holes:readonly Polygon[]=[],solid=this.params.fill){
    const p=this.params,weight=Math.min(.6,p.strokeWidth*1.2)*this.scale;
    this.drawing.parts.push(`<path d="${[outer,...holes].map(poly=>this.path(poly,true)).join('')}" fill="${solid?p.color:'none'}" fill-rule="evenodd" fill-opacity="${fmt(p.fillOpacity)}" stroke="${solid?'none':p.color}" stroke-width="${fmt(weight)}" stroke-linejoin="miter" stroke-miterlimit="8"/>`);
  }
  line(points:Polygon,weight=.3){
    const p=this.params,w=weight*Math.min(2,p.strokeWidth/.26)*this.scale;
    this.drawing.parts.push(`<path d="${this.path(points)}" fill="none" stroke="${p.color}" stroke-width="${fmt(w)}" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="8"/>`);
  }
  diamond(x:number,y:number,r:number,solid=this.params.fill){this.polygon([[x,y-r],[x+r,y],[x,y+r],[x-r,y]],[],solid);}
  /** Explicit scanline intersections of polygon rings: hatch ends match the silhouette without clipPath IDs. */
  hatch(outer:Polygon,holes:readonly Polygon[]=[],spacing=1.1){
    this.polygon(outer,holes,false);
    if(!this.params.fill)return;
    const ys=outer.map(p=>p[1]),top=Math.min(...ys),bottom=Math.max(...ys);
    for(let y=top+spacing/2;y<bottom;y+=spacing){
      const crossings:number[]=[];
      for(const poly of [outer,...holes])for(let i=0;i<poly.length;i++){
        const a=poly[i],b=poly[(i+1)%poly.length];
        if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))crossings.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));
      }
      crossings.sort((a,b)=>a-b);
      for(let i=0;i+1<crossings.length;i+=2)if(crossings[i+1]-crossings[i]>.18)this.line([[crossings[i]+.06,y],[crossings[i+1]-.06,y]],.17);
    }
  }
}

const diamond:Polygon=[[0,-8],[8,0],[0,8],[-8,0]];
const star:Polygon=[[0,-9],[2,-5],[6,-7],[5,-2],[9,0],[5,2],[7,6],[2,5],[0,9],[-2,5],[-6,7],[-5,2],[-9,0],[-5,-2],[-7,-6],[-2,-5]];
const hole:Polygon=[[0,-2],[2,0],[0,2],[-2,0]];

function comb(ink:Ink,seed:number){
  // Four cardinal comb crowns, four diagonal combs, a deliberately open central cross.
  const crown:Polygon=[[-.7,-2],[.7,-2],[.7,-9],[4,-10],[6,-13],[6,-18],[4.5,-18],[4.5,-14],[2.5,-14],[2.5,-18],[1,-18],[1,-14],[-1,-14],[-1,-18],[-2.5,-18],[-2.5,-14],[-4.5,-14],[-4.5,-18],[-6,-18],[-6,-13],[-4,-10],[-.7,-9]];
  const diagonal:Polygon=[[3,-5],[5,-3],[14,-12],[12,-14],[11,-13],[9,-15],[8,-14],[10,-12],[9,-11],[7,-13],[6,-12],[8,-10],[7,-9],[5,-11],[4,-10],[6,-8]];
  const cx=ink.cx,cy=ink.cy,s=ink.scale,base=ink.turn;
  for(let turn=0;turn<4;turn++)ink.stamp(cx,cy,s,(turn+base)%4,()=>{
    ink.polygon(crown);ink.polygon(diagonal);
    ink.polygon([[2,-2],[7,-2],[2,-7]],[],false);
  });
  ink.diamond(0,0,.85,false);if(seed%2)ink.diamond(0,0,.3);
}
function hooked(ink:Ink,seed:number){
  const crown:Polygon=[[-.7,0],[.7,0],[.7,-11],[2,-13],[5,-16],[7,-14],[5,-12],[2,-14],[0,-12],[-2,-14],[-5,-12],[-7,-14],[-5,-16],[-2,-13],[-.7,-11]];
  const wing:Polygon=[[3,-3],[4,-9],[10,-15],[10,-9],[15,-9],[9,-3]];
  const cutout:Polygon=[[5,-5],[6,-9],[8,-11],[8,-7],[11,-7],[8,-5]];
  const cx=ink.cx,cy=ink.cy,s=ink.scale,base=ink.turn;
  for(let turn=0;turn<4;turn++)ink.stamp(cx,cy,s,(turn+base)%4,()=>{
    ink.polygon(crown);ink.polygon(wing,[cutout]);
    ink.line([[2,-2],[6,-6],[6,-9],[4,-9],[4,-7]],.45);
    if(seed%2)ink.diamond(0,-9,.65,false);
    ink.polygon([[-.6,-6],[-3,-8],[-1,-5],[0,-4],[1,-5],[3,-8],[.6,-6]]);
  });
  ink.diamond(0,0,1.3);
}
function frameNode(ink:Ink,hook:boolean){
  ink.polygon(star,[hole]);
  if(hook)for(const side of [-1,1])ink.line([[side*5,-4],[side*8,-7],[side*8,-10],[side*5,-10],[side*5,-8],[side*6,-8]],.8);
}

export function renderBookRecipe(d:Drawing,p:CompositionParams,studies:StudyPlacement[]):FrameResult['inset']|undefined {
  const ink=new Ink(d,p),W=p.width,H=p.height;
  const region=(x:number,y:number,width:number,height:number)=>studies.push({kind:'geometric-study',x,y,width,height});
  if(p.composition==='comb-rosette'||p.composition==='hooked-rosette'){
    const diameter=Math.min(p.size,Math.min(W,H)*.88),s=diameter/40;
    ink.stamp(W/2,H/2,s,0,()=>p.composition==='comb-rosette'?comb(ink,p.seed):hooked(ink,p.seed));
    region((W-diameter)/2,(H-diameter)/2,diameter,diameter);
    return;
  }
  if(p.composition==='book-frame'){
    const depth=Math.min(p.size,Math.min(W,H)*.22);
    if(depth<2)return{top:0,right:0,bottom:0,left:0};
    const a=depth/2,points:Point[]=[[a,a],[W-a,a],[W-a,H-a],[a,H-a]];
    // A continuous perimeter joins the individually authored motifs intentionally.
    ink.line([...points,points[0]],depth*.095);
    for(let corner=0;corner<4;corner++){
      const [cx,cy]=points[corner];ink.stamp(cx,cy,depth/25,corner,()=>frameNode(ink,true));region(cx-depth*.43,cy-depth*.43,depth*.86,depth*.86);
    }
    const edge=(length:number,vertical:boolean)=>{
      const span=length-2*depth;
      const n=Math.min(64,Math.max(0,Math.floor((span+p.gap)/(depth+p.gap))));
      for(let i=0;i<n;i++){
        const along=depth+(i+.5)*span/n;
        for(const opposite of [false,true]){
          const cx=vertical?(opposite?W-a:a):along,cy=vertical?along:(opposite?H-a:a);
          const turn=vertical?(opposite?1:3):(opposite?2:0);
          ink.stamp(cx,cy,depth/25,turn,()=>frameNode(ink,(i+p.seed)%2===0));region(cx-depth*.43,cy-depth*.43,depth*.86,depth*.86);
        }
      }
    };
    edge(W,false);edge(H,true);
    const inset=depth*1.12;return{top:inset,right:inset,bottom:inset,left:inset};
  }
  if(p.composition==='ceremonial-tree'){
    const s=Math.min(p.size/30,H*.8/24,W*.48/40),baseline=H/2+10*s,cx=W/2;
    ink.line([[W*.05,baseline],[W*.95,baseline]],Math.max(.4,s*.32));
    ink.stamp(cx,baseline,s,0,()=>{
      ink.line([[0,0],[0,-21]],.48);
      ink.line([[-9,0],[0,-9],[9,0]],.4);
      for(const side of [-1,1]){
        ink.line([[0,-3],[side*6,-9],[side*6,-15],[side*5,-17],[side*4,-16]],.45);
        ink.line([[side*6,-11],[side*9,-14],[side*9,-17]],.36);
        ink.line([[0,-20],[side*1.8,-21.8],[side*3,-20.5],[side*1.8,-19.3],[side*.7,-20.2]],.4);
        ink.line([[side*9,0],[side*15,-6],[side*11,-10],[side*8,-7],[side*10,-5],[side*12,-7],[side*10.5,-8.5]],.5);
        if(p.seed%2)ink.diamond(side*13,-12,.6,false);
      }
    });
    region(cx-18*s,baseline-23*s,36*s,23*s);
    const space=W*.45-20*s,tri=Math.min(2.4*s,space/3),n=Math.min(16,p.count,Math.floor(space/(tri*2+p.gap)));
    for(let i=0;i<n;i++)for(const side of [-1,1]){
      const x=cx+side*(20*s+(i+.5)*space/n);
      ink.stamp(x,baseline,tri,0,()=>{ink.line([[-1,0],[0,-1],[1,0]],.12);if((p.seed+i)%2)ink.diamond(0,-1.5,.2,false);});
    }
    return;
  }
  // Repeating meander and analytically hatched lozenges. Every cell remains whole.
  const h=Math.min(H*.72,p.size*1.2,W*.7),cw=h*1.25;
  const n=Math.max(1,Math.min(64,p.count,Math.floor((W*.92+p.gap)/(cw+p.gap))));
  const cell=Math.min(cw,(W*.92-(n-1)*p.gap)/n),left=(W-n*cell-(n-1)*p.gap)/2,cy=H/2,s=p.composition==='hooked-meander'?Math.min(cell/30,h/25):Math.min(cell/24,h/21);
  ink.line([[left,cy-h*.5],[W-left,cy-h*.5]],Math.max(.4,s*.3));
  ink.line([[left,cy+h*.5],[W-left,cy+h*.5]],Math.max(.4,s*.3));
  for(let i=0;i<n;i++){
    const cx=left+(i+.5)*cell+i*p.gap;
    ink.stamp(cx,cy,s,0,()=>{
      if(p.composition==='hooked-meander'){
        const flip=(i+p.seed)%2?-1:1;
        const hook:Point[]=[[-11,6],[-1,-4],[7,4],[3,8],[-1,4],[2,1]].map(([x,y])=>[x*flip,y]);
        ink.line(hook,p.fill?2.2:.42);
        ink.hatch([[-10,8],[-7,5],[-4,8]],[],p.seed%2?.8:1.1);
      }else if((i+p.seed)%2===0){
        ink.hatch(diamond,[[[0,-4],[4,0],[0,4],[-4,0]]],p.seed%2?.85:1.15);
        ink.diamond(0,0,.5);ink.diamond(-1.5,0,.3);ink.diamond(1.5,0,.3);
      }else{
        ink.hatch([[-8,-8],[-4,-8],[8,8],[4,8]],[],1.1);
        ink.hatch([[4,-8],[8,-8],[-4,8],[-8,8]],[],1.1);
      }
    });
    region(cx-cell*.48,cy-h*.49,cell*.96,h*.98);
  }
}
