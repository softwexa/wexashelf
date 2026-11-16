import assert from "node:assert/strict";
import test from "node:test";
import { APPS } from "../src/lib/catalog";
import type { AppRecord, CatalogSnapshot } from "../src/lib/domain";
import {
  findPublisher,
  getPublishers,
  publisherSlug,
  publisherSearchText,
} from "../src/lib/publishers";
import { buildMetadata, buildSitemap, structuredData } from "../src/lib/seo";
const app = (id: string, publisher: string): AppRecord => ({
  ...APPS[0],
  id,
  publisher,
  tags: [],
  aliases: [],
  pricingModel: "unknown",
  facts: [],
  plans: [],
  storeMetrics: [],
});
const catalog: CatalogSnapshot = {
  apps: [
    app("one", "Işık Yazılım"),
    app("two", "Işık Yazılım"),
    app("three", "Isik Yazilim"),
    app("blank", " "),
  ],
  articles: [],
  lists: [],
  records: [],
};
test("publisher identities preserve distinct names and Turkish search transliteration", () => {
  assert.equal(publisherSearchText("IŞIK YAZILIM"), "isik yazilim");
  assert.match(publisherSlug("Işık Yazılım"), /^isik-yazilim--/);
  assert.notEqual(publisherSlug("Işık Yazılım"), publisherSlug("Isik Yazilim"));
  assert.notEqual(publisherSlug("A&B"), publisherSlug("A B"));
  assert.notEqual(publisherSlug("Acme"), publisherSlug("ACME"));
  assert.equal(
    publisherSlug("  Işık   Yazılım "),
    publisherSlug("Işık Yazılım"),
  );
  assert.equal(publisherSlug(""), "");
});
test("directory uses only supplied public apps, counts unique apps and keeps stable IDs", () => {
  const groups = getPublishers(catalog);
  assert.equal(groups.length, 2);
  assert.equal(
    findPublisher(catalog, publisherSlug("Işık Yazılım"))?.apps.length,
    2,
  );
  assert.equal(findPublisher(catalog, "unknown"), undefined);
  assert.deepEqual(
    getPublishers({ apps: [...catalog.apps].reverse() }),
    groups,
  );
  assert.equal(
    getPublishers({ apps: [catalog.apps[0], catalog.apps[0]] })[0].apps.length,
    1,
  );
  assert.deepEqual(getPublishers({ apps: [] }), []);
  const publicSubset = getPublishers({ apps: [catalog.apps[0]] });
  assert.deepEqual(
    publicSubset.flatMap((group) => group.apps.map((entry) => entry.id)),
    ["one"],
  );
});
test("publisher hubs have real metadata and canonical but stay noindex without sitemap or organization claims", () => {
  const config = { origin: "https://catalog.example.org", indexEnabled: true };
  const slug = publisherSlug("Işık Yazılım");
  for (const path of [["yayincilar"], ["yayinci", slug]]) {
    const metadata = buildMetadata(path, catalog, {}, config);
    assert.equal((metadata.robots as { index: boolean }).index, false);
    assert.equal(
      metadata.alternates?.canonical,
      `${config.origin}/${path.join("/")}`,
    );
    assert.deepEqual(structuredData(path, catalog, config), []);
  }
  assert.equal(
    buildMetadata(["yayinci", slug], catalog, {}, config).title,
    "Işık Yazılım uygulamaları",
  );
  assert.match(
    String(buildMetadata(["yayinci", slug], catalog, {}, config).description),
    /2 uygulama/,
  );
  assert.ok(
    !buildSitemap(catalog, config).some((entry) =>
      entry.url.includes("yayinci"),
    ),
  );
});
