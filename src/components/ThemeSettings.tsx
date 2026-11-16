"use client";

import { useI18n } from "@/lib/i18n";


import { useId, useRef, useState, type ChangeEvent } from "react";
import { Download, Palette, RotateCcw, Upload } from "lucide-react";
import {
  DEFAULT_THEME,
  parseThemeManifest,
  type ThemeManifest,
} from "../lib/themes";
import { ThemeGallery, isSameTheme } from "./ThemeGallery";
import { ThemeCustomizer } from "./ThemeCustomizer";
import { BUILTIN_THEMES } from "../lib/builtin-themes";
import { PLUGINS, normalizeEnabledPlugins } from "../lib/plugins";

interface ThemeSettingsProps {
  theme: ThemeManifest;
  onThemeChange: (theme: ThemeManifest) => void;
  enabledPlugins: string[];
  onPluginsChange: (ids: string[]) => void;
}

export function ThemeSettings({
  theme,
  onThemeChange,
  enabledPlugins,
  onPluginsChange,
}: ThemeSettingsProps) {
  const { t, formatDate, formatNumber, countryName } = useI18n();
  const fileId = useId();
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const importSequence = useRef(0);
  const current = parseThemeManifest(theme);
  const activeTheme = current.ok ? current.value : DEFAULT_THEME;
  const custom = !BUILTIN_THEMES.some((preset) =>
    isSameTheme(activeTheme, preset),
  );
  const enabled = normalizeEnabledPlugins(enabledPlugins);

  async function importTheme(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    const sequence = ++importSequence.current;
    setError("");
    if (file.size > 32 * 1024) {
      setImporting(false);
      setError(t("Tema dosyası en fazla 32 KB olabilir."));
      return;
    }
    setImporting(true);
    try {
      const parsed = parseThemeManifest(JSON.parse(await file.text()));
      if (sequence !== importSequence.current) return;
      if (!parsed.ok) {
        setError(t(parsed.error));
        return;
      }
      onThemeChange(parsed.value);
    } catch {
      if (sequence === importSequence.current)
        setError(t("Dosya okunamadı. Geçerli bir JSON tema dosyası seçin."));
    } finally {
      if (sequence === importSequence.current) setImporting(false);
    }
  }

  function resetTheme() {
    importSequence.current += 1;
    setImporting(false);
    setError("");
    onThemeChange(structuredClone(DEFAULT_THEME));
  }

  function exportTheme() {
    const blob = new Blob([JSON.stringify(activeTheme, null, 2) + "\n"], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeTheme.id}.json`;
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  return (
    <div className="settings-grid">
      <section className="settings-panel" aria-labelledby={`${fileId}-themes`}>
        <div className="settings-heading">
          <Palette size={22} aria-hidden="true" />
          <div>
            <h2 id={`${fileId}-themes`}>{t("Görünümün sana uysun")}</h2>
            <p>{BUILTIN_THEMES.length}{" "}{t("kurulu tema · Renkten fazlasını seç.")}</p>
          </div>
        </div>
        <ThemeGallery
          theme={activeTheme}
          enabledPlugins={enabled}
          onSelect={(next) => {
            importSequence.current += 1;
            setImporting(false);
            setError("");
            onThemeChange(next);
          }}
        />
        <div
          className="theme-preview"
          style={{
            background: activeTheme.tokens.background,
            color: activeTheme.tokens.foreground,
            borderColor: activeTheme.tokens.border,
          }}
        >
          <p>{custom ? t("Özel tema · Etkin") : t("Kurulu tema · Etkin")}</p>
          <h3>{t(activeTheme.name)}</h3>
          <p>{t(activeTheme.description)}</p>
          <div className="theme-swatches" aria-label={t("Tema renkleri")}>
            {Object.entries(activeTheme.tokens).map(([name, color]) => (
              <span
                key={name}
                title={`${name}: ${color}`}
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
            ))}
          </div>
          <p>
            {activeTheme.layout === "sidebar" ? t("Yan menü") : t("Üst menü")} ·{" "}
            {activeTheme.density === "comfortable"
              ? t("Rahat yoğunluk")
              : t("Sıkı yoğunluk")}
          </p>
          <p className="settings-note">{t("Tema kimliği:")}{activeTheme.id}</p>
        </div>
        <ThemeCustomizer key={activeTheme.id} theme={activeTheme} onChange={next => {
          importSequence.current += 1;
          setImporting(false);
          setError("");
          onThemeChange(next);
        }} />
        <div className="settings-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={16} aria-hidden="true" />{t("Tema dosyası yükle")}</button>
          <input
            ref={fileInput}
            id={fileId}
            className="file-input"
            type="file"
            tabIndex={-1}
            accept=".json,application/json"
            onChange={importTheme}
            aria-label={t("Tema dosyası yükle")}
            aria-describedby={`${fileId}-help`}
          />
          <button
            type="button"
            className="button button-secondary"
            onClick={exportTheme}
          >
            <Download size={16} aria-hidden="true" />{t("Etkin temayı indir")}</button>
          <button
            type="button"
            className="button button-secondary"
            onClick={resetTheme}
          >
            <RotateCcw size={16} aria-hidden="true" />{t("Gece Rotaları’na dön")}</button>
        </div>
        <p id={`${fileId}-help`} className="settings-note">{t("JSON tema dosyası · En fazla 32 KB. Bu tarayıcıda saklanır.")}</p>
        {importing && (
          <p className="settings-note" role="status">{t("Tema dosyası okunuyor…")}</p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <a
          href="/themes/kobalt-atlas.json"
          download
          className="button button-secondary"
        >
          <Download size={16} aria-hidden="true" />{t("Örnek tema dosyasını indir")}</a>
        <p className="settings-note">{t("İndirilebilir örnek: Kobalt. JSON dosyasıyla kendi renklerini ve bölüm sıralamanı da içe aktarabilirsin.")}</p>
      </section>

      <section className="settings-panel" aria-labelledby={`${fileId}-plugins`}>
        <div className="settings-heading">
          <div>
            <h2 id={`${fileId}-plugins`}>{t("Keşif alanını düzenle")}</h2>
            <p>{t("İhtiyacın olan bölümleri açık tut.")}</p>
          </div>
        </div>
        {PLUGINS.map((plugin) => {
          const checked = enabled.includes(plugin.id);
          return (
            <div className="plugin-item" key={plugin.id}>
              <div>
                <h3>{t(plugin.name)}</h3>
                <p>{t(plugin.description)}</p>
              </div>
              <button
                type="button"
                className="switch"
                role="switch"
                aria-checked={checked}
                aria-label={t(plugin.name)}
                onClick={() =>
                  onPluginsChange(
                    checked
                      ? enabled.filter((id) => id !== plugin.id)
                      : [...enabled, plugin.id],
                  )
                }
              >
                <span aria-hidden="true" />
              </button>
            </div>
          );
        })}
        <p className="settings-note">{t("Bir bölümü kapatmak içeriğini silmez. Bu tarayıcıda saklanır.")}</p>
      </section>
    </div>
  );
}
