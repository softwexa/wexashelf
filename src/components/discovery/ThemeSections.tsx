import Link from "next/link";
import { Apple, ArrowRight, ArrowUpRight, BookOpen, Check, FileText, GitCompareArrows, LayoutGrid, ListChecks, Monitor, Search, Smartphone } from "lucide-react";
import { useId } from "react";
import { useI18n } from "@/lib/i18n";
import { appIconUrl } from "@/lib/asset-url";
import { CATEGORIES, PLATFORM_LABELS, type Platform } from "@/lib/catalog";
import type { AppRecord, ArticleRecord, CatalogSnapshot, EditorialList } from "@/lib/domain";
import { AppIcon, Platforms, SaveButton, type AppActions } from "./Shared";

export function ThemeSearch() {
  const { t } = useI18n();
  const inputId = useId();
  return <form className="theme-search" action="/kesfet" method="get" role="search" onSubmit={event => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const target = new URL(form.action, window.location.href);
    const query = String(values.get("q") || "").trim();
    if (query) target.searchParams.set("q", query);
    const platforms = values.getAll("platform").map(String);
    if (platforms.length) target.searchParams.set("platform", platforms.join(","));
    window.location.assign(target.href);
  }}>
    <label className="sr-only" htmlFor={inputId}>{t("Uygulama veya ihtiyaç ara")}</label>
    <div className="theme-search-input"><Search size={21} aria-hidden="true"/><input id={inputId} name="q" placeholder={t("Uygulama, özellik veya ihtiyaç")}/><button type="submit" aria-label={t("Ara")}><ArrowRight size={21}/></button></div>
    <fieldset className="theme-platforms"><legend className="sr-only">{t("Platform")}</legend>{(["android", "ios", "windows"] as Platform[]).map(platform => <label key={platform}><input type="checkbox" name="platform" value={platform}/>{platform === "windows" ? <Monitor size={17}/> : platform === "ios" ? <Apple size={17}/> : <Smartphone size={17}/>}<span>{PLATFORM_LABELS[platform]}</span></label>)}</fieldset>
  </form>;
}

export function CategoryLinks({ apps, vertical = false }: { apps: AppRecord[]; vertical?: boolean }) {
  const { t } = useI18n();
  const categories = CATEGORIES.filter(category => category.id !== "all" && apps.some(app => app.category === category.id));
  return <nav className={`theme-categories${vertical ? " is-vertical" : ""}`} aria-label={t("Uygulama kategorileri")}>
    <Link href="/kesfet" className="category-all"><LayoutGrid size={18}/><span>{t("Tümü")}</span></Link>
    {categories.map(category => <Link href={`/kategori/${category.id}`} key={category.id}><span>{t(category.label)}</span>{vertical && <ArrowUpRight size={15}/>}</Link>)}
  </nav>;
}

export function ThemeAppCard({ app, row = false, prominent = false, compact = false, ...actions }: { app: AppRecord; row?: boolean; prominent?: boolean; compact?: boolean } & AppActions) {
  const { t } = useI18n();
  return <article className={`theme-app-card${row ? " is-row" : ""}${prominent ? " is-prominent" : ""}${compact ? " is-compact-row" : ""}`}>
    <Link className="theme-app-identity" href={`/uygulama/${app.id}`}><AppIcon app={app} large={prominent}/><div><h3>{app.name}</h3>{row && <p>{app.tagline}</p>}{compact && <Platforms platforms={app.platforms}/>}</div></Link>
    {!row && <p>{app.tagline}</p>}
    <div className="theme-app-platforms">{!compact && <Platforms platforms={app.platforms}/>}<SaveButton app={app} saved={actions.saved.includes(app.id)} onSave={actions.onSave}/></div>
    <div className="theme-app-actions"><Link href={`/uygulama/${app.id}`} aria-label={t("{name} uygulamasını incele", { name: app.name })}><span>{t("İncele")}</span><ArrowRight size={14}/></Link><button type="button" onClick={() => actions.onCompare(app.id)} aria-pressed={actions.compare.includes(app.id)} aria-label={t("{name}: karşılaştır", { name: app.name })}>{actions.compare.includes(app.id) ? <Check size={14}/> : <GitCompareArrows size={14}/>}<span>{t("Karşılaştır")}</span></button></div>
  </article>;
}

export function AppShowcase({ apps, variant = "shortlist", ...actions }: { apps: AppRecord[]; variant?: "shortlist" | "featured" | "mosaic" } & AppActions) {
  const { t } = useI18n();
  const picks = apps.slice(0, variant === "mosaic" ? 4 : 3);
  if (!picks.length) return null;
  const featured = variant === "featured" ? picks[0] : undefined;
  return <aside className={`theme-hero-showcase is-${variant}`}>
    <div className="theme-hero-showcase-heading"><span className="theme-kicker">{t("Keşfet")}</span><Link className="theme-text-link" href="/kesfet">{t("Tümünü gör")}<ArrowUpRight size={15}/></Link></div>
    {featured && <div className="theme-hero-feature"><ThemeAppCard app={featured} prominent {...actions}/></div>}
    <div className="theme-hero-showcase-list">{(featured ? picks.slice(1) : picks).map(app => <ThemeAppCard key={app.id} app={app} row compact {...actions}/>)}</div>
  </aside>;
}

/** Device shelves use the catalog's declared compatibility, never guessed availability. */
export function PlatformShelves({ apps, ...actions }: { apps: AppRecord[] } & AppActions) {
  const { t } = useI18n();
  return <div className="theme-platform-shelves">{(["android", "ios", "windows"] as Platform[]).map(platform => {
    const compatible = apps.filter(app => app.platforms.includes(platform)).slice(0, 3);
    if (!compatible.length) return null;
    return <section className="theme-platform-shelf" key={platform}><header><span className="theme-kicker">{t("Platform")}</span><h3>{PLATFORM_LABELS[platform]}</h3><Link className="theme-text-link" href={`/kesfet?platform=${platform}`}>{t("Tümünü gör")}<ArrowUpRight size={16}/></Link></header><div>{compatible.map(app => <ThemeAppCard key={app.id} app={app} row compact {...actions}/>)}</div></section>;
  })}</div>;
}

export function comparisonApps(apps: AppRecord[]): AppRecord[] {
  const named = ["notion", "obsidian"].map(id => apps.find(app => app.id === id)).filter((app): app is AppRecord => !!app);
  return named.length === 2 ? named : apps.slice(0, 2);
}

export function ComparisonFeature({ apps, compact = false }: { apps: AppRecord[]; compact?: boolean }) {
  const { t } = useI18n();
  const pair = comparisonApps(apps);
  if (pair.length < 2) return <div className="theme-comparison theme-comparison-empty"><GitCompareArrows size={29}/><h3>{t("Karar vermek kolaylaşsın")}</h3><p>{t("Browse apps while new collections are prepared.")}</p><Link className="theme-cta" href="/kesfet">{t("Kataloğu keşfet")}<ArrowRight size={16}/></Link></div>;
  const href = `/karsilastir?apps=${pair.map(app => encodeURIComponent(app.id)).join(",")}`;
  return <article className={`theme-comparison${compact ? " is-compact" : ""}`}>
    <div className="theme-comparison-copy"><span className="theme-kicker">{t("Karşılaştır")}</span><h3>{pair[0].name} <span className="theme-vs-word">vs</span> {pair[1].name}</h3><p>{t("İndirmeden önce birkaç doğru soru.")}</p><Link className="theme-cta" href={href}>{t("Explore the comparison")}<ArrowRight size={17}/></Link></div>
    <div className="theme-comparison-apps">{pair.map((app, index) => <div key={app.id}>{index === 1 && <span className="theme-vs" aria-hidden="true">vs</span>}<Link href={`/uygulama/${app.id}`}><AppIcon app={app} large/><span>{app.name}</span></Link></div>)}</div>
  </article>;
}

export function AppTiles({ apps, devices = false }: { apps: AppRecord[]; devices?: boolean }) {
  const { t } = useI18n();
  if (devices) {
    const devicesWithApps = (["android", "ios", "windows"] as Platform[]).map(platform => ({ platform, apps: apps.filter(app => app.platforms.includes(platform)).slice(0, 4) })).filter(device => device.apps.length);
    return <div className="theme-devices">{devicesWithApps.map(device => <div className={`theme-device theme-device-${device.platform}`} key={device.platform}><span className="theme-device-label">{PLATFORM_LABELS[device.platform]}</span><div>{device.apps.map(app => <Link key={app.id} href={`/uygulama/${app.id}`} aria-label={t("{name} uygulamasını incele", { name: app.name })}><AppIcon app={app}/></Link>)}</div></div>)}</div>;
  }
  return <div className="theme-icon-stage">{apps.slice(0, 8).map(app => <Link key={app.id} href={`/uygulama/${app.id}`}><AppIcon app={app} large/><span>{app.name}</span></Link>)}</div>;
}

export function ThemeSectionHeading({ title, detail, href }: { title: string; detail?: string; href?: string }) {
  const { t } = useI18n();
  return <header className="theme-section-heading"><div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>{href && <Link href={href} aria-label={t("{name}: tümünü gör", { name: title })}><ArrowUpRight size={22}/></Link>}</header>;
}

export function PeriodTabs({ period, onChange }: { period: EditorialList["period"]; onChange: (value: EditorialList["period"]) => void }) {
  const { t } = useI18n();
  return <div className="theme-period-tabs" aria-label={t("Göz atmaya değer")}>{(["week", "month", "evergreen"] as const).map((value, index) => <button key={value} type="button" aria-pressed={period === value} onClick={() => onChange(value)}>{[t("Bu hafta"), t("Bu ay"), t("Kalıcı favoriler")][index]}</button>)}</div>;
}

function ArticleArtwork({ article, apps }: { article: ArticleRecord; apps: AppRecord[] }) {
  const related = apps.filter(app => article.appIds?.includes(app.id)).slice(0, 3);
  if (article.cover) return <img className="theme-article-cover" src={appIconUrl(`/media/${article.cover.assetId}.png`)} alt={article.cover.alt} width={1536} height={1024} loading="lazy"/>;
  return <div className="theme-article-art" aria-hidden="true">{related.length ? related.map(app => <AppIcon app={app} key={app.id} large/>) : <BookOpen size={48} strokeWidth={1}/>}</div>;
}

export function JournalCards({ catalog, compact = false, limit = 3 }: { catalog: CatalogSnapshot; compact?: boolean; limit?: number }) {
  const { t } = useI18n();
  return <div className={`theme-journal-cards${compact ? " is-compact" : ""}`}>
    {catalog.articles.slice(0, limit).map(article => <article className="theme-journal-card" key={article.id}><Link href={`/blog/${article.id}`}><ArticleArtwork article={article} apps={catalog.apps}/><div><h3>{article.title}</h3><p>{article.summary}</p><span className="theme-text-link">{t("Read the article")}<ArrowUpRight size={15}/></span></div></Link></article>)}
    {!catalog.articles.length && <div className="theme-empty-editorial"><BookOpen size={26}/><p>{t("Browse the catalog while new editorial articles are prepared.")}</p><Link className="theme-text-link" href="/blog">{t("Blog ve rehberleri oku")}<ArrowRight size={15}/></Link></div>}
  </div>;
}

export function DecisionCards() {
  const { t } = useI18n();
  return <div className="theme-decision-cards"><Link href="/secim-sihirbazi"><ListChecks size={26}/><h3>{t("İhtiyacını birlikte netleştirelim")}</h3><p>{t("Cihazlarını ve vazgeçemediğin özellikleri seç.")}</p><ArrowRight size={19}/></Link><Link href="/maliyet-hesapla"><Monitor size={26}/><h3>{t("Planın toplam maliyeti")}</h3><p>{t("Süreyi ve kişi sayısını kaynaklı fiyatlarla karşılaştır.")}</p><ArrowRight size={19}/></Link><Link href="/platform-farklari"><FileText size={26}/><h3>{t("Platform farkları")}</h3><p>{t("İndirmeden önce birkaç doğru soru.")}</p><ArrowRight size={19}/></Link></div>;
}
