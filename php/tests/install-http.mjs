/** Destructive only to the explicitly supplied EMPTY QA database. Run against a fresh local install. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const [base, databaseFile, keyFile] = process.argv.slice(2);
if (!base || !databaseFile || !keyFile || !['127.0.0.1','localhost'].includes(new URL(base).hostname)) throw Error('Usage: node php/tests/install-http.mjs http://127.0.0.1:PORT[/subdir] private-database.json private-install.key');
const origin=new URL(base).origin;
const db=JSON.parse(await readFile(databaseFile,'utf8'));
const key=(await readFile(keyFile,'utf8')).trim();
const password='Local-E2E-Only-2026-Synthetic';
assert.equal((await fetch(base+'/api/health')).status,503,'refuse installed target');
const form=await fetch(base+'/install');assert.equal(form.status,200);
const cookie=form.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie);
const html=await form.text();const csrf=html.match(/name="csrf" value="([^"]+)"/)?.[1];assert.ok(csrf);
const values={setup_key:key,csrf,site_url:base,db_host:db.host,db_port:String(db.port),db_name:db.name,db_user:db.user,db_password:db.password,admin_password:password,admin_password_confirm:password};
async function submit(patch={}, from=origin){return fetch(base+'/install',{method:'POST',redirect:'manual',headers:{cookie,Origin:from,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({...values,...patch})});}
for(const [label,patch,expected,from] of [
 ['wrong key',{setup_key:'invalid-key'},403],['wrong CSRF',{csrf:'invalid'},403],['wrong origin',{},403,'https://invalid.example'],['weak password',{admin_password:'short',admin_password_confirm:'short'},400],['wrong subdirectory',{site_url:origin+'/incorrect-location'},400],['invalid DB host',{db_host:'localhost;dbname=unexpected'},400]]) {
 assert.equal((await submit(patch,from)).status,expected,label);console.log('PASS',label);
}
const installed=await submit();assert.equal(installed.status,303);assert.equal(installed.headers.get('location'),new URL(base).pathname.replace(/\/$/,'')+'/admin');
assert.equal((await fetch(base+'/install')).status,409);assert.equal((await submit()).status,409);console.log('PASS fresh installation and reinstall lock');
assert.equal((await fetch(base+'/api/health')).status,200);
assert.equal((await fetch(base+'/api/admin')).status,401);
for(const p of ['/storage/config.php','/storage/install.key','/resources/seed.json','/app/bootstrap.php','/.htaccess']) assert.ok([403,404].includes((await fetch(base+p)).status),p+' inaccessible');
const login=await fetch(base+'/api/admin/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({password})});assert.equal(login.status,200);const sessionCookie=login.headers.get('set-cookie');assert.ok(sessionCookie.includes('HttpOnly')||sessionCookie.includes('httponly'));assert.ok(sessionCookie.toLowerCase().includes('samesite=strict'));assert.ok(sessionCookie.includes('path='+new URL(base).pathname.replace(/\/$/,'')+'/'));
console.log('PASS health, protected paths, authentication and subdirectory cookie');
