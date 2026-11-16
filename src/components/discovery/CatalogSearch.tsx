import {useState} from 'react';
import {useI18n} from '@/lib/i18n';
import {fetchCatalog,type CatalogPage} from '@/lib/catalog-api';
export function CatalogSearch({onResults,count}:{onResults:(page:CatalogPage)=>void;count:number}){
 const {t,locale,formatNumber}=useI18n();const [query,setQuery]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [results,setResults]=useState<CatalogPage|null>(null);
 return <section className="home-panel"><h2>{t('Find apps for this tool')}</h2><p>{t('This tool uses the apps loaded below. Search the full catalog to add more.')}{' '}{formatNumber(count)}</p>
 <form className="result-toolbar" onSubmit={async event=>{event.preventDefault();setBusy(true);setError('');try{setResults(await fetchCatalog(new URLSearchParams({locale,q:query})));}catch(e){setError(e instanceof Error?e.message:t('Could not load the catalog. Please try again.'));}finally{setBusy(false);}}}>
 <label>{t('Uygulama ara')}<input type="search" maxLength={200} value={query} onChange={event=>setQuery(event.target.value)}/></label><button className="button button-primary" disabled={busy}>{t('Ara')}</button></form>
 {error&&<p role="alert">{error}</p>}{results&&<><p role="status">{formatNumber(results.total)} {t('uygulama')}</p><div className="category-filters">{results.items.map(app=><button key={app.id} onClick={()=>onResults({...results,items:[app]})}>{app.name} +</button>)}</div></>}
 </section>;
}
