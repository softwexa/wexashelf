import test from "node:test";
import { LocaleProvider } from "../src/lib/i18n";
import assert from "node:assert/strict";
import { APPS } from "../src/lib/catalog";
import type { AppRecord, AppPlan } from "../src/lib/domain";
import {
  EMPTY_FILTERS,
  discoverApps,
  parseFilters,
  filtersToParams,
  recommendApps,
  calculatePlanCost,
  suggestQuery,
  sanitizeStoredIds,
} from "../src/lib/discovery";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomePage } from "../src/components/discovery/HomePage";
import { DEFAULT_THEME } from "../src/lib/themes";
import { DEFAULT_ENABLED_PLUGINS } from "../src/lib/plugins";
const apps: AppRecord[] = APPS.map((app) => ({
  ...app,
  publisher: "Publisher",
  tags: ["notlar"],
  aliases: [],
  pricingModel: "unknown",
  facts: [],
  plans: [],
  storeMetrics: [],
}));
test("advanced filters preserve URL and intersect platforms without assuming missing prices", () => {
  const f = {
    ...EMPTY_FILTERS,
    platforms: ["android", "windows"] as ("android" | "windows")[],
    platformMode: "all" as const,
    query: "",
    tag: "notlar",
    order: "name" as const,
  };
  assert.deepEqual(parseFilters(filtersToParams(f)), f);
  const results = discoverApps(apps, f);
  assert.equal(results.length, 8);
  assert.equal(
    discoverApps(apps, { ...f, excludePricing: "subscription" }).length,
    0,
  );
  assert.equal(discoverApps(apps, { ...f, minimumDownloads: 100 }).length, 0);
  assert.equal(
    discoverApps(apps, {
      ...f,
      minimumDownloads: 100,
      includeUnknownDownloads: true,
    }).length,
    8,
  );
});
test("download filter uses sourced Android TR observations, not other store or country totals", () => {
  const app = {
    ...apps[0],
    storeMetrics: [
      {
        platform: "ios" as const,
        country: "TR",
        downloadsLowerBound: 1000,
        rating: null,
        ratingCount: null,
        sourceUrl: "https://example.com",
        observedAt: "2026-11-15",
      },
    ],
  };
  assert.equal(
    discoverApps([app], { ...EMPTY_FILTERS, minimumDownloads: 10 }).length,
    0,
  );
});
test("required unknown feature never becomes a full recommendation", () => {
  assert.equal(
    recommendApps([apps[0]], "all", ["android"], ["offline"])[0].state,
    "research",
  );
  const app = {
    ...apps[0],
    facts: [
      {
        key: "offline" as const,
        platform: "android" as const,
        state: "supported" as const,
        sourceUrl: "https://example.com",
        checkedAt: "2026-11-15",
        detail: "Verified fixture",
        evidence: "publisher" as const,
      },
    ],
  };
  assert.equal(
    recommendApps([app], "all", ["android"], ["offline"])[0].state,
    "match",
  );
  assert.equal(
    recommendApps([app], "all", ["android", "windows"], ["offline"])[0].state,
    "research",
  );
});
test("plan cost respects billing period, seats and unknown price", () => {
  const plan: AppPlan = {
    id: "plan",
    name: "Plan",
    currency: "USD",
    monthlyPrice: 10,
    annualPrice: 100,
    perSeat: true,
    free: false,
    platforms: ["windows"],
    features: [],
    limits: [],
    sourceUrl: "https://example.com",
    checkedAt: "2026-11-15",
    note: "",
  };
  assert.equal(calculatePlanCost(plan, 36, 2, "annual").total, 600);
  assert.equal(calculatePlanCost(plan, 12, 2, "monthly").total, 240);
  assert.equal(
    calculatePlanCost({ ...plan, annualPrice: null }, 12, 2, "annual").total,
    null,
  );
  assert.equal(
    calculatePlanCost({ ...plan, perSeat: false }, 12, 2, "annual").total,
    100,
  );
});
test("small spelling suggestions are explicit and exact search remains unchanged", () => {
  assert.equal(suggestQuery(apps, "notoin"), "Notion");
  assert.equal(
    discoverApps(apps, { ...EMPTY_FILTERS, query: "notoin" }).length,
    0,
  );
});

test("stored references survive unavailable catalog entries while malformed and excessive ids are bounded", () => {
  assert.deepEqual(
    sanitizeStoredIds([
      "notion",
      "temporarily-unpublished",
      "notion",
      "../unsafe",
      42,
      "<script>",
    ]),
    ["notion", "temporarily-unpublished"],
  );
  assert.equal(
    sanitizeStoredIds(Array.from({ length: 1005 }, (_, i) => `app-${i}`))
      .length,
    1000,
  );
  assert.deepEqual(sanitizeStoredIds(null), []);
});

test("empty public catalog renders an honest state without a nonexistent hero comparison", () => {
  const html = renderToStaticMarkup(
    createElement(HomePage, {
      catalog: { apps: [], articles: [], lists: [], records: [] },
      theme: DEFAULT_THEME,
      plugins: DEFAULT_ENABLED_PLUGINS,
      saved: [],
      compare: [],
      onSave: () => {},
      onCompare: () => {},
    }),
  );
  assert.ok(html.includes("There are no apps available to list right now."));
  assert.ok(!html.includes("Şu anda listelenebilen uygulama yok."));
  const trHtml = renderToStaticMarkup(createElement(LocaleProvider, {locale:"tr", children:createElement(HomePage, {catalog:{apps:[],articles:[],lists:[],records:[]},theme:DEFAULT_THEME,plugins:DEFAULT_ENABLED_PLUGINS,saved:[],compare:[],onSave:()=>{},onCompare:()=>{}})}));
  assert.ok(trHtml.includes("Şu anda listelenebilen uygulama yok."));
  assert.ok(!trHtml.includes("/karsilastir?apps=notion,obsidian"));
  assert.ok(trHtml.includes('href="/blog"'));
  assert.ok(!html.includes("/karsilastir?apps=notion,obsidian"));
  assert.ok(html.includes('href="/blog"'));
});
