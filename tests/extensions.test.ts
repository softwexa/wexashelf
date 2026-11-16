import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DEFAULT_THEME,
  parseThemeManifest,
  themeToStyle,
} from "../src/lib/themes";
import {
  DEFAULT_ENABLED_PLUGINS,
  getActiveSections,
  normalizeEnabledPlugins,
} from "../src/lib/plugins";

test("default and importable alternate layout validate and retain ordering", () => {
  assert.equal(parseThemeManifest(DEFAULT_THEME).ok, true);
  const parsed = parseThemeManifest(
    JSON.parse(
      readFileSync(
        new URL("../examples/themes/kobalt.json", import.meta.url),
        "utf8",
      ),
    ),
  );
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.value.layout, "topbar");
  assert.equal(parsed.value.density, "compact");
  assert.deepEqual(getActiveSections(parsed.value, ["decision-tools"]), [
    "discovery",
    "toolbox",
    "trending",
    "weekly",
  ]);
});

test("reject executable CSS, incomplete tokens and unknown metadata", () => {
  for (const accent of [
    "red",
    "#fff",
    "#123456; background:url(https://example.com)",
    "var(--x)",
    "url(javascript:alert(1))",
  ]) {
    assert.equal(
      parseThemeManifest({
        ...DEFAULT_THEME,
        tokens: { ...DEFAULT_THEME.tokens, accent },
      }).ok,
      false,
    );
  }
  for (const patch of [
    { schemaVersion: 2 },
    { layout: "script" },
    { density: "tiny" },
    { name: "x".repeat(81) },
    { id: "../file" },
    { author: "" },
    { script: "alert(1)" },
    { sections: ["discovery", "discovery"] },
    { sections: ["unknown"] },
    { sections: [] },
    { sections: Array(1) },
    { tokens: {} },
  ]) {
    assert.equal(
      parseThemeManifest({ ...DEFAULT_THEME, ...patch }).ok,
      false,
      JSON.stringify(patch),
    );
  }
  assert.equal(
    parseThemeManifest(
      JSON.parse(
        JSON.stringify(DEFAULT_THEME).replace(
          '"schemaVersion":1',
          '"__proto__":{},"schemaVersion":1',
        ),
      ),
    ).ok,
    false,
  );
  for (const value of [null, [], "{}", 123])
    assert.equal(parseThemeManifest(value).ok, false);
});

test("validated theme detaches from imported object and CSS is allowlisted", () => {
  const input = structuredClone(DEFAULT_THEME);
  const result = parseThemeManifest(input);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  input.tokens.accent = "bad";
  input.sections.reverse();
  assert.equal(result.value.tokens.accent, "#65d8be");
  assert.equal(result.value.sections[0], "discovery");
  assert.equal(themeToStyle(result.value)["--surface-raised"], "#1e3047");
  assert.equal(Object.keys(themeToStyle(result.value)).length, 13);
  assert.deepEqual(themeToStyle(input), themeToStyle(DEFAULT_THEME));
});

test("optional modules toggle without removing core or changing manifest", () => {
  assert.deepEqual(getActiveSections(DEFAULT_THEME, []), [
    "discovery",
    "weekly",
    "trending",
  ]);
  assert.deepEqual(
    getActiveSections(DEFAULT_THEME, DEFAULT_ENABLED_PLUGINS),
    DEFAULT_THEME.sections,
  );
  assert.deepEqual(getActiveSections(DEFAULT_THEME, ["migration-guides"]), [
    "discovery",
    "weekly",
    "trending",
    "guides",
  ]);
  assert.equal(DEFAULT_THEME.sections.length, 6);
});

test("persisted plugins distinguish disabled-all from missing/corrupt preferences", () => {
  for (const value of [
    undefined,
    null,
    "decision-tools",
    {},
    [1],
    ["decision-tools", null],
    Array(1),
  ]) {
    assert.deepEqual(normalizeEnabledPlugins(value), DEFAULT_ENABLED_PLUGINS);
  }
  assert.deepEqual(normalizeEnabledPlugins([]), []);
  assert.deepEqual(
    normalizeEnabledPlugins(["unknown", "decision-tools", "decision-tools"]),
    ["decision-tools"],
  );
  assert.deepEqual(normalizeEnabledPlugins(["unknown"]), []);
  const copy = normalizeEnabledPlugins(null);
  copy.pop();
  assert.equal(DEFAULT_ENABLED_PLUGINS.length, 3);
});
