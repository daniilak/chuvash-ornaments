import test from 'node:test';
import assert from 'node:assert/strict';
import {Resvg} from '@resvg/resvg-js';
import {CORNER_DIVIDER_STUDIES,generateComposition} from '../dist/index.js';

test('rich corner sets leave the promised content area transparent even with heavy outlines',()=>{
 for(const {id:composition,kind}of CORNER_DIVIDER_STUDIES){
  if(kind!=='frame')continue;
  for(const [width,height]of [[720,400],[96,360],[720,96],[48,48]])for(const fill of [true,false]){
   const art=generateComposition({composition,width,height,size:240,strokeWidth:2,fill});
   const {left,right,top,bottom}=art.inset,{pixels}=new Resvg(art.svg).render();
   for(let y=Math.ceil(top);y<Math.floor(height-bottom);y++)for(let x=Math.ceil(left);x<Math.floor(width-right);x++)
    assert.equal(pixels[(y*width+x)*4+3],0,`${composition}: decoration entered the content at ${x},${y}`);
   assert(!/<text\b|NaN|Infinity/.test(art.svg));
  }
 }
});

test('rich dividers keep mirrored silhouettes and an unchanged central design on a wider canvas',()=>{
 for(const {id:composition,kind}of CORNER_DIVIDER_STUDIES){
  if(kind!=='separator')continue;
  const render=width=>new Resvg(generateComposition({composition,width,height:180,size:96}).svg).render().pixels;
  const a=render(720),b=render(1440);let difference=0;
  for(let y=0;y<180;y++)for(let x=0;x<720;x++)difference+=Math.abs(a[(y*720+x)*4+3]-a[(y*720+719-x)*4+3]);
  assert(difference/(720*180)<1,composition+' lost reflection symmetry');
  for(let y=0;y<180;y++)for(let x=-135;x<135;x++)for(let c=0;c<4;c++)
   assert.equal(a[(y*720+360+x)*4+c],b[(y*1440+720+x)*4+c],composition+' stretched its center');
 }
});
