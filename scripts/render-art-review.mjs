import {writeFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {COMPOSITIONS,generateComposition} from '../dist/index.js';
const labels={'hooked-meander':'Крючки','hatched-diamonds':'Штриховка','ceremonial-tree':'Дерево','book-frame':'Рамка','comb-rosette':'Гребни','hooked-rosette':'Ветви'};
function embed(art,x,y,width,height){return art.svg.replace(/^<svg[^>]*>/,`<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 ${art.width} ${art.height}">`);}
function save(name,width,height,parts){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="white"/>${parts.join('')}</svg>`;writeFileSync(`docs/${name}.svg`,svg);writeFileSync(`docs/${name}.png`,new Resvg(svg,{font:{loadSystemFonts:true,defaultFontFamily:'Arial'}}).render().asPng());}
const text=(x,y,content,size=20)=>`<text x="${x}" y="${y}" font-family="Arial" font-size="${size}" font-weight="600" fill="#30343a">${content}</text>`;
const parts=[text(32,40,'Переработанные узоры',26)];
for(const [id,y] of [['hooked-meander',70],['hatched-diamonds',250],['ceremonial-tree',430]]){
 parts.push(text(32,y+20,labels[id]));
 const tree=id==='ceremonial-tree';
 parts.push(embed(generateComposition({composition:id,width:960,height:tree?220:125,size:tree?210:80,color:'#8b1a1a'}),20,y+32,960,tree?220:125));
}
parts.push(text(32,735,'Гребни'),text(532,735,'Ветви'));
for(const[id,x]of[['comb-rosette',20],['hooked-rosette',520]])parts.push(embed(generateComposition({composition:id,color:'#8b1a1a'}),x,750,460,380));
parts.push(text(32,1190,'Рамка'));
parts.push(embed(generateComposition({composition:'book-frame',width:960,height:360,size:72,color:'#8b1a1a'}),20,1200,960,360));
save('art-review',1000,1590,parts);
const comparison=[text(32,36,'Было · версия 2',22),text(532,36,'Стало · версия 3',22)];
for(let i=0;i<12;i++){
 const c=COMPOSITIONS[i],y=60+i*230;
 comparison.push(text(32,y+20,labels[c.id]??c.name.ru,18));
 for(const v of [2,3]){
  const art=generateComposition({composition:c.id,compositionVersion:v,color:'#8b1a1a',width:c.kind==='rosette'?400:720,height:c.kind==='rosette'?400:c.kind==='frame'?360:c.kind==='divider'?220:125,size:c.kind==='rosette'?320:c.kind==='frame'?64:c.kind==='divider'?200:80});
  comparison.push(embed(art,v===2?20:520,y+28,460,190));
 }
 comparison.push(`<path d="M32 ${y+224}H968" stroke="#e0e0e0"/>`);
}
save('art-v3-comparison',1000,60+12*230,comparison);
console.log('Rendered all 12 before/after comparisons and a larger sheet of the six book studies.');
