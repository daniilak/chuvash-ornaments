import {writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {generateComposition} from '../dist/index.js';
import {CEREMONIAL_LAYOUTS} from '../dist/ceremonial-layouts.js';

mkdirSync('examples/ceremonial-layouts',{recursive:true});
mkdirSync('docs/ceremonial-layouts',{recursive:true});
const embed=(a,x,y,w,h)=>a.svg.replace(/^<svg[^>]*>/,`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${a.width} ${a.height}">`);
const sheet=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#f8f5ee"/>${body}</svg>`;
const save=(path,svg)=>{writeFileSync(`${path}.svg`,svg);writeFileSync(`${path}.png`,new Resvg(svg).render().asPng());};
const dimensions=b=>b.kind==='frame'?{width:1040,height:780,size:104}:b.kind==='separator'?{width:1040,height:150,size:100}:{width:1040,height:330,size:300};
let body='';
for(const [i,b]of CEREMONIAL_LAYOUTS.entries()){
  const art=generateComposition({composition:b.id,...dimensions(b)});
  writeFileSync(`examples/ceremonial-layouts/${b.id}.svg`,art.svg);
  writeFileSync(`examples/ceremonial-layouts/${b.id}.json`,JSON.stringify(art.params,null,2)+'\n');
  writeFileSync(`examples/ceremonial-layouts/${b.id}.png`,new Resvg(art.svg).render().asPng());
  const col=i%3;
  body+=i<3?embed(art,50+col*1200,35,1100,900):i<6?embed(art,50+col*1200,1010,1100,350):embed(art,50+col*1200,1480,1100,600);
  let review='';
  for(const [j,patch]of [{},{fill:false},{color:'#272321',accentColor:'#272321'},{color:'#f0dfc6',accentColor:'#c8a263'}].entries()){
    const x=j%2*800,y=Math.floor(j/2)*600;
    if(j===3)review+=`<rect x="${x+10}" y="${y+10}" width="780" height="580" fill="#292625"/>`;
    const a=generateComposition({...art.params,...patch});
    review+=embed(a,x+25,y+20,750,490);
    review+=embed(a,x+325,y+520,150,60);
  }
  save(`docs/ceremonial-layouts/${b.id}`,sheet(1600,1200,review));
}
save('docs/ceremonial-layouts/collection-nine',sheet(3600,2200,body));
copyFileSync('docs/ceremonial-layouts/collection-nine.png','demo/public/collection-layouts.png');
console.log('Three frames, three true dividers, three headpieces. Text-free PNG/SVG collection: 3600×2200.');
