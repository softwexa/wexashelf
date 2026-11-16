/** Auth/session-only regression. Use an explicitly isolated installed QA site; never a real owner account. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {chromium,expect} from '@playwright/test';
const [input,output]=process.argv.slice(2), password=process.env.ADMIN_E2E_PASSWORD;
if(!input||!password||!['127.0.0.1','localhost'].includes(new URL(input).hostname))throw Error('Usage: ADMIN_E2E_PASSWORD=<synthetic-password> node php/tests/admin-http.mjs http://127.0.0.1:PORT[/subdir] [receipt.json]');
const base=input.replace(/\/$/,''),prefix=new URL(base).pathname.replace(/\/$/,''),checks=[];
const anonymous=await fetch(base+'/admin');assert.equal(anonymous.status,200);assert.match(anonymous.headers.get('cache-control')||'',/private/);assert.match(anonymous.headers.get('cache-control')||'',/no-store/);assert.match(anonymous.headers.get('x-robots-tag')||'',/noindex/);assert.match(anonymous.headers.get('x-robots-tag')||'',/nofollow/);
const html=await anonymous.text();assert.match(html,/class="admin-document"/);assert.doesNotMatch(html,/class="app-shell"|<footer|application\/ld\+json|assets\/app\.js|assets\/vitals\.js/);
const payload=JSON.parse(html.match(/<script id="wexa-bootstrap" type="application\/json">(.*?)<\/script>/s)?.[1]||'null');assert.ok(payload);assert.equal(payload.admin,true);assert.equal(payload.basePath,prefix);assert.equal(payload.locale,'en');assert.equal(Object.hasOwn(payload,'catalog'),false);checks.push('standalone HTML, minimal bootstrap, noindex and private no-store');
const alias=await fetch(base+'/yonetim?qa=admin-shell&tab=content',{redirect:'manual'});assert.equal(alias.status,301);assert.equal(alias.headers.get('location'),prefix+'/admin?qa=admin-shell&tab=content');checks.push('legacy301 preserves installation prefix and query');
for(const path of ['/api/admin','/api/admin/seo','/api/admin/ai','/api/admin/translations','/api/admin/source-providers'])assert.equal((await fetch(base+path)).status,401,path);checks.push('anonymous protected APIs reject with401');
const browser=await chromium.launch();const errors=[],adminRequests=[];
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',request=>{if(new URL(request.url()).pathname.startsWith(prefix+'/api/'))adminRequests.push(new URL(request.url()).pathname);});
 await page.goto(base+'/admin');await expect(page.getByRole('heading',{name:'Administration',exact:true})).toBeVisible();await expect(page.getByLabel('Administrator password',{exact:true})).toBeVisible();
 await expect(page.locator('.app-shell, .site-header, .site-footer, .search-hero, .atlas-search, footer')).toHaveCount(0);assert.deepEqual([...new Set(adminRequests)],[prefix+'/api/admin/session']);checks.push('English login renders without public chrome or prelogin catalog fetch');
 await page.getByLabel('Administrator password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'You control the content.',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Content',exact:true}).click();await expect(page.getByRole('button',{name:'New App',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Account security',exact:true}).click();await expect(page.getByRole('heading',{name:'Account security',exact:true})).toBeVisible();checks.push('English login, content navigation and security panel');
 await page.getByRole('combobox',{name:'Admin language',exact:true}).selectOption('tr');await expect(page.locator('html')).toHaveAttribute('lang','tr');await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','tr');await expect(page.getByRole('button',{name:'Hesap güvenliği',exact:true})).toBeVisible();await expect(page.getByRole('combobox',{name:'Yönetim dili',exact:true})).toHaveValue('tr');checks.push('Turkish preference and document language persist after reload');
 await page.getByRole('button',{name:'Çıkış',exact:true}).click();await expect(page.getByRole('heading',{name:'Yönetim alanı',exact:true})).toBeVisible();assert.equal((await page.request.get(base+'/api/admin')).status(),401);await expect(page.locator('footer,.app-shell')).toHaveCount(0);checks.push('logout returns standalone translated login and revokes API access');
 assert.deepEqual(errors,[]);
 const receipt={at:new Date().toISOString(),base,checks,errors,scope:'Isolated HTTP/browser administrative shell and session regression; no content writes, publication or provider calls.'};if(output){await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(receipt,null,2)+'\n');}console.log(JSON.stringify(receipt,null,2));
}finally{await browser.close();}
