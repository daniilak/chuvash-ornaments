import {writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {ELITE_STUDIES,generateComposition} from '../dist/index.js';
import {BROCADE_STUDIES} from '../dist/brocade-recipes.js';

mkdirSync('examples/brocade',{recursive:true});
mkdirSync('docs/brocade-review',{recursive:true});
const embed=(a,x,y,w,h)=>a.svg.replace(/^<svg[^>]*>/,`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${a.width} ${a.height}">`);
const sheet=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#f8f5ee"/>${body}</svg>`;
const save=(path,svg)=>{writeFileSync(`${path}.svg`,svg);writeFileSync(`${path}.png`,new Resvg(svg).render().asPng());};
let collection='';
for(const [i,b]of BROCADE_STUDIES.entries()){
  const a=generateComposition({composition:b.id,seed:42});
  writeFileSync(`examples/brocade/${b.id}.svg`,a.svg);
  writeFileSync(`examples/brocade/${b.id}.json`,JSON.stringify(a.params,null,2)+'\n');
  writeFileSync(`examples/brocade/${b.id}.png`,new Resvg(a.svg).render().asPng());
  collection+=i<3?embed(a,30+i*580,20,560,560):embed(a,60,620+(i-3)*230,1680,215);
  let review='';
  const variants=[{}, {fill:false}, {color:'#272321',accentColor:'#272321'}, {color:'#f0dfc6',accentColor:'#c8a263'}];
  for(const [j,patch]of variants.entries()){
    const x=j%2*700,y=Math.floor(j/2)*480;
    if(j===3)review+=`<rect x="${x+10}" y="${y+10}" width="680" height="460" fill="#292625"/>`;
    review+=embed(generateComposition({...a.params,...patch}),x+25,y+15,650,400);
    review+=embed(generateComposition({...a.params,...patch}),x+302,y+418,96,48);
  }
  save(`docs/brocade-review/${b.id}`,sheet(1400,960,review));
}
save('docs/brocade-review/new-six',sheet(1800,1330,collection));

// All 4 + 6 + 6: large medallions above, ribbons and headpieces below.
const originals=ELITE_STUDIES.slice(0,16),manifest=[];
const selected=[...originals.filter(b=>b.kind==='rosette'),...originals.filter(b=>b.kind==='frame'),...originals.filter(b=>b.kind==='band'||b.kind==='divider')];
if(selected.length!==16)throw Error('The horizontal collection requires all sixteen designs');
let panorama='';
for(const [i,b]of selected.entries()){
  const col=i%4,row=Math.floor(i/4),x=col*1200,y=i<8?row*900:1800+(row-2)*450;
  const a=generateComposition({composition:b.id,seed:42,...(b.kind==='band'?{width:1040,height:220,size:b.size*1.15}:b.kind==='divider'?{width:1040,height:300,size:280}:b.kind==='frame'?{width:1000,height:560,size:76}:{width:600,height:600,size:530})});
  panorama+=embed(a,x+55,y+35,1090,i<8?830:380);
  manifest.push({index:i+1,column:col+1,row:row+1,id:b.id,params:a.params});
}
save('docs/brocade-review/all-sixteen-horizontal',sheet(4800,2700,panorama));
copyFileSync('docs/brocade-review/all-sixteen-horizontal.png','demo/public/collection-16.png');
writeFileSync('docs/brocade-review/all-sixteen-horizontal.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Six detailed patterns and a text-free 4800×2700 collection of all sixteen designs.');
