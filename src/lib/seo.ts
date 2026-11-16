import { BRAND } from "@/lib/brand";
import { findPublisher, getPublishers } from "./publishers";
import type { Metadata, MetadataRoute } from "next";
import type { CatalogSnapshot, RecordKind } from "./domain";
import { CATEGORIES, GUIDES, WORKFLOWS } from "./catalog";

export const PAGE_NAMES: Record<string, string> = {
  yayincilar: "Yayıncılar",
  kesfet: "Uygulamaları keşfet",
  karsilastir: "Uygulamaları karşılaştır",
  listeler: "Editör seçkileri",
  rehberler: "Rehberler",
  kaydedilenler: "Kaydedilenler",
  "ucretsiz-planlar": "Planları keşfet",
  "platform-farklari": "Platform farkları",
  "is-akislari": "İş akışları",
  "gecis-rehberleri": "Geçiş rehberleri",
  ayarlar: "Temalar ve eklentiler",
  blog: "Uygulama günlüğü",
  kategoriler: "Uygulama kategorileri",
  "secim-sihirbazi": "İhtiyacına uygun uygulamayı bul",
  "maliyet-hesapla": "Uygulama maliyetini hesapla",
  "submit-app": "Submit an app",
  yontem: "İnceleme ve seçki yöntemimiz",
  hakkimizda: `${BRAND.name} hakkında`,
  gizlilik: "Verilerin ve gizlilik",
  "duzeltme-politikasi": "Bilgi düzeltme politikası",
};
const PRIVATE_ROUTES = new Set([
  "ayarlar",
  "kaydedilenler",
  "yonetim",
  "secim-sihirbazi",
  "maliyet-hesapla",
  "submit-app",
]);
const STATIC_INDEX_PATHS = [
  "/",
  "/hakkimizda",
  "/yontem",
  "/duzeltme-politikasi",
];
const APP_ROUTE_KIND: Record<string, RecordKind> = {
  uygulama: "app",
  blog: "article",
  liste: "list",
};

export function siteConfiguration(
  env: Record<string, string | undefined> = process.env,
) {
  let origin: string | null = null;
  try {
    const url = new URL(env.SITE_URL || "");
    const host = url.hostname.toLowerCase();
    if (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !host.endsWith(".localhost") &&
      !host.endsWith(".local") &&
      host !== "localhost" &&
      !host.endsWith(".example") &&
      !host.endsWith(".test") &&
      host.includes(".") &&
      !/^\d+\.\d+\.\d+\.\d+$/.test(host) &&
      !host.includes(":")
    )
      origin = url.origin;
  } catch {
    /* No domain is safer than an invented public canonical. */
  }
  return { origin, indexEnabled: !!origin && env.INDEXING_ENABLED === "true" };
}
export type SiteConfiguration = ReturnType<typeof siteConfiguration>;

export function pageIdentity(path: string[], catalog: CatalogSnapshot) {
  const [route, id] = path;
  const publisher =
    route === "yayinci" ? findPublisher(catalog, id) : undefined;
  const app =
    route === "uygulama"
      ? catalog.apps.find((item) => item.id === id)
      : undefined;
  const article =
    route === "blog" && id
      ? catalog.articles.find((item) => item.id === id)
      : undefined;
  const list =
    route === "liste"
      ? catalog.lists.find((item) => item.id === id)
      : undefined;
  const guide =
    route === "rehber" ? GUIDES.find((item) => item.id === id) : undefined;
  const workflow =
    route === "is-akisi" ? WORKFLOWS.find((item) => item.id === id) : undefined;
  const category =
    route === "kategori"
      ? CATEGORIES.find((item) => item.id === id)
      : undefined;
  return {
    title:
      app?.seo?.title || article?.seo?.title || list?.seo?.title ||
      (publisher ? `${publisher.name} uygulamaları` : undefined) ||
      app?.name ||
      article?.title ||
      list?.title ||
      guide?.title ||
      workflow?.title ||
      (category
        ? `${category.label} uygulamaları`
        : route === "etiket"
          ? `${id} uygulamaları`
          : Object.hasOwn(PAGE_NAMES, route)
            ? PAGE_NAMES[route]
            : BRAND.name),
    description:
      app?.seo?.description || article?.seo?.description || list?.seo?.description ||
      (route === "submit-app" ? "Submit application details, store links and images for private editorial review, or check an existing submission with its tracking code." : undefined) ||
      (publisher
        ? `${publisher.name} adıyla katalogda listelenen ${publisher.apps.length} uygulamayı ve platformlarını incele.`
        : route === "yayincilar"
          ? `Herkese açık katalogdaki ${getPublishers(catalog).length} yayıncı adını ve ilişkili uygulamaları keşfet.`
          : undefined) ||
      app?.description ||
      article?.summary ||
      list?.summary ||
      guide?.description ||
      workflow?.description ||
      "Android, iOS ve Windows uygulamalarını kaynaklarıyla keşfet, karşılaştır ve ihtiyacına uygun araçları seç.",
    app,
    article,
    list,
  };
}

function recordNoindex(kind: string, id: string, catalog: CatalogSnapshot): boolean {
  const data = kind === "app" ? catalog.apps : kind === "article" ? catalog.articles : catalog.lists;
  return data.find(item => item.id === id)?.seo?.noindex === true;
}

export function canIndex(
  path: string[],
  catalog: CatalogSnapshot,
  query: Record<string, unknown> = {},
  config = siteConfiguration(),
): boolean {
  if (
    !config.indexEnabled ||
    Object.keys(query).length ||
    PRIVATE_ROUTES.has(path[0])
  )
    return false;
  const pathname = "/" + path.join("/");
  if (STATIC_INDEX_PATHS.includes(pathname)) return true;
  const kind = APP_ROUTE_KIND[path[0]];
  if (kind && path.length === 2)
    return catalog.records.some(
      (r) => r.kind === kind && r.id === path[1] && r.seoApproved && !recordNoindex(r.kind, r.id, catalog),
    );
  if (path.length === 1 && ["blog", "listeler"].includes(path[0])) {
    const type = path[0] === "blog" ? "article" : "list";
    return catalog.records.some((r) => r.kind === type && r.seoApproved && !recordNoindex(r.kind, r.id, catalog));
  }
  // Categories and combinations need their own editorial approval model before indexing.
  return false;
}

export function buildMetadata(
  path: string[],
  catalog: CatalogSnapshot,
  query: Record<string, unknown> = {},
  config = siteConfiguration(),
): Metadata {
  const identity = pageIdentity(path, catalog);
  const pathname = "/" + path.map(encodeURIComponent).join("/");
  const isPrivate = PRIVATE_ROUTES.has(path[0]);
  const canonical =
    config.origin && !isPrivate && !Object.keys(query).length
      ? config.origin + pathname
      : undefined;
  return {
    title: path.length ? identity.title : "Kendine uygun olanı keşfet",
    description: identity.description,
    robots: {
      index: canIndex(path, catalog, query, config),
      follow: config.indexEnabled && !isPrivate,
    },
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: identity.article ? "article" : "website",
      title: identity.title,
      description: identity.description,
      locale: "tr_TR",
      siteName: BRAND.name,
      ...(canonical ? { url: canonical } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: identity.title,
      description: identity.description,
    },
  };
}

export function buildSitemap(
  catalog: CatalogSnapshot,
  config = siteConfiguration(),
): MetadataRoute.Sitemap {
  if (!config.indexEnabled || !config.origin) return [];
  const pages: MetadataRoute.Sitemap = STATIC_INDEX_PATHS.map((path) => ({
    url: config.origin + path,
  }));
  const routes = { app: "uygulama", article: "blog", list: "liste" };
  for (const record of catalog.records) {
    if (record.seoApproved && !recordNoindex(record.kind, record.id, catalog))
      pages.push({
        url: `${config.origin}/${routes[record.kind]}/${encodeURIComponent(record.id)}`,
        lastModified: record.updatedAt,
      });
  }
  for (const route of ["blog", "listeler"])
    if (canIndex([route], catalog, {}, config))
      pages.push({ url: config.origin + "/" + route });
  return pages;
}

export function structuredData(
  path: string[],
  catalog: CatalogSnapshot,
  config = siteConfiguration(),
): object[] {
  if (!config.origin || PRIVATE_ROUTES.has(path[0])) return [];
  const identity = pageIdentity(path, catalog);
  const url = config.origin + "/" + path.map(encodeURIComponent).join("/");
  const data: object[] = [];
  if (!path.length)
    data.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: BRAND.name,
      url: config.origin,
      inLanguage: "tr",
    });
  if (identity.app)
    data.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: identity.app.name,
      description: identity.app.description,
      url,
      operatingSystem: identity.app.platforms.map(
        (p) => ({ android: "Android", ios: "iOS", windows: "Windows" })[p],
      ),
      applicationCategory: CATEGORIES.find(
        (c) => c.id === identity.app?.category,
      )?.label,
      sameAs: identity.app.website,
    });
  if (identity.article)
    data.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: identity.article.title,
      description: identity.article.summary,
      author: { "@type": "Organization", name: identity.article.author },
      datePublished: identity.article.publishedAt,
      dateModified: identity.article.updatedAt,
      mainEntityOfPage: url,
      inLanguage: "tr",
      citation: identity.article.sources.map((s) => s.url),
    });
  return data;
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
