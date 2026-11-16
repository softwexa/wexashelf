import test,{before} from 'node:test';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
let RecordEditor:typeof import('../components/admin/RecordEditor').default;
let blankRecord:typeof import('../components/admin/RecordEditor').blankRecord;
before(async()=>{const require=createRequire(import.meta.url);const previous=require.extensions['.css'];require.extensions['.css']=module=>{module.exports={};};try{const editor=await import('../components/admin/RecordEditor');RecordEditor=editor.default;blankRecord=editor.blankRecord;}finally{if(previous)require.extensions['.css']=previous;else delete require.extensions['.css'];}});
import {LocaleProvider} from './i18n';
import type {ManagedRecord} from './domain';
const props={kind:'app' as const,busy:false,onSave:async()=>true,onDirty:()=>{},onHistory:()=>{},history:[],onRestore:()=>{}};
function render(record:ManagedRecord|null,locale='en'){return renderToStaticMarkup(createElement(LocaleProvider,{locale,children:createElement(RecordEditor,{...props,record,defaultSourceLocale:'en'})}));}
test('new editor defaults to English source while legacy record source remains immutable Turkish',()=>{const empty=render(null);const source=empty.match(/Source language<\/span><select([^>]*?)>(.*?)<\/select>/s);assert.ok(source);assert.doesNotMatch(source[1],/disabled/);assert.match(source[2],/value="en" selected=""/);const seed=JSON.parse(readFileSync(new URL('../../php/resources/seed.json',import.meta.url),'utf8'));const record=structuredClone(seed.records.find((item:ManagedRecord)=>item.kind==='app'));delete record.sourceLocale;const legacy=render(record).match(/Source language<\/span><select([^>]*?)>(.*?)<\/select>/s);assert.ok(legacy);assert.match(legacy[1],/disabled=""/);assert.match(legacy[2],/value="tr" selected=""/);assert.equal(blankRecord('app','en').pricingLabel,'Review plans');assert.equal(blankRecord('app','tr').pricingLabel,'Planları incele');});
test('admin authored editor copy uses explicit Turkish provider without changing source data',()=>{const html=render(null,'tr');assert.match(html,/Kaynak dili/);assert.match(html,/Kaydı kaydet/);assert.match(html,/value="en" selected=""/);});
