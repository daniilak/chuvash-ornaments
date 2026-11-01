import { writeFileSync, mkdirSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { COMPOSITIONS, BOOK_STUDIES, generateComposition } from '../dist/index.js';
mkdirSync('examples/ornaments',{recursive:true});
const dimensions=c=>c.kind==='rosette'?{width:440,height:440,size:380}:c.kind==='frame'?{width:720,height:460,size:72}:c.kind==='divider'?{width:960,height:220,size:200}:{width:960,height:150,size:90};
const arts=COMPOSITIONS.map(c=>{
 const art=generateComposition({composition:c.id,seed:42,...dimensions(c),strokeWidth:.36,fillOpacity:1,color:BOOK_STUDIES.some(b=>b.id===c.id&&b.twoTone)?'#292824':'#8b1a1a'});
 writeFileSync(`examples/ornaments/${c.id}.svg`,art.svg);
 writeFileSync(`examples/ornaments/${c.id}.json`,JSON.stringify(art.params,null,2)+'\n');
 return{...c,art};
});
function sheet(items,path){
 const height=Math.ceil(items.length/2)*310;
 const parts=items.map((c,i)=>{
  const x=i%2*500,y=Math.floor(i/2)*310;
  const root=c.art.svg.replace(/^<svg[^>]*>/,`<svg x="${x+22}" y="${y+45}" width="456" height="245" viewBox="0 0 ${c.art.width} ${c.art.height}">`);
  return`<text x="${x+24}" y="${y+28}" font-family="Arial" font-size="13" fill="#666">${c.name.en}</text>${root}`;
 });
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${height}"><rect width="1000" height="${height}" fill="#fff"/>${parts.join('')}</svg>`;
 writeFileSync(`${path}.svg`,svg);writeFileSync(`${path}.png`,new Resvg(svg,{font:{loadSystemFonts:true,defaultFontFamily:'Arial'}}).render().asPng());
}
sheet(arts,'docs/new-compositions');sheet(arts.slice(6,12),'docs/book-additions');sheet(arts.slice(12,18),'docs/more-ornaments');
console.log(`${arts.length} standalone SVGs, complete reproduction params and white-background contact sheets generated.`);
