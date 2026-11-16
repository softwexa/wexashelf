import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ArticleContent,type InlineArticleImage} from '../src/components/discovery/ArticleContent';
import type {AppRecord} from '../src/lib/domain';
import {APPS} from '../src/lib/catalog';
Object.assign(globalThis,{React});
const id='a'.repeat(64),image:InlineArticleImage={assetId:id,format:'webp',width:640,height:480,alt:'An accessible description',caption:'A verified caption',aiGenerated:false};
const app={...APPS[0],id:'notion',name:'Localized Notion',tagline:'Localized app summary',publisher:'Publisher',tags:[],aliases:[],pricingModel:'unknown',facts:[],plans:[],storeMetrics:[]} as AppRecord;
const render=(text:string,apps:AppRecord[]=[],images:InlineArticleImage[]=[],privateMedia=false)=>renderToStaticMarkup(React.createElement(ArticleContent,{sections:[{heading:'A section',paragraphs:[text]}],apps,images,basePath:'/catalog',privateMedia}));
test('article content escapes unknown markup and surrounds app cards with plain text',()=>{
 const html=render('Before <script>alert(1)</script> [app id="notion"] after [unknown id="notion"]',[app]);
 assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(html,/Localized Notion/);assert.match(html,/Localized app summary/);assert.match(html,/href="\/uygulama\/notion"/);assert.match(html,/after \[unknown id=&quot;notion&quot;\]/);assert.match(html,/article-app-embed/);
});
test('unavailable app references never fall back to foreign or unpublished data',()=>{
 const html=render('[app id="notion"]');assert.match(html,/This app has no published record in this language\./);assert.doesNotMatch(html,/href="\/uygulama\//);assert.doesNotMatch(html,/Localized Notion/);
});
test('inline media uses verified dimensions, lazy loading and truthful disclosure',()=>{
 const html=render(`[image id="${id}"]`,[],[image]);assert.match(html,new RegExp(`/catalog/media/${id}\\.webp`));assert.match(html,/width="640" height="480" loading="lazy"/);assert.match(html,/alt="An accessible description"/);assert.match(html,/A verified caption/);assert.doesNotMatch(html,/AI-generated/);
 assert.match(render(`[image id="${id}"]`,[],[{...image,aiGenerated:true}]),/AI-generated illustrative image/);
 assert.match(render(`[image id="${id}"]`,[],[image],true),/\/api\/admin\/media\?id=/);
 assert.match(render(`[image id="${id}"]`),/This image is unavailable/);
});
