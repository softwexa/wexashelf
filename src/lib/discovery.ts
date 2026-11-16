import { CATEGORIES, type Category, type Platform } from "./catalog";
import {
  FACT_LABELS,
  type AppRecord,
  type AppPlan,
  type FactKey,
  type PricingModel,
} from "./domain";

export interface DiscoveryFilters {
  query: string;
  category: Category;
  platforms: Platform[];
  platformMode: "any" | "all";
  tag: string;
  pricing: PricingModel | "all";
  excludePricing: PricingModel | "";
  order: "relevance" | "name" | "freshness";
  minimumDownloads: number;
  includeUnknownDownloads: boolean;
}
export const EMPTY_FILTERS: DiscoveryFilters = {
  query: "",
  category: "all",
  platforms: [],
  platformMode: "any",
  tag: "",
  pricing: "all",
  excludePricing: "",
  order: "relevance",
  minimumDownloads: 0,
  includeUnknownDownloads: false,
};
export const PRICING_LABELS: Record<PricingModel, string> = {
  free: "Ücretsiz",
  freemium: "Ücretsiz + ücretli plan",
  subscription: "Abonelik",
  "one-time": "Tek seferlik",
  unknown: "Doğrulanmadı",
};
export const normalizeSearch = (value: string) =>
  value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .trim();
// A temporarily filtered/unpublished record is still the user's saved choice.
export function sanitizeStoredIds(value: unknown, limit = 1000): string[] {
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id): id is string =>
              typeof id === "string" && /^[a-z0-9][a-z0-9-]{0,79}$/.test(id),
          ),
        ),
      ].slice(0, limit)
    : [];
}
const isPlatform = (value: string): value is Platform =>
  ["android", "ios", "windows"].includes(value);
export function parseFilters(params: URLSearchParams): DiscoveryFilters {
  const pricing = params.get("pricing") || "all";
  const exclude = params.get("exclude") || "";
  const minimum = Number(params.get("downloads") || 0);
  return {
    query: (params.get("q") || "").slice(0, 200),
    category: CATEGORIES.some((c) => c.id === params.get("category"))
      ? (params.get("category") as Category)
      : "all",
    platforms: [
      ...new Set((params.get("platform") || "").split(",").filter(isPlatform)),
    ],
    platformMode: params.get("mode") === "all" ? "all" : "any",
    tag: (params.get("tag") || "").slice(0, 80),
    pricing:
      pricing === "all" || Object.hasOwn(PRICING_LABELS, pricing)
        ? (pricing as DiscoveryFilters["pricing"])
        : "all",
    excludePricing: Object.hasOwn(PRICING_LABELS, exclude)
      ? (exclude as PricingModel)
      : "",
    order: ["name", "freshness"].includes(params.get("sort") || "")
      ? (params.get("sort") as DiscoveryFilters["order"])
      : "relevance",
    minimumDownloads:
      Number.isSafeInteger(minimum) && minimum >= 0 ? minimum : 0,
    includeUnknownDownloads: params.get("unknown") === "1",
  };
}
export function filtersToParams(filters: DiscoveryFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.query) p.set("q", filters.query);
  if (filters.platforms.length) p.set("platform", filters.platforms.join(","));
  if (filters.category !== "all") p.set("category", filters.category);
  if (filters.platformMode === "all") p.set("mode", "all");
  if (filters.tag) p.set("tag", filters.tag);
  if (filters.pricing !== "all") p.set("pricing", filters.pricing);
  if (filters.excludePricing) p.set("exclude", filters.excludePricing);
  if (filters.order !== "relevance") p.set("sort", filters.order);
  if (filters.minimumDownloads)
    p.set("downloads", String(filters.minimumDownloads));
  if (filters.includeUnknownDownloads) p.set("unknown", "1");
  return p;
}
export function discoverApps(
  apps: AppRecord[],
  filters: DiscoveryFilters,
): AppRecord[] {
  const terms = normalizeSearch(filters.query).split(/\s+/).filter(Boolean);
  const results = apps.filter((app) => {
    const text = normalizeSearch(
      [
        app.name,
        app.tagline,
        app.description,
        app.publisher,
        ...app.aliases,
        ...app.tags,
        CATEGORIES.find((c) => c.id === app.category)?.label,
      ].join(" "),
    );
    if (!terms.every((term) => text.includes(term))) return false;
    if (filters.category !== "all" && app.category !== filters.category)
      return false;
    if (
      filters.platforms.length &&
      !(filters.platformMode === "all"
        ? filters.platforms.every((p) => app.platforms.includes(p))
        : filters.platforms.some((p) => app.platforms.includes(p)))
    )
      return false;
    if (
      filters.tag &&
      !app.tags.some(
        (tag) => normalizeSearch(tag) === normalizeSearch(filters.tag),
      )
    )
      return false;
    if (filters.pricing !== "all" && app.pricingModel !== filters.pricing)
      return false;
    // Unknown values are never treated as satisfying a negative pricing constraint.
    if (
      filters.excludePricing &&
      (app.pricingModel === filters.excludePricing ||
        app.pricingModel === "unknown")
    )
      return false;
    if (filters.minimumDownloads) {
      const observations = app.storeMetrics
        .filter(
          (m) =>
            m.platform === "android" &&
            m.country === "TR" &&
            m.downloadsLowerBound !== null &&
            m.sourceUrl &&
            m.observedAt,
        )
        .sort((a, b) => b.observedAt.localeCompare(a.observedAt));
      const lower = observations[0]?.downloadsLowerBound;
      if (
        lower == null
          ? !filters.includeUnknownDownloads
          : lower < filters.minimumDownloads
      )
        return false;
    }
    return true;
  });
  return results.sort((a, b) =>
    filters.order === "freshness"
      ? b.checkedAt.localeCompare(a.checkedAt) ||
        a.name.localeCompare(b.name, "tr")
      : filters.order === "name"
        ? a.name.localeCompare(b.name, "tr")
        : Number(normalizeSearch(b.name) === normalizeSearch(filters.query)) -
          Number(normalizeSearch(a.name) === normalizeSearch(filters.query)),
  );
}
function editDistance(a: string, b: string): number {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++)
      next[j] = Math.min(
        next[j - 1] + 1,
        row[j] + 1,
        row[j - 1] + Number(a[i - 1] !== b[j - 1]),
      );
    row = next;
  }
  return row[b.length];
}
export function suggestQuery(
  apps: AppRecord[],
  query: string,
): string | undefined {
  const q = normalizeSearch(query);
  if (q.length < 3 || q.length > 40) return;
  const matches = apps
    .flatMap((app) => [app.name, ...app.aliases])
    .map((name) => ({ name, distance: editDistance(q, normalizeSearch(name)) }))
    .sort((a, b) => a.distance - b.distance);
  return matches[0] &&
    matches[0].distance > 0 &&
    matches[0].distance <= Math.min(2, Math.floor(q.length / 3))
    ? matches[0].name
    : undefined;
}
export function factState(app: AppRecord, key: FactKey, platform: Platform) {
  return (
    app.facts.find(
      (f) =>
        f.key === key && f.platform === platform && f.sourceUrl && f.checkedAt,
    )?.state || "unknown"
  );
}
export interface Recommendation {
  app: AppRecord;
  state: "match" | "research" | "excluded";
  reasons: string[];
}
export function recommendApps(
  apps: AppRecord[],
  category: Category,
  platforms: Platform[],
  required: FactKey[],
): Recommendation[] {
  return apps
    .filter((app) => category === "all" || app.category === category)
    .map((app) => {
      const reasons: string[] = [];
      let excluded = false,
        unknown = false;
      if (!platforms.length) {
        unknown = true;
        reasons.push("Cihaz seçerek platform koşulunu netleştir.");
      }
      for (const p of platforms) {
        if (!app.platforms.includes(p)) {
          excluded = true;
          reasons.push(`${p}: katalogda yerel sürüm desteği yok.`);
          continue;
        }
        for (const key of required) {
          const state = factState(app, key, p);
          if (state === "unknown") {
            unknown = true;
            reasons.push(`${p} · ${FACT_LABELS[key]} doğrulanmadı.`);
          } else if (state !== "supported") {
            excluded = true;
            reasons.push(
              `${p} · ${FACT_LABELS[key]} ${state === "limited" ? "sınırlı" : "desteklenmiyor"}.`,
            );
          } else
            reasons.push(`${p} · ${FACT_LABELS[key]} kaynakla destekleniyor.`);
        }
      }
      if (!reasons.length)
        reasons.push(
          "Seçtiğin platformlar katalogda bulunuyor. Özellik koşulu belirtmedin.",
        );
      return {
        app,
        state: excluded ? "excluded" : unknown ? "research" : "match",
        reasons,
      } as Recommendation;
    });
}
export function calculatePlanCost(
  plan: AppPlan,
  months: 12 | 36,
  seats: number,
  billing: "monthly" | "annual",
): { total: number | null; currency: string; reason: string } {
  if (!Number.isSafeInteger(seats) || seats < 1 || seats > 10000)
    return {
      total: null,
      currency: plan.currency,
      reason: "Kişi sayısı 1–10.000 arasında olmalı.",
    };
  const price = billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;
  if (
    !plan.sourceUrl ||
    !plan.checkedAt ||
    price === null ||
    !Number.isFinite(price) ||
    price < 0
  )
    return {
      total: null,
      currency: plan.currency,
      reason:
        "Bu faturalama dönemi için kaynaklı fiyat doğrulanmadı; kesin toplam hesaplanamıyor.",
    };
  const total =
    Math.round(
      price *
        (billing === "monthly" ? months : months / 12) *
        (plan.perSeat ? seats : 1) *
        100,
    ) / 100;
  return {
    total,
    currency: plan.currency,
    reason: `Bugünkü kayıtlı fiyatın ${months} ay değişmediği varsayımıyla; vergi, kur dönüşümü ve gelecekteki zamlar dahil değil. ${plan.perSeat ? "Kişi başına fiyat kullanıldı." : "Tek plan bedeli kullanıldı; ekip kullanım hakkını yayıncıdan doğrula."}`,
  };
}
