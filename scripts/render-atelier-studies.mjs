import {writeFileSync,mkdirSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {generateComposition} from '../dist/index.js';
import {ATELIER_STUDIES} from '../dist/atelier-recipes.js';

mkdirSync('examples/atelier',{recursive:true});
mkdirSync('docs/atelier-review',{recursive:true});
const embed=(a,x,y,w,h)=>a.svg.replace(/^<svg[^>]*>/,`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${a.width} ${a.height}">`);
const sheet=(w,h,body,color='#f8f5ee')=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${color}"/>${body}</svg>`;
const save=(path,svg)=>{writeFileSync(`${path}.svg`,svg);writeFileSync(`${path}.png`,new Resvg(svg).render().asPng());};
let gallery='';
for(const [i,b]of ATELIER_STUDIES.entries()){
  const a=generateComposition({composition:b.id,seed:42});
  writeFileSync(`examples/atelier/${b.id}.svg`,a.svg);
  writeFileSync(`examples/atelier/${b.id}.json`,JSON.stringify(a.params,null,2)+'\n');
  writeFileSync(`examples/atelier/${b.id}.png`,new Resvg(a.svg).render().asPng());
  gallery+=i<3?embed(a,30+i*440,30,420,420):embed(a,70,510+(i-3)*230,1240,210);
  let review='';
  const variants=[{}, {fill:false}, {color:'#272321',accentColor:'#272321'}, {color:'#f0dfc6',accentColor:'#c8a263'}];
  for(const [j,patch]of variants.entries()){
    const x=j%2*650,y=Math.floor(j/2)*430;
    if(j===3)review+=`<rect x="${x+10}" y="${y+10}" width="630" height="400" fill="#292625"/>`;
    review+=embed(generateComposition({...a.params,...patch}),x+30,y+20,590,360);
    review+=embed(generateComposition({...a.params,...patch}),x+274,y+370,96,50);
  }
  save(`docs/atelier-review/${b.id}`,sheet(1300,860,review));
}
save('docs/atelier-review/collection',sheet(1380,1240,gallery));
console.log('Six patterns exported without text.');
