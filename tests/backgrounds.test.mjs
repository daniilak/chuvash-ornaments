import test from 'node:test';
import assert from 'node:assert/strict';
import {Resvg} from '@resvg/resvg-js';
import {createHash} from 'node:crypto';
import React from 'react';
import{renderToString}from'react-dom/server';
import{BACKGROUNDS,MOTIFS,generateBackground}from'../dist/index.js';
import{PatternBackground}from'../dist/react.js';
const hash=pixels=>createHash('sha256').update(pixels).digest('hex');

test('background tiles restore complete parameters, retain source geometry and expose real variations',()=>{
 const before=JSON.stringify(MOTIFS),images=new Set();
 for(const b of BACKGROUNDS){
  const art=generateBackground({background:b.id,seed:42,color:'#8b1a1a'});
  assert.equal(generateBackground(JSON.parse(JSON.stringify(art.params))).svg,art.svg);
  assert.equal(art.params.backgroundVersion,1);assert.equal(art.params.preset,'tile');
  assert(!/\b(?:id|href|onload)=|<script|<image|<mask|<clipPath/.test(art.svg));
  const pixels=new Resvg(art.svg).render().pixels;
  const ink=pixels.reduce((sum,value,i)=>sum+(i%4===3?value:0),0)/(art.width*art.height*255);
  assert(ink>.005&&ink<.65,`${b.id}: unusable coverage ${ink}`);images.add(hash(pixels));
  assert.notEqual(hash(pixels),hash(new Resvg(generateBackground({...art.params,seed:43}).svg).render().pixels),`${b.id}: inert seed`);
  for(const[width,height]of[[48,48],[240,120],[80,180]]){
   const small=generateBackground({...art.params,width,height,size:500,strokeWidth:2});
   assert(new Resvg(small.svg).render().pixels.some((v,i)=>i%4===3&&v>0));
  }
 }
 assert.equal(images.size,5);assert.equal(before,JSON.stringify(MOTIFS));
 assert.throws(()=>generateBackground({backgroundVersion:2}),RangeError);
 assert.equal(generateBackground({width:0}).placements.length,0);
});

test('source figures crossing a repeat boundary have identical translated partners',()=>{
 for(const background of ['lozenge-net','keske-field'])for(const seed of [0,7,42]){
  const art=generateBackground({background,seed,width:160,height:120});
  for(const a of art.placements){
   if(a.x<0)assert(art.placements.some(b=>b.motif===a.motif&&Math.abs(b.x-a.x-art.width)<1e-6&&Math.abs(b.y-a.y)<1e-6&&b.reflect===a.reflect));
   if(a.y<0)assert(art.placements.some(b=>b.motif===a.motif&&Math.abs(b.y-a.y-art.height)<1e-6&&Math.abs(b.x-a.x)<1e-6&&b.reflect===a.reflect));
  }
 }
});

test('stepped carpet links continue across both tile seams without doubled opacity',()=>{
 const art=generateBackground({background:'stepped-carpet',width:160,height:160,fillOpacity:.5});
 const raw=art.svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
 // A single uncut coordinate field contains the full edge diamonds. Compare
 // that geometry with two clipped neighboring repeat tiles around each seam.
 const uncut=`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480"><g transform="translate(160 160)">${raw}</g></svg>`;
 let tiles='';for(let y=0;y<3;y++)for(let x=0;x<3;x++)tiles+=art.svg.replace(/^<svg[^>]*>/,`<svg x="${x*160}" y="${y*160}" width="160" height="160" viewBox="0 0 160 160">`);
 const repeated=`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480">${tiles}</svg>`;
 const a=new Resvg(uncut).render().pixels,b=new Resvg(repeated).render().pixels;
 for(let y=232;y<248;y++)for(let x=312;x<328;x++)assert.equal(a[(y*480+x)*4+3],b[(y*480+x)*4+3],'vertical seam');
 for(let y=312;y<328;y++)for(let x=232;x<248;x++)assert.equal(a[(y*480+x)*4+3],b[(y*480+x)*4+3],'horizontal seam');
 assert.equal(Math.max(...new Resvg(art.svg).render().pixels.filter((_,i)=>i%4===3)),128);
});

test('book backgrounds render through the optional React component without DOM or currentColor loss',()=>{
 const html=renderToString(React.createElement(PatternBackground,{background:'lozenge-net',children:'Page content'}));
 assert.match(html,/Page content/);assert.match(html,/background-image/);assert.match(html,/background-size:160px 160px/);assert(html.includes('%238b1a1a'));
 assert.equal(typeof window,'undefined');
});
