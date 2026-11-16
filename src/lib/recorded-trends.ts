import type {Platform} from './catalog';
export type StoreObservation={appId:string;storeId:string|null;platform:Platform;country:string;observedAt:string;sourceUrl:string;rating:number|null;ratingCount:number|null;downloadsLowerBound:number|null};
export function recordedTrends(rows:StoreObservation[],metric:'ratingCount'|'downloadsLowerBound',days:number|null,platform:Platform,country:string,now=Date.now()){
 const groups=new Map<string,StoreObservation[]>();
 for(const row of rows){const time=Date.parse(row.observedAt);if(row.platform!==platform||row.country!==country||!row.storeId||!Number.isFinite(time)||time>now||(days!==null&&time<now-days*86400000)||row[metric]===null)continue;const key=JSON.stringify([row.appId,row.storeId,row.country,row.platform]);groups.set(key,[...(groups.get(key)||[]),row]);}
 return [...groups.values()].flatMap(items=>{items.sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt));const first=items[0],last=items.at(-1)!;if(Date.parse(first.observedAt)===Date.parse(last.observedAt))return [];return [{first,last,samples:items.length,delta:last[metric]!-first[metric]!}];}).sort((a,b)=>b.delta-a.delta||a.last.appId.localeCompare(b.last.appId));
}
