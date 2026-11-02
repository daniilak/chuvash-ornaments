import {mkdirSync,writeFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {TEXTILE_STUDIES,generateComposition} from '../dist/index.js';

mkdirSync('examples/textile',{recursive:true});mkdirSync('docs/textile-review',{recursive:true});
const embed=(a,x,y,w,h)=>a.svg.replace(/^<svg[^>]*>/,`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${a.width} ${a.height}">`);
const sheet=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#f8f5ef"/>${body}</svg>`;
const save=(path,svg)=>{writeFileSync(`${path}.svg`,svg);writeFileSync(`${path}.png`,new Resvg(svg).render().asPng());};
const arts=[];
for(const item of TEXTILE_STUDIES){
 const dimensions=item.kind==='frame'?{width:900,height:1140,size:114}:item.kind==='band'?{width:1600,height:300,size:260}:{width:1100,height:680,size:600};
 const art=generateComposition({composition:item.id,...dimensions});arts.push(art);
 save(`examples/textile/${item.id}`,art.svg);
 writeFileSync(`examples/textile/${item.id}.json`,JSON.stringify(art.params,null,2)+'\n');
 let review='';
 for(const[i,patch]of [{},{fill:false},{color:'#292b28',accentColor:'#292b28'},{color:'#f1e4d1',accentColor:'#c59d5b'}].entries()){
  const x=i%2*900,y=Math.floor(i/2)*680;
  if(i===3)review+=`<rect x="${x+10}" y="${y+10}" width="880" height="660" fill="#292b28"/>`;
  const a=generateComposition({...art.params,...patch});review+=embed(a,x+25,y+20,850,550)+embed(a,x+350,y+585,180,70);
 }
 save(`docs/textile-review/final-${item.id}`,sheet(1800,1360,review));
}
save('docs/textile-review/collection',sheet(3200,1800,embed(arts[0],70,110,1215,1539)+embed(arts[1],1430,135,1680,315)+embed(arts[2],1470,600,1485,918)));
console.log('Rendered three editor recipes and their filled, outline, monochrome, dark and thumbnail reviews.');
