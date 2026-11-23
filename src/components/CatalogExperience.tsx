"use client";

import { useI18n } from "@/lib/i18n";

import { DEFAULT_LOCALE, getLocalePack } from "@/lib/i18n-registry";
import { LocaleProvider, type LanguageAlternate } from "@/lib/i18n";
import { CapabilityTools } from "./discovery/CapabilityTools";
import type { CapabilityMap } from "@/lib/capabilities";
import { CatalogSearch } from "./discovery/CatalogSearch";
import { fetchCatalog, type CatalogPage } from "@/lib/catalog-api";
import { BRAND } from "@/lib/brand";
import { type SiteBranding } from "@/lib/branding";
import SiteBrand from "./SiteBrand";


import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Apple,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Compass,
  GitCompareArrows,
  Layers3,
  LayoutGrid,
  Menu,
  Monitor,
  Search,
  Settings2,
  Smartphone,
  X,
} from "lucide-react";
import {
  CATEGORIES,
  PLATFORM_LABELS,
  type Category,
  type Platform,
} from "../lib/catalog";
import type { AppRecord, CatalogSnapshot } from "../lib/domain";
import {
  parseFilters,
  filtersToParams,
  sanitizeStoredIds,
  type DiscoveryFilters,
} from "../lib/discovery";
import {
  DEFAULT_THEME,
  getThemeTemplate,
  getThemePresentation,
  parseThemeManifest,
  themeToStyle,
  type ThemeManifest,
} from "../lib/themes";
import {
  DEFAULT_ENABLED_PLUGINS,
  normalizeEnabledPlugins,
} from "../lib/plugins";
import { ThemeSettings } from "./ThemeSettings";
import { AppIcon, Heading } from "./discovery/Shared";
import { HomePage } from "./discovery/HomePage";
import { DiscoveryPage } from "./discovery/DiscoveryPage";
import { AppDetail, ComparisonPage } from "./discovery/CatalogDetail";
import { SelectionWizard, CostCalculator } from "./discovery/DecisionTools";
import { EditorialPages } from "./discovery/EditorialPages";
import { PublisherPages } from "./discovery/PublisherPages";
import { PersonalCollections } from "./discovery/PersonalCollections";
import AppSubmission from "./discovery/AppSubmission";
import type { SubmissionConfig } from "@/lib/app-submissions";
import ExtensionBlocks from "./ExtensionBlocks";
import { DEFAULT_SITE_SETTINGS, parseSiteSettings } from "../lib/site-settings";

export type ExtensionCard = {moduleId:string;id:string;title:string;description:string;href:string};
type Props = {
  previewMode?: boolean;
  locale?: string;
  translationStale?: boolean;
  languageAlternates?: LanguageAlternate[];
  localizedPaths?: Record<string,string>;
  catalog: CatalogSnapshot & {serverCatalog?:boolean;pagination?:{items:{id:string}[];total:number;page:number;pages:number};publisherDirectory?:{slug:string;name:string;appCount:number;platforms:Platform[]}[];publisherQuery?:string;extensionCards?: ExtensionCard[];capabilities?:CapabilityMap;storeObservations?:import("@/lib/recorded-trends").StoreObservation[]};
  path: string[];
  initialQuery: string;
  initialPlatform: Platform | "all";
  initialCategory: Category;
  initialCompare: string[];
  initialCompareSpecified: boolean;
  children?: React.ReactNode;
  showDeveloperCredit?: boolean;
  basePath?: string;
  siteName?: string;
  branding?: SiteBranding;
  submissionConfig?: SubmissionConfig;
};
export default function CatalogExperience(props: Props) { return <LocaleProvider locale={props.locale}><CatalogWorkspace {...props} /></LocaleProvider>; }
function CatalogWorkspace({
  catalog: initialCatalog,
  previewMode = false,
  path,
  initialQuery,
  initialCategory,
  initialCompare,
  initialCompareSpecified,
  children,
  showDeveloperCredit = true,
  basePath = "",
  siteName,
  branding,
  submissionConfig,
  locale = DEFAULT_LOCALE,
  translationStale = false,
  languageAlternates = [],
}: Props) {
  const { t, formatDate, formatNumber, countryName } = useI18n();
  const [catalog,setCatalog]=useState(initialCatalog);
  const siteIdentityName = siteName || initialCatalog.siteName || BRAND.name;
  const siteBranding = branding || initialCatalog.branding;
  const [referenceLoading,setReferenceLoading]=useState(false);
  const [referenceError,setReferenceError]=useState('');
  useEffect(()=>setCatalog(initialCatalog),[initialCatalog]);
  const mergePage=(page:CatalogPage)=>setCatalog(previous=>({...previous,apps:[...new Map([...previous.apps,...page.items].map(app=>[app.id,app])).values()],capabilities:{...previous.capabilities,...page.capabilities},storeObservations:[...new Map([...(previous.storeObservations||[]),...page.storeObservations].map(row=>[`${row.appId}:${row.platform}:${row.country}:${row.observedAt}`,row])).values()]}));
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const route = path[0] || "home";
  const appById = (id: string) => catalog.apps.find((app) => app.id === id);
  const cleanIds = sanitizeStoredIds;
  const selectedApps = (ids: string[]) =>
    ids.map(appById).filter((app): app is AppRecord => !!app);
  const [query, setQuery] = useState(initialQuery);
  const [saved, setSaved] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>(
    cleanIds(initialCompare).slice(0, 4),
  );
  useEffect(()=>{
    if(!catalog.serverCatalog)return;
    let references=route==='kaydedilenler'?[...saved]:[...compare];if(route==='kaydedilenler')try{const collections=JSON.parse(localStorage.getItem('app-guide.collections.v1')||'[]');if(Array.isArray(collections))references.push(...collections.slice(0,32).flatMap(row=>Array.isArray(row?.appIds)?row.appIds.slice(0,100):[]));}catch{}const ids=sanitizeStoredIds(references,4200).filter(id=>!catalog.apps.some(app=>app.id===id));if(!ids.length){setReferenceLoading(false);return;}setReferenceLoading(true);setReferenceError('');
    const abort=new AbortController();
    (async()=>{for(let start=0;start<ids.length;start+=100){const params=new URLSearchParams({locale,ids:ids.slice(start,start+100).join(','),limit:'100'});const page=await fetchCatalog(params,abort.signal);mergePage(page);}})().catch(error=>{if(!abort.signal.aborted)setReferenceError(error.message);}).finally(()=>{if(!abort.signal.aborted)setReferenceLoading(false);});
    return()=>abort.abort();
  },[catalog.serverCatalog,saved.join(','),compare.join(','),route,locale]);
  const siteSettings = useMemo(() => {
    const parsed = parseSiteSettings(catalog.siteSettings);
    return parsed.ok ? parsed.value : DEFAULT_SITE_SETTINGS;
  }, [catalog.siteSettings]);
  const [theme, setTheme] = useState<ThemeManifest>(siteSettings.theme);
  const [plugins, setPlugins] = useState<string[]>(siteSettings.enabledPlugins);
  const [themeOverride, setThemeOverride] = useState(false);
  const [pluginsOverride, setPluginsOverride] = useState(false);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [filterState, setFilterState] = useState<DiscoveryFilters>(() =>
    parseFilters(new URLSearchParams(searchParams.toString())),
  );
  const filters: DiscoveryFilters = {
    ...filterState,
    query,
  };
  if (route === "kategori")
    filters.category = CATEGORIES.some((c) => c.id === path[1])
      ? (path[1] as Category)
      : initialCategory;
  if (route === "etiket") filters.tag = path[1] || "";
  useEffect(() => {
    if(previewMode){setReady(true);return;}
    try {
      const read = (key: string) => {
        const value = localStorage.getItem(`app-guide.${key}.v1`);
        try {
          return value ? JSON.parse(value) : undefined;
        } catch {
          return undefined;
        }
      };
      setSaved(cleanIds(read("saved")));
      if (!initialCompareSpecified)
        setCompare(cleanIds(read("compare")).slice(0, 4));
      const parsed = parseThemeManifest(read("theme"));
      const themeFlag = read("theme.override");
      const customTheme =
        parsed.ok &&
        (themeFlag === true ||
          (themeFlag !== false &&
            JSON.stringify(parsed.value) !== JSON.stringify(DEFAULT_THEME)));
      setThemeOverride(customTheme);
      if (customTheme && parsed.ok) setTheme(parsed.value);
      const storedPlugins = read("plugins");
      const normalizedPlugins = normalizeEnabledPlugins(storedPlugins);
      const pluginsFlag = read("plugins.override");
      const customPlugins =
        Array.isArray(storedPlugins) &&
        (pluginsFlag === true ||
          (pluginsFlag !== false &&
            JSON.stringify([...normalizedPlugins].sort()) !==
              JSON.stringify([...DEFAULT_ENABLED_PLUGINS].sort())));
      setPluginsOverride(customPlugins);
      if (customPlugins) setPlugins(normalizedPlugins);
    } catch {
      setNotice(
        t("Tarayıcı tercihleri okunamadı. Bu oturumda kullanmaya devam edebilirsin."),
      );
    } finally {
      setReady(true);
    }
  }, [previewMode]);
  useEffect(() => {
    if (!ready || previewMode) return;
    try {
      for (const [key, value] of Object.entries({ saved, compare }))
        localStorage.setItem(`app-guide.${key}.v1`, JSON.stringify(value));
      for (const [key, value, overridden] of [
        ["theme", theme, themeOverride],
        ["plugins", plugins, pluginsOverride],
      ] as const) {
        if (overridden) {
          localStorage.setItem(`app-guide.${key}.v1`, JSON.stringify(value));
          localStorage.setItem(`app-guide.${key}.override.v1`, "true");
        } else {
          localStorage.removeItem(`app-guide.${key}.v1`);
          localStorage.removeItem(`app-guide.${key}.override.v1`);
        }
      }
    } catch {
      setNotice(
        t("Tarayıcı kaydı kullanılamıyor; değişiklikler yalnız bu oturumda geçerli."),
      );
    }
  }, [ready, saved, compare, theme, plugins, themeOverride, pluginsOverride, previewMode]);
  useEffect(() => {
    if (!ready) return;
    if (previewMode || !themeOverride) setTheme(siteSettings.theme);
    if (previewMode || !pluginsOverride) setPlugins(siteSettings.enabledPlugins);
  }, [ready, siteSettings, themeOverride, pluginsOverride, previewMode]);
  const queryString = searchParams.toString();
  const comparisonParam = searchParams.get("apps");
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    setFilterState(parseFilters(new URLSearchParams(queryString)));
    setDrawer(false);
  }, [pathname, queryString]);
  useEffect(() => {
    if (comparisonParam !== null)
      setCompare(cleanIds(comparisonParam.split(",")).slice(0, 4));
  }, [comparisonParam]);
  useEffect(() => {
    if (!drawer) return;
    const prior = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const nav = document.getElementById("site-navigation");
    const focusables = () =>
      Array.from(
        nav?.querySelectorAll<HTMLElement>("a[href],button:not([disabled])") ||
          [],
      ).filter((node) => node.getClientRects().length > 0);
    focusables()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawer(false);
      if (event.key === "Tab") {
        const nodes = focusables(),
          first = nodes[0],
          last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      prior?.focus();
    };
  }, [drawer]);
  const save = (id: string) =>
    setSaved((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  function updateCompare(ids: string[]) {
    setCompare(ids);
    if (route === "karsilastir")
      window.history.replaceState(
        null,
        "",
        `/karsilastir?apps=${ids.join(",")}`,
      );
  }
  function toggleCompare(id: string) {
    if (compare.includes(id))
      updateCompare(compare.filter((item) => item !== id));
    else if (compare.length < 4) updateCompare([...compare, id]);
    else
      setNotice(
        t("Aynı anda en fazla 4 uygulamayı karşılaştırabilirsin. Önce birini kaldır."),
      );
  }
  function changeFilters(next: DiscoveryFilters) {
    setFilterState(next);
    setQuery(next.query);
    const params = filtersToParams(next);
    const target = route === "kaydedilenler" ? "/kaydedilenler" : "/kesfet";
    const url = `${target}${params.size ? `?${params}` : ""}`;
    if (pathname === target) window.history.pushState(null, "", url);
    else router.push(url);
  }
  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const params = filtersToParams(filters);
    router.push(`/kesfet${params.size ? `?${params}` : ""}`);
  }
  function platformChange(value: Platform) {
    changeFilters({
      ...filters,
      platforms: filters.platforms.includes(value)
        ? filters.platforms.filter((p) => p !== value)
        : [...filters.platforms, value],
    });
  }
  const actions = { saved, compare, onSave: save, onCompare: toggleCompare };
  let body: React.ReactNode;
  if (children) body = children;
  else if (route === "home")
    body = (
      <HomePage
        catalog={catalog}
        theme={theme}
        plugins={plugins}
        {...actions}
      />
    );
  else if (route === "ayarlar")
    body = (
      <>
        <Heading
          eyebrow={t("Kendi alanın")}
          title={t("Temalar ve eklentiler")}
          description={t("Görünümü ve ana sayfandaki bölümleri kendine göre düzenle.")}
        />
        <ThemeSettings
          theme={theme}
          onThemeChange={(value) => {
            setThemeOverride(true);
            setTheme(value);
          }}
          enabledPlugins={plugins}
          onPluginsChange={(value) => {
            setPluginsOverride(true);
            setPlugins(value);
          }}
        />
        <section className="home-panel site-preference-panel">
          <div>
            <h2>
              {themeOverride || pluginsOverride
                ? t("Bu tarayıcıya özel tercihler etkin")
                : t("Site varsayılanlarını kullanıyorsun")}
            </h2>
            <p>{t("Görünüm ve bölüm seçimlerini yalnız bu tarayıcı için değiştirebilirsin. Site ayarlarına dönmek kaydedilen uygulamalarını ve koleksiyonlarını silmez.")}</p>
          </div>
          <button
            className="button button-secondary"
            disabled={!themeOverride && !pluginsOverride}
            onClick={() => {
              setThemeOverride(false);
              setPluginsOverride(false);
              setTheme(siteSettings.theme);
              setPlugins(siteSettings.enabledPlugins);
            }}
          >{t("Site ayarlarını kullan")}</button>
        </section>
      </>
    );
  else if (["kesfet", "kaydedilenler", "kategori", "etiket"].includes(route))
    body = (
      <>
        {referenceLoading&&<p role="status">{t("Loading apps…")}</p>}{referenceError&&<p role="alert">{t("Could not load the catalog. Please try again.")} {referenceError}</p>}
        <DiscoveryPage
          apps={route === "kaydedilenler" ? selectedApps(saved) : catalog.apps}
          serverCatalog={catalog.serverCatalog}
          initialPage={catalog.pagination}
          onResults={mergePage}
          filters={filters}
          onFilters={changeFilters}
          isSaved={route === "kaydedilenler"}
          unavailableCount={
            route === "kaydedilenler"&&!referenceLoading
              ? saved.filter((id) => !appById(id)).length
              : 0
          }
          title={
            route === "kategori"
              ? t("{name} uygulamaları", {name:t(CATEGORIES.find((c) => c.id === path[1])?.label || "Kategori")})
              : route === "etiket"
                ? t("“{name}” etiketi", {name:path[1]})
                : undefined
          }
          {...actions}
        />
        {route === "kaydedilenler" && (
          <PersonalCollections apps={catalog.apps} saved={saved} />
        )}
      </>
    );
  else if (route === "karsilastir")
    body = (
      <ComparisonPage
        apps={catalog.apps}
        compare={compare}
        onCompare={toggleCompare}
        onStart={() => updateCompare(catalog.apps.slice(0, 2).map((a) => a.id))}
      />
    );
  else if (route === "uygulama") {
    const app = appById(path[1]);
    body = app ? (
      <AppDetail
        app={app}
        apps={catalog.apps}
        admission={catalog.admissions?.[app.id]}
        capability={catalog.capabilities?.[app.id]}
        previewMode={previewMode}
        {...actions}
      />
    ) : (
      <Heading
        eyebrow={t("Uygulama")}
        title={t("Bu uygulama artık yayında değil.")}
        description={t("Diğer uygulamalar için keşif sayfasına dön.")}
      />
    );
  } else if (route === "yayincilar" || route === "yayinci")
    body = (
      <PublisherPages
        catalog={catalog}
        slug={route === "yayinci" ? path[1] : undefined}
      />
    );
  else if (route === "submit-app") body = <AppSubmission previewMode={previewMode} initialConfig={submissionConfig} />;
  else if (route === "araclar") body = <CapabilityTools apps={catalog.apps} capabilities={catalog.capabilities} observations={catalog.storeObservations} />;
  else if (route === "secim-sihirbazi")
    body = <SelectionWizard apps={catalog.apps} />;
  else if (route === "maliyet-hesapla")
    body = <CostCalculator apps={catalog.apps} />;
  else body = <EditorialPages path={path} catalog={catalog} basePath={basePath} {...actions} />;
  if(catalog.serverCatalog&&catalog.pagination&&catalog.pagination.pages>1&&['blog','listeler','yayincilar','yayinci'].includes(route)&&!(route==='blog'&&path[1])){
    const pageLink=(page:number)=>{const params=new URLSearchParams(searchParams.toString());params.set('page',String(page));return `?${params}`;};
    body=<>{body}<nav className="result-toolbar" aria-label={t('Catalog pages')}>
      {catalog.pagination.page>1?<a className="button button-secondary" href={pageLink(catalog.pagination.page-1)}>{t('Previous page')}</a>:<span/>}
      <span>{formatNumber(catalog.pagination.page)} / {formatNumber(catalog.pagination.pages)}</span>
      {catalog.pagination.page<catalog.pagination.pages&&<a className="button button-secondary" href={pageLink(catalog.pagination.page+1)}>{t('Next page')}</a>}
    </nav></>;
  }
  if(catalog.serverCatalog&&['karsilastir','secim-sihirbazi','maliyet-hesapla','araclar'].includes(route))body=<><CatalogSearch count={catalog.apps.length} onResults={mergePage}/>{body}</>;
  const links = [
    ["/", t("Keşfet"), Compass],
    ["/karsilastir", t("Karşılaştır"), GitCompareArrows],
    ["/listeler", "Listeler", LayoutGrid],
    ["/blog", t("Blog"), BookOpen],
    ["/kaydedilenler", "Kaydedilenler", Bookmark],
  ] as const;
  const presentation = getThemePresentation(theme);
  return (
    <div
      className={`catalog-experience layout-${theme.layout} density-${theme.density}`}
      lang={getLocalePack(locale).locale}
      dir={getLocalePack(locale).direction as "ltr"|"rtl"}
      data-preview={previewMode || undefined}
      data-theme={theme.id}
      data-template={getThemeTemplate(theme)}
      data-page={route}
      data-font={presentation.font}
      data-width={presentation.width}
      data-radius={presentation.radius}
      data-hero={presentation.hero}
      data-card-style={presentation.cardStyle}
      style={themeToStyle(theme)}
    >
      <a className="skip-link" href="#main-content">{t("İçeriğe geç")}</a>
      {drawer && (
        <button
          className="nav-backdrop"
          aria-label={t("Menüyü kapat")}
          onClick={() => setDrawer(false)}
        />
      )}
      <aside
        id="site-navigation"
        className={`sidebar ${drawer ? "is-open" : ""}`}
      >
        <button
          className="icon-button drawer-close"
          aria-label={t("Menüyü kapat")}
          onClick={() => setDrawer(false)}
        >
          <X size={20} />
        </button>
        <Link href="/" className="brand" aria-label={siteIdentityName}>
          <SiteBrand name={siteIdentityName} branding={siteBranding} />
        </Link>
        <nav className="primary-nav" aria-label={t("Ana gezinme")}>
          {links.map(([href, label, Icon]) => (
            <Link
              key={href}
              className={
                (
                  href === "/"
                    ? route === "home" || route === "kesfet"
                    : pathname === href
                )
                  ? "active"
                  : ""
              }
              href={href}
              onClick={() => setDrawer(false)}
              aria-current={
                (href === "/" ? route === "home" : pathname === href)
                  ? "page"
                  : undefined
              }
            >
              <Icon size={19} />
              <span>{t(label)}</span>
              {href === "/kaydedilenler" && saved.length > 0 && (
                <small>{saved.length}</small>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <span className="nav-caption">{t("BİR ADIM ÖTESİ")}</span>
        <nav className="quick-nav" aria-label={t("Koleksiyonlar")}>
          <Link href="/kategoriler">{t("Kategoriler")}</Link>
          <Link href="/yayincilar">{t("Yayıncılar")}</Link>
          <Link href="/araclar">{t("Decision tools")}</Link>
          <Link href="/secim-sihirbazi">{t("Seçim sihirbazı")}</Link>
          <Link href="/maliyet-hesapla">{t("Maliyet hesapla")}</Link>
          <Link href="/platform-farklari">{t("Platform farkları")}</Link>
          <Link href="/rehberler">{t("Rehberler")}</Link>
          <Link href="/is-akislari">{t("İş akışları")}</Link>
          <Link href="/gecis-rehberleri">{t("Geçiş rehberleri")}</Link>
          {catalog.appSubmissions?.enabled && <Link href="/submit-app" onClick={() => setDrawer(false)} aria-current={route === "submit-app" ? "page" : undefined}>{t("Submit an app")}</Link>}
        </nav>
        <Link className="settings-nav" href="/ayarlar">
          <Settings2 size={17} />{t("Temalar ve eklentiler")}</Link>
        <div className="sidebar-landscape" aria-hidden="true" />
      </aside>
      <div className="main-shell" inert={drawer}>
        <header className="topbar">
          <Link href="/" className="mobile-brand" aria-label={siteIdentityName}><SiteBrand name={siteIdentityName} branding={siteBranding} /></Link>
          {languageAlternates.length>1&&<nav aria-label={t("Dil")} className="platform-filters">{languageAlternates.map(alternate=><a data-language-link key={alternate.locale} href={alternate.href} hrefLang={alternate.locale} lang={alternate.locale} aria-current={alternate.locale===locale?'page':undefined}>{alternate.label||getLocalePack(alternate.locale).label}</a>)}</nav>}
          <button
            className="icon-button menu-button"
            aria-label={drawer ? t("Menüyü kapat") : t("Menüyü aç")}
            aria-expanded={drawer}
            aria-controls="site-navigation"
            onClick={() => setDrawer(!drawer)}
          >
            {drawer ? <X /> : <Menu />}
          </button>
          <form className="search-form" role="search" onSubmit={submitSearch}>
            <Search size={19} aria-hidden="true" />
            <input
              aria-label={t("Uygulama veya ihtiyaç ara")}
              placeholder={t("Bir uygulama veya ihtiyaç ara…")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="icon-button"
                aria-label={t("Aramayı temizle")}
                onClick={() => changeFilters({ ...filters, query: "" })}
              >
                <X size={15} />
              </button>
            )}
            <button className="search-submit" aria-label={t("Ara")} type="submit">
              <ArrowRight size={16} />
            </button>
          </form>
          <div className="platform-filters" aria-label={t("Platform")}>
            {(["android", "ios", "windows"] as Platform[]).map((p) => (
              <button
                key={p}
                aria-pressed={filters.platforms.includes(p)}
                onClick={() => platformChange(p)}
              >
                {p === "windows" ? (
                  <Monitor size={15} />
                ) : p === "ios" ? (
                  <Apple size={15} />
                ) : (
                  <Smartphone size={15} />
                )}
                <span>{PLATFORM_LABELS[p]}</span>
              </button>
            ))}
          </div>
        </header>
        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button
              className="icon-button"
              aria-label={t("Bildirimi kapat")}
              onClick={() => setNotice("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <main id="main-content">{translationStale&&<p className="settings-note" role="status">{t("Bu çevirinin kaynak içeriği güncellendi; bazı bilgiler yeniden inceleme bekliyor.")}</p>}{body}{route === "home" && !!catalog.extensionBlocks?.length && <ExtensionBlocks blocks={catalog.extensionBlocks}/>}{route === "home" && !!catalog.extensionCards?.length && <section aria-label={t("Topluluk modülleri")} className="home-panel"><h2>{t("Topluluk modülleri")}</h2><div className="story-grid">{catalog.extensionCards.filter(card=>/^\/(?!\/)|^https:\/\//.test(card.href)).map(card=><article className="story-card" key={`${card.moduleId}:${card.id}`}><h3><Link href={card.href}>{card.title}</Link></h3><p>{card.description}</p></article>)}</div></section>}{route==="home"&&<section className="home-panel"><h2>{t("Editorial directories")}</h2><nav className="footer-links" aria-label={t("Editorial directories")}>{[['growthIntent','growthIntent'],['growthComparisonIndex','growthComparison'],['growthAlternatives','growthAlternatives'],['growthAuthor','growthAuthor'],['growthTest','growthTest']].map(([key,label])=>{const pack=getLocalePack(locale).serverMessages;return <Link key={key} href={`/${locale}/${pack.routes[key]}`}>{pack.messages[label]}</Link>;})}</nav></section>}</main>
        <footer className="site-footer">
          <SiteBrand name={siteIdentityName} branding={siteBranding} />
          <nav className="footer-links" aria-label={t("Bilgilendirme")}>
            <Link href="/hakkimizda">{t("Hakkımızda")}</Link>
            <Link href="/yontem">{t("Yöntem")}</Link>
            <Link href="/gizlilik">{t("Gizlilik")}</Link>
            <Link href="/duzeltme-politikasi">{t("Düzeltmeler")}</Link>
            {catalog.appSubmissions?.enabled && <Link href="/submit-app">{t("Submit an app")}</Link>}
            <Link href="/admin">{t("Yönetim")}</Link>
          </nav>
          {showDeveloperCredit && <span>{t("Geliştiren:")}{" "}<a href={BRAND.developerUrl} rel="nofollow">{BRAND.developer}</a></span>}
          <Link href="/ayarlar">{t("Alanını düzenle")}<ArrowUpRight size={13} />
          </Link>
        </footer>
      </div>
      {compare.length > 0 && route !== "karsilastir" && (
        <div className="compare-dock" inert={drawer}>
          <div className="dock-icons" role="group" aria-label={t("Karşılaştır")}>
            {compare.map((id) => {
              const app = appById(id);
              const label = t("{name} karşılaştırmadan kaldır", { name: app?.name || id });
              return <button
                key={id}
                type="button"
                className="dock-remove"
                aria-label={label}
                title={label}
                onClick={() => toggleCompare(id)}
              >
                {app ? <AppIcon app={app} /> : <Layers3 size={20} aria-hidden="true" />}
                <X className="dock-remove-mark" size={11} aria-hidden="true" />
              </button>;
            })}
          </div>
          <span>
            {selectedApps(compare).length}{" "}{t("uygulama hazır")}{compare.length > selectedApps(compare).length
              ? t(" · {count} geçici olarak görünmüyor", {count:compare.length - selectedApps(compare).length})
              : ""}
          </span>
          <Link
            className="button button-primary"
            href={`/karsilastir?apps=${compare.join(",")}`}
          >{t(selectedApps(compare).length < 2 ? "Bir uygulama seç" : "Karşılaştır")}<ArrowRight size={15} />
          </Link>
          <button
            className="icon-button"
            aria-label={t("Karşılaştırma seçimini temizle")}
            onClick={() => setCompare([])}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
