

import { useI18n } from "@/lib/i18n";
import { ModernHomePage, isModernTemplate } from "./ModernHomePage";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  ChevronRight,
  ListChecks,
  Monitor,
  Sparkles,
  Search,
  Layers,
  FileText,
  NotebookPen,
  Play,
  Globe,
  Palette,
} from "lucide-react";
import { useState } from "react";
import { comparisonApps, ComparisonFeature, ThemeAppCard } from "./ThemeSections";
import { CATEGORIES } from "../../lib/catalog";
import { localeContent } from "@/lib/i18n-content";
import { availableContent } from "@/lib/available-content";
import type { CatalogSnapshot } from "../../lib/domain";
import { getActiveSections } from "../../lib/plugins";
import {
  getThemeTemplate,
  type HomeSectionId,
  type ThemeManifest,
} from "../../lib/themes";
import {
  AppIcon,
  AppRow,
  CompareButton,
  SaveButton,
  Platforms,
  SectionHeading,
  type AppActions,
} from "./Shared";
export function HomePage({
  catalog,
  theme,
  plugins,
  ...actions
}: {
  catalog: CatalogSnapshot;
  theme: ThemeManifest;
  plugins: string[];
} & AppActions) {
  return isModernTemplate(getThemeTemplate(theme))
    ? <ModernHomePage catalog={catalog} theme={theme} plugins={plugins} {...actions} />
    : <ClassicHomePage catalog={catalog} theme={theme} plugins={plugins} {...actions} />;
}

function ClassicHomePage({
  catalog,
  theme,
  plugins,
  ...actions
}: {
  catalog: CatalogSnapshot;
  theme: ThemeManifest;
  plugins: string[];
} & AppActions) {
  const { t, locale, formatDate, formatNumber, countryName } = useI18n();
  const { guides: GUIDES, workflows: WORKFLOWS } = availableContent(localeContent(locale),catalog.apps);
  const template = getThemeTemplate(theme);
  const activeSections = getActiveSections(theme, plugins);
  const categories = CATEGORIES.filter((category) =>
    catalog.apps.some((app) => app.category === category.id),
  );
  const categoryIcons = { productivity: Layers, notes: NotebookPen, documents: FileText, media: Play, browser: Globe, design: Palette, all: Layers };
  const workflow = WORKFLOWS[0];
  const hasPlatformGuide = activeSections.includes("toolbox") && catalog.apps.length > 0;
  const hasMigrationGuides = activeSections.includes("guides") && GUIDES.some(guide => guide.kind === "migration");
  const [period, setPeriod] = useState<"week" | "month" | "evergreen">("week");
  const [directoryCategory, setDirectoryCategory] = useState("");
  const [directoryPlatform, setDirectoryPlatform] = useState("");
  const directoryApps = catalog.apps.filter(app => (!directoryCategory || app.category === directoryCategory) && (!directoryPlatform || app.platforms.some(platform => platform === directoryPlatform)));
  const list = catalog.lists.find((l) => l.period === period);
  const weekly = catalog.lists.find((l) => l.period === "week");
  const weeklyApps = (weekly?.entries ?? []).flatMap((entry) => {
    const app = catalog.apps.find((candidate) => candidate.id === entry.appId);
    return app ? [app] : [];
  });
  const featuredApps = [...weeklyApps, ...catalog.apps]
    .filter((app, index, apps) => apps.findIndex((candidate) => candidate.id === app.id) === index)
    .slice(0, 4);
  const featuredApp = featuredApps[0];
  const rows = (ids: string[]) =>
    ids
      .map((id) => catalog.apps.find((a) => a.id === id))
      .filter((a) => !!a)
      .map((app) => (
        <AppRow
          key={app.id}
          app={app}
          saved={actions.saved}
          onSave={actions.onSave}
          compare={actions.compare}
          onCompare={actions.onCompare}
        />
      ));
  const panels: Record<HomeSectionId, React.ReactNode> = {
    discovery: (
      <section className="home-panel span-7" key="discovery" data-home-section="discovery">
        <SectionHeading
          title={t("Yeni bir şey keşfet")}
          detail={t("Günlük akışına iyi gelecek uygulamalar.")}
          href="/kesfet"
        />
        <div className="app-list">
          {rows(catalog.apps.slice(0, 4).map((a) => a.id))}
        </div>
      </section>
    ),
    weekly: (
      <section className="home-panel span-5" key="weekly" data-home-section="weekly">
        <SectionHeading
          title={t("Haftanın seçkisi")}
          detail={weekly?.summary || t("Yeni editör seçkisi hazırlanıyor.")}
          href="/listeler"
        />
        <div className="app-list">
          {rows(weekly?.entries.slice(0, 4).map((e) => e.appId) || [])}
        </div>
        {weekly && (
          <Link className="text-link" href={`/liste/${weekly.id}`}>{t("Seçim gerekçelerini oku")}<ArrowRight size={14} />
          </Link>
        )}
      </section>
    ),
    trending: (
      <section className="home-panel span-7" key="trending" data-home-section="trending">
        <SectionHeading
          title={t("Göz atmaya değer")}
          detail={t("Kaynakları ve seçim gerekçeleriyle editör listeleri.")}
          href="/listeler"
        />
        <div className="period-tabs">
          {(["week", "month", "evergreen"] as const).map((id, i) => (
            <button
              key={id}
              aria-pressed={period === id}
              onClick={() => setPeriod(id)}
            >
              {[t("Bu hafta"), t("Bu ay"), t("Kalıcı favoriler")][i]}
            </button>
          ))}
        </div>
        <div className="app-list">
          {rows(list?.entries.slice(0, 4).map((e) => e.appId) || [])}
        </div>
        {!list && (
          <p className="settings-note">{t("Bu dönem için yayımlanmış seçki bulunmuyor.")}</p>
        )}
        {list && (
          <Link className="text-link" href={`/liste/${list.id}`}>{t("Listeyi ve yöntemini incele")}<ArrowRight size={14} />
          </Link>
        )}
      </section>
    ),
    toolbox: (
      <section className="home-panel span-5 toolbox" key="toolbox" data-home-section="toolbox">
        <SectionHeading
          title={t("Karar vermek kolaylaşsın")}
          detail={t("İndirmeden önce birkaç doğru soru.")}
          href="/secim-sihirbazi"
        />
        <Link className="tool-promo" href="/secim-sihirbazi">
          <span className="tool-symbol">
            <ListChecks size={24} />
          </span>
          <div>
            <h3>{t("İhtiyacını birlikte netleştirelim")}</h3>
            <p>{t("Cihazlarını ve vazgeçemediğin özellikleri seç.")}</p>
          </div>
          <ChevronRight size={18} />
        </Link>
        <Link className="tool-promo" href="/maliyet-hesapla">
          <span className="tool-symbol violet">
            <Monitor size={24} />
          </span>
          <div>
            <h3>{t("Planın toplam maliyeti")}</h3>
            <p>{t("Süreyi ve kişi sayısını kaynaklı fiyatlarla karşılaştır.")}</p>
          </div>
          <ChevronRight size={18} />
        </Link>
      </section>
    ),
    guides: (
      <section className="home-panel span-6 editorial-panel" key="guides" data-home-section="guides">
        <SectionHeading
          title={t("Küçük rehberler, rahat başlangıçlar")}
          detail={t("Bir sonraki adımın belli olsun.")}
          href="/blog"
        />
        {(catalog.articles.length ? catalog.articles.slice(0, 3) : GUIDES).map(
          (item) => (
            <Link
              className="editorial-link"
              key={item.id}
              href={`/${"sections" in item ? "blog" : "rehber"}/${item.id}`}
            >
              <span>{item.title}</span>
              <ArrowUpRight size={17} />
            </Link>
          ),
        )}
      </section>
    ),
    workflows: (
      <section className="home-panel span-6 editorial-panel" key="workflows" data-home-section="workflows">
        <SectionHeading
          title={t("Uygulamaları birlikte düşün")}
          detail={t("Bir işi baştan sona düzenle.")}
          href="/is-akislari"
        />
        {WORKFLOWS.map((w) => (
          <Link
            className="editorial-link"
            key={w.id}
            href={`/is-akisi/${w.id}`}
          >
            <span>{w.title}</span>
            <ArrowUpRight size={17} />
          </Link>
        ))}
      </section>
    ),
  };
  if (template === "atlas") {
    panels.discovery = <section className="home-panel classic-atlas-discovery" key="discovery" data-home-section="discovery">
      <SectionHeading title={t("Yeni bir şey keşfet")} detail={t("Günlük akışına iyi gelecek uygulamalar.")} href="/kesfet"/>
      <div className="classic-atlas-modules">{categories.slice(0, 3).map(category => {
        const Icon = categoryIcons[category.id];
        return <div key={category.id}><Link className="classic-atlas-category" href={`/kategori/${category.id}`}><Icon size={21} aria-hidden="true"/><span>{t(category.label)}</span><ArrowUpRight size={16}/></Link><div className="app-list">{rows(catalog.apps.filter(app => app.category === category.id).slice(0, 3).map(app => app.id))}</div></div>;
      })}</div>
    </section>;
    const authoredPair = catalog.articles.filter(article => article.kind === "comparison").map(article => article.appIds.flatMap(id => {
      const app = catalog.apps.find(candidate => candidate.id === id);
      return app ? [app] : [];
    })).find(apps => apps.length >= 2);
    const preferredPair = comparisonApps(catalog.apps);
    const comparableApps = authoredPair?.slice(0, 2) ?? (preferredPair.length === 2 && preferredPair[0].category === preferredPair[1].category ? preferredPair : []);
    if (comparableApps.length >= 2) {
      panels.toolbox = <section className="home-panel atlas-comparison" key="toolbox" data-home-section="toolbox"><p className="atlas-comparison-intro">{t("Compare up to four apps using their key details and sourced features.")}</p><ComparisonFeature apps={comparableApps}/></section>;
    }
    // Keep the authored selection separate from the featured app's quick preview.
    panels.weekly = <section className="home-panel atlas-editorial" key="weekly" data-home-section="weekly"><span className="eyebrow">{t("Haftanın seçkisi")}</span><h2>{weekly?.title || t("Yeni editör seçkisi hazırlanıyor.")}</h2>{weekly && <><p>{weekly.summary}</p><Link className="text-link" href={`/liste/${weekly.id}`}>{t("Seçim gerekçelerini oku")}<ArrowRight size={16}/></Link></>}</section>;
  }
  if (template === "catalog") {
    panels.discovery = <section className="home-panel catalog-discovery" key="discovery" data-home-section="discovery">
      <SectionHeading title={t("Yeni bir şey keşfet")} detail={t("Günlük akışına iyi gelecek uygulamalar.")} href="/kesfet"/>
      <div className="catalog-app-shelf">{catalog.apps.slice(0, 6).map(app => <ThemeAppCard key={app.id} app={app} row compact {...actions}/>)}</div>
    </section>;
  }
  if (template === "magazine") {
    const lead = catalog.articles[0];
    panels.discovery = <section className="home-panel magazine-discovery" key="discovery" data-home-section="discovery">
      <div className="magazine-lead"><h2>{t("From the editorial desk")}</h2>{lead ? <article><h3><Link href={`/blog/${lead.id}`}>{lead.title}</Link></h3><p>{lead.summary}</p><Link className="text-link" href={`/blog/${lead.id}`}>{t("Read the article")} <ArrowRight size={16}/></Link></article> : <><p>{t("Browse the catalog while new editorial articles are prepared.")}</p><Link className="text-link" href="/kesfet">{t("Kataloğu keşfet")}</Link></>}</div>
      <div className="magazine-apps"><h2>{t("Apps to examine")}</h2><div className="app-list">{rows(catalog.apps.slice(0,3).map(app=>app.id))}</div></div>
    </section>;
  }
  if (template === "directory") {
    panels.discovery = <section className="home-panel directory-discovery" key="discovery" data-home-section="discovery"><SectionHeading title={t("App directory")} detail={t("Recorded facts at a glance. Open an app to review its sources.")} href="/kesfet"/>
      <div className="classic-directory-filters"><label>{t("Kategoriler")}<select value={directoryCategory} onChange={event => setDirectoryCategory(event.target.value)}><option value="">{t("Tümü")}</option>{categories.map(category => <option key={category.id} value={category.id}>{t(category.label)}</option>)}</select></label><label>{t("Platformlar")}<select value={directoryPlatform} onChange={event => setDirectoryPlatform(event.target.value)}><option value="">{t("Tümü")}</option>{Array.from(new Set(catalog.apps.flatMap(app => app.platforms))).map(platform => <option key={platform} value={platform}>{platform === "ios" ? "iOS" : platform === "android" ? "Android" : platform === "windows" ? "Windows" : platform}</option>)}</select></label><Link className="text-link" href="/kesfet">{t("Browse all apps")}<ArrowRight size={14}/></Link></div>
      {directoryApps.length === 0 && catalog.apps.length > 0 && <p role="status">{t("Bu filtrelerle uygulama bulunamadı.")}</p>}
      {catalog.apps.length>0&&<div className="directory-scroll" role="region" aria-label={t("App directory table")} tabIndex={0}><table className="directory-table"><caption>{t("A selection from the catalog; browse all apps to search the full collection.")}</caption><thead><tr><th scope="col">{t("App")}</th><th scope="col">{t("Platforms")}</th><th scope="col">{t("Pricing summary")}</th><th scope="col">{t("Checked date")}</th><th scope="col">{t("Karşılaştır")}</th><th scope="col">{t("Save")}</th></tr></thead><tbody>{directoryApps.slice(0,12).map(app=><tr key={app.id}><th scope="row"><Link href={`/uygulama/${app.id}`}><AppIcon app={app}/><span>{app.name}<small>{app.tagline}</small></span></Link></th><td><Platforms platforms={app.platforms}/></td><td>{app.pricingLabel||t("Unverified")}</td><td>{app.checkedAt?formatDate(app.checkedAt):t("Unverified")}</td><td><CompareButton app={app} selected={actions.compare.includes(app.id)} onCompare={actions.onCompare}/></td><td><SaveButton app={app} saved={actions.saved.includes(app.id)} onSave={actions.onSave}/></td></tr>)}</tbody></table></div>}
    </section>;
  }
  const hero = catalog.apps.filter((a) =>
    ["notion", "obsidian"].includes(a.id),
  );
  return (
    <>

      {template === "magazine" || template === "directory" ? (
        <section className={`template-heading template-heading-${template}`}><div><h1>{t(template === "magazine" ? "Read the context. Choose your tools." : "Find an app. Check the details.")}</h1><p>{t(template === "magazine" ? "Editorial reading and practical app choices, in one place." : "Scan platforms and recorded pricing, then open the evidence behind each app.")}</p></div><Link className="button button-primary" href="/kesfet">{t("Browse all apps")} <ArrowRight size={16}/></Link></section>
      ) : template === "catalog" ? (
        <section className="template-hero template-hero-catalog">
          <div className="catalog-preview">
            <article className="catalog-feature">
              <div className="template-hero-copy"><span className="eyebrow">{t("Kendi rafını oluştur")}</span><h1>{t("Gününe iyi gelecek bir uygulama.")}</h1><p>{t("Uygulamaları keşfet, ilgini çekenleri kaydet. Seçimini kendi hızında yap.")}</p><Link className="button button-primary" href="/kesfet">{t("Kataloğu keşfet")}<ArrowRight size={16}/></Link></div>
              {activeSections.includes("discovery") && featuredApps.length > 0 && <div className="catalog-feature-shortlist" aria-label={t("Yeni bir şey keşfet")}>{featuredApps.slice(0, 3).map(app => <div className="catalog-shortlist-row" key={app.id}><Link href={`/uygulama/${app.id}`}><AppIcon app={app}/><span>{app.name}</span><ArrowUpRight size={16}/></Link><SaveButton app={app} saved={actions.saved.includes(app.id)} onSave={actions.onSave}/></div>)}</div>}
            </article>
            <div className="catalog-utility-tiles">
              <Link className="catalog-utility-tile" href={hasPlatformGuide ? "/platform-farklari" : activeSections.includes("toolbox") ? "/secim-sihirbazi" : "/kesfet"}>{hasPlatformGuide ? <Monitor size={26}/> : <ListChecks size={26}/>}<h2>{t(hasPlatformGuide ? "Platform farkları" : activeSections.includes("toolbox") ? "İhtiyacını birlikte netleştirelim" : "Kataloğu keşfet")}</h2><p>{t(hasPlatformGuide ? "İndirmeden önce birkaç doğru soru." : activeSections.includes("toolbox") ? "Cihazlarını ve vazgeçemediğin özellikleri seç." : "Günlük akışına iyi gelecek uygulamalar.")}</p><ArrowRight size={20}/></Link>
              <Link className="catalog-utility-tile" href={hasMigrationGuides ? "/gecis-rehberleri" : "/kaydedilenler"}>{hasMigrationGuides ? <BookOpen size={26}/> : <Bookmark size={26}/>}<h2>{t(hasMigrationGuides ? "Geçiş rehberleri" : "Kaydedilenler")}</h2><p>{t(hasMigrationGuides ? "Bir sonraki adımın belli olsun." : "Uygulamaları keşfet, ilgini çekenleri kaydet. Seçimini kendi hızında yap.")}</p><ArrowRight size={20}/></Link>
            </div>
          </div>
        </section>
      ) : template !== "night" ? (
        <section className={`template-hero template-hero-${template}${template === "atlas" && activeSections.includes("discovery") && featuredApp ? " atlas-has-feature" : ""}`}>
          <div className="template-hero-copy">
            <span className="eyebrow">
              {template === "atlas"
                ? t("Uygulama atlası")
                : template === "workflow"
                  ? t("Önce işin, sonra araçların")
                  : t("Kendi rafını oluştur")}
            </span>
            <h1>
              {template === "atlas"
                ? <span className="atlas-title-mark">{t("Find an app that fits.")}</span>
                : template === "workflow"
                  ? t("Dağınık işleri, sakin bir akışa dönüştür.")
                  : t("Gününe iyi gelecek bir uygulama.")}
            </h1>
            <p>
              {template === "atlas"
                ? t("Kategorilere göz at, kaynakları incele, seçenekleri yan yana değerlendir.")
                : template === "workflow"
                  ? t("Bir başlangıç noktası seç. Araçların hangi adımda işe yaradığını gör.")
                  : t("Uygulamaları keşfet, ilgini çekenleri kaydet. Seçimini kendi hızında yap.")}
            </p>
            {template === "atlas" || template === "workflow" ? (
              <form action="/kesfet" className={template === "atlas" ? "atlas-search" : "atlas-search workflow-search"} role="search">
                <label htmlFor={`${template}-query`}>{t("Ne yapmak istiyorsun?")}</label>
                <div>
                  <Search size={20} aria-hidden="true" />
                  <input
                    id={`${template}-query`}
                    name="q"
                    placeholder={t("Uygulama ara")}
                  />
                  <button className="button button-primary" type="submit">{t("Ara")}<ArrowRight size={16} />
                  </button>
                </div>
              </form>
            ) : (
              <Link
                className="button button-primary"
                href="/kesfet"
              >
                {t("Kataloğu keşfet")}{" "}
                <ArrowRight size={16} />
              </Link>
            )}
            {(template === "atlas" || template === "workflow") && (
              <nav className={`template-platforms ${template === "atlas" ? "atlas-platforms" : ""}`} aria-label={t("Platformlar")}>
                {(["android", "ios", "windows"] as const).map((platform) => (
                  <Link key={platform} href={`/kesfet?platform=${platform}`}>
                    <Platforms platforms={[platform]} />
                    <span>{platform === "android" ? "Android" : platform === "ios" ? "iOS" : "Windows"}</span>
                  </Link>
                ))}
              </nav>
            )}
          </div>
          {template === "atlas" && activeSections.includes("discovery") && featuredApp && (
            <aside className="atlas-feature" aria-label={t("Featured app")}>
              <div className="atlas-feature-lead">
                <span className="eyebrow">{t("Featured app")}</span>
                <Link href={`/uygulama/${featuredApp.id}`}>
                  <AppIcon app={featuredApp} large />
                  <h2>{featuredApp.name}</h2>
                </Link>
                <p>{featuredApp.tagline}</p>
                <Platforms platforms={featuredApp.platforms} />
                <Link className="button button-primary" href={`/uygulama/${featuredApp.id}`}>
                  {t("İncele")} <ArrowRight size={16} />
                </Link>
              </div>
              {featuredApps.length > 1 && <div className="atlas-feature-shortlist">
                {featuredApps.slice(1).map((app) => (
                  <Link href={`/uygulama/${app.id}`} key={app.id}>
                    <AppIcon app={app} />
                    <span>{app.name}<small>{app.tagline}</small></span>
                    <ChevronRight size={16} aria-hidden="true" />
                  </Link>
                ))}
              </div>}
            </aside>
          )}
          {template === "workflow" && workflow && activeSections.includes("workflows") && (
            <div className="workflow-preview">
              <h2>{workflow.title}</h2>
              <ol className="workflow-app-flow">
                {workflow.steps.map((step, index) => {
                  const app = catalog.apps.find(
                    (entry) => entry.id === step.appId,
                  );
                  return (
                    <li key={step.title} className="workflow-flow-step">
                      <span className="classic-step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><h3>{step.title}</h3>
                      {app && (
                        <Link className="workflow-flow-link" href={`/uygulama/${app.id}`}>
                          <AppIcon app={app} large />
                          <strong>{app.name}</strong>
                        </Link>
                      )}
                      <p>{step.description}</p>
                      {index < workflow.steps.length - 1 && <ArrowRight className="workflow-connector" size={24} aria-hidden="true" />}
                    </li>
                  );
                })}
              </ol>
              <Link className="button button-primary" href={`/is-akisi/${workflow.id}`}>
                {t("İş akışlarını incele")} <ArrowRight size={16} />
              </Link>
            </div>
          )}

        </section>
      ) : (
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <Sparkles size={13} />{t("Birlikte keşfedelim")}</span>
            <h1>{t("Telefonundan bilgisayarına,")}{" "}<br />{t("aynı düzen.")}</h1>
            <p>{t("İhtiyacına uyan uygulamaları keşfet.")}<br />{t("Farklarını gör, kendi çalışma düzenini kur.")}</p>
            <Link
              href={
                hero.length === 2
                  ? "/karsilastir?apps=notion,obsidian"
                  : catalog.apps.length
                    ? "/kesfet"
                    : "/blog"
              }
              className="button button-primary"
            >
              {hero.length === 2
                ? t("Notion ve Obsidian’ı karşılaştır")
                : catalog.apps.length
                  ? t("Uygulamaları keşfet")
                  : t("Rehberleri keşfet")}{" "}
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="hero-apps">
            {hero.map((app, i) => (
              <div className={`hero-app hero-app-${i}`} key={app.id}>
                <Link href={`/uygulama/${app.id}`}>
                  <AppIcon app={app} large />
                  <h2>{app.name}</h2>
                  <p>{app.tagline}</p>
                </Link>
                <Platforms platforms={app.platforms} />
              </div>
            ))}
            {hero.length === 2 && <span className="versus">vs</span>}
          </div>
        </section>
      )}
      {template === "atlas" && activeSections.includes("discovery") && categories.length > 0 && (
        <nav className="atlas-categories classic-category-strip" aria-label={t("Uygulama kategorileri")}>
          {categories.map((category) => {
            const Icon = categoryIcons[category.id];
            return <Link href={`/kategori/${category.id}`} key={category.id}>
              <Icon size={20} aria-hidden="true"/><span>{t(category.label)}</span><ArrowUpRight size={14} aria-hidden="true" />
            </Link>;
          })}
        </nav>
      )}
      {!catalog.apps.length && (
        <section className="home-panel detail-section empty-catalog">
          <h2>{t("Şu anda listelenebilen uygulama yok.")}</h2>
          <p>{t("Yayımlanmış ve katalog kabul koşullarını karşılayan bir uygulama bulunmuyor. Kaynak incelemesi ve yeni kayıtlar tamamlandıkça katalog güncellenecek.")}</p>
          <Link className="button button-secondary" href="/blog">{t("Blog ve rehberleri oku")}</Link>
        </section>
      )}
      <div className="home-grid classic-home-grid">{activeSections.map((id) => panels[id])}</div>
    </>
  );
}
