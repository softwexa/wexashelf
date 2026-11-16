import assert from "node:assert/strict";
import test from "node:test";
import { getLocalePack } from "../src/lib/i18n-registry";
import { internalPathname, localizedUrl, unavailableLocalizedRecord } from "../src/lib/i18n-routing";
import { buildMetadata, buildSitemap } from "../src/lib/seo";
import type { CatalogSnapshot } from "../src/lib/domain";

const catalog: CatalogSnapshot = { apps: [], articles: [], lists: [], records: [] };

test("submission navigation round-trips the declared English and Turkish URLs, including subdirectory installs", () => {
  for (const [locale, expected] of [["en", "/en/submit-app"], ["tr", "/uygulama-gonder"]] as const) {
    const segment = getLocalePack(locale).serverMessages.routes["submit-app"];
    assert.ok(segment, `The ${locale} server pack must declare the submission route.`);
    // This is the public route-map contract supplied by PHP, not a second router.
    const paths = { "/submit-app": `${locale === "tr" ? "" : `/${locale}`}/${segment}` };
    for (const base of ["", "/catalog"]) {
      const href = localizedUrl("/submit-app", base, paths);
      assert.equal(href, `${base}${expected}`);
      assert.equal(internalPathname(href, base, paths), "/submit-app");
      assert.equal(localizedUrl(href, base, paths), href, "The plain-link observer must not prefix an already localized link twice.");
      assert.equal(localizedUrl("/submit-app?view=status#form", base, paths), `${href}?view=status#form`);
    }
  }
});

test("an empty catalog does not block the submission utility route as an unavailable app translation", () => {
  for (const locale of ["en", "tr"]) {
    assert.equal(unavailableLocalizedRecord("/submit-app", locale, {}), false);
    assert.equal(unavailableLocalizedRecord("/uygulama/missing", locale, {}), true);
  }
});

test("retained Next submission metadata remains private with indexing enabled and never incorporates a tracking query", () => {
  const config = { origin: "https://catalog.example.org", indexEnabled: true };
  for (const query of [{}, { tracking: "synthetic-not-a-real-secret" }]) {
    const metadata = buildMetadata(["submit-app"], catalog, query, config);
    assert.equal(metadata.title, "Submit an app");
    assert.deepEqual(metadata.robots, { index: false, follow: false });
    assert.equal(metadata.alternates, undefined);
    assert.ok(!metadata.openGraph || !("url" in metadata.openGraph));
    assert.ok(!JSON.stringify(metadata).includes("synthetic-not-a-real-secret"));
  }
  assert.ok(!buildSitemap(catalog, config).some(entry => entry.url.endsWith("/submit-app")));
});
