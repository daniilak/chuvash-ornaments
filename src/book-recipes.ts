import { Drawing } from './drawing.js';
import { Ink, type Polygon } from './ink.js';
import type { CompositionParams, StudyPlacement } from './compositions.js';
import type { FrameResult, Point } from './types.js';

// Coordinates are a regular square grid; white channels are authored holes,
// rather than overlapping translucent strokes or inferred fills.
const star:Polygon=[[-10,0],[-7,-3],[-9,-5],[-5,-5],[-5,-9],[-3,-7],[0,-10],[3,-7],[5,-9],[5,-5],[9,-5],[7,-3],[10,0],[7,3],[9,5],[5,5],[5,9],[3,7],[0,10],[-3,7],[-5,9],[-5,5],[-9,5],[-7,3]];
const hole:Polygon=[[0,-2],[2,0],[0,2],[-2,0]];

function comb(ink:Ink){
  const crown:Polygon=[[-1,0],[1,0],[1,-8],[5,-11],[7,-13],[7,-19],[5,-19],[5,-15],[3,-15],[3,-19],[1,-19],[1,-15],[-1,-15],[-1,-19],[-3,-19],[-3,-15],[-5,-15],[-5,-19],[-7,-19],[-7,-13],[-5,-11],[-1,-8]];
  // A diagonal ladder with teeth on both sides, separated from the crowns.
  const ladder:Polygon=[[3,-5],[5,-3],[7,-5],[9,-3],[10,-4],[8,-6],[9,-7],[11,-5],[12,-6],[10,-8],[11,-9],[13,-7],[14,-8],[12,-10],[13,-11],[15,-9],[16,-10],[10,-16],[9,-15],[11,-13],[10,-12],[8,-14],[7,-13],[9,-11],[8,-10],[6,-12],[5,-11],[7,-9],[6,-8],[4,-10],[3,-9],[5,-7]];
  const cx=ink.cx,cy=ink.cy,s=ink.scale,base=ink.turn;
  for(let turn=0;turn<4;turn++)ink.stamp(cx,cy,s,(turn+base)%4,()=>{
    ink.polygon(crown,[[[-.22,0],[.22,0],[.22,-8],[-.22,-8]]]);ink.polygon(ladder);
    ink.polygon([[2,-2],[7,-2],[2,-7]]);
  });
}
function hooked(ink:Ink){
  const crown:Polygon=[[-1,0],[1,0],[1,-11],[4,-14],[6,-12],[8,-14],[4,-18],[0,-14],[-4,-18],[-8,-14],[-6,-12],[-4,-14],[-1,-11]];
  // A broad L-shaped wing. The open L is negative space, not a second line.
  const wing:Polygon=[[3,-3],[3,-9],[10,-16],[10,-10],[16,-10],[9,-3]];
  const cutout:Polygon=[[5,-5],[5,-9],[8,-12],[8,-8],[12,-8],[9,-5]];
  const cx=ink.cx,cy=ink.cy,s=ink.scale,base=ink.turn;
  for(let turn=0;turn<4;turn++)ink.stamp(cx,cy,s,(turn+base)%4,()=>{
    ink.polygon(crown);ink.polygon(wing,[cutout]);
    ink.polygon([[-1,-7],[-3,-9],[-3,-7],[0,-4],[3,-7],[3,-9],[1,-7]]);
  });
}
function frameNode(ink:Ink,hook:boolean,outline=false){
  ink.polygon(star,[hole]);
  if(hook)for(const side of [-1,1]){
    ink.line([[side*4,-6],[side*4,-9],[side*7,-12],[side*10,-9],[side*8,-7],[side*6,-9],[side*7,-10]],outline?.45:1.65);
    ink.line([[side*4,6],[side*4,9],[side*7,12],[side*10,9],[side*8,7],[side*6,9],[side*7,10]],outline?.45:1.65);
  }
}

export function renderBookRecipe(d:Drawing,p:CompositionParams,studies:StudyPlacement[]):FrameResult['inset']|undefined {
  const ink=new Ink(d,p),W=p.width,H=p.height;
  try {
  const region=(x:number,y:number,width:number,height:number)=>studies.push({kind:'geometric-study',x,y,width,height});
  if(p.composition==='comb-rosette'||p.composition==='hooked-rosette'){
    const diameter=Math.min(p.size,Math.min(W,H)*.88),s=diameter/40;
    ink.stamp(W/2,H/2,s,0,()=>p.composition==='comb-rosette'?comb(ink):hooked(ink));
    region((W-diameter)/2,(H-diameter)/2,diameter,diameter);
    return;
  }
  if(p.composition==='book-frame'){
    const depth=Math.min(p.size,Math.min(W,H)*.22);
    if(depth<2)return{top:0,right:0,bottom:0,left:0};
    const a=depth*.62,s=depth/28,points:Point[]=[[a,a],[W-a,a],[W-a,H-a],[a,H-a]];
    for(let corner=0;corner<4;corner++){
      const [cx,cy]=points[corner];ink.stamp(cx,cy,s,corner,()=>frameNode(ink,false));
      region(cx-depth*.46,cy-depth*.46,depth*.92,depth*.92);
    }
    const edge=(length:number,vertical:boolean)=>{
      const span=length-2*a,n=Math.min(64,Math.max(1,(p.compositionVersion>=3?Math.round:Math.floor)(span/(depth*1.05+p.gap*.25)))),step=span/n;
      for(let i=1;i<=n;i++)for(const opposite of [false,true]){
        const along=a+i*step,prior=along-step,axis=opposite?(vertical?W:H)-a:a;
        const from=prior+s*7,to=along-s*7,mid=(from+to)/2,r=Math.min(s*1.2,(to-from)*.2);
        // Broad diagonal links, with a small diamond opening, connect tip to tip.
        if(to>from){
          const points:Point[]=vertical?[[axis,from],[axis+s*5,mid],[axis,to],[axis-s*5,mid]]:[[from,axis],[mid,axis-s*5],[to,axis],[mid,axis+s*5]];
          const cut:Point[]=vertical?[[axis,mid-r],[axis+r,mid],[axis,mid+r],[axis-r,mid]]:[[mid,axis-r],[mid+r,axis],[mid,axis+r],[mid-r,axis]];
          ink.polygon(points,[cut]);
          if(p.compositionVersion>=3){
            if(vertical)region(axis-s*5,from,s*10,to-from);
            else region(from,axis-s*5,to-from,s*10);
          }
        }
        if(i<n){
          const cx=vertical?axis:along,cy=vertical?along:axis,turn=vertical?(opposite?1:3):(opposite?2:0);
          ink.stamp(cx,cy,s,turn,()=>frameNode(ink,(i+p.seed)%2===0,p.compositionVersion>=5&&!p.fill));
          region(cx-depth*.46,cy-depth*.46,depth*.92,depth*.92);
        }
      }
    };
    edge(W,false);edge(H,true);
    const inset=depth*1.2;return{top:inset,right:inset,bottom:inset,left:inset};
  }
  if(p.composition==='ceremonial-tree'){
    const s=Math.min(p.size/30,H*.8/26,W*.48/40),baseline=H/2+11*s,cx=W/2;
    ink.line([[W*.05,baseline],[W*.95,baseline]],Math.max(.55,s*.38));
    ink.stamp(cx,baseline,s,0,()=>{
      ink.line([[0,0],[0,-23]],.58);
      for(const side of [-1,1]){
        ink.line([[0,-4],[side*7,-11],[side*7,-17],[side*6,-19],[side*5,-18]],.55);
        ink.line([[0,-4],[side*3.5,-7.5],[side*3.5,-16],[side*2.5,-18],[side*1.5,-17]],.48);
        ink.line([[side*7,-13],[side*10,-16],[side*10,-18],[side*9,-19]],.48);
        ink.line([[0,-22],[side*1.5,-23.5],[side*3,-22],[side*2,-21],[side*1,-22]],.5);
        ink.line([[side*9,0],[side*15,-6],[side*10,-11],[side*6,-7],[side*10,-3],[side*12,-5],[side*9,-8]],.65);
        ink.line([[side*13,-9],[side*15,-11],[side*13,-13],[side*11,-11]],.45);
      }
    });
    region(cx-17*s,baseline-25*s,34*s,25*s);
    const space=W*.45-18*s,tri=2.8*s,n=Math.min(16,p.count,Math.max(0,Math.floor(space/(tri*2+p.gap*.3))));
    for(let i=0;i<n;i++)for(const side of [-1,1]){
      const x=cx+side*(18*s+(i+.5)*space/n);
      ink.stamp(x,baseline,tri,0,()=>{
        ink.line([[-1,0],[0,-1],[1,0]],.14);
        if((p.seed+i)%2===0)ink.line([[-.55,0],[0,-.55],[.55,0]],.1);
      });
    }
    return;
  }
  // Whole cells on a shared baseline: hooks meet on the diagonal and
  // the diamond/X pair has a single, even pitch like the printed bands.
  const h=Math.min(H*.72,p.size*1.2,W*.7),nominal=h*(p.composition==='hooked-meander'?1:1.05);
  const n=Math.max(1,Math.min(64,p.count,Math.floor((W*.92+p.gap*.15)/(nominal+p.gap*.15))));
  const pitch=Math.min(nominal,(W*.92-(n-1)*p.gap*.15)/n),cell=pitch,space=p.gap*.15;
  const left=(W-n*cell-(n-1)*space)/2,cy=H/2,s=cell/24;
  const top=cy-10*s,bottom=cy+10*s,right=W-left;
  ink.line([[left,top-1.4*s],[right,top-1.4*s]],Math.max(.45,s*.4));
  ink.line([[left,top],[right,top]],Math.max(.45,s*.65));
  ink.line([[left,bottom],[right,bottom]],Math.max(.45,s*.65));
  ink.line([[left,bottom+1.4*s],[right,bottom+1.4*s]],Math.max(.45,s*.4));
  if(p.compositionVersion>=3)for(const x of [left,right])ink.line([[x,top],[x,bottom]],Math.max(.45,s*.4));
  for(let i=0;i<n;i++){
    const cx=left+(i+.5)*cell+i*space;
    ink.stamp(cx,cy,s,p.composition==='hooked-meander'&&p.seed%2?2:0,()=>{
      if(p.composition==='hooked-meander'){
        // Two opposed square spirals share the rising diagonal.
        // No alternating reflection: reflection broke the continuous rhythm.
        ink.line([[-11,8],[5,-8],[11,-2],[5,4],[1,0],[5,-4],[7,-2]],p.fill?1.75:.45);
        ink.line([[-11,-8],[-5,-2],[-9,2],[-11,0],[-8,-3],[-6,-1]],p.fill?1.75:.45);
        ink.hatch([[-3,-9],[3,-9],[0,-6]],[],.7);
        ink.hatch([[-10,9],[-4,9],[-7,6]],[],.7);
      }else if((i+p.seed)%2===0){
        const outer:Polygon=[[0,-9],[10,0],[0,9],[-10,0]],inner:Polygon=[[0,-5],[5.5,0],[0,5],[-5.5,0]];
        ink.hatch(outer,[inner],.65);
        ink.diamond(0,0,.65);ink.diamond(-1.7,0,.35);ink.diamond(1.7,0,.35);
        ink.hatch([[-11,-9],[-5,-9],[-11,-3]],[],.65);
        ink.hatch([[5,9],[11,9],[11,3]],[],.65);
      }else{
        ink.hatch([[-10,-9],[-5,-9],[10,9],[5,9]],[],.65);
        ink.hatch([[5,-9],[10,-9],[-5,9],[-10,9]],[],.65);
        ink.hatch([[-3,-9],[3,-9],[0,-6]],[],.65);
        ink.hatch([[-3,9],[3,9],[0,6]],[],.65);
      }
    });
    region(cx-cell*.5,top-2*s,cell,24*s);
  }
  } finally { ink.flush(); }
}
