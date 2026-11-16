import ts from 'typescript';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
/** Retain strings from all public components and shared constants, including dynamic label maps. */
export async function publicLocales(root){
 const sources=new Set();
 // These fragments are captured by public regex templates, not literal call arguments.
 for(const fragment of ['doğrulanmadı','sınırlı','desteklenmiyor','bu platformda kayıt yok','bu ülke için kaynaklı güncel gözlem yok'])sources.add(fragment);
 async function walk(directory){for(const entry of await readdir(directory,{withFileTypes:true})){const file=path.join(directory,entry.name),relative=path.relative(root,file).replaceAll('\\','/');if(/^(?:src\/components\/admin|src\/lib\/server|src\/app\/(?:api|yonetim|admin))(?:\/|$)/.test(relative))continue;if(entry.isDirectory()){if(!['i18n-packs'].includes(entry.name))await walk(file);}else if(/\.(?:tsx?|jsx?)$/.test(entry.name)&&!/(?:\.test\.|\.spec\.)/.test(entry.name)){const text=await readFile(file,'utf8'),tree=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);function visit(node){if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node))sources.add(node.text);if(ts.isJsxText(node)&&node.text.trim())sources.add(node.text.trim());ts.forEachChild(node,visit);}visit(tree);}}}
 await walk(path.join(root,'src'));await walk(path.join(root,'php/client'));
 const en=JSON.parse(await readFile(path.join(root,'src/lib/i18n-packs/en.json'),'utf8')),tr=JSON.parse(await readFile(path.join(root,'src/lib/i18n-packs/tr.json'),'utf8')),aliases=JSON.parse(await readFile(path.join(root,'src/lib/i18n-source-keys.json'),'utf8'));
 const wanted=new Set();for(const source of sources){if(aliases[source])wanted.add(aliases[source]);if(en.messages[source])wanted.add(source);}for(const [key,value]of Object.entries(en.messages))if(sources.has(value)||sources.has(tr.messages[key]))wanted.add(key);
 const keys=[...wanted].sort();if(keys.length<300||keys.length>=Object.keys(en.messages).length)throw Error('Unexpected public locale extraction size: '+keys.length);
 const packs={en:{...en,messages:Object.fromEntries(keys.map(key=>[key,en.messages[key]]))},tr:{...tr,messages:Object.fromEntries(keys.map(key=>[key,tr.messages[key]]))}};
 return {keys,packs,aliases:Object.fromEntries(Object.entries(aliases).filter(([,key])=>wanted.has(key)))};
}
