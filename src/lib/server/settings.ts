import {
  DEFAULT_SITE_SETTINGS,
  parseSiteSettings,
  type SiteSettings,
} from "../site-settings";
import { db, transaction } from "./store";
import { StoreError } from "./validation";

const KEY = "site-settings";
export function getSiteSettings(): SiteSettings {
  const stored = db()
    .prepare("SELECT value FROM settings WHERE key=?")
    .get(KEY);
  if (stored && typeof stored.value === "string") {
    try {
      const result = parseSiteSettings(JSON.parse(stored.value));
      if (result.ok) return result.value;
    } catch {
      /* Invalid persisted JSON falls back to the built-in theme. */
    }
  }
  return structuredClone(DEFAULT_SITE_SETTINGS);
}
export function saveSiteSettings(input: unknown): SiteSettings {
  const result = parseSiteSettings(input);
  if (!result.ok) throw new StoreError(result.error);
  return transaction(() => {
    const current = getSiteSettings();
    if (current.revision !== result.value.revision)
      throw new StoreError(
        "Site görünümü başka bir oturumda değişti. Güncel sürümü yükleyin; taslağınızı önce dışa aktarabilirsiniz.",
        409,
      );
    if (current.revision >= Number.MAX_SAFE_INTEGER)
      throw new StoreError("Ayar sürümü sınırına ulaşıldı.", 409);
    const next = { ...result.value, revision: current.revision + 1 };
    db()
      .prepare(
        "INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      )
      .run(KEY, JSON.stringify(next));
    db()
      .prepare(
        "INSERT INTO audit(action,subject,detail,createdAt) VALUES(?,?,?,?)",
      )
      .run(
        "site-settings",
        "appearance",
        `theme=${next.theme.id}; plugins=${next.enabledPlugins.join(",")}; revision=${next.revision}`,
        new Date().toISOString(),
      );
    return next;
  });
}
