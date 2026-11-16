import type { AppRecord,AppPlan,EvidenceState } from './domain';
import type { Platform } from './catalog';
export type SourcedCapability={sourceUrl:string;checkedAt:string};
export type CapabilityQuota=SourcedCapability&{planId:string;metric:string;limit:number|null;unit:string;period:'month'|'day'|'total';scope:'account'|'seat';platform:Platform};
export type CapabilityFormat=SourcedCapability&{extension:string;modes:('open'|'edit'|'import'|'export')[];platform:Platform};
export type CapabilityAvailability=SourcedCapability&{platform:Platform;country:string;minOs:string;devices:string[];state:EvidenceState};
export type CapabilityPrivacy=SourcedCapability&{key:'account'|'ads'|'tracking'|'local-storage'|'export';state:EvidenceState;notes:Record<string,string>};
export type CapabilityMigration=SourcedCapability&{toAppId:string;dimension:'notes'|'attachments'|'tags'|'links'|'history'|'tasks';state:EvidenceState;notes:Record<string,string>};
export type AppCapabilities={revision:number;updatedAt:string;stale?:boolean;quotas:CapabilityQuota[];formats:CapabilityFormat[];availability:CapabilityAvailability[];privacy:CapabilityPrivacy[];migrations:CapabilityMigration[];changes:{id:string;at:string;summary:Record<string,string>;fields:string[]}[]};
export type CapabilityMap=Record<string,AppCapabilities>;
export function hasCapabilityEvidence(row:SourcedCapability):boolean{try{return ['http:','https:'].includes(new URL(row.sourceUrl).protocol)&&!!row.checkedAt&&Number.isFinite(Date.parse(row.checkedAt));}catch{return false;}}
export type UsageCandidate={app:AppRecord;plan:AppPlan;state:'eligible'|'excluded'|'verify';reasons:string[];quota?:CapabilityQuota;members?:CapabilityQuota;monthlyTotal:number|null};
export function findUsagePlans(apps:AppRecord[],capabilities:CapabilityMap,request:{people:number;ocrPages:number;platform:Platform}):UsageCandidate[]{
 if(!Number.isSafeInteger(request.people)||request.people<1||request.people>10000||!Number.isSafeInteger(request.ocrPages)||request.ocrPages<0)return [];
 const results:UsageCandidate[]=[];
 for(const app of apps)for(const plan of app.plans){
  if(!plan.platforms.includes(request.platform))continue;
  const cap=capabilities[app.id],reasons:string[]=[];let excluded=false;
  const quota=cap?.quotas.find(q=>q.planId===plan.id&&q.metric==='ocr-pages'&&q.unit==='pages'&&q.period==='month'&&q.platform===request.platform);
  const members=cap?.quotas.find(q=>q.planId===plan.id&&q.metric==='members'&&q.platform===request.platform);
  if(!hasCapabilityEvidence(plan))reasons.push('The plan price source is unverified.');
  if(cap?.stale)reasons.push('Source changed; capability review is required.');
  if(request.ocrPages>0){if(!quota||!hasCapabilityEvidence(quota)||quota.limit===null)reasons.push('The monthly OCR allowance is unverified.');else if(!cap?.stale&&quota.limit<(quota.scope==='seat'?Math.ceil(request.ocrPages/request.people):request.ocrPages)){excluded=true;reasons.push('The recorded OCR allowance is below your requested usage.');}}
  if(request.people>1){if(!members||!hasCapabilityEvidence(members)||members.limit===null||members.scope!=='account')reasons.push('Team membership capacity is unverified.');else if(!cap?.stale&&members.limit<request.people){excluded=true;reasons.push('The recorded member limit is below your team size.');}}
  if(!cap&&request.people===1&&request.ocrPages===0)reasons.push('No structured capability review is available.');
  results.push({app,plan,state:excluded?'excluded':reasons.length?'verify':'eligible',reasons,quota,members,monthlyTotal:plan.monthlyPrice===null||!hasCapabilityEvidence(plan)?null:plan.monthlyPrice*(plan.perSeat?request.people:1)});
 }
 return results;
}
export function findFormats(apps:AppRecord[],capabilities:CapabilityMap,request:{extension:string;mode:CapabilityFormat['modes'][number];platform:Platform}){
 const extension=request.extension.trim().replace(/^\./,'').toLowerCase();if(!/^[a-z0-9][a-z0-9+-]{0,19}$/.test(extension))return [];
 return apps.flatMap(app=>(capabilities[app.id]?.formats||[]).filter(row=>row.extension.replace(/^\./,'').toLowerCase()===extension&&row.platform===request.platform&&row.modes.includes(request.mode)).map(row=>({app,row,verified:!capabilities[app.id]?.stale&&hasCapabilityEvidence(row)})));
}
export const migrationDimensions=['notes','attachments','tags','links','history','tasks'] as const;
export function migrationMatrix(capability:AppCapabilities|undefined,toAppId:string){return migrationDimensions.map(dimension=>{const row=capability?.migrations.find(item=>item.toAppId===toAppId&&item.dimension===dimension);return {dimension,row,state:row&&!capability?.stale&&hasCapabilityEvidence(row)?row.state:'unknown' as EvidenceState};});}
