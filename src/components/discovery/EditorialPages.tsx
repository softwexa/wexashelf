

import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { CATEGORIES } from "../../lib/catalog";
import { localeContent } from "@/lib/i18n-content";
import { ArticleContent } from "./ArticleContent";
import {articleAppIds} from "@/lib/article-content";
import { availableContent } from "@/lib/available-content";
import type { CatalogSnapshot } from "../../lib/domain";
import { AppCard, AppRow, External, Heading, type AppActions } from "./Shared";
export function EditorialPages({
  path,
  catalog,
  basePath = "",
  ...actions
}: { path: string[]; catalog: CatalogSnapshot; basePath?: string } & AppActions) {
  const { t, locale, formatDate, formatNumber, countryName } = useI18n();
  const { guides: GUIDES, workflows: WORKFLOWS } = availableContent(localeContent(locale),catalog.apps);
  const route = path[0];
  const [period, setPeriod] = useState<"week" | "month" | "evergreen">("week");
  if (route === "blog" && path[1]) {
    const article = catalog.articles.find((a) => a.id === path[1]);
    if (!article)
      return (
        <Heading
          eyebrow={t("Blog")}
          title={t("Yazı bulunamadı.")}
          description={t("Yazı kaldırılmış veya henüz yayımlanmamış olabilir.")}
        />
      );
    return (
      <>
        <Link className="back-link" href="/blog">{t("← Bloga dön")}</Link>
        <Heading
          eyebrow={
            article.kind === "comparison"
              ? t("Karşılaştırma")
              : article.kind === "alternatives"
                ? t("Alternatifler")
                : t("Kaynaklı rehber")
          }
          title={article.title}
          description={article.summary}
        />
        <div className="article-meta">
          <span>{article.author}</span>
          <span>{t("Yayın:")}{" "}{formatDate(article.publishedAt)}</span>
          <span>{t("Güncelleme:")}{" "}{formatDate(article.updatedAt)}</span>
          <span>
            {article.method === "editor-tested"
              ? t("Editör denemesi")
              : t("Kaynak araştırması")}
          </span>
        </div>
        {article.cover && <figure className="article-cover"><img src={`${basePath}/media/${article.cover.assetId}.png`} alt={article.cover.alt} width={1536} height={1024} /><figcaption>{article.cover.caption}{article.cover.aiGenerated && <span className="article-image-disclosure">{t("AI-generated illustrative image.")}</span>}</figcaption></figure>}
        <div className="article-layout">
          <article className="home-panel long-article">
            <ArticleContent sections={article.sections} images={article.images} apps={catalog.apps} basePath={basePath}/>
            <section className="article-sources">
              <h2>{t("Kaynaklar")}</h2>
              <ul>
                {article.sources.map((source) => (
                  <li key={source.url}>
                    <External href={source.url}>{source.title}</External>
                  </li>
                ))}
              </ul>
              <Link className="text-link" href="/duzeltme-politikasi">{t("Düzeltme ve güncelleme politikası")}</Link>
            </section>
          </article>
          <aside className="home-panel">
            <h2>{t("Bu yazıda")}</h2>
            {articleAppIds(article)
              .map((id) => catalog.apps.find((a) => a.id === id))
              .filter((a) => !!a)
              .map((app) => (
                <AppRow
                  app={app}
                  key={app.id}
                  saved={actions.saved}
                  onSave={actions.onSave}
                />
              ))}
            {article.appIds.length > 1 && (
              <Link
                className="button button-secondary"
                href={`/karsilastir?apps=${article.appIds.slice(0, 4).join(",")}`}
              >{t("Uygulamaları karşılaştır")}</Link>
            )}
          </aside>
        </div>
      </>
    );
  }
  if (route === "blog")
    return (
      <>
        <Heading
          eyebrow={t("Editörün notları")}
          title={t("Daha bilinçli bir seçim.")}
          description={t("Uygulamaları seçerken, karşılaştırırken ve düzenini taşırken kaynaklarıyla işine yarayacak yazılar.")}
        />
        <div className="story-grid">
          {catalog.articles.map((article) => (
            <Link
              className="story-card"
              key={article.id}
              href={`/blog/${article.id}`}
            >
              {article.cover && <img className="story-cover" src={`${basePath}/media/${article.cover.assetId}.png`} alt={article.cover.alt} width={1536} height={1024} loading="lazy" />}
              <span className="eyebrow">
                {article.kind === "comparison"
                  ? t("Karşılaştırma")
                  : article.kind === "alternatives"
                    ? t("Alternatifler")
                    : "Rehber"}
              </span>
              <h2>{article.title}</h2>
              <p>{article.summary}</p>
              <span className="settings-note">
                {article.author} · {formatDate(article.updatedAt)}
              </span>
              <span className="text-link">{t("Yazıyı oku")}<ArrowRight size={17} />
              </span>
            </Link>
          ))}
        </div>
        {!catalog.articles.length && (
          <p className="home-panel">{t("Henüz yayımlanmış yazı bulunmuyor.")}</p>
        )}
      </>
    );
  if (route === "liste") {
    const list = catalog.lists.find((l) => l.id === path[1]);
    if (!list)
      return (
        <Heading
          eyebrow={t("Editör seçkisi")}
          title={t("Liste bulunamadı.")}
          description={t("Diğer seçkilere göz at.")}
        />
      );
    return (
      <>
        <Link className="back-link" href="/listeler">{t("← Seçkilere dön")}</Link>
        <Heading
          eyebrow={t("Editör seçkisi")}
          title={list.title}
          description={list.summary}
        />
        <p className="article-meta">
          {list.period === "evergreen"
            ? t("Kalıcı öneriler")
            : `${list.startDate} — ${list.endDate}`}
        </p>
        <section className="home-panel list-method">
          <h2>{t("Nasıl seçildi?")}</h2>
          <p>{list.method}</p>
          <Link href="/yontem" className="text-link">{t("Sıralamalar ve editör yaklaşımı")}</Link>
        </section>
        <div className="selection-list">
          {list.entries.map((entry, i) => {
            const app = catalog.apps.find((a) => a.id === entry.appId);
            return (
              <section className="home-panel" key={entry.appId}>
                <span className="eyebrow">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {app ? (
                  <AppRow
                    app={app}
                    saved={actions.saved}
                    onSave={actions.onSave}
                  />
                ) : (
                  <h2>{t("Kayıt artık yayında değil")}</h2>
                )}
                <p className="selection-reason">{entry.reason}</p>
              </section>
            );
          })}
        </div>
      </>
    );
  }
  if (route === "listeler") {
    const lists = catalog.lists.filter((l) => l.period === period);
    return (
      <>
        <Heading
          eyebrow={t("Editörün masasından")}
          title={t("Bir ihtiyaç, birkaç iyi seçenek.")}
          description={t("Her seçkinin dönemi, yöntemi ve seçim gerekçesi açık. Bu listeler indirme veya mağaza sıralaması değildir.")}
        />
        <div className="period-tabs large-tabs">
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
        <div className="story-grid">
          {lists.map((list) => (
            <Link
              className="story-card"
              href={`/liste/${list.id}`}
              key={list.id}
            >
              <span className="eyebrow">
                {list.period === "evergreen"
                  ? t("Kalıcı seçki")
                  : `${list.startDate} — ${list.endDate}`}
              </span>
              <h2>{list.title}</h2>
              <p>{list.summary}</p>
              <span className="text-link">{t("Seçim gerekçelerini oku")}<ArrowRight size={17} />
              </span>
            </Link>
          ))}
        </div>
        {!lists.length && (
          <p className="home-panel">{t("Bu dönemde yayımlanmış seçki bulunmuyor.")}</p>
        )}
      </>
    );
  }
  if (route === "kategoriler")
    return (
      <>
        <Heading
          eyebrow={t("Kullanım alanları")}
          title={t("İşinden yola çık.")}
          description={t("Benzer ihtiyaçlara cevap veren uygulamalara birlikte bak.")}
        />
        <div className="story-grid">
          {CATEGORIES.filter((c) => c.id !== "all").map((category) => (
            <Link
              className="story-card"
              key={category.id}
              href={`/kategori/${category.id}`}
            >
              <h2>{t(category.label)}</h2>
              <p>
                {catalog.apps.filter((a) => a.category === category.id).length}{" "}{" "}{t("uygulama")}</p>
              <span className="text-link">{t("Kategoriye göz at")}<ArrowRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      </>
    );
  if (route === "rehber") {
    const guide = GUIDES.find((g) => g.id === path[1]);
    return guide ? (
      <>
        <Heading
          eyebrow={t("Adım adım")}
          title={guide.title}
          description={guide.description}
        />
        <div className="article-layout">
          <article className="home-panel readable-article">
            <ol>
              {guide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
          <aside className="home-panel">
            <h2>{t("Bu rehberde")}</h2>
            {guide.appIds
              .map((id) => catalog.apps.find((a) => a.id === id))
              .filter((a) => !!a)
              .map((app) => (
                <AppRow
                  key={app.id}
                  app={app}
                  saved={actions.saved}
                  onSave={actions.onSave}
                />
              ))}
          </aside>
        </div>
      </>
    ) : <Heading eyebrow={t("Guides and workflows")} title={t("This content is unavailable.")} description={t("Its referenced apps are not all available in this catalog language.")}/>;
  }
  if (route === "is-akisi") {
    const flow = WORKFLOWS.find((w) => w.id === path[1]);
    return flow ? (
      <>
        <Heading
          eyebrow={t("Örnek iş akışı")}
          title={flow.title}
          description={flow.description}
        />
        <article className="home-panel readable-article">
          <ol>
            {flow.steps.map((step) => (
              <li key={step.title}>
                <h2>{step.title}</h2>
                <p>{step.description}</p>
                {step.appId &&
                  catalog.apps.some((a) => a.id === step.appId) && (
                    <Link
                      className="text-link"
                      href={`/uygulama/${step.appId}`}
                    >
                      {catalog.apps.find((a) => a.id === step.appId)?.name}{" "}{" "}{t("uygulamasını incele")}<ArrowRight size={15} />
                    </Link>
                  )}
              </li>
            ))}
          </ol>
          <p className="settings-note">{t("Bu, elle uygulanabilen bir düzen önerisidir; uygulamalar arasında otomatik entegrasyon çalıştırmaz.")}</p>
        </article>
      </>
    ) : <Heading eyebrow={t("Guides and workflows")} title={t("This content is unavailable.")} description={t("Its referenced apps are not all available in this catalog language.")}/>;
  }
  if (["rehberler", "gecis-rehberleri", "is-akislari"].includes(route)) {
    const workflow = route === "is-akislari";
    const items = workflow
      ? WORKFLOWS
      : GUIDES.filter(
          (g) => route !== "gecis-rehberleri" || g.kind === "migration",
        );
    return (
      <>
        <Heading
          eyebrow={t("Daha rahat bir başlangıç")}
          title={
            workflow
              ? t("Birlikte daha anlamlı.")
              : route === "gecis-rehberleri"
                ? t("Düzenini yanında götür.")
                : t("Küçük adımlarla ilerle.")
          }
          description={
            workflow
              ? t("Bir işi tamamlamak için örnek uygulama akışları.")
              : t("Başlarken ve uygulama değiştirirken işine yarayacak kısa notlar.")
          }
        />
        <div className="story-grid">
          {items.map((item, i) => (
            <Link
              className="story-card"
              key={item.id}
              href={`/${workflow ? "is-akisi" : "rehber"}/${item.id}`}
            >
              <span className="story-number">0{i + 1}</span>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <span className="text-link">
                {workflow ? t("Akışı gör") : t("Rehberi oku")}{" "}
                <ArrowRight size={17} />
              </span>
            </Link>
          ))}
        </div>
        <Link className="button button-secondary detail-section" href="/blog">{t("Kaynaklı blog yazıları")}</Link>
      </>
    );
  }
  if (route === "ucretsiz-planlar" || route === "platform-farklari") {
    const plans = route === "ucretsiz-planlar";
    return (
      <>
        <Heading
          eyebrow={t("Seçmeden önce")}
          title={
            plans
              ? t("Ücretsiz plan sana yeter mi?")
              : t("Cihaz değişince ne değişir?")
          }
          description={
            plans
              ? t("Ücretsiz indirme, bütün işlemlerin ücretsiz olduğu anlamına gelmez. Her uygulamanın plan ve limit kayıtlarını incele.")
              : t("Bir uygulamanın farklı cihazlarda bulunması, bütün özelliklerinin aynı olduğunu göstermez.")
          }
        />
        <div className="home-panel detail-section">
          <h2>
            {plans ? t("Önce ihtiyacını yaz") : t("Kanıtı platformuna göre oku")}
          </h2>
          <p>
            {plans
              ? t("Cihaz sayısı, kullanıcı sayısı, depolama, dosya boyutu ve dışa aktarma ihtiyacını listele. Kaynağı ve tarihi eksik sınırları kesin bilgi sayma.")
              : t("Özellik matrislerinde desteklenen, sınırlı, desteklenmeyen ve doğrulanmamış durumlar ayrıdır. Bir platformun kanıtı diğerine taşınmaz.")}
          </p>
          <Link
            className="button button-primary"
            href={plans ? "/maliyet-hesapla" : "/secim-sihirbazi"}
          >
            {plans ? t("Maliyet senaryosu oluştur") : t("Koşullarına göre aday bul")}
          </Link>
        </div>
        <div className="catalog-grid">
          {catalog.apps.map((app) => (
            <AppCard key={app.id} app={app} {...actions} />
          ))}
        </div>
      </>
    );
  }
  return null;
}
