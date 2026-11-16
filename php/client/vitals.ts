import { onCLS, onINP, onLCP, type Metric } from 'web-vitals';
type Config={enabled:boolean;sampleRate:number;endpoint:string;locale:string;pageType:string;theme:string};
const element=document.getElementById('wexa-performance');
if(element){try{const config=JSON.parse(element.textContent||'{}') as Config;
 if(config.enabled&&Math.random()<config.sampleRate){const send=(metric:Metric)=>{const body=JSON.stringify({id:metric.id,metric:metric.name,value:metric.value,locale:config.locale,pageType:config.pageType,device:matchMedia('(max-width: 767px)').matches?'mobile':'desktop',theme:config.theme});const blob=new Blob([body],{type:'application/json'});if(!navigator.sendBeacon?.(config.endpoint,blob))void fetch(config.endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});};onCLS(send);onINP(send);onLCP(send);}
}catch{/* Optional measurement must never interrupt the page. */}}
