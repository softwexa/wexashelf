import { createRoot } from 'react-dom/client';
import AdminWorkspace from '../../src/components/admin/AdminWorkspace';
import {registerRuntimeLocalePacks,localeRegistry} from '../../src/lib/i18n-registry';
import { bootstrap, prefixRenderedLinks } from './runtime';
import './styles.css';
import '../../src/app/yonetim/admin.css';

const localeErrors=registerRuntimeLocalePacks(bootstrap.runtimeLocalePacks);
if(localeErrors.length)console.error('Runtime language packs rejected:',localeErrors);
const runtimeFetch=window.fetch.bind(window);
window.fetch=(input,init)=>{
 const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
 if(/(?:^|\/)api\/admin(?:[/?]|$)/.test(url)){
  let locale='en';try{const saved=localStorage.getItem('wexashelf.admin.locale');if(saved&&localeRegistry[saved])locale=saved;}catch{}
  const headers=new Headers(input instanceof Request?input.headers:init?.headers);
  if(input instanceof Request&&init?.headers)new Headers(init.headers).forEach((value,key)=>headers.set(key,value));
  headers.set('Accept-Language',locale);return runtimeFetch(input,{...init,headers});
 }
 return runtimeFetch(input,init);
};
document.body.classList.add('admin-document');
const root = document.getElementById('wexa-root')!;
prefixRenderedLinks(root);
createRoot(root).render(<AdminWorkspace />);
