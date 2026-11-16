"use client";
import {useEffect,useRef,useState} from 'react';
import {useI18n} from '@/lib/i18n';
import {appIconUrl} from '@/lib/asset-url';
export default function AppIconUpload({name,icon,disabled,onChange,onBusy}:{name:string;icon:string;disabled:boolean;onChange:(icon:string)=>void;onBusy:(busy:boolean)=>void}){
 const {t}=useI18n();const [error,setError]=useState('');const pending=useRef<AbortController|null>(null);
 useEffect(()=>()=>pending.current?.abort(),[]);
 async function upload(file:File){
  setError('');if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024){setError(t('Choose a PNG, JPEG or WebP icon no larger than 2 MiB.'));return;}
  const controller=new AbortController();pending.current=controller;onBusy(true);let objectUrl='';
  try{
   objectUrl=URL.createObjectURL(file);const image=new Image();image.src=objectUrl;await image.decode();if(controller.signal.aborted)return;
   if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth>4096||image.naturalHeight>4096||image.naturalWidth*image.naturalHeight>12000000)throw Error(t('The image dimensions exceed the supported limit.'));
   const scale=Math.min(1,256/Math.max(image.naturalWidth,image.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));const context=canvas.getContext('2d');if(!context)throw Error(t('The icon could not be prepared.'));context.drawImage(image,0,0,canvas.width,canvas.height);
   const data=canvas.toDataURL('image/webp',0.92);if(!data.startsWith('data:image/webp;base64,'))throw Error(t('The icon could not be prepared.'));
   const response=await fetch('/api/admin/media',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({base64:data.split(',')[1],alt:name.trim()||t('Application icon'),caption:''}),signal:controller.signal});const result=await response.json();if(!response.ok)throw Error(result.error||t('The icon could not be uploaded.'));if(!controller.signal.aborted)onChange(`/media/${result.image.assetId}.webp`);
  }catch(reason){if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:t('The icon could not be uploaded.'));}finally{if(objectUrl)URL.revokeObjectURL(objectUrl);if(!controller.signal.aborted)onBusy(false);pending.current=null;}
 }
 const media=/^\/media\/([a-f0-9]{64})\.(png|jpg|webp)$/.exec(icon);
 return <div className="admin-field"><label><span>{t('Upload application icon')}</span><input type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled} onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void upload(file);}}/></label><small>{t('Use the publisher’s real icon. Images are resized to at most 256 pixels. Uploading changes only this unsaved form.')}</small>{error&&<p role="alert" className="admin-error">{error}</p>}{media&&<img src={appIconUrl(`/api/admin/media?id=${media[1]}&format=${media[2]}`)} alt={name.trim()||t('Application icon')} width={64} height={64} style={{objectFit:'contain'}}/>}</div>;
}
