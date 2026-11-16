

import { useI18n } from "@/lib/i18n";
import { ModernHomePage, isModernTemplate } from "./ModernHomePage";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  ListChecks,
  Monitor,
  Sparkles,
  Search,
} from "lucide-react";
import { useState } from "react";
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
  const workflow = WORKFLOWS[0];
  const [period, setPeriod] = useState<"week" | "month" | "evergreen">("week");
  const list = catalog.lists.find((l) => l.period === period);
  const weekly = catalog.lists.find((l) => l.period === "week");
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
        />
      ));
  const panels: Record<HomeSectionId, React.ReactNode> = {
    discovery: (
      <section className="home-panel span-7" key="discovery">
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
      <section className="home-panel span-5" key="weekly">
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
      <section className="home-panel span-7" key="trending">
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
          {rows(list?.entries.map((e) => e.appId) || [])}
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
      <section className="home-panel span-5 toolbox" key="toolbox">
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
      <section className="home-panel span-6 editorial-panel" key="guides">
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
      <section className="home-panel span-6 editorial-panel" key="workflows">
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
  if (template === "magazine") {
    const lead = catalog.articles[0];
    panels.discovery = <section className="home-panel magazine-discovery" key="discovery">
      <div className="magazine-lead"><h2>{t("From the editorial desk")}</h2>{lead ? <article><h3><Link href={`/blog/${lead.id}`}>{lead.title}</Link></h3><p>{lead.summary}</p><Link className="text-link" href={`/blog/${lead.id}`}>{t("Read the article")} <ArrowRight size={16}/></Link></article> : <><p>{t("Browse the catalog while new editorial articles are prepared.")}</p><Link className="text-link" href="/kesfet">{t("Kataloğu keşfet")}</Link></>}</div>
      <div className="magazine-apps"><h2>{t("Apps to examine")}</h2><div className="app-list">{rows(catalog.apps.slice(0,3).map(app=>app.id))}</div></div>
    </section>;
  }
  if (template === "directory") {
    panels.discovery = <section className="home-panel directory-discovery" key="discovery"><SectionHeading title={t("App directory")} detail={t("Recorded facts at a glance. Open an app to review its sources.")} href="/kesfet"/>
      {catalog.apps.length>0&&<div className="directory-scroll" role="region" aria-label={t("App directory table")} tabIndex={0}><table className="directory-table"><caption>{t("A selection from the catalog; browse all apps to search the full collection.")}</caption><thead><tr><th scope="col">{t("App")}</th><th scope="col">{t("Platforms")}</th><th scope="col">{t("Pricing summary")}</th><th scope="col">{t("Checked date")}</th><th scope="col">{t("Save")}</th></tr></thead><tbody>{catalog.apps.slice(0,8).map(app=><tr key={app.id}><th scope="row"><Link href={`/uygulama/${app.id}`}><AppIcon app={app}/><span>{app.name}<small>{app.tagline}</small></span></Link></th><td><Platforms platforms={app.platforms}/></td><td>{app.pricingLabel||t("Unverified")}</td><td>{app.checkedAt?formatDate(app.checkedAt):t("Unverified")}</td><td><SaveButton app={app} saved={actions.saved.includes(app.id)} onSave={actions.onSave}/></td></tr>)}</tbody></table></div>}
    </section>;
  }
  const hero = catalog.apps.filter((a) =>
    ["notion", "obsidian"].includes(a.id),
  );
  return (
    <>
      <div className="welcome-line">
        <span>{t("Az uygulama. Daha iyi bir düzen.")}</span>
        <span>Android · iOS · Windows</span>
      </div>
      {template === "magazine" || template === "directory" ? (
        <section className={`template-heading template-heading-${template}`}><div><h1>{t(template === "magazine" ? "Read the context. Choose your tools." : "Find an app. Check the details.")}</h1><p>{t(template === "magazine" ? "Editorial reading and practical app choices, in one place." : "Scan platforms and recorded pricing, then open the evidence behind each app.")}</p></div><Link className="button button-primary" href="/kesfet">{t("Browse all apps")} <ArrowRight size={16}/></Link></section>
      ) : template !== "night" ? (
        <section className={`template-hero template-hero-${template}`}>
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
                ? t("Bir ihtiyacın var. Doğru aracı bulalım.")
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
            {template === "atlas" ? (
              <form action="/kesfet" className="atlas-search" role="search">
                <label htmlFor="atlas-query">{t("Ne yapmak istiyorsun?")}</label>
                <div>
                  <Search size={20} aria-hidden="true" />
                  <input
                    id="atlas-query"
                    name="q"
                    placeholder={t("Uygulama, özellik veya ihtiyaç")}
                  />
                  <button className="button button-primary" type="submit">{t("Ara")}<ArrowRight size={16} />
                  </button>
                </div>
              </form>
            ) : (
              <Link
                className="button button-primary"
                href={
                  template === "workflow" &&
                  activeSections.includes("workflows")
                    ? "/is-akislari"
                    : "/kesfet"
                }
              >
                {template === "workflow" && activeSections.includes("workflows")
                  ? t("İş akışlarını incele")
                  : t("Kataloğu keşfet")}{" "}
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
          {template === "atlas" &&
            activeSections.includes("discovery") &&
            categories.length > 0 && (
              <nav
                className="atlas-categories"
                aria-label={t("Uygulama kategorileri")}
              >
                {categories.map((category) => (
                  <Link href={`/kategori/${category.id}`} key={category.id}>
                    <span>{t(category.label)}</span>
                    <ArrowUpRight size={18} />
                  </Link>
                ))}
              </nav>
            )}
          {template === "workflow" && workflow && activeSections.includes("workflows") && (
            <div className="workflow-preview">
              <h2>{workflow.title}</h2>
              <ol>
                {workflow.steps.map((step) => {
                  const app = catalog.apps.find(
                    (entry) => entry.id === step.appId,
                  );
                  return (
                    <li key={step.title}>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                      {app && (
                        <Link href={`/uygulama/${app.id}`}>
                          <AppIcon app={app} />
                          <span>{app.name}</span>
                          <ArrowUpRight size={14} />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
          {template === "catalog" && activeSections.includes("discovery") && (
            <div className="catalog-preview">
              {catalog.apps.slice(0, 3).map((app) => (
                <Link key={app.id} href={`/uygulama/${app.id}`}>
                  <AppIcon app={app} large />
                  <div>
                    <h2>{app.name}</h2>
                    <p>{app.tagline}</p>
                    <Platforms platforms={app.platforms} />
                  </div>
                  <ArrowUpRight size={20} />
                </Link>
              ))}
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
      {!catalog.apps.length && (
        <section className="home-panel detail-section empty-catalog">
          <h2>{t("Şu anda listelenebilen uygulama yok.")}</h2>
          <p>{t("Yayımlanmış ve katalog kabul koşullarını karşılayan bir uygulama bulunmuyor. Kaynak incelemesi ve yeni kayıtlar tamamlandıkça katalog güncellenecek.")}</p>
          <Link className="button button-secondary" href="/blog">{t("Blog ve rehberleri oku")}</Link>
        </section>
      )}
      <div className="home-intro">
        <h2>{t("Senin için bir başlangıç noktası.")}</h2>
        <p>{t("Bir araç seç. Bir alışkanlık oluştur. Gerisini sadeleştir.")}</p>
      </div>
      <div className="home-grid">{activeSections.map((id) => panels[id])}</div>
    </>
  );
}
