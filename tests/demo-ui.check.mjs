import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
const html=readFileSync(new URL('../demo-dist/index.html',import.meta.url),'utf8');
const asset=html.match(/src="([^"]+\.js)"/)[1];
const bundle=readFileSync(new URL(asset,new URL('../demo-dist/',import.meta.url)),'utf8');
const pause=()=>new Promise(resolve=>setTimeout(resolve,20));
async function waitFor(check){const deadline=Date.now()+2000;while(!check()){if(Date.now()>deadline)throw new Error('Demo update did not finish');await pause();}}
async function load(languages,stored){
 const errors=[];
 const console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM('<html><head></head><body><div id="root"></div></body></html>',{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:console});
 Object.defineProperty(dom.window.navigator,'languages',{value:languages});
 Object.defineProperty(dom.window.navigator,'language',{value:languages[0]??'en'});
 if(stored)dom.window.localStorage.setItem('chuvash-ornaments.language',stored);
 dom.window.eval(bundle);
 await waitFor(()=>dom.window.document.documentElement.lang&&dom.window.document.querySelector('[data-testid=example-code]'));
 return{dom,doc:dom.window.document,errors};
}
function change(dom,element,value){element.value=value;element.dispatchEvent(new dom.window.Event('change',{bubbles:true}));}

test('the published collection download contains the full horizontal image and uses a relative Pages path',async()=>{
 const {dom,doc}=await load(['ru-RU']);
 try{
  const link=doc.querySelector('[data-testid=collection-download]');
  assert.equal(link.getAttribute('href'),'./collection-16.png');
  assert.equal(link.getAttribute('download'),'chuvash-16-patterns.png');
  const png=readFileSync(new URL('../demo-dist/collection-16.png',import.meta.url));
  assert.equal(png.readUInt32BE(16),4800);assert.equal(png.readUInt32BE(20),2700);
  assert.deepEqual(png,readFileSync(new URL('../docs/brocade-review/all-sixteen-horizontal.png',import.meta.url)));
  assert.equal(doc.querySelector('.preview article'),null);
  const layouts=doc.querySelector('[data-testid=layouts-download]');
  assert.equal(layouts.getAttribute('href'),'./collection-layouts.png');
  const newPng=readFileSync(new URL('../demo-dist/collection-layouts.png',import.meta.url));
  assert.equal(newPng.readUInt32BE(16),3600);assert.equal(newPng.readUInt32BE(20),2200);
 }finally{dom.window.close();}
});

const groups={
 frame:['keske-treasure-frame','horn-gate-frame','heart-diadem-frame','ceremonial-frame','lozenge-frame','book-frame','border','corners'],
 band:['embroidered-treasury','horn-lace','braided-hearts','double-horn','scarlet-lattice','heirloom-chain','stitch-ribbon','nested-chevrons','stepped-scrolls','diagonal-scrolls','forked-frieze','lozenge-ligature','toothed-diamonds','horn-band','comb-band','hooked-meander','hatched-diamonds','diamond-ribbon','stepped-frieze','paired-birds','keske-lace','sun-weave','tree-procession','band'],
 headpiece:['sovereign-headpiece','procession-headpiece','heart-canopy-headpiece','regal-headpiece','winged-headpiece','panel-headpiece','ceremonial-tree'],tailpiece:['imperial-keske','eightfold-brooch','heart-tapestry','keske-crown','heart-knot','sun-chamber','keske-signet','branch-medallion','comb-rosette','hooked-rosette','motif'],divider:['sun-needle-divider','wing-knot-divider','triple-keske-divider','divider'],background:['lozenge-net','keske-field','stepped-carpet','woven-lattice','cross-stitch','tile'],
};
async function choose(dom,doc,id){
 const category=Object.keys(groups).find(key=>groups[key].includes(id));assert(category,id);
 doc.querySelector(`[data-category="${category}"]`).click();
 await waitFor(()=>doc.querySelector(`[data-design="${id}"]`));
 doc.querySelector(`[data-design="${id}"]`).click();
 await waitFor(()=>doc.querySelector(`[data-design="${id}"][aria-pressed=true]`));
}

test('built demo starts in the system language, keeps code visible, and removes menus/tabs',async()=>{
 for(const [languages,expected] of [[['ru-RU'],'ru'],[['en-US'],'en'],[['fr-FR'],'en']]){
  const{dom,doc,errors}=await load(languages);
  try{
   assert.equal(doc.documentElement.lang,expected);
   assert.equal(doc.querySelectorAll('nav,[role=tablist],details').length,0);
   assert(doc.querySelector('[data-testid=example-code]').textContent.includes('generateComposition'));
   assert.equal(doc.querySelectorAll('.category-picker button').length,6);
   assert.equal(doc.querySelector('.design-select'),null);
   assert.equal(doc.querySelector('.preview-heading'),null);
   assert.equal(doc.querySelectorAll('.controls-column .composition-grid button').length,8);
   for(const button of doc.querySelectorAll('.composition-grid button')){assert.equal(button.textContent.trim(),'');assert(button.getAttribute('aria-label'));}
   assert.equal(doc.querySelectorAll('.gallery,#catalog').length,0);
   assert.deepEqual(errors,[]);
  }finally{dom.window.close();}
 }
});

test('language switch updates labels, html lang and persistence; system mode restores browser language',async()=>{
 const{dom,doc,errors}=await load(['ru-RU']);
 try{
  const select=doc.querySelector('.language select');
  change(dom,select,'en');await pause();
  assert.equal(doc.documentElement.lang,'en');
  assert.equal(doc.querySelector('h1').textContent,'Chuvash ornaments');
  assert.equal(dom.window.localStorage.getItem('chuvash-ornaments.language'),'en');
  assert.equal(doc.querySelector('.code-heading h2').textContent,'Code');
  change(dom,select,'system');await pause();
  assert.equal(doc.documentElement.lang,'ru');
  assert.equal(dom.window.localStorage.getItem('chuvash-ornaments.language'),null);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
 const restored=await load(['en-US'],'ru');
 assert.equal(restored.doc.documentElement.lang,'ru');restored.dom.window.close();
});

test('all basic layouts and new compositions update the actual SVG and visible example code',async()=>{
 const{dom,doc,errors}=await load(['en-US']);
 try{
  const seen=new Set();
  for(const[category,ids]of Object.entries(groups)){
   doc.querySelector(`[data-category="${category}"]`).click();
   await waitFor(()=>doc.querySelector(`[data-category="${category}"][aria-pressed=true]`));
   assert.deepEqual([...doc.querySelectorAll('.composition-grid button')].map(b=>b.dataset.design).sort(),[...ids].sort());
   for(const id of ids){
    await choose(dom,doc,id);seen.add(id);
    assert.equal(doc.querySelector('.composition-grid button[aria-pressed=true]').dataset.design,id);
    assert(doc.querySelector('.preview svg,.preview [data-testid=tile-grid]'),id);
    assert(doc.querySelector('[data-testid=example-code]').textContent.includes('@daniilak/chuvash-ornaments'));
    assert(!doc.body.textContent.includes('undefined'),id);
   }
  }
  assert.equal(seen.size,60);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});


test('settings follow the selected drawing and fill opacity is displayed as a percentage',async()=>{
 const{dom,doc,errors}=await load(['en-US']);
 try{
  const opacity=doc.querySelector('input[aria-label="Fill opacity"]');
  assert(opacity);assert.equal(Number(opacity.value),1);
  assert.match(opacity.closest('label').querySelector('output').textContent,/100.*%/);
  assert.equal(doc.querySelector('input[aria-label="Variation"]'),null);
  assert.equal(doc.querySelector('input[aria-label="Count"]'),null);
  await choose(dom,doc,'ceremonial-tree');await pause();
  assert.equal(doc.querySelector('input[aria-label="Fill opacity"]'),null);
  assert.equal(doc.querySelector('input[type=checkbox]'),null);
  await choose(dom,doc,'hatched-diamonds');await pause();
  assert(doc.querySelector('input[aria-label="Variation"]'));
  const hatch=doc.querySelector('input[aria-label="Hatching"]');assert(hatch);assert.equal(hatch.checked,true);
  assert.equal(doc.querySelector('input[aria-label="Fill opacity"]'),null);
  await choose(dom,doc,'comb-rosette');await pause();
  assert.equal(doc.querySelector('input[aria-label="Spacing"]'),null);
  assert.equal(doc.querySelector('input[aria-label="Line width"]'),null);
  const outline=doc.querySelector('input[aria-label="Outline only"]');assert(outline);
  outline.click();await pause();
  assert(doc.querySelector('input[aria-label="Line width"]'));
  assert.equal(doc.querySelector('input[aria-label="Fill opacity"]'),null);
  assert(doc.querySelector('[data-testid=example-code]').textContent.includes('"fill": false'));
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('in-context examples follow the ornament role, with real localized text',async()=>{
 const{dom,doc,errors}=await load(['en-US']);
 try{
  assert.equal(doc.querySelector('.preview-mode button[aria-pressed=true]').textContent,'Specimen');
  assert.equal(doc.querySelector('.preview article'),null);
  [...doc.querySelectorAll('.preview-mode button')].find(b=>b.textContent==='In context').click();await waitFor(()=>doc.querySelector('[data-context]'));
  for(const[design,role]of[['lozenge-ligature','band'],['ceremonial-tree','headpiece'],['branch-medallion','tailpiece'],['divider','divider'],['sun-needle-divider','divider'],['triple-keske-divider','divider'],['sovereign-headpiece','headpiece'],['horn-gate-frame','frame'],['lozenge-frame','frame'],['tile','background']]){
   await choose(dom,doc,design);await waitFor(()=>doc.querySelector('[data-context]')?.dataset.context===role);
   const page=doc.querySelector('[data-context]');
   assert(page.querySelector('h2'));assert(page.querySelector('p:not(.context-chapter)').textContent.length>30);
   const art=page.querySelector('.context-ornament');
   if(role==='band'||role==='divider'){assert.equal(art.previousElementSibling.tagName,'P');assert.equal(art.nextElementSibling.tagName,'P');}
   if(role==='headpiece')assert.equal(page.firstElementChild,art);
   if(role==='tailpiece')assert.equal(page.lastElementChild,art);
   if(role==='frame'){assert(page.querySelector('.framed-copy'));assert.match(page.textContent,/The quiet shore/);}
   if(role==='background'){assert(page.style.backgroundImage.includes('image/svg+xml'));assert(page.querySelector('.context-paper'));}
  }
  change(dom,doc.querySelector('.language select'),'ru');await waitFor(()=>doc.documentElement.lang==='ru');
  assert.match(doc.querySelector('[data-context]').textContent,/Записная книжка/);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('switching to a clean specimen preserves the selected SVG, parameters and visible code',async()=>{
 const{dom,doc,errors}=await load(['en-US']);
 try{
  for(const design of ['horn-band','ceremonial-tree','branch-medallion','lozenge-frame']){
   await choose(dom,doc,design);await pause();
   const svg=doc.querySelector('.preview svg').outerHTML,code=doc.querySelector('[data-testid=example-code]').textContent;
   [...doc.querySelectorAll('.preview-mode button')].find(b=>b.textContent==='Specimen').click();
   await waitFor(()=>!doc.querySelector('[data-context]'));
   assert.equal(doc.querySelector('.preview svg').outerHTML,svg);
   assert.equal(doc.querySelector('.preview article'),null);
   assert.equal(doc.querySelector('[data-testid=example-code]').textContent,code);
   [...doc.querySelectorAll('.preview-mode button')].find(b=>b.textContent==='In context').click();await waitFor(()=>doc.querySelector('[data-context]'));
  }
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('background choices apply a repeating field and scaling changes CSS without changing the SVG',async()=>{
 const{dom,doc,errors}=await load(['en-US']);
 try{
  [...doc.querySelectorAll('.preview-mode button')].find(b=>b.textContent==='In context').click();await pause();
  for(const id of groups.background){
   await choose(dom,doc,id);
   assert(doc.querySelector('[data-context=background]'));
   const code=doc.querySelector('[data-testid=example-code]').textContent;
   assert(code.includes("backgroundRepeat = 'repeat'"));
   assert(code.includes("backgroundSize = '120px 120px'"));
   if(id!=='tile'){assert(code.includes('generateBackground'));assert.equal(doc.querySelector('.motif-select'),null);assert.equal(doc.querySelector('input[aria-label="Spacing"]'),null);}
  }
  await choose(dom,doc,'lozenge-net');
  const before=doc.querySelector('[data-context=background]').style.backgroundImage;
  const range=doc.querySelector('input[aria-label="Background scale"]');
  Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(range,'125');
  range.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  await waitFor(()=>doc.querySelector('[data-context=background]').style.backgroundSize==='200px 200px');
  assert.equal(doc.querySelector('[data-context=background]').style.backgroundImage,before);
  assert(doc.querySelector('[data-testid=example-code]').textContent.includes("backgroundSize = '200px 200px'"));
  doc.querySelector('.preview-mode button[aria-pressed=false]').click();await waitFor(()=>doc.querySelector('.background-specimen'));
  assert.equal(doc.querySelector('.background-specimen').style.backgroundImage,before);
  assert.equal(doc.querySelector('.background-specimen').style.backgroundSize,'200px 200px');
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});


test('new book studies expose a second ink only where it applies and export complete settings',async()=>{
 const{dom,doc,errors}=await load(['en-US']);
 try{
  for(const id of ['stitch-ribbon','nested-chevrons','stepped-scrolls','diagonal-scrolls','forked-frieze','panel-headpiece']){
   await choose(dom,doc,id);
   const code=doc.querySelector('[data-testid=example-code]').textContent;
   assert(code.includes('"compositionVersion": '+(['stepped-scrolls','diagonal-scrolls'].includes(id)?4:5)));
   const second=doc.querySelector('input[aria-label="Second ink"]');
   assert.equal(!!second,id!=='stitch-ribbon');
   if(second){assert(code.includes('"accentColor"'));assert(doc.querySelector('.preview svg').outerHTML.includes(second.value));}
   for(const button of doc.querySelectorAll('.composition-grid button'))assert.equal(button.textContent.trim(),'');
  }
  assert.equal(doc.querySelector('input[aria-label="Spacing"]'),null);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('Chuvash works automatically, persists manual choice and localizes every category and book example',async()=>{
 const auto=await load(['cv-RU','ru-RU']);
 assert.equal(auto.doc.documentElement.lang,'cv');
 assert.equal(auto.doc.querySelector('h1').textContent,'Чӑваш тӗррисем');
 auto.dom.window.close();
 const{dom,doc,errors}=await load(['ru-RU']);
 try{
  const select=doc.querySelector('.language select');
  assert.equal(select.querySelector('option[value=cv]').textContent,'Чӑвашла');
  change(dom,select,'cv');await waitFor(()=>doc.documentElement.lang==='cv');
  assert.equal(doc.title,'Чӑваш тӗррисем');
  assert.equal(dom.window.localStorage.getItem('chuvash-ornaments.language'),'cv');
  assert.equal(doc.querySelector('.code-heading h2').textContent,'Код');
  assert(doc.querySelector('button').textContent.includes('Рамкӑсем'));
  doc.querySelector('.preview-mode button[aria-pressed=false]').click();await waitFor(()=>doc.querySelector('[data-context]'));
  const seen=new Set();
  for(const id of Object.values(groups).flat()){
   await choose(dom,doc,id);seen.add(id);
   for(const b of doc.querySelectorAll('.composition-grid button')){
    assert(b.getAttribute('aria-label')?.trim(),id);assert.equal(b.textContent.trim(),'');
   }
   const context=doc.querySelector('[data-context]');assert(context,id);
   assert(/[ӑӗҫӳ]/.test(context.textContent),id);
   assert(!doc.body.textContent.includes('undefined'),id);
  }
  assert.equal(seen.size,60);
  await choose(dom,doc,'motif');
  const motif=doc.querySelector('.motif-select select');assert.equal(motif.options.length,16);
  assert(motif.textContent.includes('Чӗре'));assert(motif.textContent.includes('Йывӑҫ'));
  change(dom,select,'system');await waitFor(()=>doc.documentElement.lang==='ru');
  assert.equal(dom.window.localStorage.getItem('chuvash-ornaments.language'),null);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
 const restored=await load(['en-US'],'cv');
 assert.equal(restored.doc.documentElement.lang,'cv');restored.dom.window.close();
});
