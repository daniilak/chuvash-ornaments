import test from 'node:test';
import assert from 'node:assert/strict';
import {Resvg} from '@resvg/resvg-js';
import {CEREMONIAL_LAYOUTS,COMPOSITIONS,generateComposition} from '../dist/index.js';

test('new layout catalog has three frames, three separators and three headpieces',()=>{
 for(const kind of ['frame','separator','divider'])assert.equal(CEREMONIAL_LAYOUTS.filter(b=>b.kind===kind).length,3);
 for(const b of CEREMONIAL_LAYOUTS)assert.equal(COMPOSITIONS.find(c=>c.id===b.id).kind,b.kind);
});

test('all three new frames reserve an actually clear text area at extreme aspect ratios and maximum stroke',()=>{
 for(const b of CEREMONIAL_LAYOUTS.filter(b=>b.kind==='frame'))for(const [width,height]of [[1040,780],[780,1040],[900,180],[180,900],[48,48]])for(const fill of [true,false]){
  const a=generateComposition({composition:b.id,width,height,size:96,strokeWidth:2,fill});
  const {left,right,top,bottom}=a.inset,pixels=new Resvg(a.svg).render().pixels;
  assert(left<=Math.min(width,height)*.3);
  for(let y=Math.ceil(top);y<Math.floor(height-bottom);y++)for(let x=Math.ceil(left);x<Math.floor(width-right);x++)assert.equal(pixels[(y*width+x)*4+3],0,`${b.id}/${width}x${height}/${fill}: ink at ${x},${y}`);
 }
});

test('separators keep a fixed central motif while extending their endings across a wider format',()=>{
 for(const b of CEREMONIAL_LAYOUTS.filter(b=>b.kind==='separator')){
  const narrow=generateComposition({composition:b.id,width:720,height:120}),wide=generateComposition({composition:b.id,width:1440,height:120});
  for(let i=0;i<narrow.placements.length;i++)assert.equal(narrow.placements[i].width,wide.placements[i].width);
  const pixels=new Resvg(wide.svg).render().pixels;let min=1440,max=-1;
  for(let y=0;y<120;y++)for(let x=0;x<1440;x++)if(pixels[(y*1440+x)*4+3]>20){min=Math.min(min,x);max=Math.max(max,x);}
  assert(max-min>1440*.8,b.id+': endings did not extend');
 }
});
