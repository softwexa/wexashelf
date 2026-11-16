import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseThemeManifest, themeToStyle } from "../../src/lib/themes";
import { getActiveSections } from "../../src/lib/plugins";

const parsed = parseThemeManifest(JSON.parse(readFileSync(new URL("./harbor.json", import.meta.url), "utf8")));
assert.ok(parsed.ok, parsed.ok ? undefined : parsed.error);
assert.equal(Object.keys(themeToStyle(parsed.value)).length, 13);
assert.deepEqual(getActiveSections(parsed.value, ["decision-tools"]), ["discovery", "weekly", "toolbox", "trending"]);
console.log("Harbor theme validates; eight color tokens, presentation defaults and optional-section filtering verified.");
