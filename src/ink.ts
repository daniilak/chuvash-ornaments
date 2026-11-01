import type { Drawing } from './drawing.js';
import { fmt } from './geometry.js';
import type { Params, Point } from './types.js';

export type Polygon = readonly Point[];
/** A local, exact quarter-turn coordinate frame. No resource IDs, clipping or trigonometry. */
export class Ink {
  cx=0; cy=0; scale=1; turn=0;
  private solids:string[]=[];
  constructor(readonly drawing:Drawing, readonly params:Params) {}
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
    if(solid){
      const ring=(points:Polygon,clockwise:boolean)=>{
        const area=points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+a[0]*b[1]-b[0]*a[1];},0);
        return this.path((area>0)===clockwise?points:[...points].reverse(),true);
      };
      this.solids.push(ring(outer,true)+holes.map(h=>ring(h,false)).join(''));
    }else this.drawing.parts.push(`<path d="${[outer,...holes].map(poly=>this.path(poly,true)).join('')}" fill="none" stroke="${p.color}" stroke-width="${fmt(weight)}" stroke-linejoin="miter" stroke-miterlimit="8"/>`);
  }
  flush(){
    if(this.solids.length)this.drawing.parts.unshift(`<path d="${this.solids.join('')}" fill="${this.params.color}" fill-rule="nonzero" fill-opacity="${fmt(this.params.fillOpacity)}" stroke="none"/>`);
  }
  line(points:Polygon,weight=.3,opacity?:number){
    const p=this.params,w=weight*Math.min(2,p.strokeWidth/.26)*this.scale;
    this.drawing.parts.push(`<path d="${this.path(points)}" fill="none" stroke="${p.color}" stroke-width="${fmt(w)}" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="8"${opacity===undefined?'':` stroke-opacity="${fmt(opacity)}"`}/>`);
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

