import test from 'node:test';
import assert from 'node:assert/strict';
import { Resvg } from '@resvg/resvg-js';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { COMPOSITIONS, BOOK_STUDIES, MOTIFS, generateComposition } from '../dist/index.js';
import { Composition } from '../dist/react.js';

test('new compositions preserve source data and roundtrip complete versioned parameters',()=>{
 const before=JSON.stringify(MOTIFS);
 assert.equal(COMPOSITIONS.length,64);
 for(const {id:composition} of COMPOSITIONS)for(const seed of [0,7,42]){
  const result=generateComposition({composition,seed,color:'#8b1a1a'});
  assert.equal(result.svg,generateComposition(JSON.parse(JSON.stringify(result.params))).svg);
  assert.equal(result.params.compositionVersion,COMPOSITIONS.find(c=>c.id===composition).version);
  assert(!/\b(?:id|href|onload)=|<script|<image/.test(result.svg));
  for(const p of result.placements){
   assert(p.x>=0&&p.y>=0);assert(p.x+p.width<=result.width+1e-7);assert(p.y+p.height<=result.height+1e-7);
  }
  for(let i=0;i<result.placements.length;i++)for(let j=i+1;j<result.placements.length;j++){
   const a=result.placements[i],b=result.placements[j];
   assert(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)<=1e-7||Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)<=1e-7,composition);
  }
 }
 assert.equal(before,JSON.stringify(MOTIFS));
 assert.throws(()=>generateComposition({compositionVersion:4}),RangeError);
 assert.equal(generateComposition({width:0}).placements.length,0);
});

test('book-inspired compositions retain stroke margins across wide, narrow and small canvases',()=>{
 for(const {id:composition} of COMPOSITIONS)for(const [width,height] of [[720,160],[80,80],[100,500]])for(const strokeWidth of [0.26,2]){
  const art=generateComposition({composition,width,height,strokeWidth,color:'#8b1a1a'});
  const pixels=new Resvg(art.svg).render().pixels;
  let ink=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const alpha=pixels[(y*width+x)*4+3];ink+=alpha;
   if(x===0||y===0||x===width-1||y===height-1)assert.equal(alpha,0,`${composition}/${width}x${height}: clipped ink`);
  }
  assert(ink>0,composition);
 }
});

test('the book-inspired React component renders on the server without browser APIs',()=>{
 const markup=renderToString(React.createElement(Composition,{composition:'stepped-frieze',title:'Stepped frieze'}));
 assert(markup.includes('aria-label="Stepped frieze"'));
 assert(markup.includes('<path'));
 assert.equal(typeof window,'undefined');
});


test('book frame keeps its filled motifs and perimeter outside the content inset',()=>{
 for(const [width,height] of [[600,400],[400,400],[900,180],[180,900],[24,16]]){
  const frame=generateComposition({composition:'book-frame',width,height,size:54,seed:7});
  assert(frame.inset);const {left,right,top,bottom}=frame.inset;
  assert(left<=Math.min(width,height)*.3);
  const content={x:left,y:top,width:width-left-right,height:height-top-bottom};
  for(const box of frame.studies){
   assert(box.x>=0&&box.y>=0);assert(box.x+box.width<=width+1e-7&&box.y+box.height<=height+1e-7);
   assert(Math.min(box.x+box.width,content.x+content.width)-Math.max(box.x,content.x)<=1e-7||Math.min(box.y+box.height,content.y+content.height)-Math.max(box.y,content.y)<=1e-7);
  }
 }
});

test('hatching is actual bounded SVG line geometry without shared clipping IDs',()=>{
 const art=generateComposition({composition:'hatched-diamonds',seed:42});
 assert((art.svg.match(/<path /g)||[]).length>50);
 assert(!/clipPath|url\(|<pattern|<mask/.test(art.svg));
 const outline=generateComposition({composition:'hatched-diamonds',fill:false});
 assert((outline.svg.match(/<path /g)||[]).length<(art.svg.match(/<path /g)||[]).length);
});


test('fill opacity does not fade the line-only tree headpiece',()=>{
 const a=generateComposition({composition:'ceremonial-tree',seed:42,width:360,height:160,fillOpacity:0});
 const b=generateComposition({composition:'ceremonial-tree',seed:42,width:360,height:160,fillOpacity:1});
 assert.deepEqual(new Resvg(a.svg).render().pixels,new Resvg(b.svg).render().pixels);
});

test('version 2 rosettes keep quarter-turn symmetry and a single even ink opacity',()=>{
 for(const composition of ['comb-rosette','hooked-rosette']){
  const pixels=new Resvg(generateComposition({composition,width:256,height:256,size:210,fillOpacity:.5}).svg).render().pixels;
  let difference=0,maxAlpha=0;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
   const alpha=pixels[(y*256+x)*4+3];maxAlpha=Math.max(maxAlpha,alpha);
   difference+=Math.abs(alpha-pixels[(x*256+255-y)*4+3]);
  }
  // Small raster edge differences are expected when the scan direction rotates.
  assert(difference/65536<1,`${composition}: broken quarter-turn symmetry`);
  assert.equal(maxAlpha,128,`${composition}: overlapping shapes darken the ink`);
 }
});

test('saved version 1 compositions still reproduce the previous SVGs',async()=>{
 const {createHash}=await import('node:crypto');
 const expected={
  'hooked-meander':'708ba6a52ac18b369dd2a6b613abe8ef1ceb74c1ff9737d2a3a89d14c3fd98d8',
  'hatched-diamonds':'eac44da18e486f695f1b9a0fbe2cfc5a49b80f572cd51cbfba597557bf43a45e',
  'ceremonial-tree':'138e7a543aab6db4dc3db8a352fe9d650afcd3c7fab6b37d0719c3ba126eb2a2',
  'book-frame':'36d379a7854b325bc273bb57a7cfd3a4f1513e7cf42360ebecf2d0b18e8c1120',
  'comb-rosette':'b4c4b46de874b4371062789677d45785f1ecc424dcaa98dfc44b9db124b99d10',
  'hooked-rosette':'f596464a59d8f03602439ad461b79dcefc66c4853e859e3fb654faee229a7cfe',
 };
 for(const [composition,hash]of Object.entries(expected)){
  const art=generateComposition({composition,compositionVersion:1,seed:42});
  assert.equal(createHash('sha256').update(art.svg).digest('hex'),hash);
  assert.equal(generateComposition(art.params).svg,art.svg);
 }
});

test('version 2 saved SVGs survive version 3 layout corrections',async()=>{
 const {createHash}=await import('node:crypto');
 const expected={
  'book-frame':'3e8b4d89ab4f273877ea2816071e0ea45608c13b9cffd1d497cf15330f282f4b',
  'hooked-meander':'f7b83f29e672f4b7e6c226806b39d579e2371c3e642fce3b0fbf72f11aacf040',
  'hatched-diamonds':'f380aa061ac6ba189748b072f72c20ee272a70c9519ede5f0567f4e6a1555776',
  'stepped-frieze':'b38fa6ad46027e2098f4f2a80a20b87d2bf187c64fe69d068a724dbc7ab944d7',
 };
 for(const[composition,hash]of Object.entries(expected))assert.equal(createHash('sha256').update(generateComposition({composition,compositionVersion:2,seed:42}).svg).digest('hex'),hash);
 for(const composition of COMPOSITIONS.slice(12).map(c=>c.id))for(const compositionVersion of [1,2])assert.throws(()=>generateComposition({composition,compositionVersion}),RangeError);
});

test('both ornamental frames leave the actual rasterized text area clear',()=>{
 for(const composition of ['book-frame','lozenge-frame'])for(const[width,height]of[[600,400],[900,180],[180,900],[48,48]]){
  const art=generateComposition({composition,width,height,size:54,strokeWidth:2,seed:7});
  const{top,right,bottom,left}=art.inset,pixels=new Resvg(art.svg).render().pixels;
  for(let y=Math.ceil(top+1);y<Math.floor(height-bottom-1);y++)for(let x=Math.ceil(left+1);x<Math.floor(width-right-1);x++)assert.equal(pixels[(y*width+x)*4+3],0,`${composition}: ink in the text area`);
 }
});

test('new book medallion has even ink opacity and mirror symmetry on both axes',()=>{
 const pixels=new Resvg(generateComposition({composition:'branch-medallion',width:256,height:256,size:210,fillOpacity:.5}).svg).render().pixels;
 let dx=0,dy=0,max=0;
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const a=pixels[(y*256+x)*4+3];max=Math.max(max,a);
  dx+=Math.abs(a-pixels[(y*256+255-x)*4+3]);dy+=Math.abs(a-pixels[((255-y)*256+x)*4+3]);
 }
 assert(dx/65536<1);assert(dy/65536<1);assert.equal(max,128);
});


test('six new reference recipes retain both inks, safe colors and independent versioning',()=>{
 assert.equal(BOOK_STUDIES.length,6);
 for(const b of BOOK_STUDIES){
  const a=generateComposition({composition:b.id,color:'#123456',accentColor:'#c48a52',width:720,height:180});
  assert.equal(a.params.compositionVersion,COMPOSITIONS.find(c=>c.id===b.id).version);
  for(const version of [1,2,3])assert.throws(()=>generateComposition({composition:b.id,compositionVersion:version}),RangeError);
  assert.notEqual(a.svg,generateComposition({...a.params,seed:a.params.seed+1}).svg,b.id+' variation');
  if(b.twoTone){
   const pixels=new Resvg(a.svg).render().pixels;
   let primary=0,secondary=0;
   for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>240){
    if(pixels[i]===18&&pixels[i+1]===52&&pixels[i+2]===86)primary++;
    if(pixels[i]===196&&pixels[i+1]===138&&pixels[i+2]===82)secondary++;
   }
   assert(primary>20&&secondary>20,b.id+': either ink was obscured');
   assert.equal(a.params.accentColor,'#c48a52');
   assert(!generateComposition({...a.params,accentColor:'url(https://example.com/ink)'}).svg.includes('example.com'));
  }else assert.equal(a.params.accentColor,undefined);
 }
 const ssr=renderToString(React.createElement(Composition,{composition:'panel-headpiece',compositionVersion:4,accentColor:'#c48a52'}));
 assert(ssr.includes('#c48a52'));
});
