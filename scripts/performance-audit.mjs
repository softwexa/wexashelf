import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
const root=process.cwd();
const args=process.argv.slice(2);
const assert95=args.includes('--assert95');
const serverOnly=args.includes('--server-only');
const positional=args.filter(arg=>!['--assert95','--server-only'].includes(arg));
const label=positional[0]||'baseline';
if(!/^[a-zA-Z0-9_-]+$/.test(label))throw Error('Safe report label required');
const url=positional[1]||'http://127.0.0.1:3152/';
const scores=[];
const measuredPaths=['php/public/assets/favicon.svg','php/resources/icon-assets.json','php/app/PublicSite.php','php/public/index.php','php/public/.htaccess','php/public/assets/app.js','php/public/assets/app.css','php/public/assets/artwork/night-mountains.svg'];
async function iconPaths(directory='php/public/assets/icons') {
 const entries=await readdir(path.join(root,directory),{withFileTypes:true});
 const files=[];
 for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))) {
  const file=`${directory}/${entry.name}`;
  if(entry.isDirectory())files.push(...await iconPaths(file));
  else if(entry.isFile())files.push(file);
  else throw Error(`Unexpected icon filesystem entry: ${file}`);
 }
 if(!files.length)throw Error('No served icon assets found');
 return files;
}
async function sourceHashes(){const files=[...measuredPaths,...await iconPaths()].sort();return Object.fromEntries(await Promise.all(files.map(async file=>[file,createHash('sha256').update(await readFile(path.join(root,file))).digest('hex')])));}
for (const directory of ['php/app','php/resources']) for (const name of await readdir(path.join(root,directory))) if (/\.(php|json)$/.test(name)) measuredPaths.push(`${directory}/${name}`);
async function runtimeSnapshot(){const response=await fetch(url,{redirect:'manual'});if(response.status!==200)throw Error('Audit target must be an exact HTTP200 page');const html=await response.text();const raw=html.match(/<script[^>]*id="(?:wexa-bootstrap|wexa-growth-state)"[^>]*>(.*?)<\/script>/s)?.[1];if(!raw)throw Error('Expected application bootstrap missing');const payload=JSON.parse(raw);if(serverOnly&&!payload.serverOnly)throw Error('Server-only audit target is not a recognized editorial page');return {sha256:createHash('sha256').update(raw).digest('hex'),locale:payload.locale,template:payload.catalog?.siteSettings?.theme?.template||null,records:payload.catalog?.records?.length??null,serverOnly:!!payload.serverOnly};}
const runtime=await runtimeSnapshot();
const measuredHashes=await sourceHashes();
const out=path.join(root,'artifacts/performance',label);await mkdir(out,{recursive:true});
const cli=path.join(root,'artifacts/performance/tooling/node_modules/lighthouse/cli/index.js');
for(const mode of ['mobile','desktop']){
 const target=path.join(out,mode+'.json');
 const args=[cli,url,'--only-categories=performance','--output=json',`--output-path=${target}`,'--chrome-flags=--headless --no-sandbox','--quiet',...(mode==='desktop'?['--preset=desktop']:[])];
 await new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{cwd:root,env:{...process.env,CHROME_PATH:chromium.executablePath()},stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(`Lighthouse ${mode}: ${code}`)));});
 const lhr=JSON.parse(await readFile(target,'utf8'));
 const requested=new URL(url), final=new URL(lhr.finalDisplayedUrl||lhr.finalUrl);
 if(final.origin!==requested.origin || final.pathname!==requested.pathname || final.search!==requested.search)throw Error('Lighthouse final URL changed (including installer/login redirects)');
 const documentRequest=lhr.audits['network-requests']?.details?.items?.find(item=>item.resourceType==='Document'&&item.url===final.href);
 if(!documentRequest||documentRequest.statusCode!==200)throw Error('Lighthouse did not measure an HTTP 200 document');
 const requests=lhr.audits['network-requests']?.details?.items||[];
 const failedAssets=requests.filter(item=>{try{return new URL(item.url).origin===requested.origin&&(!item.statusCode||item.statusCode>=400);}catch{return false;}});
 if(failedAssets.length)throw Error(`Own-origin resources failed: ${failedAssets.map(item=>`${new URL(item.url).pathname} HTTP ${item.statusCode||0}`).join(', ')}`);
 if(!serverOnly&&!requests.some(item=>{try{return new URL(item.url).origin===requested.origin&&/\/assets\/app\.js$/.test(new URL(item.url).pathname)&&item.statusCode===200&&item.resourceType==='Script';}catch{return false;}}))throw Error('Public app.js was not loaded successfully; wrong or incomplete page');
 if(lhr.runtimeError||typeof lhr.categories?.performance?.score!=='number')throw Error(`Lighthouse ${mode} invalid run: ${lhr.runtimeError?.code||'missing score'}`);
 scores.push({mode,score:lhr.categories.performance.score*100});
 const metrics=Object.fromEntries(['first-contentful-paint','largest-contentful-paint','speed-index','total-blocking-time','cumulative-layout-shift','interactive','server-response-time'].map(id=>[id,{value:lhr.audits[id]?.numericValue,display:lhr.audits[id]?.displayValue}]));
 const issues=Object.entries(lhr.audits).filter(([,a])=>a.score!==null&&a.score<1&&a.scoreDisplayMode!=='informative').map(([id,a])=>({id,title:a.title,display:a.displayValue,score:a.score,details:a.details}));
 const summary={label,mode,url,runtime,sourceSha256:measuredHashes,finalUrl:lhr.finalDisplayedUrl,lighthouseVersion:lhr.lighthouseVersion,fetchTime:lhr.fetchTime,score:Math.round(lhr.categories.performance.score*100),metrics,issues,environment:lhr.environment,configSettings:lhr.configSettings,runWarnings:lhr.runWarnings};
 await writeFile(path.join(out,mode+'-summary.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify({mode,score:summary.score,metrics,warnings:lhr.runWarnings,issues:issues.map(({id,title,display})=>({id,title,display}))},null,2));
}

if(JSON.stringify(await sourceHashes())!==JSON.stringify(measuredHashes))throw Error('Measured source changed during audit');
if(JSON.stringify(await runtimeSnapshot())!==JSON.stringify(runtime))throw Error('Runtime content/settings changed during audit');
if(assert95&&scores.some(({score})=>score<95)){console.error('Performance target missed:',JSON.stringify(scores));process.exitCode=1;}
