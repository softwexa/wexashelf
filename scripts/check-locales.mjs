import { readFile } from 'node:fs/promises';
import { tsImport } from 'tsx/esm/api';
const {localeRegistry,sourceMessageKeys,validateLocalePack,validateStaticContent,validateServerMessages}=await tsImport('../src/lib/i18n-registry.ts',import.meta.url);
const errors=[];const codes=new Set();
for(const [code,pack]of Object.entries(localeRegistry)){
 if(codes.has(pack.locale)||code!==pack.locale)errors.push(`${code}: duplicate/mismatched registration`);
 codes.add(pack.locale);
 errors.push(...validateLocalePack(pack).map(issue=>`${code}: ${issue}`),...validateStaticContent(pack.content).map(issue=>`${code}: ${issue}`),...validateServerMessages(pack.serverMessages).map(issue=>`${code}: ${issue}`));
}
const english=localeRegistry.en.messages;
const mapped=Object.values(sourceMessageKeys);
// Original source phrases and authoritative English copy may share a stable key.
// Every alias must still resolve, and every stable key must remain mapped below.
for(const id of mapped)if(!Object.hasOwn(english,id))errors.push(`Source alias references missing English key: ${id}`);
for(const id of Object.keys(english))if(!/^ui\.[a-f0-9]{12}$/.test(id)||!mapped.includes(id))errors.push(`Invalid or unmapped stable message ID: ${id}`);
const extra=process.argv.slice(2);
if(extra.length&&extra.length!==3)errors.push('Usage: node scripts/check-locales.mjs [ui-pack.json content-pack.json server-pack.json]');
if(extra.length===3){try{const [pack,content,server]=await Promise.all(extra.map(async file=>JSON.parse(await readFile(file,'utf8'))));errors.push(...validateLocalePack(pack).map(issue=>`candidate: ${issue}`),...validateStaticContent(content).map(issue=>`candidate: ${issue}`),...validateServerMessages(server).map(issue=>`candidate: ${issue}`));}catch(error){errors.push(`Candidate files could not be validated: ${error.message}`);}}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`PASS: ${codes.size} registered languages; ${Object.keys(english).length} stable English message keys; placeholder, static content, server messages/routes and identity checks${extra.length?' plus candidate pack':''}.`);
