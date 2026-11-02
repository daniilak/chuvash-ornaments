import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
mkdirSync('docs/aesthetic-review',{recursive:true});
import {Resvg} from '@resvg/resvg-js';
import {COMPOSITIONS,generateComposition,generateMotif,generateOrnament,generateTile,fitFrame} from '../dist/index.js';
const embed=(a,x,y,w,h)=>a.svg.replace(/^<svg[^>]*>/,`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${a.width} ${a.height}">`);
const label=(x,y,t)=>`<text x="${x}" y="${y}" font-family="Arial" font-size="18" fill="#292824">${t}</text>`;
const save=(name,p)=>{const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="980"><rect width="1440" height="980" fill="#f4f3ef"/>${p.join('')}</svg>`;writeFileSync(`docs/aesthetic-review/${name}.png`,new Resvg(svg,{font:{loadSystemFonts:true}}).render().asPng());};
for(let page=0;page<Math.ceil(COMPOSITIONS.length/4);page++){
 const p=[];
 for(let j=0;j<4;j++){
 if(!COMPOSITIONS[page*4+j])continue;
 const c=COMPOSITIONS[page*4+j],x=j%2*720,y=Math.floor(j/2)*490;
 const box=c.kind==='rosette'?{width:400,height:400,size:320}:c.kind==='frame'?{width:720,height:400,size:72}:c.kind==='divider'?{width:720,height:220,size:200}:{width:720,height:160,size:88};
 const a=generateComposition({composition:c.id,...box,seed:42});
 p.push(label(x+22,y+30,c.id));p.push(embed(a,x+20,y+42,680,300));
 p.push(label(x+22,y+365,'seed 43 · outline · thumbnail'));
 p.push(embed(generateComposition({...a.params,seed:43}),x+20,y+375,310,100));
 p.push(embed(generateComposition({...a.params,fill:false}),x+340,y+375,240,100));
 p.push(embed(a,x+595,y+390,100,70));
 }
 save(`catalog-${page+1}`,p);
}
const arts=[fitFrame({color:'#8b1a1a',size:36},720,400),fitFrame({preset:'corners',color:'#8b1a1a',size:64},720,400),generateOrnament({preset:'band',color:'#8b1a1a',width:720,height:160,size:88}),generateOrnament({preset:'divider',color:'#8b1a1a',width:720,height:160,size:88}),generateMotif({color:'#8b1a1a'}),generateTile({color:'#8b1a1a',width:160,height:160,size:52,layout:'checkerboard'})];
for(let page=0;page<2;page++)save(`basic-${page+1}`,arts.slice(page*4,page*4+4).map((a,i)=>label(i%2*720+20,Math.floor(i/2)*490+30,['border','corners','band','divider','motif','tile'][page*4+i])+embed(a,i%2*720+20,Math.floor(i/2)*490+50,680,400)));
console.log('Large review sheets: all recipes in two seeds, outline and thumbnail; six basic presets.');

const old=JSON.parse(readFileSync('tests/pre-aesthetic-snapshots.json','utf8')).compositions;
const revised=COMPOSITIONS.filter(c=>c.version===5);
const compare=[];
for(const[c,i]of revised.map((c,i)=>[c,i])){
 const y=i*220,frame=c.kind==='frame',head=c.kind==='divider';
 const box={width:720,height:frame?400:head?220:160,size:frame?64:head?200:88,...(frame||c.id==='stitch-ribbon'?{fill:false}:{})};
 const before=generateComposition({composition:c.id,compositionVersion:old[c.id].params.compositionVersion,...box,seed:42});
 const after=generateComposition({composition:c.id,...box,seed:42});
 compare.push(label(22,y+30,c.name.ru+(frame||c.id==='stitch-ribbon'?' · контур':'')));
 compare.push(embed(before,20,y+40,680,175),embed(after,740,y+40,680,175));
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="${revised.length*220}"><rect width="100%" height="100%" fill="#f4f3ef"/>${compare.join('')}</svg>`;
writeFileSync('docs/aesthetic-review/before-after.svg',svg);
writeFileSync('docs/aesthetic-review/before-after.png',new Resvg(svg,{font:{loadSystemFonts:true}}).render().asPng());
