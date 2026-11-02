import {writeFileSync,mkdirSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {ELITE_STUDIES,generateComposition} from '../dist/index.js';

mkdirSync('examples/elite',{recursive:true});
mkdirSync('docs/elite-review',{recursive:true});
const embed=(a,x,y,w,h)=>a.svg.replace(/^<svg[^>]*>/,`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${a.width} ${a.height}">`);
const text=(x,y,s,size=15,color='#777066',font='Arial')=>`<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" fill="${color}">${s}</text>`;
const page=(w,h,body,bg='#f8f5ee')=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${bg}"/>${body}</svg>`;
const save=(name,svg)=>{writeFileSync(`docs/elite-review/${name}.svg`,svg);writeFileSync(`docs/elite-review/${name}.png`,new Resvg(svg,{font:{loadSystemFonts:true}}).render().asPng());};
const arts=new Map();
for(const b of ELITE_STUDIES.slice(0,4)){
  const art=generateComposition({composition:b.id,seed:42});arts.set(b.id,art);
  writeFileSync(`examples/elite/${b.id}.svg`,art.svg);
  writeFileSync(`examples/elite/${b.id}.json`,JSON.stringify(art.params,null,2)+'\n');
  writeFileSync(`examples/elite/${b.id}.png`,new Resvg(art.svg).render().asPng());
  let body=text(40,42,b.name.ru,28,'#342e2c','Georgia');
  const variants=[
    ['Две краски · 42',{}],['Контуры · 43',{fill:false,seed:43}],
    ['Одна краска',{color:'#292824',accentColor:'#292824'}],
    ['На тёмном фоне',{color:'#f0dfc6',accentColor:'#c8a263'}],
  ];
  for(const [i,[label,patch]]of variants.entries()){
    const x=40+(i%2)*610,y=80+Math.floor(i/2)*420;
    body+=text(x,y+18,label);
    if(i===3)body+=`<rect x="${x}" y="${y+34}" width="580" height="330" rx="3" fill="#292625"/>`;
    const a=generateComposition({...art.params,...patch});
    body+=embed(a,x+15,y+45,550,300);
  }
  body+=text(40,968,'Миниатюры · 96 px');
  for(const [i,[,patch]]of variants.entries())body+=embed(generateComposition({...art.params,...patch,color:'#292824',accentColor:'#aa8247'}),260+i*220,915,96,96);
  save(b.id,page(1260,1040,body));
}
let poster=text(64,51,'ЧУВАШСКАЯ ГЕОМЕТРИЯ / ПАРАДНАЯ СЕРИЯ',13,'#8e7557');
poster+=text(60,116,'Ритм. Память. Мастерство.',44,'#422e2c','Georgia');
poster+=text(64,150,'Четыре современные композиции на основе угловатых мотивов и открытых просветов.',16);
poster+=`<path d="M64 184H1376" stroke="#d9ceba"/>`;
poster+=text(64,227,'01 / ПАРАДНАЯ ЦЕПЬ',13,'#8e7557');
poster+=embed(arts.get('heirloom-chain'),52,250,820,182);
poster+=text(64,485,'02 / КРЫЛАТАЯ ЗАСТАВКА',13,'#8e7557');
poster+=embed(arts.get('winged-headpiece'),52,502,820,250);
poster+=text(1000,227,'03 / ПЕЧАТЬ КӖСКӖ',13,'#8e7557');
poster+=embed(arts.get('keske-signet'),930,265,420,420);
poster+=`<path d="M64 793H1376" stroke="#d9ceba"/>`;
poster+=text(64,836,'04 / ПАРАДНАЯ РАМКА',13,'#8e7557');
poster+=embed(arts.get('ceremonial-frame'),210,856,1020,508);
poster+=text(586,1078,'Хранить красоту',32,'#422e2c','Georgia');
poster+=text(552,1120,'Бережная геометрия. Две краски.',17);
poster+=text(626,1154,'Свободное поле.',17);
poster+=text(64,1412,'SVG · прозрачный фон · одна или две краски · масштабируемая геометрия',13);
save('collection',page(1440,1450,poster));
console.log('Four ceremonial designs: SVG, JSON, PNG, collection and four visual review sheets.');
