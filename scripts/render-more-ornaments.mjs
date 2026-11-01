import {writeFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {generateComposition} from '../dist/index.js';
const text=(x,y,t,size=21)=>`<text x="${x}" y="${y}" font-family="Arial" font-size="${size}" font-weight="600" fill="#30343a">${t}</text>`;
const embed=(art,x,y,w,h)=>art.svg.replace(/^<svg[^>]*>/,`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${art.width} ${art.height}">`);
const parts=[text(30,40,'Новые узоры',28)];
const bands=[['lozenge-ligature','Вязь'],['toothed-diamonds','Зубцы'],['horn-band','Рога'],['comb-band','Гребёнка']];
for(const[[composition,label],i]of bands.map((a,i)=>[a,i])){
 const y=65+i*175;parts.push(text(30,y+24,label));
 parts.push(embed(generateComposition({composition,width:960,height:125,size:82,color:'#8b1a1a'}),20,y+34,960,125));
}
parts.push(text(30,810,'Медальон'),text(525,810,'Ромбовая рамка'));
parts.push(embed(generateComposition({composition:'branch-medallion',color:'#8b1a1a'}),20,830,455,400));
parts.push(embed(generateComposition({composition:'lozenge-frame',width:700,height:560,size:64,color:'#8b1a1a'}),515,830,465,400));
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1260"><rect width="1000" height="1260" fill="#fff"/>${parts.join('')}</svg>`;
writeFileSync('docs/more-ornaments-large.svg',svg);writeFileSync('docs/more-ornaments-large.png',new Resvg(svg,{font:{loadSystemFonts:true,defaultFontFamily:'Arial'}}).render().asPng());
console.log('Six new ornaments rendered at a readable scale.');
