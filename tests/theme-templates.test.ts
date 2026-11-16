import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BUILTIN_THEMES } from "../src/lib/builtin-themes";
import {
  DEFAULT_THEME,
  getThemeTemplate,
  parseThemeManifest,
} from "../src/lib/themes";
import { getActiveSections } from "../src/lib/plugins";

test("v1 manifests without a template retain the night presentation and roundtrip", () => {
  const parsed = parseThemeManifest(DEFAULT_THEME);
  assert.ok(parsed.ok);
  assert.equal(getThemeTemplate(parsed.value), "night");
  assert.deepEqual(parsed.value, DEFAULT_THEME);
  const legacy = JSON.parse(
    readFileSync(
      new URL("../examples/themes/kobalt.json", import.meta.url),
      "utf8",
    ),
  );
  assert.ok(parseThemeManifest(legacy).ok);
  assert.equal(getThemeTemplate(legacy), "night");
});

test("all built-ins and portable samples validate with distinct templates", () => {
  assert.equal(new Set(BUILTIN_THEMES.map(getThemeTemplate)).size, 16);
  for (const theme of BUILTIN_THEMES) {
    const parsed = parseThemeManifest(JSON.parse(JSON.stringify(theme)));
    assert.ok(parsed.ok);
    assert.deepEqual(parsed.value, theme);
    if (theme !== DEFAULT_THEME) {
      const sample = JSON.parse(
        readFileSync(
          new URL(`../examples/themes/${theme.id}.json`, import.meta.url),
          "utf8",
        ),
      );
      assert.deepEqual(sample, theme);
    }
  }
});

test("template values cannot inject arbitrary layout names", () => {
  for (const template of ["unknown", "", null, [], {}, "atlas night"]) {
    assert.equal(parseThemeManifest({ ...DEFAULT_THEME, template }).ok, false);
  }
});

test("each template preserves section ordering while disabling plugin contributions", () => {
  for (const theme of BUILTIN_THEMES) {
    assert.deepEqual(
      getActiveSections(theme, []),
      theme.sections.filter(
        (id) => !["toolbox", "guides", "workflows"].includes(id),
      ),
    );
    const active = getActiveSections(theme, ["workflow-collections"]);
    assert.ok(active.includes("workflows"));
    assert.ok(!active.includes("toolbox"));
    assert.ok(!active.includes("guides"));
  }
});

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomePage } from "../src/components/discovery/HomePage";
import { APPS } from "../src/lib/catalog";
import type { AppRecord, CatalogSnapshot } from "../src/lib/domain";
// tsx uses the repository's preserved JSX setting; provide the classic runtime for SSR tests.
Object.assign(globalThis, { React });
const actions = {
  saved: [],
  compare: [],
  onSave: () => {},
  onCompare: () => {},
};

test("empty templates show an honest empty state and no missing app links", () => {
  const catalog: CatalogSnapshot = {
    apps: [],
    articles: [],
    lists: [],
    records: [],
  };
  for (const theme of BUILTIN_THEMES) {
    const html = renderToStaticMarkup(
      React.createElement(HomePage, {
        catalog,
        theme,
        plugins: [],
        ...actions,
      }),
    );
    assert.match(html, /There are no apps available to list right now\./);
    assert.doesNotMatch(html, /Şu anda listelenebilen uygulama yok/);
    assert.doesNotMatch(html, /href="\/uygulama\//);
    assert.doesNotMatch(html, /class="workflow-preview"|href="\/is-akisi\//);
    assert.doesNotMatch(html, /class="tool-promo"/);
  }
});

test("template heroes use available catalog records and preserve saved row actions", () => {
  const app: AppRecord = {
    ...APPS[0],
    publisher: "Publisher",
    tags: [],
    aliases: [],
    pricingModel: "unknown",
    facts: [],
    plans: [],
    storeMetrics: [],
  };
  const catalog: CatalogSnapshot = {
    apps: [app],
    articles: [],
    lists: [],
    records: [],
  };
  for (const theme of BUILTIN_THEMES.slice(1)) {
    const html = renderToStaticMarkup(
      React.createElement(HomePage, {
        catalog,
        theme,
        plugins: ["workflow-collections"],
        ...actions,
        saved: [app.id],
      }),
    );
    assert.match(html, new RegExp(`${["magazine","directory"].includes(getThemeTemplate(theme))?"template-heading":"template-hero"}-${getThemeTemplate(theme)}`));
    assert.match(html, /save-button is-saved/);
    assert.doesNotMatch(html, /href="\/uygulama\/(firefox|obsidian)"/);
    if (getThemeTemplate(theme) === "atlas") {
      assert.match(html, /name="q"/);
      assert.match(html, /href="\/kategori\/notes"/);
      assert.doesNotMatch(html, /href="\/kategori\/media"/);
    }
    if (getThemeTemplate(theme) === "workflow") assert.doesNotMatch(html, /class="workflow-preview"/);
  }
});


test("directory exposes recorded fields in a keyboard-accessible table, magazine uses actual editorial content", () => {
  const app = {...APPS[0], publisher:"Publisher", tags:[], aliases:[], pricingModel:"unknown" as const, facts:[],plans:[],storeMetrics:[],checkedAt:"",pricingLabel:""};
  const article = {id:"real-editorial",title:"A sourced editorial title",summary:"An authored summary."} as CatalogSnapshot["articles"][number];
  const catalog:CatalogSnapshot={apps:[app],articles:[article],lists:[],records:[]};
  const directory=renderToStaticMarkup(React.createElement(HomePage,{catalog,theme:BUILTIN_THEMES.find(theme=>theme.template==="directory")!,plugins:[],...actions}));
  assert.match(directory, /role="region"[^>]*tabindex="0"/);
  assert.match(directory, /<table class="directory-table">/);
  assert.match(directory, /<caption>A selection from the catalog/);
  assert.match(directory, /scope="col">Checked date/);
  assert.match(directory, /Unverified/);
  assert.doesNotMatch(directory, /href="\/is-akisi\//);
  const magazine=renderToStaticMarkup(React.createElement(HomePage,{catalog,theme:BUILTIN_THEMES.find(theme=>theme.template==="magazine")!,plugins:[],...actions}));
  assert.match(magazine, /class="magazine-lead"/);
  assert.match(magazine, /href="\/blog\/real-editorial"/);
  assert.match(magazine, /A sourced editorial title/);
  for(const template of ["magazine","directory"]){const theme=BUILTIN_THEMES.find(theme=>theme.template===template)!;const hidden=renderToStaticMarkup(React.createElement(HomePage,{catalog,theme:{...theme,sections:["weekly"]},plugins:[],...actions}));assert.doesNotMatch(hidden,/directory-table|magazine-lead/);}
});
