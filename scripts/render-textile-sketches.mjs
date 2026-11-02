import {mkdirSync,writeFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';

// Authored contemporary sketches after the construction of Chuvash textiles.
// These are proposals, not tracings or claimed reconstructions of museum objects.
const out='examples/textile-sketches',review='docs/textile-review';
mkdirSync(out,{recursive:true});mkdirSync(review,{recursive:true});
const palette={red:'#7f2934',dark:'#292b28',gold:'#ac823e',green:'#49655a'};
let C=palette;
const poly=(points,fill)=>`<polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="${fill}"/>`;
const line=(points,color=C.red,width=2)=>`<polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="square" stroke-linejoin="miter"/>`;
const rect=(x,y,w,h,color)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
const g=(x,y,body,s=1,rotation=0)=>`<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${s})">${body}</g>`;
const diamond=(x,y,r,color=C.red)=>poly([[x,y-r],[x+r,y],[x,y+r],[x-r,y]],color);
const cross=(x,y,r,color=C.red)=>g(x,y,poly([[-r/3,-r],[r/3,-r],[r/3,-r/3],[r,-r/3],[r,r/3],[r/3,r/3],[r/3,r],[-r/3,r],[-r/3,r/3],[-r,r/3],[-r,-r/3],[-r/3,-r/3]],color));
const ring=(x,y,r,weight,color=C.red)=>g(x,y,`<path d="M0 ${-r}L${r} 0L0 ${r}L${-r} 0Z M0 ${-r+weight}L${r-weight} 0L0 ${r-weight}L${-r+weight} 0Z" fill="${color}" fill-rule="evenodd"/>`);
const squareRing=(x,y,r,w,color=C.red)=>`<path d="M${x-r} ${y-r}h${r*2}v${r*2}h${-r*2}Z M${x-r+w} ${y-r+w}h${(r-w)*2}v${(r-w)*2}h${-(r-w)*2}Z" fill="${color}" fill-rule="evenodd"/>`;
const each=(n,fn)=>Array.from({length:n},(_,i)=>fn(i)).join('');
const star=()=>{
 const quarter=[[0,-37],[7,-22],[24,-24],[22,-7]];
 const points=[0,1,2,3].flatMap(t=>quarter.map(([x,y])=>t===0?[x,y]:t===1?[-y,x]:t===2?[-x,-y]:[y,-x]));
 const outline=points.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join('')+'Z';
 return `<path d="${outline} M0 -25L25 0L0 25L-25 0Z" fill="${C.red}" fill-rule="evenodd"/>`
  +ring(0,0,21,2.5,C.dark)+ring(0,0,14,2.2,C.gold)+cross(0,0,7,C.red)
  +each(4,i=>g(0,0,diamond(0,-30,1.6,C.gold),1,i*90));
};
// Four angular shoots with open hooked tips, all on a common stitch grid.
const bloom=()=>{
 let b=ring(0,0,10,3,C.red)+diamond(0,0,3,C.gold);
 for(let t=0;t<4;t++)b+=g(0,0,
  line([[0,-13],[0,-25],[-11,-36],[-20,-36],[-20,-26],[-14,-26]],C.red,5)
  +line([[0,-25],[11,-36],[20,-36],[20,-26],[14,-26]],C.red,5)
  +diamond(0,-39,3,C.gold)+diamond(-29,-16,3,C.dark),1,t*90);
 return b;
};
// Mirrored stepped S curves accompany flowers in textile borders.
const scroll=()=>line([[-34,21],[-34,8],[-21,-5],[-11,-5],[-11,7],[-22,7]],C.red,6)
 +line([[34,-21],[34,-8],[21,5],[11,5],[11,-7],[22,-7]],C.red,6)
 +line([[-25,-24],[-14,-35],[0,-21],[14,-35],[25,-24]],C.dark,3)
 +line([[-25,24],[-14,35],[0,21],[14,35],[25,24]],C.dark,3)
 +ring(0,0,11,2.5,C.gold)+diamond(0,0,3,C.red);
const miniRow=(x,y,length,step=22)=>{
 const n=Math.floor(length/step),pitch=length/n;
 return each(n,i=>g(x+(i+.5)*pitch,y,ring(0,0,5,1.6,C.red)+diamond(0,0,1.3,C.gold)));
};
const teeth=(x,y,length,down=1,step=18)=>{
 const n=Math.floor(length/step),pitch=length/n;
 return each(n,i=>poly([[x+i*pitch+1,y],[x+(i+1)*pitch-1,y],[x+(i+.5)*pitch,y+down*6]],i%2?C.gold:C.red));
};
const zig=(x,y,length,amp=5,step=18,color=C.red,width=2)=>{
 const n=Math.max(2,Math.round(length/step));
 return line(Array.from({length:n+1},(_,i)=>[x+i*length/n,y+(i%2?amp:-amp)]),color,width);
};
const branch=()=>{
 let b=line([[0,34],[0,-29],[0,-41]],C.dark,3.5);
 for(const y of [19,-3,-25])for(const sx of [-1,1]){
  b+=line([[0,y+12],[sx*15,y-3],[sx*28,y-3],[sx*28,y-13],[sx*19,y-13]],C.red,4);
  b+=diamond(sx*14,y-5,3,C.gold);
 }
 return b+diamond(0,-43,5,C.red)+ring(0,32,8,2.2,C.gold);
};
function weddingFrame(){
 const W=900,H=1140,center=68;
 let b='';
 // Continuous enclosing rules bind the dense four-sided embroidery.
 for(const [offset,weight,color]of [[22,3,C.red],[30,1.8,C.gold],[106,2.5,C.red],[114,1.8,C.dark]]){
  b+=`<rect x="${offset}" y="${offset}" width="${W-2*offset}" height="${H-2*offset}" fill="none" stroke="${color}" stroke-width="${weight}"/>`;
 }
 const side=(length)=>{
  const start=120,span=length-240,n=Math.floor(span/78),pitch=span/n;
  let s=miniRow(122,39,length-244,15)+miniRow(122,98,length-244,15);
  for(let i=0;i<n;i++)s+=g(start+(i+.5)*pitch,center,i%2?scroll():bloom(),.68);
  return s;
 };
 b+=side(W)+g(W,0,side(H),1,90)+g(W,H,side(W),1,180)+g(0,H,side(H),1,270);
 for(const [x,y,t]of [[68,68,0],[W-68,68,90],[W-68,H-68,180],[68,H-68,270]]){
  b+=g(x,y,squareRing(0,0,34,2,C.red)+g(0,0,star(),.76)+each(4,i=>g(0,0,diamond(0,-42,2.5,C.gold),1,i*90)),1,t);
 }
 // Inward-facing corner shoots enrich the field while keeping the center open.
 for(const [x,y,t]of [[163,163,-45],[W-163,163,45],[W-163,H-163,135],[163,H-163,225]])b+=g(x,y,branch(),.92,t);
 return{width:W,height:H,body:b};
}
function masmak(){
 const W=1600,H=300,left=28,right=W-28,span=right-left;
 let b='';
 for(const y of [24,76,224,276])b+=line([[left,y],[right,y]],C.red,y===24||y===276?3:2);
 b+=line([[left,86],[right,86]],C.dark,2)+line([[left,214],[right,214]],C.dark,2);
 b+=miniRow(left,45,span,24)+miniRow(left,255,span,24);
 b+=teeth(left,65,span,-1,24)+teeth(left,235,span,1,24);
 const n=14,pitch=span/n;
 for(let i=0;i<n;i++){
  const x=left+(i+.5)*pitch;
  b+=g(x,150,i%2?scroll():bloom(),1.17);
  if(i<n-1)b+=cross(x+pitch/2,150,5,C.gold);
  for(const sy of [-1,1])b+=g(x,150+sy*53,line([[-14,0],[0,-sy*8],[14,0]],C.red,2.2)+diamond(0,sy*2,2.4,C.green));
 }
 b+=line([[left,24],[left,276]],C.red,3)+line([[right,24],[right,276]],C.red,3);
 return{width:W,height:H,body:b};
}
function sara(){
 const W=1100,H=680;
 let b='';
 // A light horizontal crown anchors a pair of embroidered hanging panels.
 for(const side of [-1,1]){
  b+=g(W/2,64,line([[side*36,0],[side*122,0],[side*137,-15],[side*157,5],[side*177,-15],[side*197,5],[side*217,-15],[side*237,5],[side*257,-15],[side*277,5],[side*297,-15],[side*321,9],[side*390,9]],C.red,3));
  b+=g(W/2,64,line([[side*182,19],[side*197,34],[side*217,14],[side*237,34],[side*257,14],[side*277,34],[side*297,14],[side*315,32]],C.gold,1.8));
  b+=diamond(W/2+side*400,73,4,C.gold);
 }
 b+=g(W/2,64,star(),.65);
 for(const side of [-1,1]){
  const cx=W/2+side*132,top=125,bottom=542,w=222;
  let p=rect(cx-w/2,top,5,bottom-top,C.red)+rect(cx+w/2-5,top,5,bottom-top,C.red);
  p+=rect(cx-w/2+11,top,2,bottom-top,C.gold)+rect(cx+w/2-13,top,2,bottom-top,C.gold);
  p+=line([[cx-w/2,top],[cx+w/2,top]],C.red,3);
  p+=miniRow(cx-94,143,188,18)+zig(cx-94,165,188,4,15,C.dark,1.8);
  for(const [cy,r]of [[219,42],[327,38],[435,42]]){
   p+=g(cx,cy,star(),r/37);
   for(const s of [-1,1])p+=g(cx+s*73,cy,bloom(),.39);
   p+=teeth(cx-93,cy-47,186,1,15)+teeth(cx-93,cy+47,186,-1,15);
  }
  for(const y of [273,381])p+=miniRow(cx-94,y,188,18);
  p+=zig(cx-94,492,188,4,15,C.dark,1.8)+miniRow(cx-94,515,188,18);
  for(const y of [536,542])p+=line([[cx-109,y],[cx+109,y]],y===542?C.red:C.gold,2);
  // Structured fringe: groups of fine strands, bounded away from the artwork.
  for(let i=0;i<23;i++){
   const x=cx-99+i*9,drop=44+12*(1-Math.abs(i-11)/11);
   p+=line([[x,548],[x,548+drop]],i%5===0?C.gold:C.red,2.2);
   if(i%2===0)p+=diamond(x,556+drop,2.5,C.red);
  }
  b+=p;
 }
 // Three small drops connect the pair without merging their silhouettes.
 b+=line([[W/2,112],[W/2,143]],C.dark,2)+diamond(W/2,154,6,C.red)+diamond(W/2,174,3,C.gold);
 return{width:W,height:H,body:b};
}
const wrap=({width,height,body},background)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${background?rect(0,0,width,height,background):''}${body}</svg>`;
const save=(path,art,bg)=>{
 const svg=wrap(art,bg);writeFileSync(`${path}.svg`,svg);writeFileSync(`${path}.png`,new Resvg(svg).render().asPng());
};
const makers=[['wedding-cloth-frame',weddingFrame],['masmak-tiered-band',masmak],['sara-paired-tailpiece',sara]];
const arts=[];
for(const[id,make]of makers){
 const art=make();arts.push(art);save(`${out}/${id}`,art);
 // Inspect the same geometry as solid-color art and at realistic thumbnail size.
 C={red:palette.dark,dark:palette.dark,gold:palette.dark,green:palette.dark};
 const mono=make();C=palette;
 const thumbScale=Math.min(180/art.width,150/art.height);
 save(`${review}/${id}`,{width:1900,height:1260,body:
  g(25,35,art.body,Math.min(940/art.width,1110/art.height))
  +g(1000,35,mono.body,Math.min(850/art.width,1000/art.height))
  +g(1330,1080,art.body,thumbScale)},'#f8f5ef');
}
save(`${review}/three-textile-sketches`,{width:3200,height:1800,body:
 g(70,110,arts[0].body,1.35)+g(1430,135,arts[1].body,1.05)+g(1470,600,arts[2].body,1.35)},'#f8f5ef');
console.log('Rendered three text-free textile proposals, transparent SVG/PNG and large/thumbnail/monochrome reviews.');
