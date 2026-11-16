import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { validateData } from '../src/lib/server/validation';
import { buildMetadata, buildSitemap, canIndex } from '../src/lib/seo';
import type { AppRecord, ArticleRecord, CatalogSnapshot } from '../src/lib/domain';
const seed = JSON.parse(readFileSync(new URL('../php/resources/seed.json', import.meta.url), 'utf8'));
const app: AppRecord = seed.records.find((r: {kind:string}) => r.kind === 'app').data;
const article: ArticleRecord = seed.records.find((r: {kind:string}) => r.kind === 'article').data;
test('optional editorial metadata preserves legacy records and rejects executable or remote covers', () => {
  validateData('article', article);
  validateData('article', {...article, seo:{title:'Özel başlık',description:'Kaynaklara dayanan açıklama',noindex:true},cover:{assetId:'a'.repeat(64),alt:'Not düzenini anlatan temsili çizim',caption:'AI ile üretildi.',aiGenerated:true}});
  for(const cover of [{assetId:'../private',alt:'test',caption:'',aiGenerated:true},{assetId:'a'.repeat(64),alt:'',caption:'',aiGenerated:false}]) assert.throws(()=>validateData('article',{...article,cover}));
  assert.throws(()=>validateData('app',{...app,seo:{title:'<script>alert(1)</script>'}}));
  assert.throws(()=>validateData('article',{...article,seo:{canonical:'https://unrelated.example/'}}));
});
test('manual noindex survives approval and SEO text never replaces factual structured content', () => {
  const decorated = {...app, seo:{title:'Kaynaklı özel başlık',description:'Kaynaklı meta açıklaması',noindex:true}};
  const catalog: CatalogSnapshot={apps:[decorated],articles:[],lists:[],records:[{id:app.id,kind:'app',seoApproved:true,updatedAt:'2026-11-16T00:00:00Z'}]};
  const config={origin:'https://catalog.example.org',indexEnabled:true};
  const metadata=buildMetadata(['uygulama',app.id],catalog,{},config);
  assert.equal(metadata.title,decorated.seo.title);assert.equal(metadata.description,decorated.seo.description);
  assert.equal(canIndex(['uygulama',app.id],catalog,{},config),false);
  assert.equal(buildSitemap(catalog,config).some(r=>r.url.endsWith('/'+app.id)),false);
  assert.equal(decorated.name,app.name);
});
