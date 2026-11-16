import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {availableContent} from '../src/lib/available-content';
import {localeContent} from '../src/lib/i18n-content';
import {APPS} from '../src/lib/catalog';
import {BUILTIN_THEMES} from '../src/lib/builtin-themes';
import {HomePage} from '../src/components/discovery/HomePage';
import {EditorialPages} from '../src/components/discovery/EditorialPages';
Object.assign(globalThis,{React});
const actions={saved:[],compare:[],onSave:()=>{},onCompare:()=>{}};
test('bundled content requires every guide and workflow app, including partial localized catalogs',()=>{
 const content=localeContent('en');
 assert.equal(availableContent(content,[]).guides.length,0);
 assert.equal(availableContent(content,[]).workflows.length,0);
 const guide=content.guides[0];
 assert.ok(!availableContent(content,guide.appIds.slice(1).map(id=>({id}))).guides.some(item=>item.id===guide.id));
 assert.ok(availableContent(content,guide.appIds.map(id=>({id}))).guides.some(item=>item.id===guide.id));
 const workflow=content.workflows[0],ids=workflow.steps.map(step=>step.appId).filter(Boolean) as string[];
 assert.ok(!availableContent(content,ids.slice(1).map(id=>({id}))).workflows.some(item=>item.id===workflow.id));
 assert.ok(availableContent(content,ids.map(id=>({id}))).workflows.some(item=>item.id===workflow.id));
});
test('all built-in empty homepages remain renderable with every module enabled and no sample detail links',()=>{
 for(const theme of BUILTIN_THEMES){const html=renderToStaticMarkup(React.createElement(HomePage,{catalog:{apps:[],articles:[],lists:[],records:[]},theme,plugins:['decision-tools','migration-guides','workflow-collections'],...actions}));assert.match(html,/There are no apps available/);assert.doesNotMatch(html,/href="\/(uygulama|rehber|is-akisi)\//);}
});
test('unavailable guide/workflow detail shows an honest state instead of bundled content',()=>{
 const content=localeContent('en');for(const path of [['rehber',content.guides[0].id],['is-akisi',content.workflows[0].id]]){const html=renderToStaticMarkup(React.createElement(EditorialPages,{path,catalog:{apps:[],articles:[],lists:[],records:[]},...actions}));assert.match(html,/This content is unavailable/);assert.doesNotMatch(html,/href="\/uygulama\//);}
});

test('complete workflow references retain the ordered preview',()=>{
 const apps=APPS.map(app=>({...app,publisher:'Publisher',tags:[],aliases:[],pricingModel:'unknown' as const,facts:[],plans:[],storeMetrics:[]}));
 const html=renderToStaticMarkup(React.createElement(HomePage,{catalog:{apps,articles:[],lists:[],records:[]},theme:BUILTIN_THEMES.find(theme=>theme.template==='workflow')!,plugins:['workflow-collections'],...actions}));
 assert.match(html,/class="workflow-preview"/);assert.match(html,/<ol>/);
});
test('missing sample apps do not hide independent authored articles or lists',()=>{
 const catalog={apps:[],records:[],articles:[{id:'independent-article',title:'Independent editorial article',sections:[]}],lists:[{id:'independent-list',title:'Independent editorial list',summary:'Authored selection',period:'week',entries:[]}]} as unknown as import('../src/lib/domain').CatalogSnapshot;
 const html=renderToStaticMarkup(React.createElement(HomePage,{catalog,theme:BUILTIN_THEMES[0],plugins:['migration-guides'],...actions}));
 assert.match(html,/href="\/blog\/independent-article"/);assert.match(html,/href="\/liste\/independent-list"/);assert.doesNotMatch(html,/href="\/(rehber|is-akisi)\//);
});
