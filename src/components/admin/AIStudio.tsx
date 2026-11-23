"use client";
import {useI18n} from "@/lib/i18n";
import { useEffect, useState } from "react";
import type { ManagedRecord, RecordKind } from "@/lib/domain";
import ui from "./AIStudio.module.css";
import AIRecordPicker from "./AIRecordPicker";

type Provider = { id:string; label:string; protocol:"openai"|"compatible"; baseUrl:string; textModel:string; imageModel:string; imageEnabled:boolean; hasKey?:boolean; apiKey?:string; deleteKey?:boolean; pricing?:{inputPerMillion:number|null;outputPerMillion:number|null;imagePerRequest:number|null} };
type Job = { sourceLocale?:string;archived?:boolean;attempts?:number;nextRun?:string;id:string; task:string; status:string; providerId:string; model:string; createdAt:string; target:{kind:RecordKind;id:string|null;revision:number|null}; result?:Record<string,unknown>; warnings?:string[]; error?:string; previewUrl?:string; usage?:unknown; targetLocale?:string; locale?:string; translationRevision?:number; cost?:{currency:string;reserved:number;estimated?:number;basis?:string} };
type Settings = { queue?:{pending:number;total:number;requiresWorker:boolean;maxConcurrent:number};providers:Provider[]; defaultProviderId:string; dailyTextLimit:number; dailyImageLimit:number; usage:{text:number;image:number;date:string;estimatedReservedUsd?:number}; jobs:Job[]; targetLocales?:{code:string;label:string}[]; translations?:{kind:RecordKind;id:string;locale:string;revision:number;sourceRevision:number;status:string}[]; budget?:{enabled:boolean;currency:"USD";dailyLimit:number} };
async function request<T>(path:string, body?:unknown):Promise<T> { const response=await fetch(`/api/admin/ai${path}`,{method:body===undefined?"GET":"POST",credentials:"same-origin",cache:"no-store",headers:body===undefined?undefined:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)}); const result=await response.json(); if(!response.ok) throw new Error(result.error || "The AI request could not be completed."); return result; }
const tasks=[['titles','Title suggestions'],['description','Description'],['article','Article draft'],['seo','SEO title and description'],['image','Article cover'],['translation','Translate source fields'],['claims','Source-backed claim review'],['brief','Editorial brief'],['qa','Ask selected sources'],['impact','Source change impact']] as const;
const statusLabels:Record<string,string>={pending:"Waiting for worker",cancelled:"Cancelled",submitting:"Submitting",queued:"Queued",in_progress:"Generating",completed:"Completed",failed:"Failed",uncertain:"Outcome uncertain"};
const kindLabels:Record<string,string>={app:"App",article:"Article",list:"List"};
const taskLabel=(task:string)=>tasks.find(([id])=>id===task)?.[1]||"Content generation";
function editableSettings(value:Settings):Settings{return value.providers.length?value:{...value,defaultProviderId:"openai",providers:[{id:"openai",label:"OpenAI",protocol:"openai",baseUrl:"https://api.openai.com/v1",textModel:"gpt-5.6-luna",imageModel:"gpt-image-2.5-flare",imageEnabled:false,hasKey:false}]};}
const fieldLabels:Record<string,string>={title:"Title",summary:"Summary",tagline:"Tagline",description:"Description",sections:"Article sections",seo:"SEO title and description",cover:"Article cover",intro:"Introduction",verdict:"Editorial conclusion"};
function previewFields(job:Job):[string,unknown][] {
 const result=job.result||{};
 if(['titles','translation','claims','brief','qa','impact'].includes(job.task))return [];
 if(job.task==='seo')return [['seo',result.seo||{title:result.title,description:result.description}]];
 if(job.task==='image')return [['cover',result.cover||result]];
 const keys=job.task==='article'?['title','summary','intro','sections','verdict']:job.target.kind==='app'?['tagline','description']:['summary'];
 return keys.filter(key=>result[key]!==undefined).map(key=>[key,result[key]]);
}
function previewText(key:string,value:unknown):string {
 if(typeof value==='string')return value;
 if(key==='sections'&&Array.isArray(value))return value.map(section=>`${section.heading||''}\n${Array.isArray(section.paragraphs)?section.paragraphs.join('\n\n'):''}`).join('\n\n');
 if(key==='seo'&&value&&typeof value==='object'){const seo=value as Record<string,unknown>;return `SEO title: ${seo.title||''}\n\nSEO description: ${seo.description||''}`;}
 if(key==='cover'&&value&&typeof value==='object'){const cover=value as Record<string,unknown>;return `Alternative text: ${cover.alt||''}\n\nDescription: ${cover.caption||''}\n\nAI-generated cover`;}
 return '';
}
export type AITranslationDraft={kind:RecordKind;recordId:string;locale:string;translationRevision:number;sourceRevision:number;patch:{fields:Record<string,string>;seo:Record<string,unknown>}};
const analysisOnly=(task:string)=>['claims','brief','qa'].includes(task);
const jobLocale=(job:Job)=>job.targetLocale||job.locale||'';
function newestRecords(rows:ManagedRecord[]):ManagedRecord[]{const byId=new Map<string,ManagedRecord>();for(const row of rows){const key=`${row.kind}:${row.id}`;if(!byId.has(key)||byId.get(key)!.revision<=row.revision)byId.set(key,row);}return [...byId.values()];}
const pending=(job:Job)=>["pending","submitting","queued","in_progress"].includes(job.status);
export default function AIStudio({records:workspaceRecords,busy,onBusy,onApply,onTranslationApply,defaultSourceLocale="en"}:{records:ManagedRecord[];defaultSourceLocale?:string;busy:boolean;onBusy:(busy:boolean)=>void;onApply:(target:ManagedRecord|null,fields:Record<string,unknown>)=>boolean;onTranslationApply?:(draft:AITranslationDraft)=>boolean}) {
 const {t,intlLocale}=useI18n();
 const [extraRecords,setExtraRecords]=useState<ManagedRecord[]>([]);
 const records=newestRecords([...extraRecords,...workspaceRecords]);
 function rememberRecords(rows:ManagedRecord[]){setExtraRecords(current=>newestRecords([...current,...rows]));}

 const [configuredProviders,setConfiguredProviders]=useState<Provider[]>([]);
 const [settings,setSettings]=useState<Settings|null>(null),[providerId,setProviderId]=useState(""),[target,setTarget]=useState("new"),[task,setTask]=useState("titles"),[locale,setLocale]=useState("en"),[tone,setTonee]=useState("neutral"),[brief,setBrief]=useState(""),[appIds,setAppIds]=useState<string[]>([]),[job,setJob]=useState<Job|null>(null),[titleIndex,setTitleIndex]=useState(0),[fields,setFields]=useState<string[]>([]),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [confirmImpact,setConfirmImpact]=useState(false);
 const [acknowledgeCharge,setAcknowledgeCharge]=useState(false);
 const [metadataTarget,setMetadataTarget]=useState("");
 const record=records.find(r=>`${r.kind}:${r.id}`===target)||null;
 const kind=record?.kind||"article";
 const sourceLocale=(record as (ManagedRecord & {sourceLocale?:string})|null)?.sourceLocale||(record?"tr":defaultSourceLocale);
 const targetLocales=settings?.targetLocales||[{code:"en",label:"English"},{code:"tr",label:"Türkçe"}];
 const translationRevision=settings?.translations?.find(item=>item.kind===kind&&item.id===record?.id&&item.locale===locale)?.revision||0;
 const metadataReady=!record||metadataTarget===`${record.kind}:${record.id}`;
 const generationAllowed=metadataReady&&(!['article','image'].includes(task)||locale===sourceLocale)&&(analysisOnly(task)||!!record||(locale===sourceLocale&&!['translation','impact'].includes(task)))&&(task!=='translation'||locale!==sourceLocale);
 const provider=configuredProviders.find(p=>p.id===providerId);
 const providerReady=!!(provider?.hasKey&&provider.textModel&&(task!=="image"||(provider.imageEnabled&&provider.imageModel)));
 const load=()=>request<Settings>(record?`?${new URLSearchParams({kind:record.kind,id:record.id})}`:"").then(value=>{setSettings(editableSettings(value));setConfiguredProviders(value.providers);setProviderId(previous=>value.providers.some(p=>p.id===previous)?previous:value.defaultProviderId);return value;});
 useEffect(()=>{let active=true;request<Settings>("").then(value=>{if(active){setSettings(editableSettings(value));setConfiguredProviders(value.providers);setProviderId(value.defaultProviderId);setJob(value.jobs.find(pending)||null);}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
 useEffect(()=>{
  if(!record){setMetadataTarget("");return;}
  let active=true;setMetadataTarget("");
  request<Settings>(`?${new URLSearchParams({kind:record.kind,id:record.id})}`).then(value=>{
   if(active){setSettings(previous=>previous?{...previous,translations:value.translations??[]}:previous);setMetadataTarget(`${record.kind}:${record.id}`);}
  }).catch(error=>{if(active)setError(error.message);});
  return()=>{active=false;};
 },[record?.kind,record?.id]);
 useEffect(()=>{setTitleIndex(0);setConfirmImpact(false);setAcknowledgeCharge(false);setFields(job?previewFields(job).map(([key])=>key):[]);},[job?.id,job?.status]);
 useEffect(()=>{if(!job||!pending(job))return;let active=true;const timer=setTimeout(()=>{request<{job:Job}>("/poll",{id:job.id}).then(value=>{if(active)setJob(value.job);}).catch(e=>{if(active)setError(e.message);});},3000);return()=>{active=false;clearTimeout(timer);};},[job]);
 async function act(fn:()=>Promise<void>){if(busy)return;onBusy(true);setError("");setNotice("");try{await fn();}catch(e){setError(e instanceof Error?e.message:"The request could not be completed.");}finally{onBusy(false);}}
 function editProvider(index:number,patch:Partial<Provider>){setSettings(previous=>previous?{...previous,providers:previous.providers.map((p,i)=>i===index?{...p,...patch}:p)}:previous);}
 async function apply(){
  if(!job||analysisOnly(job.task))return;
  const current=job.target.id?records.find(r=>r.kind===job.target.kind&&r.id===job.target.id):null;
  if(job.target.id&&(!current||current.revision!==job.target.revision))throw new Error("The source revision changed. Generate a new suggestion from the current record.");
  if(job.task==='impact'&&!confirmImpact)throw new Error("Confirm that this impact suggestion should update an unsaved draft.");
  if(!jobLocale(job))throw new Error('This job has no verified target language. Reload its history before applying.');
  const currentSource=job.sourceLocale||(current as (ManagedRecord & {sourceLocale?:string})|null)?.sourceLocale||(current?'tr':defaultSourceLocale);
  const destination=jobLocale(job)===currentSource?'record':'translation';
  if(destination==='translation'&&!onTranslationApply)throw new Error("The translation editor is unavailable. Nothing was applied.");
  const result=await request<{destination?:string;locale?:string;translationRevision?:number;sourceRevision?:number;patch:Record<string,unknown>;kind:RecordKind;recordId:string|null;revision:number|null}>("/apply",{id:job.id,titleIndex,destination,...(job.task==='impact'?{confirmUpdateDraft:true}:{})});
  if(result.destination==='translation'){
   if(!result.recordId||!result.locale||!onTranslationApply)throw new Error("The translation draft target is missing.");
   if(result.locale!==jobLocale(job)||result.kind!==job.target.kind||result.recordId!==job.target.id)throw new Error('The returned translation target does not match this job. Nothing was applied.');
   const patch=result.patch as AITranslationDraft['patch'];
   const all=['translation','impact'].includes(job.task);
   const selectedFields=Object.fromEntries(Object.entries(patch.fields||{}).filter(([path])=>all||fields.includes(path.split('.')[0])||(job.task==='titles'&&path===(job.target.kind==='app'?'tagline':'title'))));
   const seo=all||fields.includes('seo')?patch.seo||{}:{};
   if(!Object.keys(selectedFields).length&&!Object.keys(seo).length)throw new Error('Select at least one field to apply.');
   onTranslationApply({kind:result.kind,recordId:result.recordId,locale:result.locale,translationRevision:result.translationRevision||0,sourceRevision:result.sourceRevision||result.revision||0,patch:{fields:selectedFields,seo}});return;
  }
  if(destination!=='record')throw new Error("The response did not match the requested translation destination. Nothing was applied.");
  const selected=Object.fromEntries(Object.entries(result.patch).filter(([key])=>['translation','impact'].includes(job.task)||fields.includes(key)||(key===(job.target.kind==='app'?'tagline':'title')&&Array.isArray(job.result?.titles))||(!job.target.id&&['sources','appIds','method'].includes(key))));
  if(!Object.keys(selected).length)throw new Error("Select at least one field to apply.");onApply(current||null,selected);
 }
 return <div>
 <div className="admin-panel-heading"><div><span className="admin-kicker">{t("Editorial assistant")}</span><h2>{t("AI content studio")}</h2></div></div>
 {settings?.queue&&<p className={ui.note}>{t("Generation is queued. A server cron worker processes requests even after this tab closes. Browser refresh only reads status.")} {t("Waiting jobs")}: {settings.queue.pending} · {t("Worker concurrency")}: {settings.queue.maxConcurrent}</p>}
 <p className={ui.note}>{t("Generation starts only when you request it. Review suggestions here, then transfer selected fields to an unsaved draft. Saving and publishing remain separate editorial actions.")}</p>
 {error&&<p role="alert" className="admin-error">{t(error)}</p>}{notice&&<p role="status" className="admin-success">{t(notice)}</p>}
 {settings&&<details className={`admin-panel ${ui.settings}`}><summary>{t("Providers, generation limits and estimated budget")}</summary><div className={ui.form}>
 <p className={ui.note}>{settings.usage.date}{" "}{t(":")}{" "}{settings.usage.text}{" "}{t("text,")}{" "}{settings.usage.image}{" "}{t("image requests. These counts are not monetary charges.")}</p>
 {settings.providers.map((p,index)=><fieldset disabled={busy} key={index} className={ui.form}><legend>{p.label||t("New provider")}</legend>
 {([['id','ID'],['label','Name'],['baseUrl','API endpoint'],['textModel','Text model'],['imageModel','Image model']] as const).map(([key,label])=><label className="admin-field" key={key}><span>{t(label)}</span><input value={p[key]} onChange={e=>editProvider(index,{[key]:e.target.value})}/></label>)}
 <label className="admin-field"><span>{t("Protocol")}</span><select value={p.protocol} onChange={e=>editProvider(index,{protocol:e.target.value as Provider['protocol']})}><option value="openai">{t("OpenAI")}</option><option value="compatible">{t("OpenAI-compatible")}</option></select></label>
 <label className="admin-field"><span>{t("API key")}{" "}{p.hasKey?t("(saved; leave blank to preserve)"):""}</span><input type="password" autoComplete="new-password" value={p.apiKey||""} onChange={e=>editProvider(index,{apiKey:e.target.value})}/></label>
 <label className="admin-check-row"><input type="checkbox" checked={!!p.imageEnabled} onChange={e=>editProvider(index,{imageEnabled:e.target.checked})}/>{t("Enable image generation")}</label><label className="admin-check-row"><input type="checkbox" checked={!!p.deleteKey} onChange={e=>editProvider(index,{deleteKey:e.target.checked})}/>{t("Delete saved key")}</label>
 <p className={ui.note}>{t("Changing an endpoint requires explicit key re-entry. Keys are never stored in browser preferences.")}</p>{([['inputPerMillion','USD per million input tokens'],['outputPerMillion','USD per million output tokens'],['imagePerRequest','USD per image request']] as const).map(([key,label])=><label key={key} className="admin-field"><span>{t(label)}{" "}{t("(blank = unknown)")}</span><input type="number" min="0" step="any" value={p.pricing?.[key]??''} onChange={e=>editProvider(index,{pricing:{inputPerMillion:null,outputPerMillion:null,imagePerRequest:null,...p.pricing,[key]:e.target.value===''?null:Number(e.target.value)}})}/></label>)}
 <button type="button" className="admin-button subtle" onClick={()=>{const providers=settings.providers.filter((_,i)=>i!==index);setSettings({...settings,providers,defaultProviderId:settings.defaultProviderId===p.id?(providers[0]?.id||""):settings.defaultProviderId});}}>{t("Remove provider")}</button>
 </fieldset>)}
 <button className="admin-button" disabled={busy} onClick={()=>setSettings({...settings,providers:[...settings.providers,{id:`provider-${settings.providers.length+1}`,label:"New provider",protocol:"compatible",baseUrl:"",textModel:"",imageModel:"",imageEnabled:false}]})}>{t("Add provider")}</button>
 <label className="admin-field"><span>{t("Default provider")}</span><select value={settings.defaultProviderId} onChange={e=>setSettings({...settings,defaultProviderId:e.target.value})}>{settings.providers.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
 {(['dailyTextLimit','dailyImageLimit'] as const).map(key=><label className="admin-field" key={key}><span>{key==='dailyTextLimit'?t("Daily text request limit"):t("Daily image request limit")}</span><input type="number" min="0" value={settings[key]} onChange={e=>setSettings({...settings,[key]:Number(e.target.value)})}/></label>)}
 <fieldset className={ui.form}><legend>{t("Estimated daily budget (USD)")}</legend><p className={ui.note}>{t("Enter provider prices yourself. These estimates are not invoices or live billing data. Unknown prices cannot be treated as free. Pending and uncertain jobs retain their reservation.")}</p><label className="admin-check-row"><input type="checkbox" checked={settings.budget?.enabled||false} onChange={e=>setSettings({...settings,budget:{currency:'USD',dailyLimit:settings.budget?.dailyLimit||0,enabled:e.target.checked}})}/>{t("Enforce estimated daily budget")}</label><label className="admin-field"><span>{t("Daily estimated limit in USD")}</span><input type="number" min="0" step="0.01" value={settings.budget?.dailyLimit||0} onChange={e=>setSettings({...settings,budget:{currency:'USD',enabled:settings.budget?.enabled||false,dailyLimit:Number(e.target.value)}})}/></label><p className={ui.note}>{t("Reserved estimate today:")}{" "}{settings.usage.estimatedReservedUsd??0}{" "}{t("USD. Limits reset in UTC.")}</p></fieldset>
 <button className="admin-button primary" disabled={busy} onClick={()=>void act(async()=>{await request('/settings',{providers:settings.providers,defaultProviderId:settings.defaultProviderId,dailyTextLimit:settings.dailyTextLimit,dailyImageLimit:settings.dailyImageLimit,budget:settings.budget});await load();setNotice('Provider settings saved.');})}>{t("Save provider settings")}</button>
 </div></details>}
 <div className={ui.layout}><section className="admin-panel"><h3>{t("Generation request")}</h3><form className={ui.form} onSubmit={e=>{e.preventDefault();if(!providerReady||!generationAllowed){setError("Save a provider, model and API key for this task first.");return;}void act(async()=>{const result=await request<{job:Job}>('/generate',{requestId:crypto.randomUUID(),providerId,task,kind,...(record?{recordId:record.id,revision:record.revision}:{}),appIds,locale,targetLocale:locale,translationRevision,tone,brief});setJob(result.job);await load();});}}><fieldset disabled={busy||!!(job&&pending(job))} className={ui.form}>
 <AIRecordPicker label={t('Target content')} value={[target]} records={records} onRecords={rememberRecords} disabled={busy} onChange={ids=>{if(ids[0]){setTarget(ids[0]);setTask('titles');}}}/>
 <label className="admin-field"><span>{t("Provider")}</span><select required value={providerId} onChange={e=>setProviderId(e.target.value)}>{configuredProviders.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
 <label className="admin-field"><span>{t("Task")}</span><select value={task} onChange={e=>setTask(e.target.value)}>{tasks.filter(([id])=>kind==='article'||!['article','image'].includes(id)).map(([id,label])=><option key={id} value={id}>{t(label)}</option>)}</select></label>
 <label className="admin-field"><span>{t("Target language")}</span><select value={locale} onChange={e=>setLocale(e.target.value)}>{targetLocales.map(item=><option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
 <label className="admin-field"><span>{t("Tone")}</span><select value={tone} onChange={e=>setTonee(e.target.value)}><option value="neutral">{t("Neutral")}</option><option value="friendly">{t("Friendly")}</option><option value="professional">{t("Professional")}</option></select></label>
 <label className="admin-field"><span>{t("Request and scope")}</span><textarea required rows={5} value={brief} onChange={e=>setBrief(e.target.value)} /></label>
 {kind==='article'&&<AIRecordPicker label={t('Source apps')} sourceApps value={appIds} onChange={setAppIds} records={records} onRecords={rememberRecords} disabled={busy}/>}
 <p className={ui.note}>{t("Generate in the source language to edit the source draft. Other languages open a separate translation draft. Save a source article before translating it.")}</p><button className="admin-button primary" disabled={!providerReady||!generationAllowed}>{t("Generate suggestion")}</button>{!generationAllowed&&<p className={ui.note}>{t("Choose an existing source record, or the source language for a new article or cover. Translation targets must differ from the source language.")}</p>}{!providerReady&&<p className={ui.note}>{t("Choose a saved provider with a key and a suitable model. Save changed provider settings before generating.")}</p>}</fieldset></form></section>
 <section className={`admin-panel ${ui.preview}`}><h3>{t("Preview and apply")}</h3>{!job?<p className={ui.note}>{t("Generated suggestions appear here.")}</p>:<><p className={ui.note}>{t(taskLabel(job.task))}{" "}{t("·")}{" "}{t(statusLabels[job.status]||"Unknown status")}{" "}{t("·")}{" "}{job.model}<br/>{t("Target:")}{" "}{job.target.id||t("New source article")}{" "}{t("· Language:")}{" "}{jobLocale(job)||t("unverified")}</p>{job.error&&<p role="alert">{job.error}</p>}{job.warnings?.map((warning,i)=><p key={i} className={ui.note}>{warning}</p>)}{job.previewUrl&&<img src={job.previewUrl} alt={t("Generated cover preview")}/>}{Array.isArray(job.result?.titles)&&job.result.titles.map((title,i)=><label className={ui.choice} key={i}><input type="radio" name="ai-title" checked={titleIndex===i} onChange={()=>setTitleIndex(i)}/>{String(title)}</label>)}{previewFields(job).map(([key,value])=><div key={key}><label className={ui.choice}><input type="checkbox" checked={fields.includes(key)} onChange={e=>setFields(e.target.checked?[...fields,key]:fields.filter(f=>f!==key))}/>{t(fieldLabels[key]||"Content")}</label>{key==='sections'&&Array.isArray(value)?<div>{value.map((section,index)=><section key={index}><h4>{section.heading}</h4>{Array.isArray(section.paragraphs)&&section.paragraphs.map((paragraph:string,i:number)=><p className={ui.note} key={i}>{paragraph}</p>)}</section>)}</div>:<p className={ui.note} style={{whiteSpace:'pre-wrap'}}>{previewText(key,value)}</p>}</div>)}{job.usage!==undefined&&<p className={ui.note}>{t("Provider-reported usage:")}{" "}{typeof job.usage==='object'&&job.usage!==null?Object.entries(job.usage as Record<string,unknown>).filter(([key,value])=>['input_tokens','output_tokens','total_tokens','prompt_tokens','completion_tokens'].includes(key)&&typeof value==='number').map(([key,value])=>`${({input_tokens:'Input tokens',output_tokens:'Output tokens',total_tokens:'Total tokens',prompt_tokens:'Input tokens',completion_tokens:'Output tokens'} as Record<string,string>)[key]}: ${value}`).join(' · ')||t("Token totals were not reported."):t("Token totals were not reported.")}</p>}{Array.isArray(job.result?.warnings)&&job.result.warnings.filter((warning):warning is string=>typeof warning==='string').map((warning,i)=><p className={ui.note} key={`result-warning:${i}`}>{warning}</p>)}{job.result&&<StructuredResult job={job}/>}
 {job.cost&&<p className={ui.note}>{t("Estimated reservation:")}{" "}{job.cost.reserved} {job.cost.currency}{" "}{t(". Admin-configured estimate, not a provider invoice. Pending or uncertain requests retain their reservation.")}</p>}
 {job.task==='impact'&&job.status==='completed'&&<label className={ui.choice}><input type="checkbox" checked={confirmImpact} onChange={e=>setConfirmImpact(e.target.checked)}/>{t("I reviewed the impact and want to prepare an unsaved update draft.")}</label>}
 {job.status==='completed'&&!analysisOnly(job.task)&&<button className="admin-button primary" disabled={busy||(job.task==='impact'&&!confirmImpact)||(!['translation','impact'].includes(job.task)&&!fields.length&&!Array.isArray(job.result?.titles))} onClick={()=>void act(apply)}>{jobLocale(job)===((records.find(r=>r.kind===job.target.kind&&r.id===job.target.id) as ManagedRecord & {sourceLocale?:string})?.sourceLocale||(job.target.id?'tr':defaultSourceLocale))?t("Apply selected fields to source draft"):t("Open translation draft")}</button>}{['failed','uncertain','cancelled'].includes(job.status)&&<div>{job.status==='uncertain'&&<label className={ui.choice}><input type="checkbox" checked={acknowledgeCharge} onChange={event=>setAcknowledgeCharge(event.target.checked)}/>{t("The previous request may already have incurred a charge. I explicitly authorize a new attempt.")}</label>}<button className="admin-button" disabled={busy||(job.status==='uncertain'&&!acknowledgeCharge)} onClick={()=>void act(async()=>{const value=await request<{job:Job}>('/jobs',{action:'retry',jobId:job.id,requestId:crypto.randomUUID(),acknowledgePossibleCharge:acknowledgeCharge});setJob(value.job);await load();})}>{t("Retry as a new request")}</button></div>}
 {job.status==='pending'&&<button className="admin-button" disabled={busy} onClick={()=>void act(async()=>{await request('/jobs',{action:'cancel',jobId:job.id});const value=await load();setJob(value.jobs.find(item=>item.id===job.id)||null);})}>{t("Cancel waiting request")}</button>}
 {!pending(job)&&!job.archived&&<button className="admin-button" disabled={busy} onClick={()=>void act(async()=>{await request('/jobs',{action:'archive',jobId:job.id});const value=await load();setJob(value.jobs.find(item=>item.id===job.id)||null);})}>{t("Archive request")}</button>}
 {!pending(job)&&job.createdAt.slice(0,10)<new Date().toISOString().slice(0,10)&&<button className="admin-button" disabled={busy} onClick={()=>{if(!window.confirm(t("Delete this historical request? This does not refund provider charges.")))return;void act(async()=>{await request('/jobs',{action:'delete',jobId:job.id});setJob(null);await load();});}}>{t("Delete historical request")}</button>}
 {pending(job)&&<button className="admin-button" disabled={busy} onClick={()=>void act(async()=>{const result=await request<{job:Job}>('/poll',{id:job.id});setJob(result.job);})}>{t("Refresh status")}</button>}</>}
 {settings&&settings.jobs.length>0&&<><h3>{t("Previous requests")}</h3>{settings.jobs.map(item=><button className="admin-row-link" disabled={busy} key={item.id} onClick={()=>setJob(item)}><span>{t(taskLabel(item.task))}{" "}{t("·")}{" "}{item.target.id||t("New source article")}</span><small>{t(statusLabels[item.status]||"Unknown status")}</small></button>)}</>}
 </section></div></div>;
}

function StructuredResult({job}:{job:Job}) {
 const {t,intlLocale}=useI18n();

 const result=job.result||{};
 const text=(value:unknown)=>typeof value==='string'?value:'';
 const rows=(value:unknown):Record<string,unknown>[]=>Array.isArray(value)?value.filter(item=>item&&typeof item==='object') as Record<string,unknown>[]:[];
 const refs=(value:unknown)=><ul>{rows(value).map((ref,i)=><li key={i}><code>{text(ref.recordId)}</code>{t("·")}{" "}{text(ref.field)}</li>)}</ul>;
 if(job.task==='translation')return <div><h4>{t("Translated source fields")}</h4>{rows(result.fields).map((field,i)=><div key={i}><strong>{text(field.path)}</strong><p className={ui.note}>{text(field.text)}</p></div>)}</div>;
 if(job.task==='claims')return <div><h4>{t("Claims to review")}</h4>{rows(result.claims).map((claim,i)=><section key={i}><p>{text(claim.text)}</p>{refs(claim.references)}</section>)}<h4>{t("Evidence gaps")}</h4>{rows(result.gaps).map((gap,i)=><p key={i}>{text(gap.question)}{" "}{t("—")}{" "}{text(gap.reason)}</p>)}<p className={ui.note}>{t("Analysis only. References identify selected source fields; they are not independent verification.")}</p></div>;
 if(job.task==='brief')return <div><h4>{text(result.title)}</h4><p>{text(result.audience)}</p>{rows(result.outline).map((row,i)=><section key={i}><h4>{text(row.heading)}</h4><ul>{Array.isArray(row.questions)&&row.questions.map((q,j)=><li key={j}>{text(q)}</li>)}</ul></section>)}{refs(result.references)}<p className={ui.note}>{t("Planning only. This brief does not create or publish an article.")}</p></div>;
 if(job.task==='qa')return <div><p className={ui.note}>{text(result.answer)}</p>{refs(result.references)}<h4>{t("Evidence gaps")}</h4><ul>{Array.isArray(result.gaps)&&result.gaps.map((gap,i)=><li key={i}>{text(gap)}</li>)}</ul><p className={ui.note}>{t("Answer limited to selected sources; no external product test was performed.")}</p></div>;
 if(job.task==='impact')return <div><p>{text(result.summary)}</p><h4>{t("Affected fields")}</h4><ul>{Array.isArray(result.affectedFields)&&result.affectedFields.map((field,i)=><li key={i}>{text(field)}</li>)}</ul>{rows(result.suggestedUpdates).map((update,i)=><section key={i}><h4>{text(update.field)}</h4><p className={ui.note}>{text(update.text)}</p>{refs(update.references)}</section>)}</div>;
 return null;
}
