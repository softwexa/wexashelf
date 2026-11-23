"use client";
import {useEffect,useRef,useState} from 'react';
import {useI18n} from '@/lib/i18n';
import {fetchCatalog} from '@/lib/catalog-api';
import {CATEGORIES,PLATFORM_LABELS} from '@/lib/catalog';
import type {AppRecord,ManagedRecord} from '@/lib/domain';
import AdminRecordPicker,{type AdminPickerOption} from './AdminRecordPicker';

// Load only an opened picker, retaining server search and pagination for large catalogs.
export default function EditorAppPicker({value,onChange,label,disabled,multiple=false,publicOnly=false,sourceLocale='en',onApp,minSelections,maxSelections,initialApps=[]}:{value:readonly string[];onChange:(ids:string[])=>void;label:string;disabled?:boolean;multiple?:boolean;publicOnly?:boolean;sourceLocale?:string;onApp?:(app:AppRecord)=>void;minSelections?:number;maxSelections?:number;initialApps?:readonly AppRecord[]}){
 const {t,locale}=useI18n();
 const translate=useRef(t);translate.current=t;
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[page,setPage]=useState(1),[options,setOptions]=useState<AdminPickerOption[]>([]),[hasMore,setHasMore]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const apps=useRef(new Map<string,AppRecord>());
 initialApps.forEach(app=>apps.current.set(app.id,app));
 useEffect(()=>{if(!open)return;const t=translate.current;const abort=new AbortController();setLoading(true);setError('');const timer=setTimeout(()=>{void(async()=>{
  try{
   let rows:{app:AppRecord;status?:string}[],more:boolean;
   if(publicOnly){const result=await fetchCatalog(new URLSearchParams({locale:sourceLocale,q:query,page:String(page),limit:'60'}),abort.signal);rows=result.items.map(app=>({app}));more=result.hasMore;}
   else{const response=await fetch(`/api/admin?${new URLSearchParams({kind:'app',q:query,page:String(page)})}`,{credentials:'same-origin',cache:'no-store',signal:abort.signal});const result=await response.json() as {error?:string;records:ManagedRecord<'app'>[];pagination:{page:number;pages:number}};if(!response.ok)throw Error(result.error||t('The request could not be completed.'));rows=result.records.filter(record=>record.kind==='app').map(record=>({app:record.data,status:record.status}));more=result.pagination.page<result.pagination.pages;}
   if(abort.signal.aborted)return;
   const next=rows.map(({app,status})=>{apps.current.set(app.id,app);return {matchedQuery:query,id:app.id,label:app.name,detail:[app.publisher,app.id,status?t(({draft:'Taslak',review:'İncelemede',scheduled:'Zamanlanmış',published:'Yayında',archived:'Arşivde'} as Record<string,string>)[status]):''].filter(Boolean).join(' · '),icon:app.icon,keywords:[app.id,app.publisher,...(app.aliases||[]),...(app.tags||[])].join(' '),facets:{platform:app.platforms,category:[app.category],...(status?{status:[status]}:{})}};});
   setOptions(previous=>page===1?next:[...previous,...next.filter(item=>!previous.some(old=>old.id===item.id))]);setHasMore(more);
  }catch(caught){if(!abort.signal.aborted)setError(caught instanceof Error?t(caught.message):t('The request could not be completed.'));}finally{if(!abort.signal.aborted)setLoading(false);}
 })();},query?250:0);return()=>{clearTimeout(timer);abort.abort();};},[open,query,page,publicOnly,sourceLocale,locale]);
 const filters=[{key:'platform',label:t('Platform'),choices:Object.entries(PLATFORM_LABELS).map(([value,label])=>({value,label}))},{key:'category',label:t('Kategori'),choices:CATEGORIES.filter(item=>item.id!=='all').map(item=>({value:item.id,label:t(item.label)}))},...(!publicOnly?[{key:'status',label:t('Kayıt durumu'),choices:Object.entries({draft:'Taslak',review:'İncelemede',scheduled:'Zamanlanmış',published:'Yayında',archived:'Arşivde'}).map(([value,label])=>({value,label:t(label)}))}]:[])];
 return <AdminRecordPicker options={[...options,...initialApps.filter(app=>!options.some(option=>option.id===app.id)).map(app=>({id:app.id,label:app.name,detail:[app.publisher,app.id].filter(Boolean).join(' · '),icon:app.icon,keywords:[app.id,...(app.aliases||[])].join(' '),facets:{platform:app.platforms,category:[app.category]}}))]} minSelections={minSelections} maxSelections={maxSelections} filters={filters} label={label} value={value} multiple={multiple} disabled={disabled} onChange={ids=>{ids.forEach(id=>{const app=apps.current.get(id);if(app)onApp?.(app);});onChange(ids);}} onOpenChange={setOpen} onQueryChange={next=>{setQuery(next);setPage(1);setOptions([]);setHasMore(false);}} onLoadMore={hasMore?()=>setPage(previous=>previous+1):undefined} loading={loading} error={error}/>;
}
