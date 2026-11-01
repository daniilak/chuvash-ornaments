import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { Resvg } from '@resvg/resvg-js';
import { MOTIFS, PRESETS, getMotif, generateMotif, generateOrnament, generateTile, fitFrame, normalizeParams } from '../dist/index.js';
import { bounds, geometry, polylines, transformPoint } from '../dist/geometry.js';
const source = JSON.parse(readFileSync(new URL('../data/patterns.json', import.meta.url)));
const editor = { window: {} };
runInNewContext(readFileSync(new URL('../sources/editor/pattern_shapes.js', import.meta.url), 'utf8'), editor);
const editorShapes = editor.window.PatternShapes.BASE;
const ids = ['wing_r','chelovech','chelovek','snezhinka1','snezhinka2','snezhinka3','krab','keske_iz_serdtsa','zvezda','serdtse','bolshoe_serdtse','vzaimoponimanie','kuritsa','kuritsa_fill','tsvetok','tree'];
const xml = svg => new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document;
function inside(result) {
  for (const p of result.placements) {
    assert(p.x >= -1e-8 && p.y >= -1e-8, JSON.stringify(p));
    assert(p.x+p.width <= result.width+1e-8 && p.y+p.height <= result.height+1e-8, JSON.stringify(p));
  }
}
function noOverlaps(placements) {
  for (let i=0;i<placements.length;i++) for(let j=i+1;j<placements.length;j++) {
    const a=placements[i],b=placements[j];
    const overlap = Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1e-7 && Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1e-7;
    assert(!overlap, `Overlapping neighbors ${JSON.stringify([a,b])}`);
  }
}
function edgeKey(a,b) { return [JSON.stringify(a),JSON.stringify(b)].sort().join('|'); }
function edges(segments) { return segments.map(([a,b])=>edgeKey(a,b)).sort(); }

test('all 16 IDs, original names, coordinates and fills match both repository and live editor snapshot', () => {
  assert.deepEqual(MOTIFS.map(m=>m.id),ids);
  assert.equal(source.patterns.filter(m=>m.compact).length,15);
  for (const m of MOTIFS) {
    assert.deepEqual(m,source.patterns.find(x=>x.id===m.id));
    const original=editorShapes.find(x=>x.id===m.id);
    assert.equal(m.name,original.name);
    assert.equal(JSON.stringify(m.segments),JSON.stringify(original.segs));
    assert.equal(JSON.stringify(m.fills??[]),JSON.stringify(original.fills??[]));
  }
  assert.equal(getMotif('zvezda').name,'Солнце');
  assert.equal(getMotif('krab').name,'Жук');
  assert.throws(()=>getMotif('missing'),RangeError);
});

test('polylines preserve every edge, duplicates, closed contours and branch geometry', () => {
  for (const m of MOTIFS) {
    const actual=polylines(m.segments).flatMap(line=>line.slice(1).map((p,i)=>[line[i],p]));
    assert.deepEqual(edges(actual),edges(m.segments),m.id);
  }
  const branch=[[[0,0],[1,1]],[[1,1],[2,0]],[[1,1],[1,2]],[[0,0],[1,1]]];
  assert.deepEqual(edges(polylines(branch).flatMap(l=>l.slice(1).map((p,i)=>[l[i],p]))),edges(branch));
});

test('exact rectangular transformations, Y orientation, negative and displaced coordinates', () => {
  assert.deepEqual(transformPoint([2,3],0,'none'),[2,-3]);
  assert.deepEqual(transformPoint([2,3],90,'none'),[3,2]);
  assert.deepEqual(transformPoint([2,3],180,'none'),[-2,3]);
  assert.deepEqual(transformPoint([2,3],270,'none'),[-3,-2]);
  assert.deepEqual(transformPoint([2,3],0,'x'),[-2,-3]);
  const flower=geometry(getMotif('tsvetok'),normalizeParams({strokeWidth:0}));
  assert(flower.y < -19 && flower.y+flower.height < -11.9);
  assert.equal(bounds([[5,6],[-8,30]]).width,13);
  for(const id of ['tsvetok','snezhinka3','keske_iz_serdtsa','kuritsa_fill']) for(const rotation of [0,90,180,270]) {
    const art=generateMotif({motif:id,rotation,width:200,height:150});
    assert.equal(art.placements.length,1);inside(art);
  }
});

test('bird has only its exact source polygon, opacity is configurable and no implicit fills appear', () => {
  const doc=xml(generateMotif({motif:'kuritsa_fill',fillOpacity:0.35}).svg);
  const polygons=doc.querySelectorAll('polygon');
  assert.equal(polygons.length,1);
  assert.equal(polygons[0].getAttribute('fill-opacity'),'0.35');
  const points=polygons[0].getAttribute('points').split(' ').map(p=>p.split(',').map(Number));
  assert.deepEqual(points,getMotif('kuritsa_fill').fills[0].map(([x,y])=>[x,-y===0?0:-y]));
  assert.equal(xml(generateMotif({motif:'kuritsa'}).svg).querySelectorAll('polygon').length,0);
  assert.equal(xml(generateMotif({motif:'kuritsa_fill',fill:false}).svg).querySelectorAll('polygon').length,0);
  for(const line of doc.querySelectorAll('polyline')) assert.equal(line.getAttribute('fill'),'none');
});

test('all motif strokes stay inside image, including miter joins at thick widths', () => {
  for(const m of MOTIFS) for(const strokeWidth of [0.18,0.8,2]) for(const rotation of [0,90]) {
    const art=generateMotif({motif:m.id,strokeWidth,rotation,width:192,height:192,color:'#8b1a1a'});
    const image=new Resvg(art.svg).render();const pix=image.pixels;
    let ink=0;
    for(let y=0;y<192;y++) for(let x=0;x<192;x++) {
      const alpha=pix[(y*192+x)*4+3];ink+=alpha;
      if(x===0||y===0||x===191||y===191) assert.equal(alpha,0,`${m.id}: clipped at ${x},${y}`);
    }
    assert(ink>0,m.id);inside(art);
  }
});

test('normalization is bounded, JSON-safe, idempotent and rejects unsupported schemas', () => {
  for(const input of [null,undefined,[],false,'test',NaN,Infinity,Symbol('x'),{}, {seed:NaN,width:Infinity,height:-3,count:1e99,gap:-50,strokeWidth:Infinity,motif:'other',color:'url(https://evil)',rotation:45,motifs:['bad']}, {width:1e50,size:1e100,fillOpacity:-3,seed:-3}, {count:Infinity,width:NaN,height:NaN}]) {
    const p=normalizeParams(input);
    assert.deepEqual(normalizeParams(p),p);
    assert.equal(JSON.stringify(p).includes('null'),false);
    assert(p.width>=0&&p.width<=16384);assert(p.height>=0&&p.height<=16384);
    assert(p.count>=1&&p.count<=128);assert(p.size>=0&&p.size<=1024);
  }
  assert.throws(()=>normalizeParams({schemaVersion:2}),RangeError);
  assert.equal(normalizeParams({width:-1}).width,0);
  assert.equal(generateOrnament({width:0}).placements.length,0);
  assert.equal(fitFrame({},0,400).placements.length,0);
});

test('same complete normalized parameters reproduce every mode, including frame dimensions', () => {
  const before=JSON.stringify(MOTIFS);
  for(const {id:preset} of PRESETS) for(const m of MOTIFS) for(const seed of [0,1,42,4294967295]) {
    const p=normalizeParams({preset,motif:m.id,seed,width:400,height:240,size:32});
    const a=generateOrnament(p),b=generateOrnament(JSON.parse(JSON.stringify(a.params)));
    assert.equal(a.svg,b.svg,`${preset}/${m.id}/${seed}`);
    inside(a);noOverlaps(a.placements);
  }
  assert.equal(JSON.stringify(MOTIFS),before);
  assert.throws(()=>MOTIFS[0].segments[0][0][0]=999,TypeError);
  assert.throws(()=>MOTIFS.push(MOTIFS[0]),TypeError);
  assert.notEqual(generateOrnament({seed:1}).svg,generateOrnament({seed:2}).svg);
});

test('band strategies and mirrored divider sides preserve compatible motifs', () => {
  const common={motif:'kuritsa',motifs:['kuritsa','kuritsa_fill'],width:600,height:100,size:48,count:7,gap:8};
  const alt=generateOrnament({...common,preset:'band',sequence:'alternate'});
  assert.deepEqual(alt.placements.map(p=>p.motif),['kuritsa','kuritsa_fill','kuritsa','kuritsa_fill','kuritsa','kuritsa_fill','kuritsa']);
  const repeat=generateOrnament({...common,preset:'band',sequence:'repeat'});
  assert(repeat.placements.every(p=>p.motif==='kuritsa'));
  const paired=generateOrnament({...common,preset:'band',sequence:'mirror'});
  assert.notEqual(paired.placements[0].reflect,paired.placements[1].reflect);
  const div=generateOrnament({...common,preset:'divider'});
  for(let i=0;i<Math.floor(div.placements.length/2);i++) {
    const a=div.placements[i],b=div.placements.at(-i-1);
    assert.equal(a.motif,b.motif);assert.notEqual(a.reflect,b.reflect);
    assert(Math.abs(a.x+b.x+a.width-div.width)<1e-8);
  }
});

test('checkerboard does not cancel mirror-pair transforms for asymmetric birds', () => {
  for(const sequence of ['repeat','alternate','mirror','seeded']) {
    const tile=generateTile({motif:'kuritsa',motifs:['kuritsa'],layout:'checkerboard',sequence,width:160,height:160});
    assert.notEqual(tile.placements[0].reflect,tile.placements[1].reflect);
    assert.equal(tile.placements[0].reflect,tile.placements[3].reflect);
    assert.equal(tile.placements[1].reflect,tile.placements[2].reflect);
  }
});

test('3×3 repeat has equal seam spacing, no clipped ink, checkerboard parity and no overlaps', () => {
  for(const layout of ['grid','checkerboard']) for(const m of MOTIFS) {
    const a=generateTile({motif:m.id,layout,width:160,height:120,size:40,gap:10});
    assert.equal(a.placements.length,layout==='grid'?1:4);
    const copies=[];
    for(let y=0;y<3;y++) for(let x=0;x<3;x++) copies.push(...a.placements.map(p=>({...p,x:p.x+x*a.width,y:p.y+y*a.height})));
    noOverlaps(copies);inside(a);
    const body=a.svg.replace(/^<svg[^>]+>/,'').replace(/<\/svg>$/,'');
    const repeat=`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">${Array.from({length:9},(_,i)=>`<g transform="translate(${i%3*160} ${Math.floor(i/3)*120})">${body}</g>`).join('')}</svg>`;
    const pixels=new Resvg(repeat).render().pixels;
    let rasterDifference=0,referenceInk=0;
    for(let y=0;y<360;y++)for(let x=0;x<480;x++) {
      const local=((y%120)*480+x%160)*4;
      // Compare aggregate coverage: resvg antialiasing can vary with translated world coordinates.
      rasterDifference+=Math.abs(pixels[(y*480+x)*4+3]-pixels[local+3]);
      referenceInk+=pixels[local+3];
      if(x%160===0 || y%120===0) assert.equal(pixels[(y*480+x)*4+3],0,'Ink crosses tile seam');
    }
    assert(rasterDifference/referenceInk<0.03,`${layout}/${m.id}: inconsistent repeat coverage ${rasterDifference/referenceInk}`);
    // Center-to-center pitch repeats at the boundary as it does inside each supercell.
    const pitch=160/(layout==='grid'?1:2);
    const first=a.placements[0],last=a.placements[layout==='grid'?0:1];
    assert(Math.abs(first.x+first.width/2+160-(last.x+last.width/2)-pitch)<1e-8);
  }
});

test('corner seeds choose compatible diagonal accents while retaining the main motif', () => {
  const variants=new Set();
  for(let seed=0;seed<16;seed++) {
    const f=fitFrame({preset:'corners',motif:'tree',seed},400,300);
    assert.equal(f.placements[0].motif,'tree');assert.equal(f.placements[3].motif,'tree');
    assert.equal(f.placements[1].motif,f.placements[2].motif);
    variants.add(f.placements[1].motif);
  }
  assert.deepEqual([...variants].sort(),['tree','tsvetok']);
});

test('square, wide, tall, tiny and extreme frames keep neighbors and content separate', () => {
  for(const preset of ['border','corners'])for(const m of MOTIFS)for(const [w,h] of [[400,400],[900,160],[160,900],[24,16],[1,1],[0,0],[16384,16]]) {
    const f=fitFrame({preset,motif:m.id,size:64,gap:8,strokeWidth:0.8},w,h);
    inside(f);noOverlaps(f.placements);
    const content={x:f.inset.left,y:f.inset.top,width:w-f.inset.left-f.inset.right,height:h-f.inset.top-f.inset.bottom};
    if(content.width>0&&content.height>0) noOverlaps([...f.placements,content]);
    assert(f.inset.left<=Math.min(w,h)*0.3+1e-7);
    if(preset==='corners'&&Math.min(w,h)>8)assert.equal(f.placements.length,4);
    assert(f.placements.length<=512);
  }
});

test('SVG is valid, escaped, standalone and ID-free for multiple identical inline instances', () => {
  const a=generateOrnament({title:'<script>" & title',color:'" onload="alert(1)'});
  const doc=xml(a.svg);assert.equal(doc.documentElement.namespaceURI,'http://www.w3.org/2000/svg');
  assert.equal(doc.querySelector('title').textContent,'<script>" & title');
  assert.equal(doc.documentElement.getAttribute('role'),'img');
  assert.equal(doc.documentElement.getAttribute('aria-label'),'<script>" & title');
  assert.equal(doc.querySelectorAll('script, image, use, foreignObject, [id], [href], [onload]').length,0);
  const multiple=new JSDOM(`<main>${a.svg}${a.svg}${generateTile().svg}${fitFrame({},100,200).svg}</main>`);
  assert.equal(multiple.window.document.querySelectorAll('svg').length,4);
  assert.equal(multiple.window.document.querySelectorAll('[id]').length,0);
});

test('schema v1 regression drawings remain pinned', () => {
  const actual={};
  for(const preset of PRESETS.map(p=>p.id)) for(const seed of [0,7,42]) {
    const p={preset,seed,motif:'snezhinka1',width:600,height:400,size:40};
    actual[`${preset}/${seed}`]=createHash('sha256').update(generateOrnament(p).svg).digest('hex');
  }
  assert.deepEqual(actual,JSON.parse(readFileSync(new URL('./snapshots.json',import.meta.url),'utf8')));
});
