import type { AppRecord } from './domain';
import type { CapabilityMap } from './capabilities';
import type { StoreObservation } from './recorded-trends';
export type CatalogPage = {items:AppRecord[];total:number;page:number;pageSize:number;pages:number;hasMore:boolean;localizedPaths:Record<string,string>;capabilities:CapabilityMap;storeObservations:StoreObservation[]};
export async function fetchCatalog(params:URLSearchParams,signal?:AbortSignal):Promise<CatalogPage>{
 const response=await fetch(`/api/catalog?${params}`,{signal});const data=await response.json();if(!response.ok)throw new Error(data.error||'Catalog request failed.');
 if(!Array.isArray(data.items)||!Number.isSafeInteger(data.total))throw new Error('Invalid catalog response.');
 window.dispatchEvent(new CustomEvent('wexa:catalog-paths',{detail:data.localizedPaths}));return data;
}
