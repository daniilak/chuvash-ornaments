import {writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {DEER_STUDIES,DEER_OUTLINE,generateComposition} from '../dist/index.js';

mkdirSync('examples/deer',{recursive:true});mkdirSync('docs/deer-review',{recursive:true});
const embed=(a,x,y,w,h)=>a.svg.replace(/^<svg[^>]*>/,`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${a.width} ${a.height}">`);
const sheet=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#f8f5ee"/>${body}</svg>`;
const save=(path,svg)=>{writeFileSync(`${path}.svg`,svg);writeFileSync(`${path}.png`,new Resvg(svg).render().asPng());};
const single=`<svg xmlns="http://www.w3.org/2000/svg" width="440" height="500" viewBox="-60 -67 120 134"><polygon points="${DEER_OUTLINE.map(p=>p.join(',')).join(' ')}" fill="#292625"/></svg>`;
save('examples/deer/deer-silhouette',single);
const arts=new Map();
for(const b of DEER_STUDIES){
 const dim=b.kind==='frame'?{width:760,height:1080,size:130}:b.kind==='band'?{width:1600,height:240,size:140}:b.kind==='separator'?{width:1400,height:180,size:120}:{width:960,height:340,size:300};
 const art=generateComposition({composition:b.id,...dim});arts.set(b.id,art);
 save(`examples/deer/${b.id}`,art.svg);writeFileSync(`examples/deer/${b.id}.json`,JSON.stringify(art.params,null,2)+'\n');
 let review='';
 for(const [i,patch]of [{},{fill:false},{color:'#292625',accentColor:'#292625'},{color:'#f0dfc6',accentColor:'#c8a263'}].entries()){
  const x=i%2*800,y=Math.floor(i/2)*620;
  if(i===3)review+=`<rect x="${x+10}" y="${y+10}" width="780" height="600" fill="#292625"/>`;
  const a=generateComposition({...art.params,...patch});review+=embed(a,x+20,y+20,760,510);review+=embed(a,x+330,y+548,140,54);
 }
 save(`docs/deer-review/${b.id}`,sheet(1600,1240,review));
}
let collection=embed(arts.get('deer-procession'),40,40,2250,320);
collection+=embed(arts.get('deer-and-suns'),40,420,2250,320);
collection+=embed(arts.get('deer-guardians'),40,850,1100,470);
collection+=embed(arts.get('deer-crest'),1190,850,1100,470);
collection+=embed(arts.get('deer-sun-divider'),40,1490,2250,220);
collection+=embed(arts.get('deer-tapestry-frame'),2390,40,1160,1690);
save('docs/deer-review/collection',sheet(3600,1800,collection));
copyFileSync('docs/deer-review/collection.png','demo/public/collection-deer.png');
console.log('Deer silhouette, six ornaments and a text-free 3600×1800 collection.');
