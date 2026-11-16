import {
  DEFAULT_THEME,
  parseThemeManifest,
  type ThemeManifest,
} from "./themes";
import { DEFAULT_ENABLED_PLUGINS, PLUGINS } from "./plugins";

export interface SiteSettings {
  theme: ThemeManifest;
  enabledPlugins: string[];
  revision: number;
}
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  theme: structuredClone(DEFAULT_THEME),
  enabledPlugins: [...DEFAULT_ENABLED_PLUGINS],
  revision: 0,
};

export function parseSiteSettings(
  input: unknown,
): { ok: true; value: SiteSettings } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  try {
    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(input))
    )
      return fail("Site ayarları düz bir JSON nesnesi olmalıdır.");
    const data = input as Record<string, unknown>;
    if (
      Reflect.ownKeys(data).some(
        (key) =>
          typeof key !== "string" ||
          !["theme", "enabledPlugins", "revision"].includes(key),
      )
    )
      return fail("Site ayarlarında bilinmeyen alan var.");
    const theme = parseThemeManifest(data.theme);
    if (!theme.ok) return fail(theme.error);
    if (!Number.isSafeInteger(data.revision) || Number(data.revision) < 0)
      return fail("Geçerli bir ayar sürümü gereklidir.");
    const known = new Set(PLUGINS.map((plugin) => plugin.id));
    if (
      !Array.isArray(data.enabledPlugins) ||
      data.enabledPlugins.length > known.size ||
      Array.from(data.enabledPlugins).some(
        (id) => typeof id !== "string" || !known.has(id),
      ) ||
      new Set(data.enabledPlugins).size !== data.enabledPlugins.length
    )
      return fail(
        "Eklentiler benzersiz, yerel kayıtlı kimliklerden oluşmalıdır.",
      );
    return {
      ok: true,
      value: {
        theme: theme.value,
        enabledPlugins: [...data.enabledPlugins] as string[],
        revision: data.revision as number,
      },
    };
  } catch {
    return fail("Site ayarları okunamadı.");
  }
}
