import { type HomeSectionId, type ThemeManifest } from "./themes";

export interface PluginDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  sections: HomeSectionId[];
  defaultEnabled: boolean;
}

export const PLUGINS: PluginDefinition[] = [
  {
    id: "decision-tools",
    name: "Karar araçları",
    description: "Uygulama seçimini kolaylaştıran araç kutusu.",
    version: "1.0.0",
    sections: ["toolbox"],
    defaultEnabled: true,
  },
  {
    id: "migration-guides",
    name: "Geçiş rehberleri",
    description: "Uygulamalar arasında geçiş için adım adım rehberler.",
    version: "1.0.0",
    sections: ["guides"],
    defaultEnabled: true,
  },
  {
    id: "workflow-collections",
    name: "İş akışı koleksiyonları",
    description: "Birlikte kullanılabilecek uygulama akışları.",
    version: "1.0.0",
    sections: ["workflows"],
    defaultEnabled: true,
  },
];
export const DEFAULT_ENABLED_PLUGINS: string[] = PLUGINS.filter(
  (plugin) => plugin.defaultEnabled,
).map((plugin) => plugin.id);

export function normalizeEnabledPlugins(value: unknown): string[] {
  if (
    !Array.isArray(value) ||
    Array.from(value).some((id) => typeof id !== "string")
  )
    return [...DEFAULT_ENABLED_PLUGINS];
  const known = new Set(PLUGINS.map((plugin) => plugin.id));
  return [
    ...new Set(
      value.filter(
        (id): id is string => typeof id === "string" && known.has(id),
      ),
    ),
  ];
}

export function getActiveSections(
  theme: ThemeManifest,
  enabledIds: string[],
): HomeSectionId[] {
  const enabled = new Set(normalizeEnabledPlugins(enabledIds));
  const optional = new Set(PLUGINS.flatMap((plugin) => plugin.sections));
  const contributions = new Set(
    PLUGINS.filter((plugin) => enabled.has(plugin.id)).flatMap(
      (plugin) => plugin.sections,
    ),
  );
  return theme.sections.filter(
    (section) => !optional.has(section) || contributions.has(section),
  );
}
