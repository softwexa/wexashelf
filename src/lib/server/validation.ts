import { articleAppIds } from '../article-content';
import {
  extractStoreId,
  isCanonicalStoreId,
  isStoreCountry,
  isSafeIdentityDate,
  storeIdentityKey,
  type StoreIdentity,
} from "../store-identities";
import type { ManagedRecord, RecordKind } from "../domain";
export class StoreError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function check(ok: unknown, message: string): asserts ok {
  if (!ok) throw new StoreError(message);
}
export function object(value: unknown): Record<string, unknown> {
  check(
    value && typeof value === "object" && !Array.isArray(value),
    "Nesne bekleniyor.",
  );
  return value as Record<string, unknown>;
}
const kinds = ["app", "article", "list"];
const states = ["draft", "review", "scheduled", "published", "archived"];
const platforms = ["android", "ios", "windows"];
const factKeys = [
  "offline",
  "sync",
  "export",
  "account-free",
  "ad-free",
  "ocr",
];
function date(value: unknown, label: string, allowEmpty = false) {
  if (allowEmpty && value === "") return;
  check(
    typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) &&
      Number.isFinite(Date.parse(value)),
    `${label}: geçersiz tarih.`,
  );
  if (value.length === 10)
    check(
      new Date(value).toISOString().slice(0, 10) === value,
      `${label}: geçersiz tarih.`,
    );
}
function str(v: unknown, name: string, max = 10000) {
  check(
    typeof v === "string" &&
      v.length <= max &&
      !/<\/?(?:script|iframe|object|embed|style)\b/i.test(v),
    `${name}: geçersiz metin.`,
  );
}
function array(v: unknown, name: string, max = 100) {
  check(Array.isArray(v) && v.length <= max, `${name}: geçersiz liste.`);
  return v;
}
function url(v: unknown, empty = false) {
  if (empty && v === "") return;
  str(v, "URL", 2048);
  let u: URL;
  try {
    u = new URL(v as string);
  } catch {
    throw new StoreError("Geçersiz URL.");
  }
  check(
    ["https:", "http:"].includes(u.protocol) && !u.username && !u.password,
    "Yalnız HTTP(S) adresleri kullanılabilir.",
  );
}
function scan(v: unknown, key = "", depth = 0): void {
  check(depth < 12, "İçerik çok iç içe.");
  if (typeof v === "string") {
    str(v, key, key === "description" ? 20000 : 10000);
    if (/url$|website/i.test(key)) url(v, true);
  } else if (Array.isArray(v)) {
    check(v.length <= 200, "Liste çok uzun.");
    v.forEach((x) => scan(x, key, depth + 1));
  } else if (v && typeof v === "object")
    for (const [k, x] of Object.entries(v)) scan(x, k, depth + 1);
}
export function validateData(kind: unknown, value: unknown): void {
  check(
    typeof kind === "string" && kinds.includes(kind),
    "Geçersiz kayıt türü.",
  );
  const d = object(value);
  scan(d);
  check(
    typeof d.id === "string" && /^[a-z0-9][a-z0-9-]{0,79}$/.test(d.id),
    "Geçersiz kimlik.",
  );
  for (const [field, expectedKind, maximum] of [["images", "article", 20], ["screenshots", "app", 5]] as const) {
    if (d[field] === undefined) continue;
    const images = d[field];
    check(kind === expectedKind && Array.isArray(images) && images.length <= maximum, "Invalid record images.");
    const seen = new Set<string>();
    for (const raw of images) {
      const image = object(raw);
      check(Object.keys(image).every(key => ["assetId","format","width","height","alt","caption","aiGenerated"].includes(key)), "Invalid article image fields.");
      check(typeof image.assetId === "string" && /^[a-f0-9]{64}$/.test(image.assetId) && !seen.has(image.assetId) && ["png","jpg","webp"].includes(String(image.format)), "Invalid or duplicate image identity.");
      seen.add(image.assetId);
      check(typeof image.width === "number" && typeof image.height === "number" && Number.isInteger(image.width) && Number.isInteger(image.height) && image.width > 0 && image.height > 0 && image.width <= 4096 && image.height <= 4096 && image.width * image.height <= 12000000, "Image dimensions exceed the supported limit.");
      for (const [key,max] of [["alt",300],["caption",500]] as const) check(typeof image[key] === "string" && [...image[key]].length <= max && !/[<>\x00-\x1f\x7f]/u.test(image[key]), "Image text must be plain text.");
      check(String(image.alt).trim() !== "" && typeof image.aiGenerated === "boolean", "Image alternative text and provenance are required.");
    }
  }
  if (d.seo !== undefined) {
    const seo = object(d.seo);
    check(Object.keys(seo).every(key => ["title", "description", "noindex"].includes(key)), "Geçersiz SEO alanları.");
    if (seo.title !== undefined) str(seo.title, "SEO başlığı", 160);
    if (seo.description !== undefined) str(seo.description, "SEO açıklaması", 500);
    if (seo.noindex !== undefined) check(typeof seo.noindex === "boolean", "Geçersiz indeks tercihi.");
  }
  if (d.cover !== undefined) {
    const cover = object(d.cover);
    check(kind === "article" && Object.keys(cover).every(key => ["assetId", "alt", "caption", "aiGenerated"].includes(key)), "Geçersiz kapak.");
    check(typeof cover.assetId === "string" && /^[a-f0-9]{64}$/.test(cover.assetId) && cover.aiGenerated === true, "Geçersiz kapak kimliği.");
    str(cover.alt, "Kapak alternatif metni", 500); check(String(cover.alt).trim().length > 0, "Kapak alternatif metni gerekli.");
    str(cover.caption, "Kapak açıklaması", 500);
  }
  if (kind === "app") {
    for (const k of [
      "name",
      "tagline",
      "icon",
      "color",
      "publisher",
      "pricingLabel",
      "checkedAt",
    ])
      str(d[k], k);
    str(d.description, "description", 20000);
    check(Array.from(String(d.description)).length <= 10000, "description: metin çok uzun.");
    date(d.checkedAt, "Kontrol tarihi");
    check(/^#[0-9a-fA-F]{6}$/.test(String(d.color)), "Geçersiz renk.");
    check(
      [
        "productivity",
        "notes",
        "documents",
        "media",
        "browser",
        "design",
      ].includes(String(d.category)),
      "Geçersiz kategori.",
    );
    check(
      ["free", "freemium", "subscription", "one-time", "unknown"].includes(
        String(d.pricingModel),
      ),
      "Geçersiz fiyat modeli.",
    );
    check(
      array(d.platforms, "platforms").length > 0 &&
        (d.platforms as unknown[]).every((p) => platforms.includes(String(p))),
      "Geçersiz platform.",
    );
    check(
      typeof d.icon === "string" &&
        /^(?:\/icons\/[a-z0-9.-]+\.(?:svg|png|jpg|webp)|\/media\/[a-f0-9]{64}\.(?:png|jpg|webp))$/.test(d.icon),
      "Yerel ikon gerekli.",
    );
    url(d.website);
    url(d.sourceUrl);
    for (const [p, link] of Object.entries(object(d.storeLinks))) {
      url(link);
      const host = new URL(link as string).hostname;
      check(
        (
          {
            android: ["play.google.com"],
            ios: ["apps.apple.com"],
            windows: ["apps.microsoft.com", "www.microsoft.com"],
          } as Record<string, string[]>
        )[p]?.includes(host),
        "Mağaza adresi platformla eşleşmiyor.",
      );
    }
    if (d.storeIds !== undefined) {
      const seen = new Set<string>();
      for (const raw of array(d.storeIds, "storeIds")) {
        const identity = object(raw);
        check(
          platforms.includes(String(identity.platform)) &&
            (d.platforms as string[]).includes(String(identity.platform)),
          "Mağaza kimliği platformu geçersiz.",
        );
        const platform = identity.platform as StoreIdentity["platform"];
        check(
          isCanonicalStoreId(platform, identity.storeId),
          "Geçersiz mağaza kimliği.",
        );
        check(isStoreCountry(identity.country), "Geçersiz mağaza ülkesi.");
        check(
          typeof identity.sourceUrl === "string" &&
            extractStoreId(platform, identity.sourceUrl) === identity.storeId,
          "Mağaza ürün adresi kimlikle eşleşmiyor.",
        );
        check(
          isSafeIdentityDate(identity.checkedAt),
          "Geçersiz mağaza kontrol tarihi.",
        );
        const source = new URL(identity.sourceUrl as string);
        const sourceCountry =
          platform === "ios"
            ? source.pathname.match(/^\/([a-z]{2})\/app\//)?.[1]
            : source.searchParams.get("gl");
        check(
          !sourceCountry || sourceCountry.toUpperCase() === identity.country,
          "Mağaza adresinin ülkesi eşleşmiyor.",
        );
        const key = storeIdentityKey(identity as unknown as StoreIdentity);
        check(!seen.has(key), "Yinelenen mağaza kimliği.");
        seen.add(key);
      }
    }
    for (const key of ["tags", "aliases"])
      array(d[key], key).forEach((v) => { str(v, key, 200); check(Array.from(String(v)).length <= 100, `${key}: metin çok uzun.`); });
    const seenFacts = new Set<string>();
    for (const note of array(d.featureNotes, "featureNotes")) {
      const n = object(note);
      str(n.label, "label");
      str(n.value, "value");
    }
    for (const fact of array(d.facts, "facts")) {
      const f = object(fact);
      check(
        [
          "offline",
          "sync",
          "export",
          "account-free",
          "ad-free",
          "ocr",
        ].includes(String(f.key)) &&
          platforms.includes(String(f.platform)) &&
          ["supported", "limited", "unsupported", "unknown"].includes(
            String(f.state),
          ) &&
          ["publisher", "tested"].includes(String(f.evidence)),
        "Geçersiz özellik kanıtı.",
      );
      str(f.detail, "detail");
      url(f.sourceUrl);
      str(f.checkedAt, "checkedAt");
      date(f.checkedAt, "Özellik kontrol tarihi");
      check(
        (d.platforms as string[]).includes(String(f.platform)),
        "Özellik platformu uygulamada bulunmuyor.",
      );
      const factId = `${f.platform}:${f.key}`;
      check(!seenFacts.has(factId), "Aynı platform ve özellik tekrarlanamaz.");
      seenFacts.add(factId);
    }
    const seenPlans = new Set<string>();
    for (const plan of array(d.plans, "plans")) {
      const p = object(plan);
      for (const k of ["id", "name", "note", "checkedAt"]) str(p[k], k);
      date(p.checkedAt, "Plan kontrol tarihi");
      check(
        !!p.id && !seenPlans.has(String(p.id)),
        "Plan kimliği boş veya yineleniyor.",
      );
      seenPlans.add(String(p.id));
      check(
        ["TRY", "USD", "EUR"].includes(String(p.currency)),
        "Geçersiz para birimi.",
      );
      for (const k of ["monthlyPrice", "annualPrice"])
        check(
          p[k] === null ||
            (typeof p[k] === "number" && Number.isFinite(p[k]) && p[k] >= 0),
          "Geçersiz ücret.",
        );
      for (const k of ["free", "perSeat"])
        check(typeof p[k] === "boolean", "Geçersiz plan.");
      check(
        array(p.platforms, "platforms").length > 0,
        "Plan platformu gerekli.",
      );
      array(p.platforms, "platforms").forEach((x) =>
        check(
          (d.platforms as string[]).includes(String(x)),
          "Geçersiz platform.",
        ),
      );
      array(p.features, "features").forEach((key) =>
        check(factKeys.includes(String(key)), "Geçersiz plan özelliği."),
      );
      check(
        !p.free ||
          [p.monthlyPrice, p.annualPrice].every(
            (price) => price === 0 || price === null,
          ),
        "Ücretsiz planın fiyatı sıfır olmalı.",
      );
      array(p.limits, "limits").forEach((x) => {
        const n = object(x);
        str(n.label, "label");
        str(n.value, "value");
      });
      url(p.sourceUrl);
    }
    for (const metric of array(d.storeMetrics, "storeMetrics")) {
      const m = object(metric);
      check(platforms.includes(String(m.platform)), "Geçersiz platform.");
      str(m.country, "country", 2);
      url(m.sourceUrl);
      str(m.observedAt, "observedAt");
      date(m.observedAt, "Gözlem tarihi");
      check(
        /^[A-Z]{2}$/.test(String(m.country)),
        "Ülke iki büyük harfle yazılmalı.",
      );
      for (const k of ["downloadsLowerBound", "rating", "ratingCount"])
        check(
          m[k] === null ||
            (typeof m[k] === "number" &&
              Number.isFinite(m[k]) &&
              m[k] >= 0 &&
              (k !== "rating" || m[k] <= 5)),
          "Geçersiz metrik.",
        );
      for (const key of ["downloadsLowerBound", "ratingCount"])
        check(
          m[key] === null || Number.isSafeInteger(m[key]),
          "Sayaç tam sayı olmalı.",
        );
    }
  } else if (kind === "article") {
    for (const k of ["title", "summary", "author", "publishedAt", "updatedAt"])
      str(d[k], k);
    date(d.publishedAt, "Yayın tarihi", true);
    date(d.updatedAt, "Güncelleme tarihi", true);
    check(
      ["guide", "comparison", "alternatives", "review", "news"].includes(
        String(d.kind),
      ) && ["source-research", "editor-tested"].includes(String(d.method)),
      "Geçersiz makale türü.",
    );
    array(d.sections, "sections").forEach((v) => {
      const s = object(v);
      str(s.heading, "heading");
      array(s.paragraphs, "paragraphs").forEach((p) => str(p, "paragraph"));
    });
    array(d.appIds, "appIds").forEach((x) => str(x, "appId", 80));
    array(d.sources, "sources").forEach((v) => {
      const s = object(v);
      str(s.title, "title");
      url(s.url);
    });
  } else {
    for (const k of ["title", "summary", "method", "startDate", "endDate"])
      str(d[k], k);
    date(d.startDate, "Başlangıç tarihi", d.period === "evergreen");
    date(d.endDate, "Bitiş tarihi", d.period === "evergreen");
    check(
      !d.startDate || !d.endDate || String(d.startDate) <= String(d.endDate),
      "Dönem tarihleri ters olamaz.",
    );
    check(
      ["week", "month", "evergreen"].includes(String(d.period)),
      "Geçersiz dönem.",
    );
    array(d.entries, "entries").forEach((v) => {
      const e = object(v);
      str(e.appId, "appId", 80);
      str(e.reason, "reason");
    });
  }
}
export function validateManaged(value: unknown): ManagedRecord {
  const r = object(value);
  check(r.sourceLocale === undefined || typeof r.sourceLocale === 'string' && /^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(r.sourceLocale), 'Invalid source language.');
  validateData(r.kind, r.data);
  check(states.includes(String(r.status)), "Geçersiz yayın durumu.");
  check(typeof r.seoApproved === "boolean", "SEO onayı gerekli.");
  if (r.revision !== undefined)
    check(
      Number.isSafeInteger(r.revision) && Number(r.revision) >= 0,
      "Geçersiz revizyon.",
    );
  if (r.updatedAt !== undefined) date(r.updatedAt, "Kayıt tarihi");
  str(r.reviewNote ?? "", "reviewNote");
  str(r.admissionException ?? "", "Editör istisnası", 1000);
  check(
    r.publishAt === null ||
      r.publishAt === undefined ||
      (typeof r.publishAt === "string" &&
        Number.isFinite(Date.parse(r.publishAt))),
    "Geçersiz yayın zamanı.",
  );
  const d = object(r.data);
  if(r.kind === "article") {d.appIds = articleAppIds(d as unknown as import("../domain").ArticleRecord);check((d.appIds as string[]).length <= 100,"Article app references exceed the supported limit.");}
  if (r.status === "published" || r.status === "scheduled") {
    if (r.kind === "app")
      check(
        d.name && d.description && d.sourceUrl,
        "Ad, açıklama ve kaynak gerekli.",
      );
    else if (r.kind === "article")
      check(
        d.title &&
          d.summary &&
          d.author &&
          (d.sources as unknown[]).length &&
          (d.sections as { paragraphs: string[] }[]).some((x) =>
            x.paragraphs.some((p) => p.trim()),
          ),
        "Başlık, özet, yazar, kaynak ve içerik gerekli.",
      );
    else
      check(
        d.title && d.summary && d.method && (d.entries as unknown[]).length,
        "Liste özeti, yöntem ve öğeler gerekli.",
      );
  }
  if (r.status === "scheduled")
    check(r.publishAt, "Zamanlanmış yayın için tarih gerekli.");
  return {
    ...r,
    sourceLocale: r.sourceLocale ?? 'tr',
    kind: r.kind as RecordKind,
    id: d.id,
    reviewNote: r.reviewNote ?? "",
    publishAt: r.publishAt ?? null,
  } as ManagedRecord;
}
