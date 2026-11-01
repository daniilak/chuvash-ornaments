import {writeFileSync,mkdirSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {BOOK_STUDIES,generateComposition} from '../dist/index.js';
mkdirSync('examples/book-studies',{recursive:true});
const parts=[];
for(const[b,i]of BOOK_STUDIES.map((b,i)=>[b,i])){
 const art=generateComposition({composition:b.id,width:1120,height:b.kind==='divider'?300:180,size:b.kind==='divider'?200:96,seed:42});
 writeFileSync(`examples/book-studies/${b.id}.svg`,art.svg);
 writeFileSync(`examples/book-studies/${b.id}.json`,JSON.stringify(art.params,null,2)+'\n');
 const y=i*235;
 parts.push(`<text x="42" y="${y+32}" fill="#30302c" font-family="Arial" font-size="19">${i+1}. ${b.name.ru}</text>`);
 parts.push(art.svg.replace(/^<svg[^>]*>/,`<svg x="20" y="${y+44}" width="1120" height="180" viewBox="0 0 ${art.width} ${art.height}">`));
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1160" height="1410"><rect width="1160" height="1410" fill="#f4f3ef"/>${parts.join('')}</svg>`;
writeFileSync('docs/reference-studies.svg',svg);
writeFileSync('docs/reference-studies.png',new Resvg(svg,{font:{loadSystemFonts:true}}).render().asPng());
console.log('Six distinct new book studies rendered.');
