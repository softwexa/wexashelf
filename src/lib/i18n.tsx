"use client";
import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_LOCALE,getLocalePack,message,sourceMessageKeys } from './i18n-registry';
export type Locale = string;
export type LanguageAlternate = {locale:string;href:string;label?:string};
const Context=createContext<Locale>(DEFAULT_LOCALE);
export function LocaleProvider({locale=DEFAULT_LOCALE,children}:{locale?:string;children:ReactNode}){return <Context.Provider value={getLocalePack(locale).locale}>{children}</Context.Provider>;}
export function translate(locale:string,text:string,params?:Record<string,string|number>):string {
 let value=message(locale,text);let parameters=params;
 if(!sourceMessageKeys[text]){
  let match=text.match(/^(.+): katalogda yerel sürüm desteği yok\.$/);
  if(match){value=message(locale,'{platform}: katalogda yerel sürüm desteği yok.');parameters={platform:match[1]};}
  match=text.match(/^(Android indirme alt sınırı|iOS değerlendirme sayısı|Windows değerlendirme sayısı): (bu platformda kayıt yok|bu ülke için kaynaklı güncel gözlem yok)\.$/);
  if(match){value=message(locale,'{metric}: {reason}.');parameters={metric:message(locale,match[1]),reason:message(locale,match[2])};}
  match=text.match(/^(Android indirme alt sınırı|iOS değerlendirme sayısı|Windows değerlendirme sayısı) (\d+); ([A-Z]{2}) eşiği (\d+) karşılandı\.$/);
  if(match){value=message(locale,'{metric} {value}; {country} eşiği {minimum} karşılandı.');parameters={metric:message(locale,match[1]),value:match[2],country:match[3],minimum:match[4]};}
  match=text.match(/^(Android indirme alt sınırı|iOS değerlendirme sayısı|Windows değerlendirme sayısı) (\d+); gerekli eşik (\d+)\.$/);
  if(match){value=message(locale,'{metric} {value}; gerekli eşik {minimum}.');parameters={metric:message(locale,match[1]),value:match[2],minimum:match[3]};}
  match=text.match(/^Editoryal istisna: (.+)$/);
  if(match){value=message(locale,'Editoryal istisna: {reason}');parameters={reason:match[1]};}
  match=text.match(/^(.+) · (.+) (doğrulanmadı|sınırlı|desteklenmiyor)\.$/);
  if(match){value=message(locale,'{platform} · {feature} {state}.');parameters={platform:match[1],feature:message(locale,match[2]),state:message(locale,match[3])};}
  match=text.match(/^Bugünkü kayıtlı fiyatın (\d+) ay değişmediği varsayımıyla; vergi, kur dönüşümü ve gelecekteki zamlar dahil değil\. (.+)$/);
  if(match){value=message(locale,'Bugünkü kayıtlı fiyatın {months} ay değişmediği varsayımıyla; vergi, kur dönüşümü ve gelecekteki zamlar dahil değil. {basis}');parameters={months:match[1],basis:message(locale,match[2])};}
 }
 for(const [key,replacement]of Object.entries(parameters||{}))value=value.replaceAll(`{${key}}`,String(replacement));return value;
}
export function useI18n(){const locale=useContext(Context),pack=getLocalePack(locale);return {locale,intlLocale:pack.intlLocale,direction:pack.direction,t:(text:string,params?:Record<string,string|number>)=>translate(locale,text,params),formatDate:(value:string)=>{if(!value)return '';const date=new Date(value.length===10?`${value}T12:00:00Z`:value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat(pack.intlLocale,{dateStyle:'medium',timeZone:'Europe/Istanbul'}).format(date);},formatNumber:(value:number)=>new Intl.NumberFormat(pack.intlLocale).format(value),countryName:(code:string)=>new Intl.DisplayNames([pack.intlLocale],{type:'region'}).of(code)||code};}
