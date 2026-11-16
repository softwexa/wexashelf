"use client";
import {useI18n} from "@/lib/i18n";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { History, Languages, RefreshCw, RotateCcw, Save } from "lucide-react";
import type { ManagedRecord, RecordKind } from "@/lib/domain";
import type { AITranslationDraft } from "./AIStudio";
const KIND_LABELS: Record<RecordKind, string> = { app: "App", article: "Article", list: "Editorial list" };
const STATUS_LABELS = { draft: "Draft", review: "In review", published: "Published", scheduled: "Scheduled", archived: "Archived" };
import ui from "./TranslationsWorkspace.module.css";

type LocaleSettings = {
  revision: number;
  defaultLocale: string;
  sourceLocale: string;
  locales: { code: string; label: string; enabled: boolean }[];
  homeSeo?: Record<string, { title: string; description: string }>;
};
type Translation = {
  kind: RecordKind;
  id: string;
  locale: string;
  slug: string;
  revision: number;
  sourceRevision: number;
  stale?: boolean;
  status: "draft" | "published" | "scheduled" | "archived";
  publishAt: string | null;
  seoApproved: boolean;
  fields: Record<string, string>;
  seo: { title?: string; description?: string; noindex?: boolean };
  reviewNote: string;
  updatedAt?: string;
};
type SourceField = { path: string; label: string; value: string };
function fieldLabel(field: SourceField,t:(key:string,params?:Record<string,string|number>)=>string): string {
  if (field.label !== field.path) return t(field.label);
  const labels: Record<string, string> = {
    name: "Name", title: "Title", tagline: "Tagline", description: "Description",
    pricingLabel: "Pricing summary", summary: "Summary", method: "Selection method",
    "cover.alt": "Cover image alternative text", "cover.caption": "Cover image caption",
  };
  if (labels[field.path]) return t(labels[field.path]);
  const parts = field.path.split(".");
  const number = Number(parts[1]) + 1;
  if (parts[0] === "tags") return t("Tag {number}",{number});
  if (parts[0] === "aliases") return t("Alternative name {number}",{number});
  if (parts[0] === "featureNotes") return t("Feature {number} · {label}",{number,label:t(parts[2]==="label"?"Title":"Description")});
  if (parts[0] === "facts") return t("Verified fact {number} · Description",{number});
  if (parts[0] === "plans") return parts[2]==="limits"?t("Plan {number} · Limit {limit} · {label}",{number,limit:Number(parts[3])+1,label:t(parts[4]==="label"?"Title":"Description")}):t("Plan {number} · {label}",{number,label:t(parts[2]==="name"?"Name":"Note")});
  if (parts[0] === "sections") return t("Section {number} · {label}",{number,label:parts[2]==="heading"?t("Title"):t("Paragraph {number}",{number:Number(parts[3])+1})});
  if (parts[0] === "sources") return t("Source {number} · Title",{number});
  if (parts[0] === "entries") return t("List entry {number} · Selection reason",{number});
  return t(field.label);
}
type Workspace = {
  settings: LocaleSettings;
  supportedLocales: string[];
  records: ManagedRecord[];
  translations: Translation[];
  fieldMaps: Record<string, SourceField[]>;
  pagination?: {total:number;page:number;pages:number;pageSize:number};
};
type Props = {
  onDirty: (value: boolean) => void;
  onBusy: (value: boolean) => void;
  onAuthLost: () => void;
  initialDraft?: (AITranslationDraft & { token: number }) | null;
  onInitialDraftConsumed?: () => void;
};

class TranslationApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
async function request<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({ error: "The server response could not be read." }));
  if (!response.ok) throw new TranslationApiError(data.error || `The request could not be completed (${response.status}).`, response.status);
  return data as T;
}
const recordSourceLocale=(record:ManagedRecord)=>record.sourceLocale||"tr";
const recordKey = (record: Pick<ManagedRecord, "kind" | "id">) => `${record.kind}:${record.id}`;
const recordTitle = (record: ManagedRecord) => "name" in record.data ? record.data.name : record.data.title;
const matches = (translation: Translation, record: ManagedRecord, locale: string) =>
  translation.kind === record.kind && translation.id === record.id && translation.locale === locale;
const isStale = (translation: Translation | undefined, record: ManagedRecord) =>
  !!translation && (translation.stale ?? translation.sourceRevision !== record.revision);
function makeDraft(record: ManagedRecord, locale: string, saved?: Translation): Translation {
  return {
    kind: record.kind, id: record.id, locale, slug: saved?.slug ?? record.id,
    revision: saved?.revision ?? 0, sourceRevision: record.revision,
    status: saved?.status ?? "draft", publishAt: saved?.publishAt ?? null,
    seoApproved: saved?.seoApproved ?? false,
    fields: { ...saved?.fields }, seo: { ...saved?.seo }, reviewNote: saved?.reviewNote ?? "",
  };
}
function localDateTime(value: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "";
  return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function TranslationsWorkspace({ onDirty, onBusy, onAuthLost, initialDraft, onInitialDraftConsumed }: Props) {
 const {t,intlLocale,locale:adminLocale}=useI18n();

  const formId = useId();
  const appliedAiToken = useRef<number | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [settings, setSettings] = useState<LocaleSettings | null>(null);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [draft, setDraft] = useState<Translation | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locale, setLocale] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [kind, setKind] = useState<RecordKind>("app");
  const [query, setQuery] = useState("");
  const [pageKeys,setPageKeys]=useState<string[]>([]);
  const searchState=useRef({q:"",kind:"app" as RecordKind,page:1});
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [conflict, setConflict] = useState(false);
  const [settingsConflict, setSettingsConflict] = useState(false);
  const [history, setHistory] = useState<Translation[] | null>(null);

  const fail = useCallback((caught: unknown) => {
    if (caught instanceof TranslationApiError && caught.status === 401) onAuthLost();
    setError(caught instanceof Error ? caught.message : "The request could not be completed.");
  }, [onAuthLost]);
  useEffect(() => {
    let active = true;
    request<Workspace>(`/api/admin/translations?${new URLSearchParams(initialDraft?{kind:initialDraft.kind,id:initialDraft.recordId}:{kind:"app",page:"1"})}`).then(next => {
      if (!active) return;
      setWorkspace(next); setPageKeys(next.records.map(recordKey)); setSettings(next.settings);
      setLocale(next.settings.locales.find(item => item.code !== (next.records[0]?recordSourceLocale(next.records[0]):next.settings.sourceLocale) && item.enabled)?.code
        ?? next.settings.locales.find(item => item.code !== (next.records[0]?recordSourceLocale(next.records[0]):next.settings.sourceLocale))?.code ?? "");
    }).catch(caught => { if (active) fail(caught); });
    return () => { active = false; };
  }, [fail]);
  useEffect(() => { onDirty(dirty || settingsDirty); }, [dirty, settingsDirty, onDirty]);
  useEffect(() => {
    if (!workspace || !initialDraft || appliedAiToken.current === initialDraft.token) return;
    appliedAiToken.current = initialDraft.token;
    const record = workspace.records.find(item => item.kind === initialDraft.kind && item.id === initialDraft.recordId);
    const translation = record ? workspace.translations.find(item => matches(item, record, initialDraft.locale)) : undefined;
    if (!record || initialDraft.locale === recordSourceLocale(record) || !workspace.settings.locales.some(item => item.code === initialDraft.locale)) {
      setError("The AI suggestion has no available translation target. No content was changed.");
    } else if (record.revision !== initialDraft.sourceRevision || (translation?.revision ?? 0) !== initialDraft.translationRevision) {
      setError("The source or translation changed after this AI suggestion was created. Review a new suggestion against the latest revision; nothing was applied.");
    } else {
      const base = makeDraft(record, initialDraft.locale, translation);
      const allowed = new Set((workspace.fieldMaps[recordKey(record)] ?? []).map(field => field.path));
      const fields = Object.fromEntries(Object.entries(initialDraft.patch.fields ?? {}).filter(([path, value]) => allowed.has(path) && typeof value === "string"));
      const suggestedSeo = initialDraft.patch.seo ?? {};
      const seo = { ...base.seo, ...(typeof suggestedSeo.title === "string" ? { title: suggestedSeo.title } : {}), ...(typeof suggestedSeo.description === "string" ? { description: suggestedSeo.description } : {}) };
      setSelectedKey(recordKey(record)); setKind(record.kind); setLocale(initialDraft.locale);
      setDraft({ ...base, fields: { ...base.fields, ...fields }, seo, status: "draft", publishAt: null, seoApproved: false });
      setDirty(true); setConflict(false); setHistory(null); setError("");
      setSuccess("AI suggestions were added to this unsaved translation draft. Review the source text and save explicitly; nothing has been published.");
    }
    onInitialDraftConsumed?.();
  }, [workspace, initialDraft, onInitialDraftConsumed]);

  const supportedUiPacks = new Set(workspace?.supportedLocales ?? ["tr", "en"]);
  const source = workspace?.records.find(record => recordKey(record) === selectedKey);
  const saved = source ? workspace?.translations.find(item => matches(item, source, locale)) : undefined;
  const sourceFields = workspace?.fieldMaps[selectedKey] ?? [];
  const language = workspace?.settings.locales.find(item => item.code === locale);
  const requiredFields = sourceFields.filter(field => field.value.trim());
  const completedCount = requiredFields.filter(field => draft?.fields[field.path]?.trim()).length;
  const complete = completedCount === requiredFields.length && requiredFields.length > 0;
  const stale = source ? isStale(saved, source) : false;
  const locales = workspace?.settings.locales ?? [];
  const records = workspace?.records.filter(record => {
    if (!pageKeys.includes(recordKey(record)) || recordSourceLocale(record)===locale) return false;
    const translation = workspace.translations.find(item => matches(item, record, locale));
    if (filter === "missing") return !translation;
    if (filter === "stale") return isStale(translation, record);
    if (filter === "published") return translation?.status === "published";
    return true;
  }) ?? [];
  function discardTranslation() {
    return !dirty || window.confirm(t("Discard unsaved translation changes?"));
  }
  function select(record: ManagedRecord, nextLocale = locale) {
    if (busy || !discardTranslation()) return;
    if(nextLocale===recordSourceLocale(record)||!nextLocale)nextLocale=workspace?.settings.locales.find(item=>item.enabled&&item.code!==recordSourceLocale(record))?.code||workspace?.settings.locales.find(item=>item.code!==recordSourceLocale(record))?.code||"";
    if(!nextLocale)return;
    const translation = workspace?.translations.find(item => matches(item, record, nextLocale));
    setSelectedKey(recordKey(record)); setLocale(nextLocale); setKind(record.kind);
    setDraft(makeDraft(record, nextLocale, translation)); setDirty(false);
    setConflict(false); setHistory(null); setError(""); setSuccess("");
  }
  function changeLocale(nextLocale: string) {
    if (source && nextLocale===recordSourceLocale(source)) {
      if(busy||!discardTranslation())return;
      setSelectedKey("");setDraft(null);setDirty(false);setLocale(nextLocale);setHistory(null);setError("");setSuccess("");
    } else if (source) select(source, nextLocale);
    else { setLocale(nextLocale); setError(""); setSuccess(""); }
  }
  function update(patch: Partial<Translation>) {
    setDraft(previous => previous ? { ...previous, ...patch } : previous);
    setDirty(true); setSuccess("");
  }
  function working(value: boolean) { setBusy(value); onBusy(value); }
  function pageUrl(state=searchState.current) {
    return `/api/admin/translations?${new URLSearchParams({q:state.q,kind:state.kind,page:String(state.page)})}`;
  }
  async function loadPage(nextKind=kind,page=1) {
    if(busy)return;
    working(true);setError("");
    const nextSearch={q:query,kind:nextKind,page};
    try {
      const next=await request<Workspace>(pageUrl(nextSearch));
      searchState.current=nextSearch;setKind(nextKind);setPageKeys(next.records.map(recordKey));
      // Keep the active unsaved editor while browsing a different result page.
      setWorkspace(previous=>{
        const selected=previous?.records.find(item=>recordKey(item)===selectedKey);
        if(!selected)return next;
        return {...next,records:[...next.records.filter(item=>recordKey(item)!==selectedKey),selected],fieldMaps:{...next.fieldMaps,[selectedKey]:previous?.fieldMaps[selectedKey]??[]},translations:[...next.translations.filter(item=>recordKey(item)!==selectedKey),...(previous?.translations.filter(item=>recordKey(item)===selectedKey)??[])]};
      });
    }catch(caught){fail(caught);}finally{working(false);}
  }
  async function refresh() {
    if (busy || ((dirty || settingsDirty) && !window.confirm(t("Reload the latest data and discard unsaved translation and language setting changes?")))) return;
    working(true); setError(""); setSuccess("");
    try {
      let next = await request<Workspace>(pageUrl());
      setPageKeys(next.records.map(recordKey));
      if(draft&&!next.records.some(item=>recordKey(item)===selectedKey)){
        const selected=await request<Workspace>(`/api/admin/translations?${new URLSearchParams({kind:draft.kind,id:draft.id})}`);
        next={...next,records:[...next.records,...selected.records],translations:[...next.translations,...selected.translations],fieldMaps:{...next.fieldMaps,...selected.fieldMaps}};
      }
      setWorkspace(next); setSettings(next.settings); setSettingsDirty(false); setSettingsConflict(false);
      const nextSourceLocale=next.records.find(record=>recordKey(record)===selectedKey)?.sourceLocale||"tr";
      const nextLocale = next.settings.locales.some(item => item.code === locale && item.code !== nextSourceLocale)
        ? locale : next.settings.locales.find(item => item.code !== nextSourceLocale)?.code ?? "";
      setLocale(nextLocale);
      const nextSource = next.records.find(record => recordKey(record) === selectedKey);
      setDraft(nextSource ? makeDraft(nextSource, nextLocale, next.translations.find(item => matches(item, nextSource, nextLocale))) : null);
      if (!nextSource) setSelectedKey("");
      setDirty(false); setConflict(false); setHistory(null); setSuccess("Latest source records and translations loaded.");
    } catch (caught) { fail(caught); } finally { working(false); }
  }
  function acceptTranslation(translation: Translation) {
    setWorkspace(previous => previous ? { ...previous, translations: [
      ...previous.translations.filter(item => !(item.kind === translation.kind && item.id === translation.id && item.locale === translation.locale)), translation,
    ] } : previous);
    if (source) setDraft(makeDraft(source, locale, translation));
    setDirty(false); setConflict(false); setHistory(null);
  }
  async function save() {
    if (!source || !draft || busy) return;
    setError(""); setSuccess("");
    if (["published", "scheduled"].includes(draft.status) && !complete) {
      setError("Complete every translation field that has source text before publishing. You can save an incomplete translation as a draft."); return;
    }
    working(true);
    try {
      const result = await request<{ translation: Translation }>("/api/admin/translations", {
        ...draft, sourceRevision: source.revision,
        publishAt: draft.status === "scheduled" ? draft.publishAt : null,
        fields: Object.fromEntries(sourceFields.map(field => [field.path, draft.fields[field.path] ?? ""])),
      });
      acceptTranslation(result.translation);
      setSuccess(t("Translation saved · {p0} · {p1} · Revision {p2}{p3}",{p0:language?.label ?? locale,p1:t(STATUS_LABELS[result.translation.status]),p2:result.translation.revision,p3:draft.seoApproved && !result.translation.seoApproved ? ". The content changed, so SEO approval was reset. Review the saved text, check the approval box again, and save." : ""}));
    } catch (caught) {
      if (caught instanceof TranslationApiError && caught.status === 409 && !/dil adresi|adres.*başka|slug/i.test(caught.message)) {
        setConflict(true);
        setError("The source or translation changed in another session. Your edits are preserved. Copy your changes before reloading the latest data.");
      } else fail(caught);
    } finally { working(false); }
  }
  async function saveSettings() {
    if (!settings || busy) return;
    working(true); setError(""); setSuccess("");
    try {
      const result = await request<{ settings: LocaleSettings }>("/api/admin/localization", settings);
      setSettings(result.settings); setSettingsDirty(false); setSettingsConflict(false);
      setWorkspace(previous => previous ? { ...previous, settings: result.settings } : previous);
      setSuccess("Language settings saved. Translation publishing is managed separately.");
    } catch (caught) {
      if (caught instanceof TranslationApiError && caught.status === 409) {
        setSettingsConflict(true); setError("Language settings changed in another session. Your edits are preserved; reload the latest data before editing again.");
      } else fail(caught);
    } finally { working(false); }
  }
  function updateHomepageSeo(code: string, key: "title" | "description", value: string) {
    setSettings(previous => previous ? {
      ...previous,
      homeSeo: {
        ...previous.homeSeo,
        [code]: { title: "", description: "", ...previous.homeSeo?.[code], [key]: value },
      },
    } : previous);
    setSettingsDirty(true); setSuccess("");
  }
  async function loadHistory() {
    if (!draft || busy) return;
    working(true); setError("");
    try {
      const params = new URLSearchParams({ kind: draft.kind, id: draft.id, locale: draft.locale });
      const result = await request<{ revisions: Translation[] }>(`/api/admin/translations/history?${params}`);
      setHistory(result.revisions);
    } catch (caught) { fail(caught); } finally { working(false); }
  }
  async function restore(revision: number) {
    if (!draft || busy || !window.confirm(t("Restore translation revision {p0}? Unsaved edits will be replaced. Review the restored text and SEO approval again.",{p0:revision}))) return;
    working(true); setError(""); setSuccess("");
    try {
      const result = await request<{ translation: Translation }>("/api/admin/translations/restore", { kind: draft.kind, id: draft.id, locale: draft.locale, revision });
      acceptTranslation(result.translation);
      setSuccess(t("Translation revision {p0} restored. Current status: {p1}. Review publishing and SEO approval again.",{p0:revision,p1:t(STATUS_LABELS[result.translation.status])}));
    } catch (caught) { fail(caught); } finally { working(false); }
  }

  return <div className={ui.workspace} aria-busy={busy} lang={adminLocale}>
    <div className={ui.heading}>
      <div><span className="admin-kicker">{t("Content and search visibility for each language")}</span><h2>{t("Languages and translations")}</h2></div>
      <button type="button" className="admin-button" disabled={busy} onClick={() => void refresh()}><RefreshCw size={15} />{t("Reload latest data")}</button>
    </div>
    <p className={ui.note}>{t("Edit source content and translations field by field. Each translation has its own address, publishing status, and SEO approval. Store identities and numeric facts remain tied to the source record.")}</p>
    {error && <p className="admin-error" role="alert">{t(error)}</p>}
    {success && <p className="admin-success" role="status">{t(success)}</p>}
    {(conflict || settingsConflict) && <div className={ui.warning}><p>{t("Resolve the conflict before saving this record. Your form contents are still here.")}</p><button type="button" className="admin-button" disabled={busy} onClick={() => void refresh()}>{t("Load current revision")}</button></div>}
    {!workspace || !settings ? <p className={ui.note}>{error ? t("Data could not be loaded. Use the reload button above to try again.") : t("Loading languages and translations…")}</p> : <>
      <details className={`admin-panel ${ui.settings}`}>
        <summary>{t("Site languages")}<span className="admin-badge">{settings.locales.filter(item => item.enabled).length}{" "}{t("enabled")}</span></summary>
        <p className={ui.note}>{t("Default language for new source records:")}<strong>{settings.locales.find(item => item.code === settings.sourceLocale)?.label ?? settings.sourceLocale}</strong>{t(". Existing records keep their own source language. Selecting a default visitor language does not rewrite records or publish translations.")}</p>
        <form onSubmit={event => { event.preventDefault(); void saveSettings(); }}>
          <label className="admin-field"><span>{t("Default language for new source records:")}</span><select value={settings.sourceLocale} disabled={busy} onChange={event=>{setSettings(previous=>previous?{...previous,sourceLocale:event.target.value}:previous);setSettingsDirty(true);setSuccess("");}}>{settings.locales.filter(item=>item.enabled&&supportedUiPacks.has(item.code)).map(item=><option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
          <label className="admin-field"><span>{t("Default visitor language")}</span><select value={settings.defaultLocale} disabled={busy} onChange={event => {
            setSettings(previous => previous ? { ...previous, defaultLocale: event.target.value } : previous);
            setSettingsDirty(true); setSuccess("");
          }}>{settings.locales.filter(item => item.enabled && supportedUiPacks.has(item.code)).map(item => <option key={item.code} value={item.code}>{item.label}</option>)}</select><small>{t("English is the default for new installations. Language-specific addresses and existing source content stay separate.")}</small></label>
          <fieldset disabled={busy}><legend>{t("Installed language packs")}</legend>
            {settings.locales.map(item => <label className="admin-check-row" key={item.code}>
              <input type="checkbox" checked={item.enabled} disabled={item.code === settings.defaultLocale || item.code === settings.sourceLocale || !supportedUiPacks.has(item.code)} onChange={event => {
                const enabled = event.target.checked;
                setSettings(previous => previous ? { ...previous, locales: previous.locales.map(value => value.code === item.code ? { ...value, enabled } : value) } : previous);
                setSettingsDirty(true); setSuccess("");
              }} />{item.label} <span className="admin-badge">{item.code}</span>{item.code === settings.sourceLocale && t(" · Source language")}{!supportedUiPacks.has(item.code) && t(" · UI language pack required")}
            </label>)}
          </fieldset>
          <p className={ui.note}>{t("Disabling a language preserves its translations and removes its pages and language links from the public site.")}</p>
          <div><h3>{t("Homepage SEO by language")}</h3><p className={ui.note}>{t("Set the homepage search title and description for each language. Leave a field blank to use its localized default. Saving these fields does not enable a language or change the default visitor language.")}</p></div>
          {settings.locales.map(item => <fieldset className={ui.homeSeo} key={item.code} disabled={busy}>
            <legend>{item.label} <span className="admin-badge">{item.code}</span>{!item.enabled && t(" · Disabled")}</legend>
            <label className="admin-field"><span>{item.label}{" "}{t("homepage SEO title")}</span><input lang={item.code} maxLength={160} value={settings.homeSeo?.[item.code]?.title ?? ""} onChange={event => updateHomepageSeo(item.code, "title", event.target.value)} /><small>{t("Optional · up to 160 characters")}</small></label>
            <label className="admin-field"><span>{item.label}{" "}{t("homepage SEO description")}</span><textarea lang={item.code} rows={3} maxLength={500} value={settings.homeSeo?.[item.code]?.description ?? ""} onChange={event => updateHomepageSeo(item.code, "description", event.target.value)} /><small>{t("Optional · up to 500 characters")}</small></label>
          </fieldset>)}
          <div><button className="admin-button primary" disabled={busy || !settingsDirty || settingsConflict}>{t("Save language settings")}</button></div>
        </form>
      </details>
      {!locales.length ? <section className="admin-panel"><p className={ui.empty}>{t("No translation language is registered yet.")}</p></section> : <div className={ui.layout}>
        <aside className={`admin-panel ${ui.sidebar}`} aria-label={t("Content to translate")}>
          <label className="admin-field"><span>{t("Translation language")}</span><select value={locale} disabled={busy} onChange={event => changeLocale(event.target.value)}>{locales.map(item => <option key={item.code} value={item.code}>{item.label}{item.enabled ? "" : t(" · Disabled")}</option>)}</select></label>
          <label className="admin-field"><span>{t("Content type")}</span><select value={kind} disabled={busy} onChange={event => void loadPage(event.target.value as RecordKind,1)}>{Object.entries(KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}</select></label>
          <label className="admin-field"><span>{t("Find content")}</span><input type="search" value={query} disabled={busy} onChange={event => setQuery(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();void loadPage();}}} /></label>
          <button type="button" className="admin-button" disabled={busy} onClick={()=>void loadPage()}>{t("Search")}</button>
          <p className={ui.note}>{t("Translation status filters apply to the current page. Search covers the full catalog.")}</p>
          <label className="admin-field"><span>{t("Translation status")}</span><select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">{t("All")}</option><option value="missing">{t("Missing translations")}</option><option value="stale">{t("Source changed")}</option><option value="published">{t("Published")}</option></select></label>
          {workspace.pagination&&<nav aria-label={t("Catalog pages")}><p>{t("Page {page} of {pages} · {total} records",{page:workspace.pagination.page,pages:workspace.pagination.pages,total:workspace.pagination.total})}</p><button type="button" className="admin-button" disabled={busy||workspace.pagination.page<=1} onClick={()=>void loadPage(kind,workspace.pagination!.page-1)}>{t("Previous page")}</button><button type="button" className="admin-button" disabled={busy||workspace.pagination.page>=workspace.pagination.pages} onClick={()=>void loadPage(kind,workspace.pagination!.page+1)}>{t("Next page")}</button></nav>}
          <div className={ui.recordList}>{records.map(record => {
            const translation = workspace.translations.find(item => matches(item, record, locale));
            return <button type="button" className={ui.record} key={recordKey(record)} aria-pressed={selectedKey === recordKey(record)} disabled={busy} onClick={() => select(record)}><strong>{recordTitle(record)}</strong><span>{translation ? `${t(STATUS_LABELS[translation.status])} · v${translation.revision}` : t("No translation")}{isStale(translation, record) ? t(" · Source changed") : ""}</span></button>;
          })}{!records.length && <p className={ui.note}>{t("No content matches these filters.")}</p>}</div>
        </aside>
        {!source || !draft ? <section className="admin-panel"><Languages size={26} aria-hidden="true" /><h3>{t("Select content")}</h3><p className={ui.note}>{t("The source and")}{" "}{language?.label ?? locale}{" "}{t("translation will appear here side by side. New translations start as drafts.")}</p></section> : <section className={`admin-panel ${ui.editor}`}>
          <div><div className={ui.editorHeading}><h3>{recordTitle(source)}</h3><span className="admin-badge">{language?.label ?? locale}</span></div>
            <div className={ui.version}><span className="admin-badge">{t("Source revision")}{" "}{source.revision}</span><span className="admin-badge">{saved ? t("Translation revision {p0} · Source reference {p1}",{p0:saved.revision,p1:saved.sourceRevision}) : t("New translation")}</span>{dirty && <span className="admin-badge warning">{t("Unsaved changes")}</span>}</div>
          </div>
          {stale && <div className={ui.warning}>{t("The source content changed after this translation. Compare each field with the current source and save again. Stale translations are excluded from indexing until reviewed again.")}</div>}
          {!language?.enabled && <div className={ui.warning}>{t("This language is disabled. You can save translations, but visitors cannot access them until the language is enabled.")}</div>}
          <form onSubmit={event => { event.preventDefault(); void save(); }}>
            <fieldset disabled={busy} className={ui.fields}>
              <fieldset><legend>{t("Translation fields ·")}{" "}{completedCount}{" "}{t("/")}{" "}{requiredFields.length}{" "}{t("completed")}</legend>
                {sourceFields.map((field, index) => {
                  const fieldId = `${formId}-field-${index}`;
                  const label = fieldLabel(field,t);
                  const multiline = field.value.length > 140 || /description|paragraph|summary|reason|method|notes/i.test(field.path);
                  return <div className={ui.fieldPair} key={field.path}>
                    <div className={ui.source}><span id={`${fieldId}-source-label`}>{t(label)}{" "}{t("· Source")}</span><p id={`${fieldId}-source`} lang={source?recordSourceLocale(source):"tr"}>{field.value || t("This source field is empty.")}</p></div>
                    <label className="admin-field" htmlFor={fieldId}><span>{t(label)}{" "}{t("·")}{" "}{language?.label ?? locale}</span>
                      {multiline ? <textarea id={fieldId} lang={locale} rows={Math.min(8, Math.max(3, Math.ceil(field.value.length / 100)))} aria-describedby={`${fieldId}-source-label ${fieldId}-source`} value={draft.fields[field.path] ?? ""} onChange={event => update({ fields: { ...draft.fields, [field.path]: event.target.value } })} />
                        : <input id={fieldId} lang={locale} aria-describedby={`${fieldId}-source-label ${fieldId}-source`} value={draft.fields[field.path] ?? ""} onChange={event => update({ fields: { ...draft.fields, [field.path]: event.target.value } })} />}
                    </label>
                  </div>;
                })}
                {!sourceFields.length && <p className={ui.note}>{t("This record has no translatable fields.")}</p>}
              </fieldset>
              <fieldset><legend>{t("Address and search result")}</legend><div className={ui.metaGrid}>
                <label className={`admin-field ${ui.full}`}><span>{t("Localized address segment (slug)")}</span><input required maxLength={120} value={draft.slug} onChange={event => update({ slug: event.target.value })} autoCapitalize="none" spellCheck={false} /><small>{t("Use lowercase letters, numbers, and hyphens between words. Do not include a full URL or language prefix. Consider existing links before changing a published address.")}</small></label>
                <label className={`admin-field ${ui.full}`}><span>{t("SEO title ·")}{" "}{language?.label ?? locale}</span><input lang={locale} maxLength={160} value={draft.seo.title ?? ""} onChange={event => update({ seo: { ...draft.seo, title: event.target.value } })} /><small>{Array.from(draft.seo.title ?? "").length}{" "}{t("characters · Leave blank to use the translated content title.")}</small></label>
                <label className={`admin-field ${ui.full}`}><span>{t("SEO description ·")}{" "}{language?.label ?? locale}</span><textarea lang={locale} rows={3} maxLength={400} value={draft.seo.description ?? ""} onChange={event => update({ seo: { ...draft.seo, description: event.target.value } })} /><small>{Array.from(draft.seo.description ?? "").length}{" "}{t("characters · Leave blank to use the translated summary.")}</small></label>
              </div><label className="admin-check-row"><input type="checkbox" checked={!!draft.seo.noindex} onChange={event => update({ seo: { ...draft.seo, noindex: event.target.checked } })} />{t("Exclude this translation from search engine indexing (noindex)")}</label>
                <div className={ui.snippet} lang={locale}><small>{language?.label ?? locale}{" "}{t("·")}{" "}{draft.slug}</small><strong>{draft.seo.title || draft.fields[source.kind === "app" ? "name" : "title"] || t("Translated title")}</strong><p>{draft.seo.description || draft.fields[source.kind === "app" ? "tagline" : "summary"] || t("Translated description")}</p></div>
                <p className={ui.note}>{t("This is a preview. Search engines may rewrite the title and description.")}</p>
              </fieldset>
              <fieldset><legend>{t("Publishing and editorial review")}</legend><div className={ui.metaGrid}>
                <label className="admin-field"><span>{t("Translation publication status")}</span><select value={draft.status} onChange={event => update({ status: event.target.value as Translation["status"] })}>{(["draft", "published", "scheduled", "archived"] as const).map(value => <option key={value} value={value}>{t(STATUS_LABELS[value])}</option>)}</select></label>
                {draft.status === "scheduled" && <label className="admin-field"><span>{t("Translation publication time")}</span><input type="datetime-local" required value={localDateTime(draft.publishAt)} onChange={event => update({ publishAt: event.target.value ? new Date(event.target.value).toISOString() : null })} /><small>{t("Uses your browser’s local time; the saved value preserves the time zone.")}</small></label>}
                <label className={`admin-field ${ui.full}`}><span>{t("Translation review note")}</span><textarea rows={3} value={draft.reviewNote} onChange={event => update({ reviewNote: event.target.value })} /></label>
              </div><label className="admin-check-row"><input type="checkbox" checked={draft.seoApproved} onChange={event => update({ seoApproved: event.target.checked })} />{t("I reviewed the translation, current source content, and SEO fields for this language.")}</label>
                <p className={ui.note}>{t("Source status:")}{" "}{t(STATUS_LABELS[source.status])}{" "}{t(". Search visibility depends on source eligibility, site SEO settings, an enabled language, complete translation, and editorial approval. Save changes to text, addresses, or SEO fields first, then approve the saved version separately.")}</p>
              </fieldset>
              <div className={ui.actions}><button className="admin-button primary" disabled={conflict || !sourceFields.length || (!dirty && !!saved && !stale)}><Save size={15} />{t("Save translation")}</button><button type="button" className="admin-button" disabled={!saved} onClick={() => void loadHistory()}><History size={15} />{t("Translation history")}</button></div>
            </fieldset>
          </form>
          {history && <section className={ui.history} aria-label={t("Translation history")}><h3>{t("Previous translation revisions")}</h3>{history.length ? history.map(item => <div className={ui.historyItem} key={item.revision}><div><strong>{t("Revision")}{" "}{item.revision}{" "}{t("·")}{" "}{t(STATUS_LABELS[item.status])}</strong><p>{item.updatedAt ? new Date(item.updatedAt).toLocaleString(intlLocale) : t("No date")}{" "}{t("· Source revision")}{" "}{item.sourceRevision}</p>{item.reviewNote && <p>{item.reviewNote}</p>}</div><button type="button" className="admin-button" disabled={busy || item.revision === saved?.revision || conflict} onClick={() => void restore(item.revision)}><RotateCcw size={14} />{t("Restore revision")}{" "}{item.revision}</button></div>) : <p className={ui.note}>{t("No previous revision is available.")}</p>}</section>}
        </section>}
      </div>}
    </>}
  </div>;
}
