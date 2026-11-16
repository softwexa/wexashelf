"use client";
import {useI18n} from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  Download,
  Globe,
  LayoutGrid,
  RotateCcw,
  Upload,
} from "lucide-react";
import { DEFAULT_THEME, parseThemeManifest } from "@/lib/themes";
import { ThemeGallery, ThemeMiniature } from "../ThemeGallery";
import { ThemeCustomizer } from "../ThemeCustomizer";
import BrandingSettings from "./BrandingSettings";
import CatalogExperience from "../CatalogExperience";
import type { CatalogSnapshot } from "@/lib/domain";
import { PLUGINS } from "@/lib/plugins";
import { parseSiteSettings, type SiteSettings } from "@/lib/site-settings";

type Props = {
  onDirty: (value: boolean) => void;
  onBusy: (value: boolean) => void;
};
export default function SiteAppearance({ onDirty, onBusy }: Props) {
 const {t,intlLocale}=useI18n();

  const [published, setPublished] = useState<SiteSettings | null>(null);
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [conflict, setConflict] = useState(false);
  const [brandingDirty, setBrandingDirty] = useState(false);
  const [brandingBusy, setBrandingBusy] = useState(false);
  const [customizerValid, setCustomizerValid] = useState(true);
  const [previewCatalog, setPreviewCatalog] = useState<CatalogSnapshot | null>(null);
  const [previewLocale, setPreviewLocale] = useState("en");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewRequest = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const pendingImport = useRef(0);
  const dirty =
    !!draft &&
    !!published &&
    JSON.stringify(draft) !== JSON.stringify(published);
  useEffect(() => {
    onDirty(dirty || brandingDirty || !customizerValid);
  }, [dirty, brandingDirty, customizerValid, onDirty]);
  useEffect(() => {
    onBusy(loading || saving || brandingBusy || previewLoading);
  }, [loading, saving, brandingBusy, previewLoading, onBusy]);
  useEffect(() => {
    let active = true;
    fetch("/api/admin/settings", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Site ayarları yüklenemedi.");
        const parsed = parseSiteSettings(result.settings);
        if (!parsed.ok) throw new Error(parsed.error);
        if (active) {
          setPublished(parsed.value);
          setDraft(structuredClone(parsed.value));
        }
      })
      .catch((caught) => {
        if (active)
          setError(
            caught instanceof Error
              ? caught.message
              : "Site ayarları yüklenemedi.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      previewRequest.current?.abort();
      pendingImport.current += 1;
      onBusy(false);
    };
  }, [onBusy]);
  function update(next: SiteSettings) {
    pendingImport.current += 1;
    setDraft(next);
    setSuccess("");
    setError("");
  }
  async function togglePreview() {
    if (previewOpen) { setPreviewOpen(false); return; }
    const controller = new AbortController();
    previewRequest.current?.abort();
    previewRequest.current = controller;
    setPreviewLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/extensions", { cache: "no-store", credentials: "same-origin", signal: controller.signal });
      const value = await response.json();
      if (!response.ok) throw Error(value.error || t("Theme preview could not be loaded."));
      if (!controller.signal.aborted) { setPreviewCatalog(value.catalog); setPreviewLocale(value.previewLocale || "en"); setPreviewOpen(true); }
    } catch (caught) {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : t("Theme preview could not be loaded."));
    } finally { if (!controller.signal.aborted) setPreviewLoading(false); }
  }
  async function reload() {
    if (
      (dirty || !customizerValid) &&
      !window.confirm(
        t("Güncel site ayarlarını yüklemek bu görünüm taslağını kaldıracak. Devam edilsin mi?"),
      )
    )
      return;
    pendingImport.current += 1;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/settings", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Site ayarları yüklenemedi.");
      const parsed = parseSiteSettings(result.settings);
      if (!parsed.ok) throw new Error(parsed.error);
      setPublished(parsed.value);
      setDraft(structuredClone(parsed.value));
      setConflict(false);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Site ayarları yüklenemedi.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function importTheme(file?: File) {
    if (!file || !draft) return;
    const sequence = ++pendingImport.current;
    setError("");
    setSuccess("");
    if (file.size > 32 * 1024) {
      setError(t("Site teması dosyası en fazla 32 KB olabilir."));
      return;
    }
    try {
      const parsed = parseThemeManifest(JSON.parse(await file.text()));
      if (sequence !== pendingImport.current) return;
      if (!parsed.ok) throw new Error(parsed.error);
      setDraft((previous) =>
        previous ? { ...previous, theme: parsed.value } : previous,
      );
    } catch (caught) {
      if (sequence === pendingImport.current)
        setError(
          caught instanceof SyntaxError
            ? "Dosya geçerli bir JSON teması değil."
            : caught instanceof Error
              ? caught.message
              : "Tema dosyası okunamadı.",
        );
    }
  }
  function exportTheme() {
    if (!draft) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(draft.theme, null, 2) + "\n"], {
        type: "application/json",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${draft.theme.id}-site-taslagi.json`;
    document.body.appendChild(anchor);
    try {
      anchor.click();
    } finally {
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
  async function publish() {
    if (!draft || saving || loading || !customizerValid) return;
    pendingImport.current += 1;
    setSaving(true);
    setError("");
    setSuccess("");
    setConflict(false);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) setConflict(true);
        throw new Error(result.error || "Site görünümü etkinleştirilemedi.");
      }
      const parsed = parseSiteSettings(result.settings);
      if (!parsed.ok) throw new Error(parsed.error);
      setPublished(parsed.value);
      setDraft(structuredClone(parsed.value));
      setSuccess(
        t("Site görünümü etkinleştirildi · Sürüm {p0}. Yeni ziyaretçiler bu varsayılan görünümü kullanır.",{p0:parsed.value.revision}),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Site görünümü etkinleştirilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }
  if (!draft || !published)
    return (
      <section className="admin-panel">
        <h2>{t("Site görünümü")}</h2>
        {loading ? (
          <p role="status">{t("Site ayarları yükleniyor…")}</p>
        ) : (
          <>
            <p className="admin-error" role="alert">
              {t(error)}
            </p>
            <button className="admin-button" onClick={() => void reload()}>{t("Yeniden dene")}</button>
          </>
        )}
      </section>
    );
  return (
    <section className="admin-appearance">
      <BrandingSettings onDirty={setBrandingDirty} onBusy={setBrandingBusy} />
      <div className="admin-appearance-intro">
        <div>
          <span className="admin-kicker">{t("Site genelinde varsayılan")}</span>
          <h2>{t("Bir görünüm, bütün site.")}</h2>
          <p>{t("Yeni ziyaretçilerin göreceği temayı ve ana sayfa bölümlerini seç. Kişisel tercihini kaydetmiş ziyaretçiler kendi görünümünü kullanmayı sürdürür.")}</p>
        </div>
        <span className={`admin-badge ${dirty ? "warning" : ""}`}>
          {dirty
            ? t("Etkinleştirilmemiş taslak")
            : t("Etkin sürüm {p0}",{p0:published.revision})}
        </span>
      </div>
      {error && (
        <p className="admin-error" role="alert">
          {t(error)}
        </p>
      )}
      {success && (
        <p className="admin-success" role="status">
          {t(success)}
        </p>
      )}
      {conflict && (
        <div className="admin-conflict">
          <p>{t("Taslağın korunuyor. Gerekirse tema dosyasını indir; ardından güncel sürümü yükleyip değişikliklerini yeniden uygula.")}</p>
          <button
            className="admin-button"
            disabled={saving || loading}
            onClick={() => void reload()}
          >{t("Güncel site ayarlarını yükle")}</button>
        </div>
      )}
      <fieldset className="admin-edit-fields" disabled={saving || loading}>
        <ThemeGallery
          theme={draft.theme}
          enabledPlugins={draft.enabledPlugins}
          mode="draft"
          onSelect={(theme) => update({ ...draft, theme })}
        />
        <section className="admin-panel">
          <ThemeCustomizer key={draft.theme.id} theme={draft.theme} onValidityChange={setCustomizerValid} onChange={theme => update({ ...draft, theme })} />
        </section>
        <div className="admin-appearance-grid">
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <span className="admin-kicker">{t("Tema taslağı")}</span>
                <h3>{draft.theme.name}</h3>
              </div>
              <LayoutGrid size={21} />
            </div>
            <p>{draft.theme.description}</p>
            <p className="admin-appearance-meta">
              {draft.theme.id}{" "}{t("·")}{" "}
              {draft.theme.layout === "sidebar" ? t("Yan menü") : t("Üst menü")}{" "}{t("·")}{" "}
              {draft.theme.density === "compact" ? t("Sıkı") : t("Rahat")}{" "}{t("yoğunluk")}</p>
            <div className="admin-theme-colors">
              {Object.entries(draft.theme.tokens).map(([key, color]) => (
                <span
                  key={key}
                  style={{ background: color }}
                  title={`${key}: ${color}`}
                />
              ))}
            </div>
            <div className="admin-editor-actions">
              <button
                type="button"
                className="admin-button"
                onClick={() => fileInput.current?.click()}
              >
                <Upload size={15} />{t("Site teması yükle")}</button>
              <button
                type="button"
                className="admin-button"
                onClick={exportTheme}
              >
                <Download size={15} />{t("Tema taslağını indir")}</button>
              <button
                type="button"
                className="admin-button"
                onClick={() =>
                  update({ ...draft, theme: structuredClone(DEFAULT_THEME) })
                }
              >
                <RotateCcw size={15} />{t("Varsayılan temayı taslağa al")}</button>
            </div>
            <input
              ref={fileInput}
              hidden
              type="file"
              aria-label={t("Site teması dosyası")}
              accept=".json,application/json"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                void importTheme(file);
              }}
            />
            <p>{t("Yalnız JSON tema dosyası · En fazla 32 KB. Dosya yüklemek siteyi değiştirmez.")}</p>
            <a
              className="admin-appearance-example"
              href="/themes/kobalt-atlas.json"
              download
            >{t("Örnek tema JSON dosyasını indir")}<Download size={13} />
            </a>
          </section>
          <section className="admin-panel">
            <span className="admin-kicker">{t("Yerel eklentiler")}</span>
            <h3>{t("Ana sayfanın bölümleri")}</h3>
            <p>{t("Kapalı eklenti yalnız bölüm katkısını gizler; içeriği silmez ve doğrudan içerik bağlantılarını kapatmaz.")}</p>
            {PLUGINS.map((plugin) => {
              const checked = draft.enabledPlugins.includes(plugin.id);
              return (
                <div className="admin-plugin-row" key={plugin.id}>
                  <div>
                    <h4>{plugin.name}</h4>
                    <p>{plugin.description}</p>
                  </div>
                  <button
                    type="button"
                    className="admin-plugin-switch"
                    role="switch"
                    aria-label={plugin.name}
                    aria-checked={checked}
                    onClick={() =>
                      update({
                        ...draft,
                        enabledPlugins: checked
                          ? draft.enabledPlugins.filter(
                              (id) => id !== plugin.id,
                            )
                          : [...draft.enabledPlugins, plugin.id],
                      })
                    }
                  >
                    <span />
                  </button>
                </div>
              );
            })}
          </section>
        </div>
        <section className="admin-panel admin-site-preview">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-kicker">{t("Yalnız taslak önizlemesi")}</span>
              <h3>{t("Bölüm sırası ve renk düzeni")}</h3>
            </div>
            <span>{t("Etkin tema:")}{" "}{published.theme.name}</span>
          </div>
          <ThemeMiniature
            theme={draft.theme}
            enabledPlugins={draft.enabledPlugins}
          />
          <div className="admin-actions" style={{ marginTop: 18 }}>
            <button type="button" className="admin-button" disabled={previewLoading || !customizerValid} onClick={() => void togglePreview()}>{previewLoading ? t("Loading theme preview…") : previewOpen ? t("Hide live preview") : t("Preview this draft")}</button>
          </div>
          <p>{t("Preview uses saved site identity and unsaved theme settings. It does not change the public site.")}</p>
          {previewOpen && previewCatalog && <div className="extension-live-preview" role="region" aria-label={t("Theme draft preview")} tabIndex={0} style={{ maxHeight: 720, overflow: "auto", border: "1px solid var(--admin-border, #cbd5e1)", borderRadius: 12 }}><div inert><CatalogExperience previewMode locale={previewLocale} catalog={{ ...previewCatalog, siteSettings: draft }} path={[]} initialQuery="" initialPlatform="all" initialCategory="all" initialCompare={[]} initialCompareSpecified={false} /></div></div>}
        </section>
        <div className="admin-appearance-publish">
          <div>
            <Globe size={20} />
            <p>{t("Bu işlem site varsayılanını değiştirir.")}<br />
              <span>{t("Kişisel /ayarlar tercihleri ve kaydedilen uygulamalar korunur.")}</span>
            </p>
          </div>
          <button
            type="button"
            className="admin-button primary"
            disabled={!dirty || saving || loading || !customizerValid}
            onClick={() => void publish()}
          >
            <Check size={16} />
            {saving ? t("Etkinleştiriliyor…") : t("Sitede etkinleştir")}
          </button>
        </div>
      </fieldset>
    </section>
  );
}
