"use client";
import {localeRegistry} from "@/lib/i18n-registry";
import {useI18n} from "@/lib/i18n";
import { useCallback, useEffect, useRef, useState } from "react";
import { History, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import type { ManagedRecord } from "@/lib/domain";
import ui from "./GrowthWorkspace.module.css";

type Kind = "intent" | "comparison" | "alternatives" | "author" | "test";
type Status = "draft" | "review" | "published" | "archived";
type Evidence = { performedAt: string; method: string; environment: string; observations: string; limitations: string };
type GrowthDocument = {
  id: string; kind: Kind; locale: string; slug: string; revision: number; status: Status;
  seoApproved: boolean; title: string; summary: string; topic: string; intent: string;
  authorId: string; appIds: string[]; sections: { heading: string; paragraphs: string[] }[];
  sources: { title: string; url: string; checkedAt: string }[];
  links: { kind: "app" | "growth"; id: string; label: string }[];
  seo: { title: string; description: string; noindex: boolean }; test: Evidence | null;
  reviewNote: string; updatedAt?: string; stale?: boolean; path?: string;
};
type Insights = {
  topicMap: Record<string, string[]>;
  warnings: { code: string; id?: string; locale?: string; key?: string; ids?: string[]; message: string }[];
  edges: { from: string; to: string; label: string }[];
  orphans: { id: string; locale: string; title: string }[];
  recommendations: { from: string; to: string; locale: string; reason: string }[];
  scope: string;
};
type Lifecycle = { revision: number; rules: { from: string; to: string; status: 301 | 410; reason: string }[] };
type GscImport = {
  property: string; startDate: string; endDate: string; importedAt: string; source: string;
  rows: { query: string; page: string; clicks: number; impressions: number; ctr: number; position: number | null; opportunity: string }[];
};
type Workspace = { documents: GrowthDocument[]; insights: Insights; lifecycle: Lifecycle; gsc: { imports: GscImport[] }; kinds: Kind[] };
type Props = { records: ManagedRecord[]; onDirty: (value: boolean) => void; onBusy: (value: boolean) => void; onAuthLost: () => void };
const kinds: Record<Kind, string> = { intent: "Topic and intent page", comparison: "App comparison", alternatives: "App alternatives", author: "Author profile", test: "Hands-on test" };
const statuses: Record<Status, string> = { draft: "Draft", review: "In review", published: "Published", archived: "Archived" };
const today = () => new Date().toISOString().slice(0, 10);
const emptyDocument = (): GrowthDocument => ({ id: "", kind: "intent", locale: "en", slug: "", revision: 0, status: "draft", seoApproved: false, title: "", summary: "", topic: "", intent: "", authorId: "", appIds: [], sections: [], sources: [], links: [], seo: { title: "", description: "", noindex: false }, test: null, reviewNote: "" });
const name = (record: ManagedRecord) => "name" in record.data ? record.data.name : record.data.title;
class GrowthError extends Error { constructor(message: string, public status: number) { super(message); } }
async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/admin/growth${path}`, { method: body === undefined ? "GET" : "POST", credentials: "same-origin", cache: "no-store", headers: body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json().catch(() => ({ error: "The server response could not be read." }));
  if (!response.ok) throw new GrowthError(data.error || `Request failed (${response.status}).`, response.status);
  return data as T;
}

export default function GrowthWorkspace({ records, onDirty, onBusy, onAuthLost }: Props) {
 const {t,intlLocale}=useI18n();

  const [state, setState] = useState<Workspace | null>(null);
  const [view, setView] = useState("content");
  const [draft, setDraft] = useState<GrowthDocument | null>(null);
  const [dirty, setDirty] = useState(false);
  const [rules, setRules] = useState<Lifecycle | null>(null);
  const [rulesDirty, setRulesDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [conflict, setConflict] = useState(false);
  const [rulesConflict, setRulesConflict] = useState(false);
  const [history, setHistory] = useState<GrowthDocument[] | null>(null);
  const [query, setQuery] = useState("");
  const [appQuery, setAppQuery] = useState("");
  const [csv, setCsv] = useState("");
  const [property, setProperty] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [importIndex, setImportIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const fileRead = useRef(0);
  const fail = useCallback((caught: unknown) => {
    if (caught instanceof GrowthError && caught.status === 401) onAuthLost();
    setError(caught instanceof Error ? caught.message : "The request could not be completed.");
  }, [onAuthLost]);
  useEffect(() => {
    let active = true;
    request<Workspace>("").then(next => { if (active) { setState(next); setRules(next.lifecycle); } }).catch(caught => { if (active) fail(caught); });
    return () => { active = false; fileRead.current++; };
  }, [fail]);
  useEffect(() => { onDirty(dirty || rulesDirty || !!csv); }, [dirty, rulesDirty, csv, onDirty]);
  const apps = records.filter(record => record.kind === "app");
  const currentImport = state?.gsc.imports[importIndex];
  const working = (value: boolean) => { setBusy(value); onBusy(value); };
  function edit(document: GrowthDocument | null) {
    if (busy || (dirty && !window.confirm(t("Discard unsaved document changes?")))) return;
    setDraft(document ? structuredClone(document) : emptyDocument()); setDirty(false); setConflict(false); setHistory(null); setError(""); setSuccess("");
  }
  function patch(values: Partial<GrowthDocument>) { setDraft(previous => previous ? { ...previous, ...values } : previous); setDirty(true); setSuccess(""); }
  async function run(action: () => Promise<void>) {
    if (busy) return; working(true); setError(""); setSuccess("");
    try { await action(); } catch (caught) { fail(caught); } finally { working(false); }
  }
  async function reload() {
    if ((dirty || rulesDirty || csv) && !window.confirm(t("Reload current data and discard unsaved document, redirect, and CSV changes?"))) return;
    await run(async () => {
      const next = await request<Workspace>(""); setState(next); setRules(next.lifecycle);
      setDraft(previous => previous ? next.documents.find(item => item.id === previous.id && item.locale === previous.locale) ?? null : null);
      setDirty(false); setRulesDirty(false); setCsv(""); setConflict(false); setRulesConflict(false); setHistory(null); setImportIndex(0); setPageIndex(0); setSuccess("Current growth data loaded.");
    });
  }
  async function acceptDocument(document: GrowthDocument, message: string) {
    setDraft(document); setDirty(false); setConflict(false); setHistory(null);
    setState(previous => previous ? { ...previous, documents: [...previous.documents.filter(item => item.id !== document.id || item.locale !== document.locale), document] } : previous);
    setSuccess(message);
    try { const insights = await request<Insights>("/insights"); setState(previous => previous ? { ...previous, insights } : previous); } catch { setSuccess(t("{p0} Reload to refresh editorial insights.",{p0:message})); }
  }
  async function saveDocument() {
    if (!draft) return;
    await run(async () => {
      try {
        const { document } = await request<{ document: GrowthDocument }>("", draft);
        await acceptDocument(document, t("Document saved · {p0} · Revision {p1}{p2}",{p0:t(statuses[document.status]),p1:document.revision,p2:draft.seoApproved && !document.seoApproved ? ". Content changed; review the saved version and approve SEO separately." : ""}));
      } catch (caught) {
        if (caught instanceof GrowthError && caught.status === 409 && !/slug/i.test(caught.message)) { setConflict(true); throw new Error("The document changed in another session. Your edits are preserved. Copy them before reloading the current revision."); }
        throw caught;
      }
    });
  }
  async function restore(revision: number) {
    if (!draft || !window.confirm(t("Restore revision {p0} as a new draft? Unsaved changes will be replaced.",{p0:revision}))) return;
    await run(async () => { const { document } = await request<{ document: GrowthDocument }>("/restore", { id: draft.id, locale: draft.locale, revision }); await acceptDocument(document, t("Revision {p0} restored as a draft. Review current sources before publishing.",{p0:revision})); });
  }
  async function saveRules() {
    if (!rules) return;
    await run(async () => {
      try { const { lifecycle } = await request<{ lifecycle: Lifecycle }>("/lifecycle", rules); setRules(lifecycle); setRulesDirty(false); setRulesConflict(false); setState(previous => previous ? { ...previous, lifecycle } : previous); setSuccess("URL lifecycle rules saved."); }
      catch (caught) { if (caught instanceof GrowthError && caught.status === 409) setRulesConflict(true); throw caught; }
    });
  }
  function changeRule(index: number, value: Partial<Lifecycle["rules"][number]>) { setRules(previous => previous ? { ...previous, rules: previous.rules.map((rule, i) => i === index ? { ...rule, ...value } : rule) } : previous); setRulesDirty(true); setSuccess(""); }
  async function loadCsv(file?: File) {
    if (!file || busy) return;
    const token = ++fileRead.current;
    if (file.size > 1000000) { setError("The CSV file must be 1 MB or smaller."); return; }
    working(true); setError("");
    try { const text = await file.text(); if (token === fileRead.current) { setCsv(text); setSuccess("CSV loaded locally. Review its property and date range before importing."); } }
    catch (caught) { fail(caught); } finally { working(false); }
  }
  function insightName(id: string, locale?: string) { return state?.documents.find(item => item.id === id && (!locale || item.locale === locale))?.title || id; }

  return <div className={ui.workspace} lang="en" aria-busy={busy}>
    <div className={ui.heading}><div><span className="admin-kicker">{t("Editorial growth and search evidence")}</span><h2>{t("Content growth")}</h2></div><button type="button" className="admin-button" disabled={busy} onClick={() => void reload()}><RefreshCw size={15} />{t("Reload current data")}</button></div>
    <p className={ui.note}>{t("Build useful topic pages, comparisons, author profiles, and documented tests. Suggestions come from your editorial records and imported search data; they do not predict rankings.")}</p>
    {error && <p className="admin-error" role="alert">{t(error)}</p>}{success && <p className="admin-success" role="status">{t(success)}</p>}
    {(conflict || rulesConflict) && <div className={ui.warning}>{t("Resolve the revision conflict before saving. Your form data is preserved.")}<button className="admin-button" type="button" disabled={busy} onClick={() => void reload()}>{t("Reload current revision")}</button></div>}
    <nav className={ui.nav} aria-label={t("Growth tools")}>{[["content", "Editorial pages"], ["insights", "Topics and links"], ["lifecycle", "URL lifecycle"], ["search", "Search Console data"]].map(([id, label]) => <button type="button" className="admin-button" key={id} aria-pressed={view === id} onClick={() => setView(id)} disabled={busy}>{t(label)}</button>)}</nav>
    {!state ? <p className={ui.note}>{error ? t("Use reload to try again.") : t("Loading growth workspace…")}</p> : <>
      {view === "content" && <div className={ui.layout}>
        <aside className={`admin-panel ${ui.sidebar}`}><button type="button" className="admin-button primary" disabled={busy} onClick={() => edit(null)}><Plus size={15} />{t("New editorial page")}</button><label className="admin-field"><span>{t("Find editorial content")}</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label><div className={ui.records}>{state.documents.filter(item => `${item.title} ${item.id} ${item.locale}`.toLowerCase().includes(query.toLowerCase())).map(item => <button type="button" key={`${item.id}:${item.locale}`} disabled={busy} aria-pressed={draft?.id === item.id && draft.locale === item.locale} onClick={() => edit(item)}><strong>{item.title}</strong><small>{t(kinds[item.kind])}{" "}{t("·")}{" "}{item.locale.toUpperCase()}{" "}{t("·")}{" "}{t(statuses[item.status])}{" "}{item.stale ? t(" · Sources changed") : ""}</small></button>)}{!state.documents.length && <p className={ui.note}>{t("No editorial pages yet. Start with a real question your readers need answered.")}</p>}</div></aside>
        {!draft ? <section className="admin-panel"><h3>{t("Select or create a page")}</h3><p className={ui.note}>{t("Content is stored as a draft until you choose to publish it. SEO approval follows a review of the saved version.")}</p></section> : <section className={`admin-panel ${ui.form}`}>
          <div className={ui.row}><h3>{draft.title || t("New editorial page")}</h3><span className="admin-badge">{dirty ? t("Unsaved changes") : t("Revision {p0}",{p0:draft.revision})}</span></div>
          {draft.stale && <p className={ui.warning}>{t("Linked app data changed. Review claims and sources, save the updated content, and renew SEO approval.")}</p>}
          <form onSubmit={event => { event.preventDefault(); void saveDocument(); }}><fieldset disabled={busy} className={ui.fields}>
            <div className={ui.grid}>
              <label className="admin-field"><span>{t("Stable page identifier")}</span><input required pattern="[a-z0-9][a-z0-9-]{0,119}" maxLength={120} readOnly={draft.revision > 0} value={draft.id} onChange={event => patch({ id: event.target.value })} /><small>{t("Lowercase letters, numbers, and hyphens. The same ID joins language variants.")}</small></label>
              <label className="admin-field"><span>{t("Content language")}</span><select disabled={draft.revision > 0} value={draft.locale} onChange={event => patch({ locale: event.target.value, authorId: "", links: draft.links.filter(link => link.kind === "app") })}>{Object.values(localeRegistry).map(pack=><option key={pack.locale} value={pack.locale}>{pack.label}</option>)}</select></label>
              <label className="admin-field"><span>{t("Page kind")}</span><select value={draft.kind} disabled={draft.revision > 0} onChange={event => patch({ kind: event.target.value as Kind, test: null })}>{Object.entries(kinds).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}</select></label>
              <label className="admin-field"><span>{t("Localized slug")}</span><input required pattern="[a-z0-9][a-z0-9-]{0,119}" maxLength={120} value={draft.slug} onChange={event => patch({ slug: event.target.value })} /></label>
              <label className={`admin-field ${ui.full}`}><span>{t("Page title")}</span><input required maxLength={180} lang={draft.locale} value={draft.title} onChange={event => patch({ title: event.target.value })} /></label>
              <label className={`admin-field ${ui.full}`}><span>{t("Page summary")}</span><textarea rows={3} maxLength={600} lang={draft.locale} value={draft.summary} onChange={event => patch({ summary: event.target.value })} /></label>
              <label className="admin-field"><span>{t("Topic")}</span><input maxLength={120} lang={draft.locale} value={draft.topic} onChange={event => patch({ topic: event.target.value })} /></label>
              <label className="admin-field"><span>{t("Reader intent")}</span><input maxLength={240} lang={draft.locale} value={draft.intent} onChange={event => patch({ intent: event.target.value })} /><small>{t("The question or task this page helps a reader complete.")}</small></label>
              <label className="admin-field"><span>{t("Author profile")}</span><select value={draft.authorId} onChange={event => patch({ authorId: event.target.value })}><option value="">{t("No author selected")}</option>{state.documents.filter(item => item.kind === "author" && item.locale === draft.locale && item.id !== draft.id).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select><small>{t("Create a profile in this language before assigning an author.")}</small></label>
            </div>
            <fieldset className={ui.repeater}><legend>{t("Content sections")}</legend>{draft.sections.map((section, index) => <div className={ui.item} key={index}><div className={ui.row}><h4>{t("Section")}{" "}{index + 1}</h4><button type="button" className="admin-button subtle" onClick={() => patch({ sections: draft.sections.filter((_, i) => i !== index) })} aria-label={t("Remove section {p0}",{p0:index + 1})}><Trash2 size={14} />{t("Remove")}</button></div><label className="admin-field"><span>{t("Section")}{" "}{index + 1}{" "}{t("heading")}</span><input required maxLength={180} lang={draft.locale} value={section.heading} onChange={event => patch({ sections: draft.sections.map((item, i) => i === index ? { ...item, heading: event.target.value } : item) })} /></label><label className="admin-field"><span>{t("Section")}{" "}{index + 1}{" "}{t("paragraphs")}</span><textarea rows={6} lang={draft.locale} value={section.paragraphs.join("\n\n")} onChange={event => patch({ sections: draft.sections.map((item, i) => i === index ? { ...item, paragraphs: event.target.value ? event.target.value.split(/\n\s*\n/) : [] } : item) })} /><small>{t("Separate paragraphs with a blank line. Plain text only; up to eight paragraphs per section.")}</small></label></div>)}<div><button type="button" className="admin-button" disabled={draft.sections.length >= 12} onClick={() => patch({ sections: [...draft.sections, { heading: "", paragraphs: [] }] })}><Plus size={14} />{t("Add section")}</button></div></fieldset>
            <fieldset className={ui.repeater}><legend>{t("Referenced apps ·")}{" "}{draft.appIds.length}{" "}{t("/20")}</legend><label className="admin-field"><span>{t("Find an app to reference")}</span><input type="search" value={appQuery} onChange={event => setAppQuery(event.target.value)} /></label><div className={ui.appChoices}>{apps.filter(app => name(app).toLowerCase().includes(appQuery.toLowerCase())).map(app => <label className="admin-check-row" key={app.id}><input type="checkbox" checked={draft.appIds.includes(app.id)} disabled={draft.appIds.length >= 20 && !draft.appIds.includes(app.id)} onChange={event => patch({ appIds: event.target.checked ? [...draft.appIds, app.id] : draft.appIds.filter(id => id !== app.id) })} />{name(app)}{draft.appIds.includes(app.id) ? ` · ${draft.appIds.indexOf(app.id) + 1}` : ""}</label>)}</div><p className={ui.note}>{t("Select the subject app first for an alternatives page. Comparisons and alternatives require at least two apps before publishing.")}</p></fieldset>
            <fieldset className={ui.repeater}><legend>{t("Source evidence")}</legend>{draft.sources.map((source, index) => <div className={ui.item} key={index}><div className={ui.row}><h4>{t("Source")}{" "}{index + 1}</h4><button type="button" className="admin-button subtle" onClick={() => patch({ sources: draft.sources.filter((_, i) => i !== index) })}>{t("Remove source")}{" "}{index + 1}</button></div>{(["title", "url", "checkedAt"] as const).map(key => <label className="admin-field" key={key}><span>{t("Source")}{" "}{index + 1} {key === "checkedAt" ? t("checked date") : key}</span><input required type={key === "url" ? "url" : key === "checkedAt" ? "date" : "text"} max={key === "checkedAt" ? today() : undefined} value={source[key]} onChange={event => patch({ sources: draft.sources.map((item, i) => i === index ? { ...item, [key]: event.target.value } : item) })} /></label>)}</div>)}<div><button type="button" className="admin-button" disabled={draft.sources.length >= 30} onClick={() => patch({ sources: [...draft.sources, { title: "", url: "", checkedAt: "" }] })}><Plus size={14} />{t("Add source")}</button></div><p className={ui.note}>{t("Record a date only after checking the source. Publishing requires dated source evidence.")}</p></fieldset>
            <fieldset className={ui.repeater}><legend>{t("Contextual internal links")}</legend>{draft.links.map((link, index) => <div className={ui.item} key={index}><div className={ui.grid}><label className="admin-field"><span>{t("Link")}{" "}{index + 1}{" "}{t("type")}</span><select value={link.kind} onChange={event => patch({ links: draft.links.map((item, i) => i === index ? { ...item, kind: event.target.value as "app" | "growth", id: "" } : item) })}><option value="app">{t("App")}</option><option value="growth">{t("Editorial page")}</option></select></label><label className="admin-field"><span>{t("Link")}{" "}{index + 1}{" "}{t("destination")}</span><select required value={link.id} onChange={event => patch({ links: draft.links.map((item, i) => i === index ? { ...item, id: event.target.value } : item) })}><option value="">{t("Select destination")}</option>{link.kind === "app" ? apps.map(app => <option key={app.id} value={app.id}>{name(app)}</option>) : state.documents.filter(item => item.locale === draft.locale && item.id !== draft.id).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className={`admin-field ${ui.full}`}><span>{t("Link")}{" "}{index + 1}{" "}{t("readable label")}</span><input required maxLength={180} lang={draft.locale} value={link.label} onChange={event => patch({ links: draft.links.map((item, i) => i === index ? { ...item, label: event.target.value } : item) })} /></label></div><div><button type="button" className="admin-button subtle" onClick={() => patch({ links: draft.links.filter((_, i) => i !== index) })}>{t("Remove link")}{" "}{index + 1}</button></div></div>)}<div><button type="button" className="admin-button" disabled={draft.links.length >= 30} onClick={() => patch({ links: [...draft.links, { kind: "growth", id: "", label: "" }] })}><Plus size={14} />{t("Add internal link")}</button></div></fieldset>
            {draft.kind === "test" && <fieldset className={ui.repeater}><legend>{t("Performed test evidence")}</legend><p className={ui.note}>{t("Fill this only for a test actually performed. Describe its limitations; generated text is not proof that a test happened.")}</p><label className="admin-check-row"><input type="checkbox" checked={draft.test !== null} onChange={event => patch({ test: event.target.checked ? { performedAt: "", method: "", environment: "", observations: "", limitations: "" } : null })} />{t("Add evidence from a performed test")}</label>{draft.test && <><label className="admin-field"><span>{t("Test performed date")}</span><input required type="date" max={today()} value={draft.test.performedAt} onChange={event => patch({ test: { ...draft.test!, performedAt: event.target.value } })} /></label>{(["method", "environment", "observations", "limitations"] as const).map(key => <label className="admin-field" key={key}><span>{t("Test")}{" "}{key}</span><textarea required rows={4} lang={draft.locale} value={draft.test![key]} onChange={event => patch({ test: { ...draft.test!, [key]: event.target.value } })} /></label>)}</>}</fieldset>}
            <fieldset className={ui.repeater}><legend>{t("Search visibility and publication")}</legend><label className="admin-field"><span>{t("SEO title")}</span><input maxLength={180} lang={draft.locale} value={draft.seo.title} onChange={event => patch({ seo: { ...draft.seo, title: event.target.value } })} /></label><label className="admin-field"><span>{t("SEO description")}</span><textarea maxLength={320} rows={3} lang={draft.locale} value={draft.seo.description} onChange={event => patch({ seo: { ...draft.seo, description: event.target.value } })} /></label><label className="admin-check-row"><input type="checkbox" checked={draft.seo.noindex} onChange={event => patch({ seo: { ...draft.seo, noindex: event.target.checked } })} />{t("Exclude this page from indexing")}</label><label className="admin-field"><span>{t("Publication status")}</span><select value={draft.status} onChange={event => patch({ status: event.target.value as Status })}>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}</select></label><label className="admin-field"><span>{t("Editorial review note")}</span><textarea rows={3} maxLength={1000} value={draft.reviewNote} onChange={event => patch({ reviewNote: event.target.value })} /></label><label className="admin-check-row"><input type="checkbox" checked={draft.seoApproved} onChange={event => patch({ seoApproved: event.target.checked })} />{t("I reviewed the saved content, sources, and SEO fields.")}</label><p className={ui.note}>{t("New or changed content needs a separate approval after saving. Search indexing also depends on the site settings and source freshness.")}</p></fieldset>
            <div className={ui.actions}><button className="admin-button primary" disabled={conflict || (!dirty && draft.revision > 0 && !draft.stale)}><Save size={15} />{t("Save editorial page")}</button><button type="button" className="admin-button" disabled={!draft.revision} onClick={() => void run(async () => { const params = new URLSearchParams({ id: draft.id, locale: draft.locale }); const result = await request<{ revisions: GrowthDocument[] }>(`/history?${params}`); setHistory(result.revisions); })}><History size={15} />{t("Page history")}</button></div>
          </fieldset></form>
          {history && <section><h3>{t("Previous page revisions")}</h3>{history.map(item => <div className={ui.item} key={item.revision}><div className={ui.row}><span>{t("Revision")}{" "}{item.revision}{" "}{t("·")}{" "}{t(statuses[item.status])}</span><button type="button" className="admin-button" disabled={busy || conflict || item.revision === draft.revision} onClick={() => void restore(item.revision)}>{t("Restore revision")}{" "}{item.revision}</button></div><small className={ui.source}>{item.updatedAt ? new Date(item.updatedAt).toLocaleString(intlLocale) : t("No date")}</small></div>)}</section>}
        </section>}
      </div>}
      {view === "insights" && <div className={ui.workspace}><section className="admin-panel"><h3>{t("Topic and intent overlap")}</h3><p className={ui.note}>{state.insights.scope}{" "}{t("Matching topics are editorial suggestions, not measured search competition.")}</p>{state.insights.warnings.length ? <ul className={ui.list}>{state.insights.warnings.map((item, index) => <li key={index}>{item.message}<br /><small className={ui.source}>{item.id ? insightName(item.id, item.locale) : item.ids?.map(id => insightName(id)).join(" · ")}</small></li>)}</ul> : <p className={ui.note}>{t("No overlap or source freshness warnings in the current editorial records.")}</p>}<div className={ui.tableWrap}><table className={ui.table}><caption>{t("Topic and intent groups")}</caption><thead><tr><th>{t("Language, topic, and intent")}</th><th>{t("Pages")}</th></tr></thead><tbody>{Object.entries(state.insights.topicMap).map(([key, ids]) => <tr key={key}><td>{key.replaceAll("|", " · ")}</td><td>{ids.map(id => insightName(id)).join(" · ")}</td></tr>)}</tbody></table></div></section><section className="admin-panel"><h3>{t("Pages without editorial inbound links")}</h3><p className={ui.note}>{t("This checks links from editorial pages and author references. It does not measure every navigation link or external backlink.")}</p>{state.insights.orphans.length ? <ul className={ui.list}>{state.insights.orphans.map(item => <li key={`${item.id}:${item.locale}`}>{item.title}{" "}{t("·")}{" "}{item.locale.toUpperCase()}</li>)}</ul> : <p className={ui.note}>{t("No published orphan pages in this editorial graph.")}</p>}<h3>{t("Contextual link suggestions")}</h3>{state.insights.recommendations.length ? <ul className={ui.list}>{state.insights.recommendations.map((item, index) => <li key={index}><strong>{insightName(item.from, item.locale)}{" "}{t("→")}{" "}{insightName(item.to, item.locale)}</strong><br />{item.reason}</li>)}</ul> : <p className={ui.note}>{t("No suggestions yet. Add useful pages with a shared topic to evaluate contextual connections.")}</p>}</section></div>}
      {view === "lifecycle" && rules && <section className="admin-panel"><h3>{t("Redirects and removed pages")}</h3><p className={ui.note}>{t("Paths are relative to the installation root. Use a 301 for a genuine replacement or a 410 for content intentionally removed without a replacement. Saving applies these HTTP rules to the public site.")}</p><form onSubmit={event => { event.preventDefault(); void saveRules(); }}><fieldset className={ui.fields} disabled={busy}>{rules.rules.map((rule, index) => <div className={ui.item} key={index}><div className={ui.grid}><label className="admin-field"><span>{t("Rule")}{" "}{index + 1}{" "}{t("source path")}</span><input required placeholder={t("/en/topics/old-guide")} value={rule.from} onChange={event => changeRule(index, { from: event.target.value })} /></label><label className="admin-field"><span>{t("Rule")}{" "}{index + 1}{" "}{t("response")}</span><select value={rule.status} onChange={event => changeRule(index, { status: Number(event.target.value) as 301 | 410, to: "" })}><option value={301}>{t("301 · Permanent redirect")}</option><option value={410}>{t("410 · Gone")}</option></select></label>{rule.status === 301 && <label className={`admin-field ${ui.full}`}><span>{t("Rule")}{" "}{index + 1}{" "}{t("destination path")}</span><input required placeholder={t("/en/topics/replacement-guide")} value={rule.to} onChange={event => changeRule(index, { to: event.target.value })} /></label>}<label className={`admin-field ${ui.full}`}><span>{t("Rule")}{" "}{index + 1}{" "}{t("reason")}</span><input required maxLength={500} value={rule.reason} onChange={event => changeRule(index, { reason: event.target.value })} /></label></div><div><button type="button" className="admin-button subtle" onClick={() => { setRules({ ...rules, rules: rules.rules.filter((_, i) => i !== index) }); setRulesDirty(true); }}>{t("Remove rule")}{" "}{index + 1}</button></div></div>)}{!rules.rules.length && <p className={ui.note}>{t("No URL lifecycle rules configured.")}</p>}<div className={ui.actions}><button type="button" className="admin-button" disabled={rules.rules.length >= 500} onClick={() => { setRules({ ...rules, rules: [...rules.rules, { from: "", to: "", status: 301, reason: "" }] }); setRulesDirty(true); }}><Plus size={15} />{t("Add URL rule")}</button><button className="admin-button primary" disabled={!rulesDirty || rulesConflict}>{t("Save URL rules")}</button></div></fieldset></form></section>}
      {view === "search" && <><section className="admin-panel"><h3>{t("Import Search Console CSV")}</h3><p className={ui.note}>{t("Import an export you obtained from Search Console. This does not connect a Google account or verify the data independently. Files are limited to 1 MB and 5,000 rows. Required columns: query or page, clicks, impressions. English and Turkish column headers are supported.")}</p><form onSubmit={event => { event.preventDefault(); void run(async () => { const { gsc } = await request<{ gsc: Workspace["gsc"] }>("/gsc", { csv, property, startDate, endDate }); setState(previous => previous ? { ...previous, gsc } : previous); setCsv(""); setImportIndex(0); setPageIndex(0); setSuccess("Search Console CSV imported. These metrics are attributed to the uploaded file."); }); }}><fieldset disabled={busy} className={ui.fields}><div className={ui.grid}><label className={`admin-field ${ui.full}`}><span>{t("Property URL prefix")}</span><input required type="url" placeholder={t("https://your-site.example/")} value={property} onChange={event => setProperty(event.target.value)} /><small>{t("Use the full website URL prefix, including a subdirectory if applicable.")}</small></label><label className="admin-field"><span>{t("Search data start date")}</span><input required type="date" max={today()} value={startDate} onChange={event => setStartDate(event.target.value)} /></label><label className="admin-field"><span>{t("Search data end date")}</span><input required type="date" min={startDate || undefined} max={today()} value={endDate} onChange={event => setEndDate(event.target.value)} /></label><label className={`admin-field ${ui.full}`}><span>{t("Search Console CSV file")}</span><input type="file" accept=".csv,text/csv" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; void loadCsv(file); }} /></label><label className={`admin-field ${ui.full}`}><span>{t("CSV contents")}</span><textarea required rows={6} value={csv} onChange={event => { fileRead.current++; setCsv(event.target.value); }} /><small>{t("You can review or paste the original CSV here before importing.")}</small></label></div><div><button className="admin-button primary" disabled={!csv}>{t("Import search data")}</button></div></fieldset></form></section>
        <section className="admin-panel"><h3>{t("Imported search evidence")}</h3>{!state.gsc.imports.length ? <p className={ui.note}>{t("No search data has been imported. Clicks, impressions, positions, and opportunities will appear only after an actual CSV import.")}</p> : <><label className="admin-field"><span>{t("Search data import")}</span><select value={importIndex} onChange={event => { setImportIndex(Number(event.target.value)); setPageIndex(0); }}>{state.gsc.imports.map((item, index) => <option value={index} key={`${item.importedAt}:${index}`}>{item.property}{" "}{t("·")}{" "}{item.startDate}{" "}{t("–")}{" "}{item.endDate}</option>)}</select></label>{currentImport && <><p className={ui.note}>{currentImport.source}{" "}{t("Imported")}{" "}{new Date(currentImport.importedAt).toLocaleString(intlLocale)}{" "}{t(". Opportunities are review prompts, not traffic forecasts.")}</p><div className={ui.tableWrap}><table className={ui.table}><caption>{currentImport.rows.length}{" "}{t("imported rows · Showing")}{" "}{pageIndex * 25 + 1}{" "}{t("–")}{" "}{Math.min((pageIndex + 1) * 25, currentImport.rows.length)}</caption><thead><tr>{["Query / page", "Clicks", "Impressions", "CTR", "Position", "Review prompt"].map(label => <th key={t(label)}>{t(label)}</th>)}</tr></thead><tbody>{currentImport.rows.slice(pageIndex * 25, (pageIndex + 1) * 25).map((row, index) => <tr key={index}><td>{row.query || "—"}{row.page && <div className={ui.source}>{row.page}</div>}</td><td>{row.clicks.toLocaleString(intlLocale)}</td><td>{row.impressions.toLocaleString(intlLocale)}</td><td>{(row.ctr * 100).toFixed(2)}{" "}{t("%")}</td><td>{row.position === null ? "—" : row.position.toFixed(1)}</td><td>{row.opportunity}</td></tr>)}</tbody></table></div><div className={ui.actions}><button type="button" className="admin-button" disabled={pageIndex === 0} onClick={() => setPageIndex(value => value - 1)}>{t("Previous rows")}</button><button type="button" className="admin-button" disabled={(pageIndex + 1) * 25 >= currentImport.rows.length} onClick={() => setPageIndex(value => value + 1)}>{t("Next rows")}</button></div></>}</>}</section>
      </>}
    </>}
  </div>;
}
