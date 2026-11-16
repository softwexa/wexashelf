import assert from "node:assert/strict";
import { PLUGINS, getActiveSections, normalizeEnabledPlugins } from "../../src/lib/plugins";
import { DEFAULT_THEME } from "../../src/lib/themes";
import { communityLearningGuides } from "./module";

// Register only in this process. This verifier never writes project files or a database.
assert.ok(!PLUGINS.some(plugin => plugin.id === communityLearningGuides.id));
PLUGINS.push(communityLearningGuides);
try {
  const enabled = normalizeEnabledPlugins([communityLearningGuides.id]);
  assert.deepEqual(enabled, [communityLearningGuides.id]);
  assert.deepEqual(getActiveSections(DEFAULT_THEME, enabled), ["discovery", "weekly", "trending", "guides"]);
  assert.deepEqual(getActiveSections(DEFAULT_THEME, []), ["discovery", "weekly", "trending"]);
  assert.ok(!getActiveSections({ ...DEFAULT_THEME, sections: ["discovery"] }, enabled).includes("guides"));
  console.log("Source module registration, enable/disable, and theme ordering verified in memory.");
} finally {
  const position = PLUGINS.findIndex(plugin => plugin.id === communityLearningGuides.id);
  if (position !== -1) PLUGINS.splice(position, 1);
}
