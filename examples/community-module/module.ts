import type { PluginDefinition } from "../../src/lib/plugins";

/** Source-registered contribution to an existing section, not an upload package. */
export const communityLearningGuides = {
  id: "community-learning-guides",
  name: "Learning guides",
  description: "Shows the existing guides section in a learning-focused community distribution.",
  version: "1.0.0",
  sections: ["guides"],
  defaultEnabled: false,
} satisfies PluginDefinition;
