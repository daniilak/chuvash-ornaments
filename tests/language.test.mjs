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
