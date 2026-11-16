import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_THEME, getThemePresentation, parseThemeManifest, themeToStyle, type ThemeManifest } from "../src/lib/themes";
import { parseSiteSettings } from "../src/lib/site-settings";
import { getActiveSections } from "../src/lib/plugins";

test("older exported v1 themes roundtrip without adding presentation metadata", () => {
  const legacy = JSON.parse(JSON.stringify(DEFAULT_THEME));
  const parsed = parseThemeManifest(legacy);
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.value, legacy);
  assert.equal(Object.hasOwn(parsed.value, "presentation"), false);
  assert.deepEqual(getThemePresentation(parsed.value), { font: "sans", width: "wide", radius: "soft", hero: "standard", cardStyle: "outline" });
});

test("partial presentation choices survive export without losing omitted defaults", () => {
  const input: ThemeManifest = { ...DEFAULT_THEME, presentation: { font: "serif", radius: "square" } };
  const parsed = parseThemeManifest(JSON.parse(JSON.stringify(input)));
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.value.presentation, { font: "serif", radius: "square" });
  assert.deepEqual(getThemePresentation(parsed.value), { font: "serif", width: "wide", radius: "square", hero: "standard", cardStyle: "outline" });
  input.presentation!.font = "mono";
  assert.equal(parsed.value.presentation?.font, "serif");
  const empty = parseThemeManifest({ ...DEFAULT_THEME, presentation: {} });
  assert.ok(empty.ok);
  assert.deepEqual(empty.value.presentation, {});
  assert.deepEqual(getThemePresentation(empty.value), getThemePresentation(DEFAULT_THEME));
});

test("presentation imports reject arbitrary styles, URLs, unknown values and hostile object keys", () => {
  for (const presentation of [
    null, [], "serif", 1, { font: "url(https://attacker.invalid/font.woff)" },
    { width: "calc(100vw + 10px)" }, { radius: "expression(alert(1))" },
    { hero: "2000px" }, { cardStyle: "background:url(javascript:alert(1))" },
    { font: "SANS" }, { width: false }, { hero: null }, { font: ["sans"] },
    { font: "serif", style: { display: "none" } }, { fontUrl: "https://attacker.invalid/font" },
    JSON.parse('{"__proto__":{"font":"display"}}'),
    { [Symbol("font")]: "serif" },
  ]) assert.equal(parseThemeManifest({ ...DEFAULT_THEME, presentation }).ok, false, String(presentation));
  const hostile = { ...DEFAULT_THEME, presentation: { width: "100vw;display:none" } } as unknown as ThemeManifest;
  assert.deepEqual(themeToStyle(hostile), themeToStyle(DEFAULT_THEME));
});

test("owner appearance roundtrip retains typography, palette, navigation, order and disabled modules", () => {
  const input = {
    revision: 42,
    enabledPlugins: [],
    theme: {
      ...structuredClone(DEFAULT_THEME), id: "my-editorial", name: "My custom theme", template: "fieldnotes",
      layout: "topbar", density: "compact", sections: ["weekly", "discovery"],
      tokens: { ...DEFAULT_THEME.tokens, accent: "#176C68" },
      presentation: { font: "serif", width: "standard", radius: "square", hero: "compact", cardStyle: "flat" },
    },
  };
  const parsed = parseSiteSettings(JSON.parse(JSON.stringify(input)));
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.value, input);
  assert.deepEqual(getActiveSections(parsed.value.theme, parsed.value.enabledPlugins), ["weekly", "discovery"]);
  const css = themeToStyle(parsed.value.theme);
  assert.equal(css["--accent"], "#176C68");
  assert.equal(css["--theme-content-width"], "1120px");
  assert.equal(css["--theme-radius"], "2px");
  assert.equal(css["--theme-card-shadow"], "none");
});

test("one-section themes remain valid while removing the final section or duplicating it is rejected", () => {
  const theme = { ...DEFAULT_THEME, sections: ["weekly"] };
  const parsed = parseThemeManifest(theme);
  assert.ok(parsed.ok);
  assert.deepEqual(getActiveSections(parsed.value, []), ["weekly"]);
  for (const sections of [[], ["weekly", "weekly"], ["weekly", "missing"]]) {
    assert.equal(parseThemeManifest({ ...theme, sections }).ok, false);
  }
});

test("custom names accept ordinary words but reject embedded control characters", () => {
  assert.ok(parseThemeManifest({ ...DEFAULT_THEME, name: "My custom theme" }).ok);
  for (const name of ["My\ncustom theme", "My\tcustom theme", "My\u0000theme", " "]) {
    assert.equal(parseThemeManifest({ ...DEFAULT_THEME, name }).ok, false);
  }
});
