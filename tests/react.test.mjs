import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { renderToString } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { Motif, Ornament, Framed, PatternBackground } from '../dist/react.js';
import { createRoot, hydrateRoot } from 'react-dom/client';
const h=React.createElement;

test('React SSR works without browser globals; accessible/decorative SVG and CSS background', () => {
  assert.equal(typeof window,'undefined');
  const markup=renderToString(h('main',null,
    h(Motif,{motif:'tsvetok',title:'Цветок',className:'flower',style:{width:100}}),
    h(Ornament,{motif:'serdtse',seed:42}),
    h(PatternBackground,{motif:'snezhinka1'},'Text'),
    h(Framed,{motif:'tree',seed:7,color:'#8b1a1a',size:32},h('p',null,'Content'))));
  const dom=new JSDOM(markup),doc=dom.window.document;
  assert.equal(doc.querySelectorAll('svg').length,2);
  assert.equal(doc.querySelector('svg[role=img]').getAttribute('aria-label'),'Цветок');
  assert.equal(doc.querySelectorAll('svg[aria-hidden=true]').length,1);
  assert.equal(doc.querySelector('.flower').style.width,'100px');
  assert(markup.includes('data:image/svg+xml'));
  assert(markup.includes('padding:38.4px'));
  assert(!markup.includes('suppressHydrationWarning'));
});

test('hydration has identical initial markup; ResizeObserver rebuilds frame without changing padding', async () => {
  const ui=h('section',null,h(Motif,{motif:'kuritsa_fill',seed:42}),h(Framed,{id:'box',motif:'snezhinka1',size:32},h('article',null,'Content')));
  const html=renderToString(ui);
  const dom=new JSDOM(`<div id="root">${html}</div>`,{pretendToBeVisual:true});
  const saved={};
  for(const key of ['window','document','HTMLElement','ResizeObserver','IS_REACT_ACT_ENVIRONMENT']) saved[key]=Object.getOwnPropertyDescriptor(globalThis,key);
  globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.HTMLElement=dom.window.HTMLElement;
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  let callback, disconnected=0, w=400, ht=260, observations=0;
  globalThis.ResizeObserver=class {
    constructor(cb){callback=cb;}
    observe(el){observations++;assert.equal(el.id,'box');}
    disconnect(){disconnected++;}
  };
  Object.defineProperties(dom.window.HTMLElement.prototype,{clientWidth:{configurable:true,get(){return w}},clientHeight:{configurable:true,get(){return ht}}});
  const errors=[];const oldError=console.error;console.error=(...args)=>errors.push(args.join(' '));
  let root;
  try {
    await act(async()=>{root=hydrateRoot(document.getElementById('root'),ui,{onRecoverableError:e=>errors.push(String(e))});});
    const box=document.getElementById('box'),pad=box.style.padding;
    assert.equal(box.querySelector('svg').getAttribute('viewBox'),'0 0 400 260');
    const before=box.querySelectorAll('polyline').length;
    w=800;ht=400;
    await act(async()=>callback([]));
    assert.equal(box.querySelector('svg').getAttribute('viewBox'),'0 0 800 400');
    assert(box.querySelectorAll('polyline').length>before);
    assert.equal(box.style.padding,pad);
    const markup=box.innerHTML;await act(async()=>callback([]));assert.equal(box.innerHTML,markup);
    assert.equal(observations,1);assert.deepEqual(errors,[]);
    await act(async()=>root.unmount());assert.equal(disconnected,1);
  } finally {
    console.error=oldError;
    for(const [key,descriptor] of Object.entries(saved))if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];
    dom.window.close();
  }
});

test('Framed has a no-ResizeObserver fallback and forwards div props', async () => {
  const dom=new JSDOM('<div id="root"></div>');
  globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  let root;
  try {
    await act(async()=>{root=createRoot(document.getElementById('root'));root.render(h(Framed,{className:'frame','data-qa':'ok',style:{color:'navy'},color:'#8b1a1a'},'Hello'));});
    const el=document.querySelector('.frame');assert.equal(el.dataset.qa,'ok');assert.equal(el.style.color,'navy');
    assert(el.querySelector('svg'));
    await act(async()=>root.unmount());
  } finally {delete globalThis.window;delete globalThis.document;delete globalThis.IS_REACT_ACT_ENVIRONMENT;dom.window.close();}
});
