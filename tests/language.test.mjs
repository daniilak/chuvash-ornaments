import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../demo/i18n.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {resolveLanguage,text}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
test('system language selection honors supported language priority and explicit user choice',()=>{
 assert.equal(resolveLanguage('system',['ru-RU','en-US']),'ru');
 assert.equal(resolveLanguage('system',['en-GB','ru-RU']),'en');
 assert.equal(resolveLanguage('system',['de-DE','ru-RU']),'ru');
 assert.equal(resolveLanguage('system',['ja-JP']),'en');
 assert.equal(resolveLanguage('system',[]),'en');
 assert.equal(resolveLanguage('en',['ru-RU']),'en');
 assert.equal(resolveLanguage('ru',['en-US']),'ru');
 assert.equal(resolveLanguage('invalid',['ru-RU']),'ru');
 assert.deepEqual(Object.keys(text.ru).sort(),Object.keys(text.en).sort());
});

test('Chuvash auto-detection, regional tags and manual preference honor language priority',()=>{
 for(const locale of ['cv','cv-RU','CV-cyrl-RU','cv_RU','chv'])assert.equal(resolveLanguage('system',[locale,'ru-RU']),'cv');
 assert.equal(resolveLanguage('system',['de-DE','cv-RU','en-US']),'cv');
 assert.equal(resolveLanguage('system',['en-US','cv-RU']),'en');
 assert.equal(resolveLanguage('cv',['ru-RU']),'cv');
 assert.equal(resolveLanguage('ru',['cv-RU']),'ru');
 const keys=value=>Object.entries(value).flatMap(([key,v])=>typeof v==='object'?keys(v).map(k=>`${key}.${k}`):[key]).sort();
 assert.deepEqual(keys(text.cv),keys(text.en));
 assert.deepEqual(keys(text.cv),keys(text.ru));
});

test('Chuvash accessible names cover every composition, background and source motif',async()=>{
 const{COMPOSITIONS,BACKGROUNDS,MOTIFS}=await import('../dist/index.js');
 const{chuvashDesignNames,chuvashBackgrounds,chuvashMotifs}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
 for(const[items,names]of [[COMPOSITIONS,chuvashDesignNames],[BACKGROUNDS,chuvashBackgrounds],[MOTIFS,chuvashMotifs]]){
  assert.deepEqual(Object.keys(names).sort(),items.map(i=>i.id).sort());
  for(const value of Object.values(names))assert.equal(typeof value,'string');
 }
});
