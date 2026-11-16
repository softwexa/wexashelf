import { useEffect, useRef, useState } from 'react';
import { fetchCatalog, type CatalogPage } from '@/lib/catalog-api';
import { filtersToParams } from '@/lib/discovery';


import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { Search } from "lucide-react";
import { CATEGORIES } from "../../lib/catalog";
import type { AppRecord } from "../../lib/domain";
import {
  EMPTY_FILTERS,
  PRICING_LABELS,
  discoverApps,
  suggestQuery,
  type DiscoveryFilters,
} from "../../lib/discovery";
import { AppCard, Heading, type AppActions } from "./Shared";
export function DiscoveryPage({
  apps,
  filters,
  onFilters,
  isSaved = false,
  title,
  unavailableCount = 0,
  serverCatalog = false,
  initialPage,
  onResults,
  ...actions
}: {
  apps: AppRecord[];
  filters: DiscoveryFilters;
  onFilters: (filters: DiscoveryFilters) => void;
  isSaved?: boolean;
  title?: string;
  unavailableCount?: number;
  serverCatalog?: boolean;
  initialPage?: {items:{id:string}[];total:number;page:number;pages:number};
  onResults?: (page:CatalogPage) => void;
} & AppActions) {
  const { t, locale, formatDate, formatNumber, countryName } = useI18n();
  const [remote,setRemote]=useState<CatalogPage|null>(null);
  const [page,setPage]=useState(initialPage?.page || 1);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const filterKey=filtersToParams(filters).toString();
  const previousFilters=useRef(filterKey);
  useEffect(()=>{if(previousFilters.current!==filterKey){previousFilters.current=filterKey;setPage(1);}},[filterKey]);
  useEffect(()=>{
    if(!serverCatalog||isSaved)return;
    const abort=new AbortController();setLoading(true);setError('');
    const timer=setTimeout(()=>{const params=new URLSearchParams(filterKey);params.set('locale',locale);params.set('page',String(page));
      fetchCatalog(params,abort.signal).then(data=>{setRemote(data);onResults?.(data);}).catch(e=>{if(!abort.signal.aborted)setError(e.message);}).finally(()=>{if(!abort.signal.aborted)setLoading(false);});},180);
    return()=>{clearTimeout(timer);abort.abort();};
  },[serverCatalog,isSaved,filterKey,page,locale]);
  const results = serverCatalog&&!isSaved ? (remote?.items || apps.filter(app=>initialPage?.items.some(row=>row.id===app.id))) : discoverApps(apps, filters);
  const total=serverCatalog&&!isSaved?(remote?.total??initialPage?.total??results.length):results.length;
  const pages=remote?.pages??initialPage?.pages??1;
  const suggestion = !results.length
    ? suggestQuery(apps, filters.query)
    : undefined;
  const tags = [...new Set(apps.flatMap((a) => a.tags))].sort((a, b) =>
    a.localeCompare(b, "tr"),
  );
  const update = (patch: Partial<DiscoveryFilters>) =>
    onFilters({ ...filters, ...patch });
  return (
    <>
      <Heading
        eyebrow={isSaved ? t("Kendi koleksiyonun") : t("Uygulama rehberi")}
        title={
          title ||
          (isSaved ? t("Bir kenara ayırdıkların.") : t("İhtiyacına göre keşfet."))
        }
        description={
          isSaved
            ? t("Kaydettiğin uygulamalar bu tarayıcıda seni bekler. Tarayıcı verileri temizlenirse bu kayıtlar silinir.")
            : t("Cihazlarını ve kullanım alanını seç; kaynaklarıyla karar ver.")
        }
      />
      {isSaved && unavailableCount > 0 && (
        <div className="notice unavailable-saved" role="status">
          {unavailableCount}{" "}{t("kaydedilmiş uygulama şu anda katalogda görünmüyor. Kayıtlarını koruduk; uygulamalar yeniden görünür olduğunda burada yer alacak.")}</div>
      )}
      <div className="category-filters" aria-label={t("Kategoriler")}>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            aria-pressed={filters.category === c.id}
            onClick={() => update({ category: c.id })}
          >
            {t(c.label)}
          </button>
        ))}
      </div>
      <details className="advanced-filters">
        <summary>{t("Filtreleri genişlet")}</summary>
        <div className="filter-fields">
          <label>{t("Platform eşleşmesi")}<select
              value={filters.platformMode}
              onChange={(e) =>
                update({ platformMode: e.target.value as "any" | "all" })
              }
            >
              <option value="any">{t("Seçilenlerden en az biri")}</option>
              <option value="all">{t("Seçilenlerin tamamı")}</option>
            </select>
          </label>
          <label>{t("Etiket")}<select
              value={filters.tag}
              onChange={(e) => update({ tag: e.target.value })}
            >
              <option value="">{t("Tüm etiketler")}</option>
              {tags.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>{t("Fiyat modeli")}<select
              value={filters.pricing}
              onChange={(e) =>
                update({
                  pricing: e.target.value as DiscoveryFilters["pricing"],
                })
              }
            >
              <option value="all">{t("Tümü")}</option>
              {Object.entries(PRICING_LABELS).map(([id, label]) => (
                <option value={id} key={id}>
                  {t(label)}
                </option>
              ))}
            </select>
          </label>
          <label>{t("İstemediğim fiyat modeli")}<select
              value={filters.excludePricing}
              onChange={(e) =>
                update({
                  excludePricing: e.target
                    .value as DiscoveryFilters["excludePricing"],
                })
              }
            >
              <option value="">{t("Hariç tutma yok")}</option>
              {Object.entries(PRICING_LABELS)
                .filter(([id]) => id !== "unknown")
                .map(([id, label]) => (
                  <option value={id} key={id}>
                    {t(label)}
                  </option>
                ))}
            </select>
          </label>
          <label>{t("Sıralama")}<select
              value={filters.order}
              onChange={(e) =>
                update({ order: e.target.value as DiscoveryFilters["order"] })
              }
            >
              <option value="relevance">{t("Arama eşleşmesi")}</option>
              <option value="name">{t("Uygulama adı")}</option>
              <option value="freshness">{t("Son kaynak kontrolü")}</option>
            </select>
          </label>
          <label>{t("Android indirme alt sınırı")}<select
              value={filters.minimumDownloads}
              onChange={(e) =>
                update({ minimumDownloads: Number(e.target.value) })
              }
            >
              <option value="0">{t("Alt sınır yok")}</option>
              <option value="10000">10.000+</option>
              <option value="100000">100.000+</option>
              <option value="1000000">1.000.000+</option>
            </select>
          </label>
        </div>
        <label className="check-label">
          <input
            type="checkbox"
            checked={filters.includeUnknownDownloads}
            onChange={(e) =>
              update({ includeUnknownDownloads: e.target.checked })
            }
          />{t("İndirme bilgisi olmayanları da dahil et")}</label>
        <p className="settings-note">{t("İndirme filtresi yalnız kaynaklı Google Play / Türkiye alt sınırını kullanır. Apple ve Windows indirmeleri varsayılmaz. Hariç tutma filtresinde fiyat modeli bilinmeyenler eşleşme sayılmaz.")}</p>
      </details>
      <div className="filter-chips" aria-label={t("Etkin filtreler")}>
        {filters.tag && (
          <button onClick={() => update({ tag: "" })}>{t("Etiket:")}{filters.tag} ×
          </button>
        )}
        {filters.pricing !== "all" && (
          <button onClick={() => update({ pricing: "all" })}>
            {t(PRICING_LABELS[filters.pricing])} ×
          </button>
        )}
        {filters.excludePricing && (
          <button onClick={() => update({ excludePricing: "" })}>
            {t(PRICING_LABELS[filters.excludePricing])}{" "}{t("hariç ×")}</button>
        )}
        {filters.minimumDownloads > 0 && (
          <button onClick={() => update({ minimumDownloads: 0 })}>{t("Android TR:")}{" "}{formatNumber(filters.minimumDownloads)}+ ×
          </button>
        )}
        {filters.platforms.length > 1 && (
          <button
            onClick={() =>
              update({
                platformMode: filters.platformMode === "all" ? "any" : "all",
              })
            }
          >{t("Platform:")}{" "}
            {filters.platformMode === "all"
              ? t("tümü gerekli")
              : t("en az biri yeterli")}
          </button>
        )}
      </div>
      <div className="result-toolbar">
        <p className="result-count" aria-live="polite">
          {formatNumber(total)}{" "}{t("uygulama")}{filters.query ? ` · “${filters.query}”` : ""}
        </p>
        <button
          className="text-button"
          onClick={() => onFilters({ ...EMPTY_FILTERS })}
        >{t("Filtreleri temizle")}</button>
      </div>
      {loading&&<p role="status">{t("Loading apps…")}</p>}
      {error&&<p role="alert">{t("Could not load the catalog. Please try again.")} {error}</p>}
      {results.length ? (
        <div className="catalog-grid">
          {results.map((app) => (
            <AppCard key={app.id} app={app} {...actions} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={28} />
          <h2>
            {isSaved && !apps.length && unavailableCount > 0
              ? t("Kaydettiklerin geçici olarak görünmüyor.")
              : isSaved && !apps.length
                ? t("İlk uygulamanı kaydet.")
                : t("Bu filtrelerle uygulama bulunamadı.")}
          </h2>
          <p>
            {isSaved && !apps.length
              ? t("Uygulama kartlarındaki yer imi simgesine dokun.")
              : t("Filtreleri koruduk. İstersen bir koşulu kaldırarak yeniden deneyebilirsin.")}
          </p>
          {suggestion && (
            <button
              className="button button-secondary"
              onClick={() => update({ query: suggestion })}
            >
              “{suggestion}{" "}{t("” mı demek istedin?")}</button>
          )}
          <Link className="button button-primary" href="/kesfet">{t("Uygulamaları keşfet")}</Link>
        </div>
      )}
      {serverCatalog&&!isSaved&&pages>1&&<nav className="result-toolbar" aria-label={t("Catalog pages")}>
        <button className="button button-secondary" disabled={loading||page<=1} onClick={()=>setPage(page-1)}>{t("Previous page")}</button>
        <span>{formatNumber(page)} / {formatNumber(pages)}</span>
        <button className="button button-secondary" disabled={loading||page>=pages} onClick={()=>setPage(page+1)}>{t("Next page")}</button>
      </nav>}
    </>
  );
}
