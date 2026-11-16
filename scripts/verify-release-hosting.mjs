// Local synthetic installed-runtime checks; never accepts a remote hostname.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const [base,privateFixture,output]=process.argv.slice(2);
assert.ok(base&&privateFixture&&output,'Usage: node scripts/verify-release-hosting.mjs http://127.0.0.1:PORT PRIVATE_FIXTURE OUTPUT');
const url=new URL(base);assert.equal(url.hostname,'127.0.0.1');assert.equal(url.protocol,'http:');
const fixture=JSON.parse(await readFile(privateFixture,'utf8'));const checks=[];
const check=(value,name)=>{assert.ok(value,name);checks.push(name);};
const get=(path,options={})=>fetch(base.replace(/\/$/,'')+path,{redirect:'manual',...options});
const prefix=url.pathname.replace(/\/$/,'');
const home=await get('/');check(home.status===302&&home.headers.get('location')===prefix+'/en','English default redirect');
for(const locale of ['en','tr']){const r=await get('/'+locale);const html=await r.text();check(r.status===200&&html.includes(`lang="${locale}"`),locale+' SSR locale');check(html.includes('noindex'),locale+' fresh-install noindex');}
for(const path of ['/assets/app.js','/assets/app.css','/assets/admin.js','/assets/admin.css','/assets/favicon.svg'])check((await get(path)).status===200,'Asset '+path);
check((await get('/api/admin')).status===401,'Anonymous admin denied');
for(const path of ['/storage/config.php','/storage/install.key','/app/bootstrap.php','/resources/seed.json','/cli/worker.php','/cli/account-recovery.php','/cli/backup-restore.php','/.github/PULL_REQUEST_TEMPLATE.md','/examples/community-module/verify.php'])check([403,404].includes((await get(path)).status),'Private path denied '+path);
const login=await get('/api/admin/login',{method:'POST',headers:{Origin:url.origin,'Content-Type':'application/json'},body:JSON.stringify({password:fixture.adminPassword})});check(login.status===200,'Synthetic owner login');const cookie=login.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie);
for(const path of ['/api/admin/security','/api/admin/ai','/api/admin/upgrade']){const response=await get(path,{headers:{Cookie:cookie}});check(response.status===200,'Owner state '+path);if(path.endsWith('/ai')){const data=await response.json();check(data.providers.length===0&&data.jobs.length===0,'No provider credentials or automatic AI jobs');}}
await writeFile(output,JSON.stringify({checkedAt:new Date().toISOString(),base,passed:true,checks,limits:'Local synthetic Apache hosting smoke only. Does not establish upgrade, backup restoration, production cron activation or paid provider readiness.'},null,2)+'\n');
console.log(`PASS ${checks.length} local hosting checks`);
