import assert from "node:assert/strict";
import test from "node:test";
import { APPS, getAppById, searchApps, type CatalogApp } from "./catalog";
test("search folds Turkish letters and supports category labels", () => {
  assert.deepEqual(
    searchApps(APPS, "TARAYICI", "all", "all").map((a) => a.id),
    ["firefox"],
  );
  assert.deepEqual(
    searchApps(APPS, "DUSUNCELERININ", "all", "all").map((a) => a.id),
    ["obsidian"],
  );
  assert.equal(searchApps(APPS, "üretkenlik", "all", "all").length, 3);
});
test("query, platform and category are intersected without mutating source", () => {
  const fixture: CatalogApp[] = [
    { ...APPS[0], platforms: ["ios"] },
    { ...APPS[1], platforms: ["android"] },
  ];
  assert.deepEqual(
    searchApps(fixture, "notion", "android", "notes").map((a) => a.id),
    [],
  );
  assert.deepEqual(
    searchApps(fixture, "", "android", "notes").map((a) => a.id),
    ["obsidian"],
  );
  assert.equal(searchApps(fixture, "", "android", "media").length, 0);
  assert.equal(fixture.length, 2);
});
test("whitespace query shows all and unknown ids are absent", () => {
  assert.equal(searchApps(APPS, "   ", "all", "all").length, APPS.length);
  assert.equal(getAppById("not-a-real-app"), undefined);
  assert.equal(getAppById("notion")?.name, "Notion");
});

test("real platform filters narrow the catalog and preserve cross-platform apps", () => {
  const windows = searchApps(APPS, "", "windows", "all").map((app) => app.id);
  const android = searchApps(APPS, "", "android", "all").map((app) => app.id);
  const ios = searchApps(APPS, "", "ios", "all").map((app) => app.id);
  assert.ok(
    windows.length < APPS.length &&
      android.length < APPS.length &&
      ios.length < APPS.length,
  );
  assert.ok(windows.includes("powertoys") && !windows.includes("antennapod"));
  assert.ok(android.includes("antennapod") && !android.includes("powertoys"));
  assert.ok(!ios.includes("powertoys") && !ios.includes("antennapod"));
  for (const results of [windows, android, ios])
    assert.ok(results.includes("notion"));
});

test("PDF search includes description matches under the iOS filter", () => {
  assert.deepEqual(
    searchApps(APPS, "PDF", "ios", "all").map((app) => app.id),
    ["acrobat", "xodo"],
  );
});
