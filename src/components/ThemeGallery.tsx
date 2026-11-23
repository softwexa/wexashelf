"use client";

import { useI18n } from "@/lib/i18n";


import { useId, useState } from "react";
import { BUILTIN_THEMES } from "@/lib/builtin-themes";
import { appIconUrl } from "@/lib/asset-url";
import {
  getThemePresentation,
  getThemeTemplate,
  themeToStyle,
  type ThemeManifest,
  type HomeSectionId,
} from "@/lib/themes";
import { getActiveSections } from "@/lib/plugins";
import gallery from "./ThemeGallery.module.css";

const sectionNames: Record<HomeSectionId, string> = {
  discovery: "Yeni bir şey keşfet",
  weekly: "Haftanın seçkisi",
  trending: "Göz atmaya değer",
  toolbox: "Karar araçları",
  guides: "Rehberler",
  workflows: "İş akışları",
};
const templateNames = {
  night: "Gece keşfi",
  atlas: "Kategori atlası",
  workflow: "İş akışı haritası",
  catalog: "Katalog rafları",
  magazine: "Editorial magazine",
  directory: "Compact directory",
  porcelain: "Porcelain", ember: "Ember", fieldnotes: "Fieldnotes", signal: "Signal", lilac: "Lilac Studio",
  tide: "Tide", copper: "Copper Desk", prism: "Prism", index: "Index", velvet: "Velvet",
};
const screenshotTemplates = new Set(Object.keys(templateNames));
const conceptHeadlines: Record<string, string> = {
  porcelain: "Good apps. Clear choices.", ember: "Find your next everyday essential.",
  fieldnotes: "A little less searching. A lot more doing.", signal: "Less noise. Better apps.",
  lilac: "Make room for better tools.", tide: "Useful on every device.", copper: "The right tool changes everything.",
  prism: "Your next good find.", index: "Find the tool. Keep the flow.", velvet: "Better apps. Beautifully considered.",
};

// Compare normalized content, not only the id: imports may customize a built-in.
export function isSameTheme(left: ThemeManifest, right: ThemeManifest) {
  return (
    left.id === right.id &&
    left.name === right.name &&
    left.description === right.description &&
    left.author === right.author &&
    left.layout === right.layout &&
    left.density === right.density &&
    getThemeTemplate(left) === getThemeTemplate(right) &&
    JSON.stringify(getThemePresentation(left)) === JSON.stringify(getThemePresentation(right)) &&
    JSON.stringify(left.sections) === JSON.stringify(right.sections) &&
    Object.keys(left.tokens).every(
      (key) =>
        left.tokens[key as keyof ThemeManifest["tokens"]].toLowerCase() ===
        right.tokens[key as keyof ThemeManifest["tokens"]].toLowerCase(),
    )
  );
}

function PresetPreview({ preset, enabledPlugins }: { preset: ThemeManifest; enabledPlugins: string[] }) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  // This receives only registered built-ins. Imported IDs never become asset URLs.
  const hasScreenshot = screenshotTemplates.has(getThemeTemplate(preset));
  const url = appIconUrl(`/themes/${preset.id}/screen.jpg`);
  const previewUrl = appIconUrl(`/themes/${preset.id}/preview.jpg`);
  if (!hasScreenshot || failed) return <ThemeMiniature theme={preset} enabledPlugins={enabledPlugins} decorative />;
  return <figure className={gallery.screenshot}>
    <a href={url} target="_blank" rel="noreferrer" aria-label={t("Open {name} screenshot", { name: preset.name })}>
      <img src={previewUrl} width={1440} height={1000} loading="lazy" decoding="async" alt={t("{name} homepage screenshot", { name: preset.name })} onError={() => setFailed(true)} />
    </a>
    <figcaption>{t("Preset screenshot")} <span>{t("Open full image")}</span></figcaption>
  </figure>;
}

export function ThemeMiniature({
  theme,
  enabledPlugins,
  decorative = false,
}: {
  theme: ThemeManifest;
  enabledPlugins: string[];
  decorative?: boolean;
}) {
  const { t, formatDate, formatNumber, countryName } = useI18n();
  const template = getThemeTemplate(theme);
  const sections = getActiveSections(theme, enabledPlugins);
  return (
    <div
      className={gallery.preview}
      data-template={template}
      data-layout={theme.layout}
      data-density={theme.density}
      style={themeToStyle(theme)}
      aria-hidden={decorative || undefined}
    >
      <div className={gallery.navigation}>
        <span>WexaShelf</span>
        <span>{t("Keşfet")}</span>
        <span>{t("Koleksiyonlar")}</span>
      </div>
      <div className={gallery.content}>
        <div className={gallery.hero}>
          <span>{t(templateNames[template])}</span>
          <strong style={{ fontFamily: "var(--theme-heading-font)" }}>
            {conceptHeadlines[template] ? t(conceptHeadlines[template]) : template === "magazine" ? t("Read the context. Choose your tools.") : template === "directory" ? t("Find an app. Check the details.") : template === "workflow"
              ? t("İşinden başla.")
              : template === "atlas"
                ? t("Bir kategori, yeni olasılıklar.")
                : template === "catalog"
                  ? t("Sıradaki uygulaman burada.")
                  : t("Kendine yeni bir rota bul.")}
          </strong>
          <span className={gallery.previewAction}>{t("Uygulamaları keşfet")}</span>
        </div>
        <ol className={gallery.sections}>
          {sections.map((section) => (
            <li key={section}>
              <span>{t(sectionNames[section])}</span>
              <div className={gallery.tiles}>
                <i />
                <i />
                <i />
              </div>
            </li>
          ))}
        </ol>
        {sections.length === 0 && (
          <p>{t("Bu tema ve eklenti seçiminde görünür bölüm yok.")}</p>
        )}
      </div>
    </div>
  );
}

export function ThemeGallery({
  theme,
  enabledPlugins,
  onSelect,
  mode = "personal",
}: {
  theme: ThemeManifest;
  enabledPlugins: string[];
  onSelect: (theme: ThemeManifest) => void;
  mode?: "personal" | "draft";
}) {
  const { t, formatDate, formatNumber, countryName } = useI18n();
  const heading = useId();
  const installed = BUILTIN_THEMES.find((preset) => isSameTheme(theme, preset));
  const modified =
    !installed && BUILTIN_THEMES.some((preset) => preset.id === theme.id);
  return (
    <section className={gallery.gallery} aria-labelledby={heading}>
      <div className={gallery.heading}>
        <h3 id={heading}>{t("Tema galerisi")}</h3>
        <p>
          {BUILTIN_THEMES.length}{" "}{t("kurulu tema ·")}{" "}
          {mode === "draft"
            ? t("Seçimin önce taslağa alınır.")
            : t("Seçimin bu tarayıcıda uygulanır ve saklanır.")}
        </p>
      </div>
      <p className={gallery.status} role="status">
        {mode === "draft" ? t("Taslak") : t("Etkin")}: {t(theme.name)} ·{" "}
        {installed
          ? t("Kurulu tema")
          : modified
            ? t("Özelleştirilmiş kurulu tema")
            : t("İçe aktarılan özel tema")}
      </p>
      <div className={gallery.grid}>
        {BUILTIN_THEMES.map((preset) => {
          const selected = isSameTheme(theme, preset);
          return (
            <article
              key={preset.id}
              className={gallery.card}
              data-selected={selected}
            >
              <PresetPreview preset={preset} enabledPlugins={enabledPlugins} />
              <div className={gallery.details}>
                <h4>{t(preset.name)}</h4>
                <p>{t(preset.description)}</p>
                <span>
                  {preset.layout === "sidebar" ? t("Yan menü") : t("Üst menü")} ·{" "}
                  {t(templateNames[getThemeTemplate(preset)])}
                </span>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(structuredClone(preset))}
                >
                  {selected
                    ? mode === "draft"
                      ? t("Taslakta seçili")
                      : t("Etkin tema")
                    : mode === "draft"
                      ? t("Taslağa al")
                      : t("Temayı kullan")}
                  <span className={gallery.srOnly}>: {t(preset.name)}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <p className={gallery.previewNote}>{t("Screenshots show each original preset. Your content and custom settings appear in the live preview.")}</p>
    </section>
  );
}
