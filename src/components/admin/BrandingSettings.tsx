"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { normalizeBranding, type SiteBranding } from "@/lib/branding";
import type { ArticleImage } from "@/lib/domain";
import SiteBrand from "../SiteBrand";

type Settings = Record<string, unknown> & { siteName: string; revision: number; branding?: SiteBranding };
type Props = { onDirty: (dirty: boolean) => void; onBusy: (busy: boolean) => void };
export default function BrandingSettings({ onDirty, onBusy }: Props) {
  const { t } = useI18n();
  const [published, setPublished] = useState<Settings | null>(null), [draft, setDraft] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(true), [error, setError] = useState(""), [saved, setSaved] = useState(false);
  const pending = useRef<AbortController | null>(null);
  const dirty = !!draft && !!published && JSON.stringify(draft) !== JSON.stringify(published);
  useEffect(() => { onDirty(dirty); }, [dirty, onDirty]);
  useEffect(() => { onBusy(busy); }, [busy, onBusy]);
  useEffect(() => { const abort = new AbortController(); pending.current = abort; void load(abort.signal); return () => { pending.current?.abort(); }; }, []);
  async function load(signal?: AbortSignal) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/seo", { credentials: "same-origin", cache: "no-store", signal });
      const result = await response.json(); if (!response.ok) throw Error(result.error || t("Brand settings could not be loaded."));
      if (signal?.aborted) return;
      const value = { ...result.settings, branding: normalizeBranding(result.settings.branding) } as Settings;
      setPublished(value); setDraft(structuredClone(value)); setSaved(false);
    } catch (e) { if (!signal?.aborted) setError(e instanceof Error ? e.message : t("Brand settings could not be loaded.")); }
    finally { if (!signal?.aborted) setBusy(false); }
  }
  function update(patch: Partial<Settings>) { setDraft(previous => previous ? { ...previous, ...patch } : previous); setSaved(false); setError(""); }
  async function upload(file: File) {
    if (!draft || busy) return;
    const abort = new AbortController(); pending.current = abort; setBusy(true); setError(""); setSaved(false);
    try {
      if (file.size > 2 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw Error(t("Use a PNG, JPEG or WebP image no larger than 2 MiB."));
      const source = URL.createObjectURL(file); let base64: string;
      try {
        const probe = new Image(); probe.src = source; await probe.decode();
        if (probe.naturalWidth > 4096 || probe.naturalHeight > 4096 || probe.naturalWidth * probe.naturalHeight > 12000000) throw Error(t("Image dimensions must be at most 4096 pixels per side and 12 megapixels."));
        const scale = Math.min(1, 1024 / Math.max(probe.naturalWidth, probe.naturalHeight));
        const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(probe.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(probe.naturalHeight * scale));
        const context = canvas.getContext("2d"); if (!context) throw Error(t("The image could not be uploaded."));
        context.drawImage(probe, 0, 0, canvas.width, canvas.height);
        base64 = canvas.toDataURL("image/webp", 0.9).split(",")[1];
      } finally { URL.revokeObjectURL(source); }
      if (abort.signal.aborted) return;
      const current = normalizeBranding(draft.branding);
      const response = await fetch("/api/admin/media", { method: "POST", credentials: "same-origin", signal: abort.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ base64, alt: current.logo?.alt || draft.siteName, caption: "" }) });
      const result = await response.json(); if (!response.ok) throw Error(result.error || t("The image could not be uploaded."));
      if (abort.signal.aborted) return;
      const candidate = normalizeBranding({ ...current, logo: result.image as ArticleImage });
      if (!candidate.logo) throw Error(t("The server returned invalid image metadata."));
      update({ branding: { ...candidate, logoMode: candidate.logoMode === "text-only" ? "image-and-name" : candidate.logoMode } });
    } catch (e) { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : t("The image could not be uploaded.")); }
    finally { if (!abort.signal.aborted) setBusy(false); }
  }
  async function save() {
    if (!draft || busy) return;
    const abort = new AbortController(); pending.current = abort; setBusy(true); setError(""); setSaved(false);
    try {
      const response = await fetch("/api/admin/seo", { method: "POST", credentials: "same-origin", signal: abort.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const result = await response.json();
      if (!response.ok) throw Error(response.status === 409 ? t("Site settings changed elsewhere. Your draft is kept; reload current settings before saving again.") : result.error || t("Brand settings could not be saved."));
      if (!abort.signal.aborted) { const next = { ...result.settings, branding: normalizeBranding(result.settings.branding) }; setPublished(next); setDraft(structuredClone(next)); setSaved(true); }
    } catch (e) { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : t("Brand settings could not be saved.")); }
    finally { if (!abort.signal.aborted) setBusy(false); }
  }
  const brand = normalizeBranding(draft?.branding);
  return <section className="admin-panel branding-settings" aria-busy={busy}>
    <h3>{t("Site identity")}</h3><p>{t("Your name and logo stay the same when you switch themes. Save branding separately from theme appearance.")}</p>
    {error && <p className="admin-error" role="alert">{error}</p>}{saved && <p className="admin-success" role="status">{t("Site identity saved.")}</p>}
    {!draft ? <button type="button" className="admin-button" disabled={busy} onClick={() => void load()}>{busy ? t("Ayarlar yükleniyor…") : t("Yeniden dene")}</button> : <form onSubmit={event => { event.preventDefault(); void save(); }}>
      <fieldset className="admin-edit-fields" disabled={busy}><div className="admin-form-grid">
        <label className="admin-field"><span>{t("Site adı")}</span><input required maxLength={80} value={draft.siteName} onChange={e => update({ siteName: e.target.value })} /></label>
        <label className="admin-field"><span>{t("Logo display")}</span><select value={brand.logoMode} onChange={e => update({ branding: { ...brand, logoMode: e.target.value as SiteBranding["logoMode"] } })}>
          <option value="image-and-name">{t("Logo and site name")}</option><option value="image-only">{t("Logo only")}</option><option value="text-only">{t("Site name only")}</option></select></label>
        <label className="admin-field"><span>{t("Upload site logo")}</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { const file = e.target.files?.[0]; e.currentTarget.value = ""; if (file) void upload(file); }} /><small>{t("PNG, JPEG or WebP, up to 2 MiB. Transparency is preserved. Uploading only changes this draft.")}</small></label>
        <label className="admin-field"><span>{t("Logo width")}</span><input type="range" min={64} max={320} step={8} value={brand.logoWidth} onChange={e => update({ branding: { ...brand, logoWidth: Number(e.target.value) } })} /><output>{brand.logoWidth} px</output></label>
        {brand.logo && <label className="admin-field"><span>{t("Image alternative text")}</span><input required maxLength={500} value={brand.logo.alt} onChange={e => update({ branding: { ...brand, logo: { ...brand.logo!, alt: e.target.value } } })} /></label>}
      </div><div className="branding-preview" aria-label={t("Brand preview")}><SiteBrand name={draft.siteName} branding={brand} privatePreview /></div>
      <div className="admin-actions"><button type="submit" className="admin-button primary" disabled={!dirty || !draft.siteName.trim() || !!brand.logo && !brand.logo.alt.trim()}>{t("Save site identity")}</button>
        {brand.logo && <button type="button" className="admin-button" onClick={() => update({ branding: { ...brand, logo: null } })}>{t("Remove logo")}</button>}
        <button type="button" className="admin-button subtle" onClick={() => { if (!dirty || window.confirm(t("Reloading discards this unsaved branding draft. Continue?"))) void load(); }}>{t("Reload saved identity")}</button>
      </div></fieldset>
    </form>}
  </section>;
}
