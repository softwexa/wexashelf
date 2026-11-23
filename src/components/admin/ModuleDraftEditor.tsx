"use client";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { AppRecord } from "@/lib/domain";
import type { ModuleManifest } from "@/lib/module-packages";
import EditorAppPicker from "./EditorAppPicker";

type FunctionalManifest = Extract<ModuleManifest, {schemaVersion: 2}>;
export default function ModuleDraftEditor({manifest,apps,locale,busy,reservedIds,onPreview,onClose}:{manifest:FunctionalManifest;apps:AppRecord[];locale:string;busy:boolean;reservedIds:readonly string[];onPreview:(manifest:ModuleManifest)=>void;onClose:()=>void}) {
 const {t}=useI18n();
 const [draft,setDraft]=useState<FunctionalManifest>(()=>({...structuredClone(manifest),id:`${manifest.id.slice(0,57)}-custom`,version:'1.0.0'}));
 const [error,setError]=useState('');
 function validated(){const bytes=(value:string)=>new TextEncoder().encode(value).length;const invalid=!/^[a-z][a-z0-9-]{2,63}$/.test(draft.id)||reservedIds.includes(draft.id)||!/^\d+\.\d+\.\d+$/.test(draft.version)||bytes(draft.version)>40||!draft.name.trim()||bytes(draft.name)>100||!draft.description.trim()||bytes(draft.description)>500||draft.blocks.some(block=>block.type==='latest-articles'?!Number.isInteger(block.limit)||block.limit<1||block.limit>6:block.appIds.length<(block.type==='comparison'?2:1)||block.appIds.length>(block.type==='comparison'?4:12));if(invalid){setError('Use a distinct package ID, valid metadata and the required number of references.');return null;}setError('');return draft;}
 function download(){const value=validated();if(!value)return;const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=`${value.id}-${value.version}.json`;link.click();URL.revokeObjectURL(url);}
 return <section className="admin-panel"><h5>{t('Customize a module copy')}</h5><p>{t('Editing creates a separate package draft. Preview and review the exact result before installing it disabled.')}</p>
 <div className="admin-grid">{(['id','name','description','version'] as const).map(key=><label className="admin-field" key={key}><span>{t(({id:'Package ID',name:'Name',description:'Description',version:'Version'})[key])}</span><input value={draft[key]} disabled={busy} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>)}</div>
 <p>{t('Search published apps in the displayed language. Existing unavailable references are retained until removed.')} <strong>{locale}</strong></p>
 {draft.blocks.map((block,index)=><fieldset key={block.id}><legend>{block.locales[locale]?.title||block.locales.en.title} · {block.id}</legend>{block.type==='latest-articles'?<label className="admin-field"><span>{t('Maximum articles')}</span><input type="number" min={1} max={6} step={1} value={block.limit} disabled={busy} onChange={e=>setDraft({...draft,blocks:draft.blocks.map((row,i)=>i===index&&row.type==='latest-articles'?{...row,limit:Number(e.target.value)}:row)})}/></label>:<EditorAppPicker label={t('App IDs')} publicOnly sourceLocale={locale} initialApps={apps} multiple maxSelections={block.type==='comparison'?4:12} minSelections={block.type==='comparison'?2:1} disabled={busy} value={block.appIds} onChange={ids=>setDraft({...draft,blocks:draft.blocks.map((row,i)=>i===index&&row.type!=='latest-articles'?{...row,appIds:ids}:row)})}/>}</fieldset>)}
 {error&&<p role="alert" className="admin-error">{t(error)}</p>}
 <div className="admin-actions"><button type="button" className="admin-button primary" disabled={busy} onClick={()=>{const value=validated();if(value)onPreview(value);}}>{t('Preview customized package')}</button><button type="button" className="admin-button" disabled={busy} onClick={download}>{t('Export draft manifest')}</button><button type="button" className="admin-button subtle" disabled={busy} onClick={onClose}>{t('Cancel customization')}</button></div></section>;
}
