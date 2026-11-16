import englishPack from './i18n-packs/en.json';
import turkishPack from './i18n-packs/tr.json';
import englishContent from './i18n-packs/content.en.json';
import turkishContent from './i18n-packs/content.tr.json';
import englishServer from './i18n-packs/server.en.json';
import turkishServer from './i18n-packs/server.tr.json';
import sourceKeys from './i18n-source-keys.json';
export interface LocalePack {schemaVersion:number;locale:string;label:string;intlLocale:string;direction:string;messages:Record<string,string>;}
export type StaticLocaleContent = Omit<typeof englishContent,'tags'|'categories'|'guides'|'workflows'> & {
 tags?: typeof englishContent.tags;
 categories:Array<Omit<typeof englishContent.categories[number],'slug'>&{slug?:string}>;
 guides:Array<Omit<typeof englishContent.guides[number],'slug'>&{slug?:string}>;
 workflows:Array<Omit<typeof englishContent.workflows[number],'slug'>&{slug?:string}>;
};
export type ServerLocaleMessages = {messages:Record<string,string>;routes:Record<string,string>};
export type RegisteredLocale = LocalePack & {content:StaticLocaleContent;serverMessages:ServerLocaleMessages};
export const DEFAULT_LOCALE='en';
export const SOURCE_LOCALE='tr';
const placeholders=(value:string)=>[...value.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)].map(match=>match[1]).sort().join('|');
export function validateLocalePack(pack:LocalePack):string[]{
 const issues:string[]=[];const baseline=englishPack.messages as Record<string,string>;
 if(pack.schemaVersion!==1)issues.push('schemaVersion must be 1');
 if(!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(pack.locale))issues.push('locale must use a supported language tag such as en or pt-BR');
 if(typeof pack.label!=='string'||!pack.label.trim()||pack.label.length>80)issues.push('label is required (up to 80 characters)');
 if(!['ltr','rtl'].includes(pack.direction))issues.push('direction must be ltr or rtl');
 try{if(typeof pack.intlLocale!=='string'||!pack.intlLocale)throw Error();new Intl.DateTimeFormat(pack.intlLocale);}catch{issues.push('intlLocale is invalid');}
 if(!pack.messages||typeof pack.messages!=='object')return [...issues,'messages must be an object'];
 for(const key of Object.keys(pack.messages))if(!Object.hasOwn(baseline,key))issues.push(`Unknown message key: ${key}`);
 for(const [key,source]of Object.entries(baseline)){const value=pack.messages[key];if(typeof value!=='string'||!value.trim()){issues.push(`Missing message: ${key}`);continue;}if(placeholders(value)!==placeholders(source))issues.push(`Placeholder mismatch: ${key}`);if(/<\/?(?:script|iframe|object|style)\b/i.test(value))issues.push(`Unsafe markup: ${key}`);}
 return issues;
}
export function validateStaticContent(content:StaticLocaleContent):string[]{
 const issues:string[]=[];
 function walk(expected:unknown,actual:unknown,path:string){
  if(actual===undefined&&(path==='tags'||/^(categories|guides|workflows)\.\d+\.slug$/.test(path)))return;
  if(typeof expected==='string'){if(typeof actual!=='string'||!actual.trim())issues.push(`Missing static text: ${path}`);else if(/(?:^|\.)(?:id|appId|kind)$/.test(path)&&actual!==expected)issues.push(`Stable identity changed: ${path}`);return;}
  if(Array.isArray(expected)){if(!Array.isArray(actual)||actual.length!==expected.length){issues.push(`Static array shape changed: ${path}`);return;}expected.forEach((item,i)=>walk(item,actual[i],`${path}.${i}`));if(path.endsWith('.appIds')&&JSON.stringify(expected)!==JSON.stringify(actual))issues.push(`Stable references changed: ${path}`);return;}
  if(expected&&typeof expected==='object'){if(!actual||typeof actual!=='object'){issues.push(`Static object missing: ${path}`);return;}for(const [key,value]of Object.entries(expected))walk(value,(actual as Record<string,unknown>)[key],path?`${path}.${key}`:key);for(const key of Object.keys(actual))if(!Object.hasOwn(expected,key))issues.push(`Unknown static key: ${path}.${key}`);}
 }
 walk(englishContent,content,'');
 for(const group of ['categories','guides','workflows','tags'] as const){
  const entries=content?.[group];if(!Array.isArray(entries))continue;
  const tokens=new Map<string,string>();
  for(const entry of entries){
   const slug=entry.slug??entry.id;
   if(typeof slug!=='string'||slug.length>100||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))issues.push(`Unsafe static slug: ${group}.${entry.id}`);
   for(const token of [entry.id,slug,...('label' in entry&&group==='tags'?[entry.label]:[])]){if(tokens.has(token)&&tokens.get(token)!==entry.id)issues.push(`Static slug collision: ${group}.${entry.id}`);tokens.set(token,entry.id);}
  }
 }
 return issues;
}
export function validateServerMessages(server:ServerLocaleMessages):string[]{
 const issues:string[]=[];
 if(!server||typeof server!=='object')return ['Server language resource must be an object'];
 for(const extra of Object.keys(server))if(!['messages','routes'].includes(extra))issues.push(`Unknown server resource key: ${extra}`);
 for(const section of ['messages','routes'] as const){
  const baseline=englishServer[section] as Record<string,string>,actual=server[section];
  if(!actual||typeof actual!=='object'){issues.push(`Missing server ${section}`);continue;}
  for(const key of Object.keys(actual))if(!Object.hasOwn(baseline,key))issues.push(`Unknown server ${section} key: ${key}`);
  for(const [key,reference]of Object.entries(baseline)){
   const value=actual[key];
   if(typeof value!=='string'||!value.trim()){issues.push(`Missing server ${section}: ${key}`);continue;}
   if(section==='routes'&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))issues.push(`Unsafe route segment: ${key}`);
   if(section==='messages'&&placeholders(reference)!==placeholders(value))issues.push(`Server placeholder mismatch: ${key}`);
   if(/<\/?(?:script|iframe|object|style)\b/i.test(value))issues.push(`Unsafe server markup: ${key}`);
  }
 }
 return issues;
}
// Add a complete, reviewed UI + static-content + server-message set at build time.
export const localeRegistry:Record<string,RegisteredLocale>={
 en:{...englishPack,content:englishContent,serverMessages:englishServer},
 tr:{...turkishPack,content:turkishContent,serverMessages:turkishServer}
};
export function getLocalePack(locale?:string):RegisteredLocale{return localeRegistry[locale||DEFAULT_LOCALE]||localeRegistry[DEFAULT_LOCALE];}
export const supportedLocales=Object.values(localeRegistry).map(({locale,label,intlLocale,direction})=>({code:locale,label,intlLocale,direction}));
export const sourceMessageKeys:Record<string,string>=sourceKeys;
export function message(locale:string|undefined,sourceOrKey:string):string {const key=sourceMessageKeys[sourceOrKey]||sourceOrKey;const pack=getLocalePack(locale);return pack.messages[key]??englishPack.messages[key as keyof typeof englishPack.messages]??sourceOrKey;}

export type RuntimeLocalePackage={schemaVersion:1;locale:string;ui:LocalePack;content:StaticLocaleContent;server:ServerLocaleMessages};
export function validateRuntimeLocalePackage(value:unknown):string[]{
 if(!value||typeof value!=='object')return ['Language package must be an object'];
 const pack=value as RuntimeLocalePackage;
 if(!pack.ui||typeof pack.ui!=='object')return ['UI language resource is missing'];
 const errors=[...validateLocalePack(pack.ui),...validateStaticContent(pack.content),...validateServerMessages(pack.server)];
 if(pack.schemaVersion!==1)errors.push('Package schemaVersion must be 1');
 if(pack.locale!==pack.ui.locale)errors.push('Package and UI locale must match');
 if(['en','tr'].includes(pack.locale))errors.push('Built-in languages cannot be overwritten by runtime packages');
 return errors;
}
export function registerRuntimeLocalePacks(input:unknown):string[]{
 if(input===undefined||input===null)return [];
 if(!Array.isArray(input))return ['Runtime language packs must be an array'];
 const pending:Record<string,RegisteredLocale>={},errors:string[]=[];
 for(const value of input){const code=value?.locale;const issues=validateRuntimeLocalePackage(value);if(Object.hasOwn(pending,code))issues.push('Duplicate runtime locale');const pack=value as RuntimeLocalePackage;if(pack?.locale!==code)issues.push('Runtime key must match package locale');if(issues.length){errors.push(...issues.map(issue=>`${code}: ${issue}`));continue;}pending[code]={...pack.ui,content:pack.content,serverMessages:pack.server};}
 if(errors.length)return errors;
 Object.assign(localeRegistry,pending);supportedLocales.splice(0,supportedLocales.length,...Object.values(localeRegistry).map(({locale,label,intlLocale,direction})=>({code:locale,label,intlLocale,direction})));
 return [];
}
