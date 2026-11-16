import test from 'node:test';
import assert from 'node:assert/strict';
import { localizedUrl,internalPathname,unavailableLocalizedRecord } from './i18n-routing';
import { translate } from './i18n';
import { localeContent } from './i18n-content';
import { GUIDES,WORKFLOWS } from './catalog';
test('locale URLs use only declared equivalents and preserve base/query/hash',()=>{const paths={'/':'/en','/kesfet':'/en/apps','/uygulama/stable-id':'/en/apps/translated-name'};assert.equal(localizedUrl('/uygulama/stable-id?q=a%20b#details','/catalog',paths),'/catalog/en/apps/translated-name?q=a%20b#details');assert.equal(localizedUrl('/catalog/en/apps?q=x','/catalog',paths),'/catalog/en/apps?q=x');assert.equal(localizedUrl('/unknown','/catalog',paths),'/catalog/unknown');assert.equal(localizedUrl('/api/feedback','/catalog',paths),'/catalog/api/feedback');assert.equal(localizedUrl('https://example.org/path','/catalog',paths),'https://example.org/path');assert.equal(localizedUrl('//example.org/path','/catalog',paths),'//example.org/path');assert.equal(internalPathname('/catalog/en/apps/translated-name','/catalog',paths),'/uygulama/stable-id');});
test('encoded Unicode and space tag links keep their declared locale without treating encoded separators as routes',()=>{
 const paths={'/etiket/açık kaynak':'/en/tags/open-source','/etiket/local files':'/en/tags/local-files','/yayinci/acme':'/en/publishers/acme','/etiket/x/y':'/en/tags/not-allowed'};
 assert.equal(localizedUrl('/catalog/etiket/a%C3%A7%C4%B1k%20kaynak?sort=name#apps','/catalog',paths),'/catalog/en/tags/open-source?sort=name#apps');
 assert.equal(localizedUrl('/etiket/local%20files','',paths),'/en/tags/local-files');
 assert.equal(localizedUrl('/yayinci/acme','',paths),'/en/publishers/acme');
 assert.equal(localizedUrl('/etiket/x%2Fy','',paths),'/etiket/x%2Fy');
 assert.equal(localizedUrl('/etiket/%invalid','',paths),'/etiket/%invalid');
});
test('optional static slugs and tag taxonomy keep legacy packs valid and reject collisions or identity changes',async()=>{
 const {localeRegistry,validateStaticContent}=await import('./i18n-registry');
 const legacy=structuredClone(localeRegistry.en.content);delete legacy.tags;for(const group of ['categories','guides','workflows'] as const)for(const entry of legacy[group])delete entry.slug;
 assert.deepEqual(validateStaticContent(legacy),[]);
 const collision=structuredClone(localeRegistry.tr.content);collision.categories[1].slug=collision.categories[2].slug;assert.ok(validateStaticContent(collision).some(issue=>issue.includes('collision')));
 const unsafe=structuredClone(localeRegistry.en.content);unsafe.guides[0].slug='../admin';assert.ok(validateStaticContent(unsafe).some(issue=>issue.includes('Unsafe static slug')));
 const identity=structuredClone(localeRegistry.en.content);identity.tags![0].id='invented';assert.ok(validateStaticContent(identity).some(issue=>issue.includes('Stable identity changed')));
});
test('explicit UI translations preserve original locale and unregistered content',()=>{assert.equal(translate('tr','Karşılaştır'),'Karşılaştır');assert.equal(translate('en','Karşılaştır'),'Compare');assert.equal(translate('en','{name} uygulamaları',{name:'Notes'}),'Notes apps');assert.equal(translate('en','Customer authored note'),'Customer authored note');assert.equal(translate('en','android: katalogda yerel sürüm desteği yok.'),'android: no native version support in the catalog.');});
test('authored English guides and workflows preserve stable references and Turkish originals',()=>{const en=localeContent('en');assert.deepEqual(en.guides.map(g=>({id:g.id,appIds:g.appIds,kind:g.kind})),GUIDES.map(g=>({id:g.id,appIds:g.appIds,kind:g.kind})));assert.deepEqual(en.workflows.map(w=>({id:w.id,apps:w.steps.map(s=>s.appId)})),WORKFLOWS.map(w=>({id:w.id,apps:w.steps.map(s=>s.appId)})));assert.deepEqual(localeContent('tr').guides.map(guide=>{const copy={...guide} as typeof guide & {slug?:string};delete copy.slug;return copy;}),GUIDES);assert.equal(en.guides[0].title,'A new home for your notes');assert.equal(en.categories.find(c=>c.id==='notes')?.label,'Notes');});

test("Locale links cannot silently fall back to untranslated managed records",()=>{assert.equal(unavailableLocalizedRecord("/uygulama/untranslated","en",{}),true);assert.equal(unavailableLocalizedRecord("/uygulama/untranslated","tr",{}),true);assert.equal(unavailableLocalizedRecord("/uygulama/stable","en",{"/uygulama/stable":"/en/apps/name"}),false);assert.equal(unavailableLocalizedRecord("/api/feedback","en",{}),false);});

test('registered packs use English fallback and reject missing keys, placeholders and changed identities',async()=>{
 const {localeRegistry,getLocalePack,sourceMessageKeys,validateLocalePack,validateStaticContent}=await import('./i18n-registry');
 assert.equal(getLocalePack().locale,'en');assert.equal(getLocalePack('unknown').locale,'en');assert.equal(getLocalePack('tr').locale,'tr');
 const bad=structuredClone(localeRegistry.en);delete bad.messages[sourceMessageKeys['Karşılaştır']];assert.ok(validateLocalePack(bad).some(issue=>issue.includes('Missing message')));
 const placeholders=structuredClone(localeRegistry.tr);placeholders.messages[sourceMessageKeys['{name} uygulamaları']]='Apps';assert.ok(validateLocalePack(placeholders).some(issue=>issue.includes('Placeholder mismatch')));
 const changed=structuredClone(localeRegistry.en.content);changed.guides[0].id='different';assert.ok(validateStaticContent(changed).some(issue=>issue.includes('Stable identity changed')));
 const third={...structuredClone(localeRegistry.en),locale:'xx',label:'Test pack',intlLocale:'es-ES'};third.messages[sourceMessageKeys['Keşfet']]='Explorar';localeRegistry.xx=third;
 try{assert.equal(translate('xx','Keşfet'),'Explorar');assert.equal(getLocalePack('xx').intlLocale,'es-ES');}finally{delete localeRegistry.xx;}
});
test('authored starter overlay covers 17 records without source mutation and fails closed on changed prose',async()=>{
 const {readFile}=await import('node:fs/promises');const {buildEnglishSeedTranslations}=await import('../../php/client/english-seed');
 const seed=JSON.parse(await readFile(new URL('../../php/resources/seed.json',import.meta.url),'utf8'));const before=JSON.stringify(seed.records);const overlays=buildEnglishSeedTranslations(seed.records);
 assert.equal(overlays.length,17);assert.equal(overlays.reduce((count,row)=>count+Object.keys(row.fields).length,0),210);assert.equal(JSON.stringify(seed.records),before);
 for(const row of overlays){assert.equal(row.locale,'en');assert.ok(Object.values(row.fields).every(value=>value.trim().length>0));assert.ok(!Object.keys(row.fields).some(key=>/sourceUrl|website|monthlyPrice|annualPrice|^id$/.test(key)));}
 seed.records[0].data.tagline='New unreviewed source text';assert.throws(()=>buildEnglishSeedTranslations(seed.records),/requires review/);
});

test('server locale resources require all stable messages/routes and safe route segments',async()=>{const {localeRegistry,validateServerMessages}=await import('./i18n-registry');assert.deepEqual(validateServerMessages(localeRegistry.en.serverMessages),[]);assert.deepEqual(validateServerMessages(localeRegistry.tr.serverMessages),[]);const bad=structuredClone(localeRegistry.en.serverMessages);delete bad.messages.homeTitle;bad.routes.kesfet='../admin';assert.ok(validateServerMessages(bad).some(issue=>issue.includes('homeTitle')));assert.ok(validateServerMessages(bad).some(issue=>issue.includes('Unsafe route')));});

test('admission explanations translate static labels while preserving recorded values and authored exceptions',()=>{assert.equal(translate('en','Mağaza kabul eşikleri henüz yapılandırılmadı.'),'Store admission thresholds have not been configured yet.');assert.equal(translate('en','Android indirme alt sınırı 10000; TR eşiği 5000 karşılandı.'),'Android download lower bound 10000; the TR threshold of 5000 is met.');assert.equal(translate('en','iOS değerlendirme sayısı: bu platformda kayıt yok.'),'iOS rating count: no record for this platform.');assert.equal(translate('en','Editoryal istisna: Authored exception'),'Editorial exception: Authored exception');});

test('runtime language packages register atomically without build and reject built-in replacement or incomplete fields',async()=>{const {localeRegistry,registerRuntimeLocalePacks,supportedLocales}=await import('./i18n-registry');const make=(locale:string)=>{const base=structuredClone(localeRegistry.en);return {schemaVersion:1 as const,locale,ui:{schemaVersion:1,locale,label:'Synthetic language',intlLocale:'de-DE',direction:'ltr',messages:base.messages},content:base.content,server:base.serverMessages};};const good=make('de');try{const bad=make('fr');delete bad.ui.messages[Object.keys(bad.ui.messages)[0]];assert.ok(registerRuntimeLocalePacks([good,bad]).length>0);assert.equal(localeRegistry.de,undefined);assert.deepEqual(registerRuntimeLocalePacks([good]),[]);assert.equal(translate('de','Karşılaştır'),'Compare');assert.ok(supportedLocales.some(item=>item.code==='de'));assert.ok(registerRuntimeLocalePacks([make('en')]).some(issue=>issue.includes('Built-in')));assert.ok(registerRuntimeLocalePacks({de:good}).length>0);}finally{delete localeRegistry.de;delete localeRegistry.fr;supportedLocales.splice(0,supportedLocales.length,...Object.values(localeRegistry).map(({locale,label,intlLocale,direction})=>({code:locale,label,intlLocale,direction})));}});
