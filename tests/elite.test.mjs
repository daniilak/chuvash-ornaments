import test from 'node:test';
import assert from 'node:assert/strict';
import {Resvg} from '@resvg/resvg-js';
import {ELITE_STUDIES,generateComposition} from '../dist/index.js';

test('ceremonial collection saves both inks, validates colors and rejects unsupported versions',()=>{
  assert.equal(ELITE_STUDIES.length,16);
  for(const {id:composition}of ELITE_STUDIES){
    const art=generateComposition({composition,color:'#762b32',accentColor:'#aa8247'});
    assert.equal(art.svg,generateComposition(JSON.parse(JSON.stringify(art.params))).svg);
    const pixels=new Resvg(art.svg).render().pixels,inks=new Set();
    for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]===255)inks.add([...pixels.slice(i,i+3)].join(','));
    assert(inks.has('118,43,50'),`${composition}: missing primary ink`);
    assert(inks.has('170,130,71'),`${composition}: missing second ink`);
    assert(!generateComposition({composition,accentColor:'url(https://invalid.test)'}).svg.includes('invalid.test'));
    for(const compositionVersion of [1,2,4,5])assert.throws(()=>generateComposition({composition,compositionVersion}),RangeError);
  }
});

test('ceremonial frame leaves its promised text inset empty in portrait, landscape and small formats',()=>{
  for(const [width,height]of [[720,400],[180,900],[900,180],[48,48]])for(const fill of [true,false]){
    const art=generateComposition({composition:'ceremonial-frame',width,height,size:64,strokeWidth:2,fill});
    const {left,right,top,bottom}=art.inset,pixels=new Resvg(art.svg).render().pixels;
    for(let y=Math.ceil(top);y<Math.floor(height-bottom);y++)for(let x=Math.ceil(left);x<Math.floor(width-right);x++){
      assert.equal(pixels[(y*width+x)*4+3],0,`ink entered text area at ${x},${y}`);
    }
  }
});

test('filled and outline ceremonial designs have clear raster margins even at maximum line weight',()=>{
  for(const {id:composition}of ELITE_STUDIES)for(const [width,height]of [[64,64],[96,360],[720,160]])for(const fill of [true,false]){
    const art=generateComposition({composition,width,height,fill,strokeWidth:2});
    const pixels=new Resvg(art.svg).render().pixels;
    for(let x=0;x<width;x++)for(const y of [0,height-1])assert.equal(pixels[(y*width+x)*4+3],0,composition);
    for(let y=0;y<height;y++)for(const x of [0,width-1])assert.equal(pixels[(y*width+x)*4+3],0,composition);
  }
});

test('ceremonial medallions keep both mirror axes in their raster silhouettes',()=>{
 for(const composition of ['keske-signet','keske-crown','heart-knot','sun-chamber','imperial-keske','eightfold-brooch','heart-tapestry']){
  const {pixels}=new Resvg(generateComposition({composition,width:256,height:256,size:220}).svg).render();
  let error=0;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const a=pixels[(y*256+x)*4+3];
    error+=Math.abs(a-pixels[(y*256+255-x)*4+3])+Math.abs(a-pixels[((255-y)*256+x)*4+3]);
  }
  assert(error/(256*256*2)<1,composition+' lost its paired symmetry');
 }
});
