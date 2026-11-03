import {mkdirSync,writeFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {CORNER_DIVIDER_STUDIES,generateComposition} from '../dist/index.js';

mkdirSync('examples/corners-dividers',{recursive:true});mkdirSync('docs/corner-divider-review',{recursive:true});
const embed=(a,x,y,w,h,viewBox=`0 0 ${a.width} ${a.height}`)=>a.svg.replace(/^<svg[^>]*>/,`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${viewBox}">`);
const sheet=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#f8f5ef"/>${body}</svg>`;
const save=(path,svg)=>{writeFileSync(`${path}.svg`,svg);writeFileSync(`${path}.png`,new Resvg(svg).render().asPng());};
const arts=[];
for(const item of CORNER_DIVIDER_STUDIES){
 const dimensions=item.kind==='frame'?{width:900,height:680,size:220}:{width:1600,height:210,size:165};
 const art=generateComposition({composition:item.id,...dimensions});arts.push(art);
 save(`examples/corners-dividers/${item.id}`,art.svg);
 writeFileSync(`examples/corners-dividers/${item.id}.json`,JSON.stringify(art.params,null,2)+'\n');
 if(item.kind==='frame'){
  const solo=art.svg.replace(/width="900" height="680" viewBox="0 0 900 680"/, 'width="240" height="240" viewBox="0 0 240 240"');
  save(`examples/corners-dividers/${item.id}-single`,solo);
 }
 let review='';
 for(const[i,patch]of [{},{fill:false},{color:'#292b28',accentColor:'#292b28'},{color:'#f1e4d1',accentColor:'#c59d5b'}].entries()){
  const x=i%2*900,y=Math.floor(i/2)*680;
  if(i===3)review+=`<rect x="${x+10}" y="${y+10}" width="880" height="660" fill="#292b28"/>`;
  const a=generateComposition({...art.params,...patch});review+=embed(a,x+25,y+20,850,550)+embed(a,x+350,y+585,180,70);
 }
 save(`docs/corner-divider-review/${item.id}`,sheet(1800,1360,review));
}
let collection='';
for(let i=0;i<3;i++)collection+=embed(arts[i],80+i*1050,60,940,820,'0 0 240 240');
for(let i=0;i<3;i++)collection+=embed(arts[i+3],60,970+i*315,3080,270);
save('docs/corner-divider-review/collection',sheet(3300,1970,collection));
console.log('Rendered three corner sets, three isolated corners and three dividers, with text-free visual reviews.');
