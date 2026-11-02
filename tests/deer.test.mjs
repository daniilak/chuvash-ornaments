import test from 'node:test';
import assert from 'node:assert/strict';
import {Resvg} from '@resvg/resvg-js';
import {DEER_OUTLINE,DEER_STUDIES,generateComposition} from '../dist/index.js';

test('the traced deer keeps distinct antlers, two standing legs and an open belly',()=>{
 const points=DEER_OUTLINE.map(([x,y])=>[x+60,y+66.5].join(',')).join(' ');
 const px=new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="133"><polygon points="${points}"/></svg>`).render().pixels;
 const runs=y=>{let n=0,prior=false;for(let x=0;x<120;x++){const ink=px[(y*120+x)*4+3]>127;if(ink&&!prior)n++;prior=ink;}return n;};
 assert.equal(runs(117),2,'legs merged or disappeared');
 assert(runs(20)>=3,'antler tines merged');
 assert.equal(px[((93+10)*120+65+10)*4+3],0,'space between the legs was filled');
 assert(px[((65+10)*120+65+10)*4+3]>250,'body is no longer a filled silhouette');
});

test('deer frame stays clear inside the promised inset with heavy outlines',()=>{
 for(const [width,height]of [[760,1080],[1080,760],[900,180],[180,900],[48,48]])for(const fill of [true,false]){
  const a=generateComposition({composition:'deer-tapestry-frame',width,height,size:130,strokeWidth:2,fill});
  const {top,right,bottom,left}=a.inset,px=new Resvg(a.svg).render().pixels;
  assert(left<=Math.min(width,height)*.3);
  for(let y=Math.ceil(top);y<Math.floor(height-bottom);y++)for(let x=Math.ceil(left);x<Math.floor(width-right);x++)assert.equal(px[(y*width+x)*4+3],0,`ink in deer frame content at ${x},${y}`);
 }
});

test('paired deer face each other and retain exact horizontal balance',()=>{
 for(const composition of ['deer-guardians','deer-sun-divider']){
  const a=generateComposition({composition,width:720,height:220}),px=new Resvg(a.svg).render().pixels;let error=0;
  for(let y=0;y<220;y++)for(let x=0;x<720;x++)error+=Math.abs(px[(y*720+x)*4+3]-px[(y*720+719-x)*4+3]);
  assert(error/(720*220)<1,composition);
 }
 assert.equal(DEER_STUDIES.length,6);
});
