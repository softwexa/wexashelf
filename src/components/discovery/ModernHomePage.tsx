import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { availableContent } from "@/lib/available-content";
import { localeContent } from "@/lib/i18n-content";
import { CATEGORIES } from "@/lib/catalog";
import type { CatalogSnapshot, EditorialList } from "@/lib/domain";
import { getActiveSections } from "@/lib/plugins";
import { getThemeTemplate, type HomeSectionId, type ThemeManifest } from "@/lib/themes";
import { AppIcon, type AppActions } from "./Shared";
import { AppShowcase, AppTiles, CategoryLinks, PlatformShelves, ComparisonFeature, DecisionCards, JournalCards, PeriodTabs, ThemeAppCard, ThemeSearch, ThemeSectionHeading } from "./ThemeSections";

const MODERN_TEMPLATES = ["porcelain", "ember", "fieldnotes", "signal", "lilac", "tide", "copper", "prism", "index", "velvet"] as const;
type ModernTemplate = typeof MODERN_TEMPLATES[number];
export function isModernTemplate(template: string): template is ModernTemplate { return MODERN_TEMPLATES.includes(template as ModernTemplate); }

function HeroTitle({ template }: { template: ModernTemplate }) {
  const { t } = useI18n();
  const titles: Record<ModernTemplate, string> = {
    porcelain: t("Good apps. Clear choices."),
    ember: t("Find your next everyday essential."),
    fieldnotes: t("A little less searching. A lot more doing."),
    signal: t("Less noise. Better apps."),
    lilac: t("Make room for better tools."),
    tide: t("Useful on every device."),
    copper: t("The right tool changes everything."),
    prism: t("Your next good find."),
    index: t("Find the tool. Keep the flow."),
    velvet: t("Better apps. Beautifully considered."),
  };
  return <h1>{titles[template]}</h1>;
}

export function ModernHomePage({ catalog, theme, plugins, ...actions }: { catalog: CatalogSnapshot; theme: ThemeManifest; plugins: string[] } & AppActions) {
  const { t, locale } = useI18n();
  const template = getThemeTemplate(theme) as ModernTemplate;
  const activeSections = getActiveSections(theme, plugins);
  const { guides, workflows } = availableContent(localeContent(locale), catalog.apps);
  const [period, setPeriod] = useState<EditorialList["period"]>("week");
  const [category, setCategory] = useState("all");
  const categories = CATEGORIES.filter(value => value.id !== "all" && catalog.apps.some(app => app.category === value.id));
  const selectedList = catalog.lists.find(list => list.period === period);
  const weeklyList = catalog.lists.find(list => list.period === "week");
  const inDiscovery = activeSections.includes("discovery");
  const hasGuides = activeSections.includes("guides");
  const cardRows = ["ember", "fieldnotes", "copper", "index"].includes(template);
  const pairInHero = template === "copper" && inDiscovery;
  const heroIcons = inDiscovery && catalog.apps.length > 0 && ["ember", "fieldnotes", "tide", "velvet"].includes(template);
  const heroShowcase = inDiscovery && catalog.apps.length > 0 && ["lilac", "prism"].includes(template);
  const listApps = (list: EditorialList | undefined, count: number) => (list?.entries || []).map(entry => catalog.apps.find(app => app.id === entry.appId)).filter(app => !!app).slice(0, count);

  const journal = <><ThemeSectionHeading title={t("From the Journal")} detail={t("Bir sonraki adımın belli olsun.")} href="/blog"/><JournalCards catalog={catalog}/>{!catalog.articles.length && guides.length > 0 && <div className="theme-guide-links">{guides.slice(0, 3).map(guide => <Link href={`/rehber/${guide.id}`} key={guide.id}><BookOpen size={20}/><span>{guide.title}</span><ArrowUpRight size={17}/></Link>)}</div>}</>;

  function discovery() {
    if (template === "tide") return <PlatformShelves apps={catalog.apps} {...actions}/>;
    if (template === "fieldnotes") return <div className="theme-fieldnotes-feature">{catalog.apps[0] && <ThemeAppCard app={catalog.apps[0]} prominent {...actions}/>}<div className="theme-app-rows">{catalog.apps.slice(1, 5).map(app => <ThemeAppCard key={app.id} app={app} row compact {...actions}/>)}</div></div>;
    if (template === "index") return <div className="theme-index-workspace"><aside className="theme-index-filters"><h3>{t("Browse by category")}</h3><div role="group" aria-label={t("Uygulama kategorileri")}>{[CATEGORIES[0], ...categories].map(value => <button type="button" key={value.id} onClick={() => setCategory(value.id)} aria-pressed={category === value.id}>{t(value.label)}<ArrowUpRight size={14}/></button>)}</div><Link className="theme-text-link" href="/kesfet">{t("Browse all apps")}<ArrowRight size={16}/></Link></aside><div className="theme-app-rows">{catalog.apps.filter(app => category === "all" || app.category === category).slice(0, 8).map(app => <ThemeAppCard key={app.id} app={app} row compact {...actions}/>)}</div><aside className="theme-index-editorial"><ComparisonFeature apps={catalog.apps} compact/>{hasGuides && <><h3 className="theme-rail-title">{t("From the Journal")}</h3><JournalCards catalog={catalog} compact limit={2}/></>}</aside></div>;
    if (template === "prism") {
      const collection = catalog.lists.find(list => listApps(list, 1).length > 0);
      return <div className={`theme-prism-mosaic${collection ? " has-collection" : ""}`}>
        {collection && <article className="theme-prism-collection"><span className="theme-kicker">{t("Koleksiyonlar")}</span><h3>{collection.title}</h3><p>{collection.summary}</p><div className="theme-collection-apps">{listApps(collection, 3).map(app => <Link key={app.id} href={`/uygulama/${app.id}`} aria-label={t("{name} uygulamasını incele", { name: app.name })}><AppIcon app={app}/><span>{app.name}</span></Link>)}</div><Link className="theme-text-link" href={`/liste/${collection.id}`}>{t("Listeyi ve yöntemini incele")}<ArrowRight size={16}/></Link></article>}
        <div className="theme-app-grid">{catalog.apps.slice(0, 6).map(app => <ThemeAppCard key={app.id} app={app} row compact {...actions}/>)}</div><ComparisonFeature apps={catalog.apps} compact/>
      </div>;
    }
    if (template === "lilac") {
      const editorialRail = hasGuides && (guides.length > 0 || catalog.articles.length > 0);
      const apps = <div className="theme-app-grid">{catalog.apps.slice(0, 6).map(app => <ThemeAppCard key={app.id} app={app} {...actions}/>)}</div>;
      if (!editorialRail) return apps;
      return <div className="theme-lilac-discovery">{apps}<aside className="theme-editorial-rail"><ThemeSectionHeading title={t("Bir sonraki adımın belli olsun.")} href="/blog"/>{guides.length > 0 ? <div className="theme-guide-links">{guides.slice(0, 3).map(guide => <Link href={`/rehber/${guide.id}`} key={guide.id}><BookOpen size={19}/><span>{guide.title}</span><ArrowUpRight size={16}/></Link>)}</div> : <JournalCards catalog={catalog} compact limit={2}/>}</aside></div>;
    }
    if (template === "signal") return <div className="theme-signal-discovery"><div className="theme-signal-apps">{catalog.apps.slice(0, 4).map(app => <ThemeAppCard key={app.id} app={app} row compact {...actions}/>)}</div><ComparisonFeature apps={catalog.apps} compact/><div className="theme-signal-directory"><h3>{t("Browse by category")}</h3><CategoryLinks apps={catalog.apps} vertical/></div></div>;
    return <div className={cardRows ? "theme-app-rows" : "theme-app-grid"}>{catalog.apps.slice(0, template === "porcelain" ? 6 : template === "velvet" || template === "copper" ? 4 : 6).map(app => <ThemeAppCard key={app.id} app={app} row={cardRows} compact={cardRows} {...actions}/>)}{template === "porcelain" && catalog.apps.length >= 2 && <ComparisonFeature apps={catalog.apps}/>}</div>;
  }

  const panels: Record<HomeSectionId, React.ReactNode> = {
    discovery: <section className="theme-section theme-discovery" key="discovery" data-home-section="discovery"><ThemeSectionHeading title={t("Yeni bir şey keşfet")} detail={t("Günlük akışına iyi gelecek uygulamalar.")} href="/kesfet"/>{discovery()}</section>,
    weekly: <section className="theme-section theme-weekly" key="weekly" data-home-section="weekly"><ThemeSectionHeading title={t("Editor’s shelf")} detail={weeklyList?.summary || t("Yeni editör seçkisi hazırlanıyor.")} href="/listeler"/><div className="theme-weekly-apps">{listApps(weeklyList, 3).map(app => <ThemeAppCard key={app.id} app={app} row compact {...actions}/>)}</div>{weeklyList && <Link className="theme-text-link" href={`/liste/${weeklyList.id}`}>{t("Seçim gerekçelerini oku")}<ArrowRight size={16}/></Link>}</section>,
    trending: <section className="theme-section theme-trending" key="trending" data-home-section="trending"><div className="theme-trending-heading"><ThemeSectionHeading title={t("Göz atmaya değer")} detail={t("Kaynakları ve seçim gerekçeleriyle editör listeleri.")}/><PeriodTabs period={period} onChange={setPeriod}/></div><div className="theme-selection-grid">{listApps(selectedList, 4).map(app => <ThemeAppCard key={app.id} app={app} {...actions}/>)}</div>{!selectedList && <p className="theme-empty-note">{t("Bu dönem için yayımlanmış seçki bulunmuyor.")}</p>}{selectedList && <Link className="theme-text-link" href={`/liste/${selectedList.id}`}>{t("Listeyi ve yöntemini incele")}<ArrowRight size={16}/></Link>}</section>,
    toolbox: <section className="theme-section theme-toolbox" key="toolbox" data-home-section="toolbox"><ThemeSectionHeading title={t("Karar vermek kolaylaşsın")} detail={t("İndirmeden önce birkaç doğru soru.")} href="/secim-sihirbazi"/>{["ember", "tide", "lilac", "velvet", "fieldnotes"].includes(template) && inDiscovery && <ComparisonFeature apps={catalog.apps}/>}<DecisionCards/></section>,
    guides: <section className="theme-section theme-journal" key="guides" data-home-section="guides">{journal}</section>,
    workflows: <section className="theme-section theme-workflows" key="workflows" data-home-section="workflows"><ThemeSectionHeading title={t("A simple, focused workflow.")} detail={t("Bir işi baştan sona düzenle.")} href="/is-akislari"/>{workflows[0] ? <><h3 className="theme-workflow-title">{workflows[0].title}</h3><ol className="theme-workflow-steps">{workflows[0].steps.map(step => { const app = catalog.apps.find(value => value.id === step.appId); return <li key={step.title}><span className="theme-step-label">{step.title}</span>{app && <Link href={`/uygulama/${app.id}`}><AppIcon app={app}/><strong>{app.name}</strong></Link>}<p>{step.description}</p></li>; })}</ol><Link className="theme-text-link" href={`/is-akisi/${workflows[0].id}`}>{t("İş akışlarını incele")}<ArrowRight size={16}/></Link></> : <p className="theme-empty-note">{t("Browse apps while new collections are prepared.")}</p>}</section>,
  };

  return <div className={`modern-home modern-home-${template}`}>
    <section className={`modern-hero template-hero-${template}${heroIcons ? " has-artwork" : ""}${pairInHero ? " has-comparison" : ""}${heroShowcase ? " has-showcase" : ""}`}>
      {["fieldnotes", "lilac"].includes(template) && inDiscovery && <aside className="theme-hero-index"><span className="theme-kicker">{t("Browse by category")}</span><CategoryLinks apps={catalog.apps} vertical/></aside>}
      <div className="modern-hero-copy"><span className="theme-kicker">{t("Uygulama rehberi")} <span aria-hidden="true">/</span> Android · iOS · Windows</span><HeroTitle template={template}/><p>{t("Discover useful apps, compare your options, and find a setup that fits your day.")}</p><ThemeSearch/></div>
      {pairInHero && <ComparisonFeature apps={catalog.apps}/>}
      {heroShowcase && (template === "lilac" && hasGuides && catalog.articles.length > 0 ? <aside className="theme-hero-showcase is-editorial"><div className="theme-hero-showcase-heading"><span className="theme-kicker">{t("From the Journal")}</span><Link className="theme-text-link" href="/blog">{t("Tümünü gör")}<ArrowUpRight size={15}/></Link></div><JournalCards catalog={catalog} compact limit={1}/><div className="theme-hero-showcase-list">{catalog.apps.slice(0, 2).map(app => <ThemeAppCard key={app.id} app={app} row compact {...actions}/>)}</div></aside> : <AppShowcase apps={catalog.apps} variant={template === "porcelain" ? "shortlist" : template === "prism" ? "mosaic" : "featured"} {...actions}/>)}
      {heroIcons && <AppTiles apps={catalog.apps.slice(0, template === "tide" ? 6 : 4)} devices={template === "tide"}/>}
    </section>
    {inDiscovery && !["fieldnotes", "lilac", "index", "signal"].includes(template) && <CategoryLinks apps={catalog.apps}/>}
    {!catalog.apps.length && <section className="theme-empty-catalog"><h2>{t("Şu anda listelenebilen uygulama yok.")}</h2><p>{t("Yayımlanmış ve katalog kabul koşullarını karşılayan bir uygulama bulunmuyor. Kaynak incelemesi ve yeni kayıtlar tamamlandıkça katalog güncellenecek.")}</p><Link className="theme-cta" href="/blog">{t("Blog ve rehberleri oku")}<ArrowRight size={16}/></Link></section>}
    <div className="modern-sections">{activeSections.map(id => panels[id])}</div>
  </div>;
}
