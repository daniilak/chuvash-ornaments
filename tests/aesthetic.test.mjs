import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Resvg} from '@resvg/resvg-js';
import {COMPOSITIONS,generateComposition,generateBackground} from '../dist/index.js';
const sha=svg=>createHash('sha256').update(svg).digest('hex');
test('saved pre-review versions of every composition and background remain byte-identical',()=>{
 const saved=JSON.parse(readFileSync(new URL('./pre-aesthetic-snapshots.json',import.meta.url)));
 for(const {params,sha256}of Object.values(saved.compositions))assert.equal(sha(generateComposition(params).svg),sha256,params.composition);
 for(const {params,sha256}of Object.values(saved.backgrounds))assert.equal(sha(generateBackground(params).svg),sha256,params.background);
});
test('refined source bands give unlike source motifs the same actual line weight',()=>{
 for(const composition of ['tree-procession','keske-lace']){
  const art=generateComposition({composition,color:'#8b1a1a'});
  const groups=[...art.svg.matchAll(/<g transform="[^"]*scale\(([^)]+)\)"[^>]*stroke-width="([^"]+)"/g)];
  assert(groups.length>1);const weights=groups.map(g=>Number(g[1])*Number(g[2]));
  assert(Math.max(...weights)-Math.min(...weights)<.005,composition);
 }
});
test('filled stepped revision is balanced and the frame outline has no heavy filled hooks',()=>{
 const art=generateComposition({composition:'stepped-frieze',width:256,height:128,size:70,fillOpacity:.5});
 const pixels=new Resvg(art.svg).render().pixels;let diff=0;
 for(let y=0;y<128;y++)for(let x=0;x<256;x++)diff+=Math.abs(pixels[(y*256+x)*4+3]-pixels[((127-y)*256+x)*4+3]);
 assert(diff/(256*128)<1);
 const outline=generateComposition({composition:'book-frame',fill:false});
 const old=generateComposition({...outline.params,compositionVersion:3});
 const ink=svg=>new Resvg(svg).render().pixels.reduce((sum,v,i)=>sum+(i%4===3?v:0),0);
 assert(ink(outline.svg)<ink(old.svg)*.9,'outline hooks still dominate the fine frame');
 for(const c of COMPOSITIONS.filter(c=>c.version===5))assert.equal(generateComposition({composition:c.id}).params.compositionVersion,c.version);
});
test('new woven lattice has matching source partners and intentional transparent crossing gaps',()=>{
 const art=generateBackground({background:'woven-lattice',width:160,height:160});
 for(const a of art.placements)if(a.x<0)assert(art.placements.some(b=>b.motif===a.motif&&Math.abs(b.x-a.x-160)<1e-6&&Math.abs(b.y-a.y)<1e-6));
 assert(!/<rect|fill="(?:white|#fff)"|<pattern|<mask|clipPath|\bid=/.test(art.svg));
 const raw=art.svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
 const uncut=new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480"><g transform="translate(160 160)">${raw}</g></svg>`).render().pixels;
 let tiles='';for(let row=0;row<3;row++)for(let col=0;col<3;col++)tiles+=art.svg.replace(/^<svg[^>]*>/,`<svg x="${col*160}" y="${row*160}" width="160" height="160" viewBox="0 0 160 160">`);
 const repeat=new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480">${tiles}</svg>`).render().pixels;
 let error=0,total=0;
 for(const [cx,cy]of [[240,320],[320,240]])for(let y=cy-10;y<cy+10;y++)for(let x=cx-10;x<cx+10;x++){const i=(y*480+x)*4+3;error+=Math.abs(uncut[i]-repeat[i]);total++;}
 assert(error/total<1,'woven strands break or darken at the repeat seam');
});
