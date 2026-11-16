import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSitemap,
  buildMetadata,
  canIndex,
  serializeJsonLd,
  siteConfiguration,
  structuredData,
} from "../src/lib/seo";
import { APPS } from "../src/lib/catalog";
import type { CatalogSnapshot } from "../src/lib/domain";
const config = { origin: "https://catalog.example.org", indexEnabled: true };
const catalog: CatalogSnapshot = {
  apps: APPS.map((app) => ({
    ...app,
    publisher: "Publisher",
    tags: [],
    aliases: [],
    pricingModel: "unknown",
    facts: [],
    plans: [],
    storeMetrics: [],
  })),
  articles: [],
  lists: [],
  records: [
    {
      id: "notion",
      kind: "app",
      updatedAt: "2026-11-15T12:00:00Z",
      seoApproved: true,
    },
    {
      id: "obsidian",
      kind: "app",
      updatedAt: "2026-11-15T12:00:00Z",
      seoApproved: false,
    },
  ],
};
test("indexing requires intentional public HTTPS configuration", () => {
  assert.equal(siteConfiguration({}).indexEnabled, false);
  for (const url of [
    "http://site.com",
    "https://localhost",
    "https://127.0.0.1",
    "https://a.local",
    "https://placeholder.example",
  ])
    assert.equal(
      siteConfiguration({ SITE_URL: url, INDEXING_ENABLED: "true" })
        .indexEnabled,
      false,
    );
  assert.equal(
    siteConfiguration({
      SITE_URL: "https://catalog.example.org",
      INDEXING_ENABLED: "false",
    }).indexEnabled,
    false,
  );
});
test("only reviewed published public records enter sitemap", () => {
  assert.equal(canIndex(["uygulama", "notion"], catalog, {}, config), true);
  assert.equal(canIndex(["uygulama", "obsidian"], catalog, {}, config), false);
  assert.equal(
    canIndex(["uygulama", "notion"], catalog, { tracking: "x" }, config),
    false,
  );
  for (const path of [
    "kaydedilenler",
    "ayarlar",
    "yonetim",
    "kesfet",
    "secim-sihirbazi",
  ])
    assert.equal(canIndex([path], catalog, {}, config), false);
  const sitemap = buildSitemap(catalog, config);
  assert.ok(
    sitemap.some(
      (item) =>
        item.url.endsWith("/uygulama/notion") &&
        item.lastModified === "2026-11-15T12:00:00Z",
    ),
  );
  assert.ok(
    !sitemap.some(
      (item) => item.url.includes("obsidian") || item.url.includes("kesfet"),
    ),
  );
  assert.deepEqual(
    buildSitemap(catalog, { ...config, indexEnabled: false }),
    [],
  );
});
test("metadata and structured data never fabricate store reviews or prices", () => {
  const metadata = buildMetadata(["uygulama", "notion"], catalog, {}, config);
  assert.equal(
    metadata.alternates?.canonical,
    config.origin + "/uygulama/notion",
  );
  assert.equal(
    buildMetadata(["karsilastir"], catalog, { apps: "notion" }, config)
      .alternates,
    undefined,
  );
  const data = JSON.stringify(
    structuredData(["uygulama", "notion"], catalog, config),
  );
  assert.ok(data.includes("SoftwareApplication"));
  assert.ok(!data.includes("aggregateRating") && !data.includes("offers"));
  assert.deepEqual(structuredData(["kaydedilenler"], catalog, config), []);
});
test("JSON-LD cannot close its enclosing script tag", () => {
  const value = { title: "</script><script>alert(1)</script>" };
  const encoded = serializeJsonLd(value);
  assert.ok(!encoded.includes("<"));
  assert.deepEqual(JSON.parse(encoded), value);
});
