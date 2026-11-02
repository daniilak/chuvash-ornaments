import test from 'node:test';
import assert from 'node:assert/strict';
import {Resvg} from '@resvg/resvg-js';
import {TEXTILE_STUDIES,generateComposition} from '../dist/index.js';

test('textile frame keeps its content area transparent at maximum pen weight',()=>{
 for(const [width,height]of [[900,1140],[720,400],[96,360],[720,96],[48,48]])for(const fill of [true,false]){
  const art=generateComposition({composition:'wedding-cloth-frame',width,height,size:130,strokeWidth:2,fill});
  const {pixels}=new Resvg(art.svg).render(),{left,right,top,bottom}=art.inset;
  for(let y=Math.ceil(top);y<Math.floor(height-bottom);y++)for(let x=Math.ceil(left);x<Math.floor(width-right);x++)
   assert.equal(pixels[(y*width+x)*4+3],0,`${width}×${height}: decoration at ${x},${y}`);
 }
});

test('textile recipes preserve custom inks and respond to size, spacing, outline and pen settings',()=>{
 for(const {id:composition}of TEXTILE_STUDIES){
  const base={composition,width:900,height:600,size:80,color:'#225544',accentColor:'#cc9933'};
  const art=generateComposition(base);
  assert(art.svg.includes('#225544'));assert(art.svg.includes('#cc9933'));
  assert.equal(generateComposition(art.params).svg,art.svg);
  for(const patch of [{size:40},{strokeWidth:.7},{fill:false},{fillOpacity:.4}])assert.notEqual(generateComposition({...base,...patch}).svg,art.svg);
  if(composition!=='sara-paired-tailpiece')assert.notEqual(generateComposition({...base,gap:48}).svg,art.svg);
 }
});
