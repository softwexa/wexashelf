"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, RefreshCw, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { appIconUrl } from "@/lib/asset-url";
import type { AppSubmission, SubmissionSettings, SubmissionStatus, SubmissionWorkspace } from "@/lib/app-submissions";
import type { ArticleImage, ManagedRecord } from "@/lib/domain";
import ui from "./AppSubmissionsWorkspace.module.css";

type Props = {
  onDirty: (value: boolean) => void;
  onBusy: (value: boolean) => void;
  onAuthLost: () => void;
  onRecordsChanged: () => void;
  onOpenDraft: (record: ManagedRecord<"app">) => void;
};
type Filter = SubmissionStatus | "all";
const statuses: Record<SubmissionStatus, string> = { draft: "Draft", pending: "Pending review", accepted: "Accepted", rejected: "Rejected", withdrawn: "Withdrawn" };
const categories = { productivity: "Productivity", notes: "Notes", documents: "Documents", media: "Media", browser: "Browser", design: "Design" };
const pricing = { free: "Free", freemium: "Freemium", subscription: "Subscription", "one-time": "One-time purchase", unknown: "Unknown" };
const platforms = { android: "Android", ios: "iOS", windows: "Windows" };
const suggestedId = (name: string) => name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80).replace(/-$/, "") || "submitted-app";
const validRecordId = (value: string) => /^[a-z0-9][a-z0-9-]{0,79}$/.test(value);
function safeLink(value: string): string | null { try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : null; } catch { return null; } }
class SubmissionError extends Error { constructor(message: string, public status: number) { super(message); } }
async function request<T>(suffix = "", body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/admin/submissions${suffix}`, {
    method: body === undefined ? "GET" : "POST", credentials: "same-origin", cache: "no-store", signal,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({ error: "The submission response could not be read. Reload its status before trying again." }));
  if (!response.ok) throw new SubmissionError(data.error || "The submission request could not be completed.", response.status);
  return data as T;
}
function IntakeImage({ submissionId, image, title }: { submissionId: string; image: ArticleImage; title: string }) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  const source = appIconUrl(`/api/admin/submissions/media?${new URLSearchParams({ id: submissionId, assetId: image.assetId, format: image.format })}`);
  return <figure className={ui.image}>
    {failed ? <p role="status">{t("This private image is unavailable. Reload the submission before accepting it.")}</p>
      : <img src={source} alt={image.alt} width={image.width} height={image.height} loading="lazy" onError={() => setFailed(true)} />}
    <figcaption><strong>{title}</strong><span>{image.alt}</span><small>{image.width} × {image.height} · {image.format.toUpperCase()}</small>{image.caption && <span>{image.caption}</span>}</figcaption>
  </figure>;
}

export default function AppSubmissionsWorkspace({ onDirty, onBusy, onAuthLost, onRecordsChanged, onOpenDraft }: Props) {
  const { t, intlLocale } = useI18n();
  const [state, setState] = useState<SubmissionWorkspace | null>(null);
  const [enabled, setEnabled] = useState(false), [filter, setFilter] = useState<Filter>("pending");
  const [selected, setSelected] = useState<AppSubmission | null>(null), [createdRecord, setCreatedRecord] = useState<ManagedRecord<"app"> | null>(null);
  const [recordId, setRecordId] = useState(""), [reviewNote, setReviewNote] = useState(""), [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(true), [error, setError] = useState(""), [notice, setNotice] = useState(""), [conflict, setConflict] = useState(false);
  const pending = useRef<AbortController | null>(null), working = useRef(false);
  const settingsDirty = !!state && enabled !== state.settings.enabled;
  const reviewDirty = !!selected && selected.status === "pending" && (reviewNote !== selected.reviewNote || recordId !== suggestedId(selected.draft.name) || reviewed);
  const dirty = settingsDirty || reviewDirty;
  useEffect(() => { onDirty(dirty); }, [dirty, onDirty]);
  useEffect(() => { onBusy(busy); }, [busy, onBusy]);
  const fail = useCallback((caught: unknown) => {
    if (caught instanceof SubmissionError && caught.status === 401) onAuthLost();
    if (caught instanceof SubmissionError && caught.status === 409) setConflict(true);
    setError(caught instanceof Error ? caught.message : "The submission request could not be completed.");
  }, [onAuthLost]);
  useEffect(() => {
    const abort = new AbortController(); pending.current = abort; working.current = true;
    void request<SubmissionWorkspace>("?status=pending&page=1", undefined, abort.signal).then(value => {
      if (!abort.signal.aborted) { setState(value); setEnabled(value.settings.enabled); }
    }).catch(caught => { if (!abort.signal.aborted) fail(caught); }).finally(() => {
      if (!abort.signal.aborted) { setBusy(false); working.current = false; }
    });
    return () => { pending.current?.abort(); onBusy(false); onDirty(false); };
  }, [fail, onBusy, onDirty]);
  async function run(action: (signal: AbortSignal) => Promise<void>) {
    if (working.current) return;
    const abort = new AbortController(); pending.current = abort; working.current = true; setBusy(true); setError(""); setNotice("");
    try { await action(abort.signal); } catch (caught) { if (!abort.signal.aborted) fail(caught); }
    finally { if (!abort.signal.aborted) { working.current = false; setBusy(false); } }
  }
  function populate(submission: AppSubmission | null) {
    setSelected(submission); setReviewNote(submission?.reviewNote || ""); setRecordId(submission ? suggestedId(submission.draft.name) : "");
    setReviewed(false); setCreatedRecord(null); setConflict(false);
  }
  async function queue(nextFilter: Filter, page: number, signal: AbortSignal, resetSettings = false) {
    const value = await request<SubmissionWorkspace>(`?${new URLSearchParams({ status: nextFilter, page: String(page) })}`, undefined, signal);
    if (signal.aborted) return;
    setState(value); setFilter(nextFilter); if (resetSettings || !settingsDirty) setEnabled(value.settings.enabled);
  }
  async function loadCreatedRecord(submission: AppSubmission, signal: AbortSignal) {
    if (!submission.recordId) return;
    const response = await fetch(`/api/admin/record?${new URLSearchParams({ kind: "app", id: submission.recordId })}`, { credentials: "same-origin", cache: "no-store", signal });
    const value = await response.json().catch(() => ({}));
    if (!response.ok) throw new SubmissionError(value.error || "The created app record could not be loaded.", response.status);
    if (!signal.aborted) setCreatedRecord(value.record);
  }
  async function select(submission: AppSubmission) {
    if (reviewDirty && !window.confirm(t("Discard this unsaved submission review?"))) return;
    await run(async signal => {
      const result = await request<{ submission: AppSubmission }>(`?id=${encodeURIComponent(submission.id)}`, undefined, signal);
      if (signal.aborted) return; populate(result.submission);
      await loadCreatedRecord(result.submission, signal);
    });
  }
  async function reload() {
    if (dirty && !window.confirm(t("Reloading discards unsaved submission settings and review inputs. Continue?"))) return;
    await run(async signal => {
      await queue(filter, state?.pagination.page || 1, signal, true);
      if (selected) {
        const result = await request<{ submission: AppSubmission }>(`?id=${encodeURIComponent(selected.id)}`, undefined, signal);
        if (signal.aborted) return; populate(result.submission); await loadCreatedRecord(result.submission, signal);
      } else setConflict(false);
      setNotice("Submission settings and queue refreshed.");
    });
  }
  async function navigate(nextFilter: Filter, page: number) {
    if (reviewDirty && !window.confirm(t("Discard this unsaved submission review?"))) return;
    await run(async signal => { await queue(nextFilter, page, signal); if (!signal.aborted) populate(null); });
  }
  async function saveSettings() {
    if (!state || !settingsDirty || conflict) return;
    await run(async signal => {
      const result = await request<{ settings: SubmissionSettings }>("", { action: "configure", revision: state.settings.revision, enabled }, signal);
      if (signal.aborted) return;
      setState(previous => previous ? { ...previous, settings: result.settings } : previous); setEnabled(result.settings.enabled);
      setNotice(result.settings.enabled ? "App submissions are open. New entries still require owner review." : "App submissions are closed. Existing submissions remain available for moderation.");
    });
  }
  async function moderate(action: "accept" | "reject") {
    if (!selected || selected.status !== "pending" || conflict) return;
    if (action === "accept" && (!reviewed || !validRecordId(recordId))) return;
    if (action === "reject" && !reviewNote.trim()) { setError("Write a message to the applicant before rejecting this submission."); return; }
    await run(async signal => {
      const result = await request<{ submission: AppSubmission; record?: ManagedRecord<"app"> }>("", {
        action, id: selected.id, revision: selected.revision, reviewNote: reviewNote.trim(),
        ...(action === "accept" ? { recordId, reviewed: true } : {}),
      }, signal);
      if (signal.aborted) return;
      populate(result.submission);
      if (result.record) { setCreatedRecord(result.record); onRecordsChanged(); }
      setNotice(action === "accept" ? "An app draft was created. Review it in Content before choosing any publication action." : "Submission rejected. The applicant can read your message using their tracking code.");
      await queue(filter, state?.pagination.page || 1, signal);
    });
  }
  async function purge() {
    if (!selected || !["accepted", "rejected", "withdrawn"].includes(selected.status) || conflict) return;
    if (!window.confirm(t("Permanently remove this closed submission and its private intake images? Any catalog app and its media will remain."))) return;
    await run(async signal => {
      await request<{ deleted: boolean }>("", { action: "purge", id: selected.id, revision: selected.revision }, signal);
      if (signal.aborted) return; populate(null);
      setNotice("The closed submission and its private intake images were removed. Catalog records were preserved.");
      await queue(filter, state?.pagination.page || 1, signal);
    });
  }
  const date = (value: string) => new Date(value).toLocaleString(intlLocale);
  const links = selected ? Object.entries(selected.draft.storeLinks).filter(([, href]) => !!href) : [];
  return <div className={ui.workspace} aria-busy={busy}>
    <div className={ui.heading}><div><span className="admin-kicker">{t("Wexa Submissions")}</span><h2>{t("Review queue")}</h2><p className={ui.note}>{t("Review submitted store listings, descriptions and images before creating a catalog draft.")}</p></div>
      <button type="button" className="admin-button" disabled={busy} onClick={() => void reload()}><RefreshCw size={15} />{t("Reload submissions")}</button></div>
    {error && <p className="admin-error" role="alert">{t(error)}</p>}{notice && <p className="admin-success" role="status">{t(notice)}</p>}
    {conflict && <div className={ui.warning} role="alert"><p>{t("The submission or settings changed in another session. Your inputs are preserved. Copy them before loading the latest version.")}</p><button type="button" className="admin-button" disabled={busy} onClick={() => void reload()}>{t("Load latest submission state")}</button></div>}
    {!state ? <section className="admin-panel"><p role="status">{error ? t("Use reload to try again.") : t("Loading app submissions…")}</p></section> : <>
      <section className={`admin-panel ${ui.settings}`} aria-labelledby="submission-settings-title">
        <div><h3 id="submission-settings-title">{t("Submission availability")}</h3><p className={ui.note}>{t("Disabled by default. Closing submissions stops new drafts, edits and uploads; owners can still moderate the queue. Applicants can still check status or withdraw eligible entries.")}</p><p className={ui.note}>{t("Only store links, app details and raster images are accepted. Application binaries are never accepted.")}</p></div>
        <div className={ui.settingActions}><span className="admin-badge">{state.settings.enabled ? t("Open to submissions") : t("Submissions closed")}</span>
          <label className="admin-check-row"><input type="checkbox" checked={enabled} disabled={busy || conflict} onChange={event => { setEnabled(event.target.checked); setNotice(""); }} />{t("Allow app submissions")}</label>
          <button type="button" className="admin-button primary" disabled={busy || !settingsDirty || conflict} onClick={() => void saveSettings()}>{t("Save submission settings")}</button></div>
      </section>
      <div className={ui.counts} aria-label={t("Submission counts")}>{Object.entries(statuses).map(([status, label]) => <div key={status}><span>{t(label)}</span><strong>{state.counts[status as SubmissionStatus].toLocaleString(intlLocale)}</strong></div>)}</div>
      <div className={ui.layout}>
        <section className={`admin-panel ${ui.queue}`} aria-labelledby="submission-queue-title">
          <h3 id="submission-queue-title">{t("Review queue")}</h3><label className="admin-field"><span>{t("Submission status")}</span><select value={filter} disabled={busy} onChange={event => void navigate(event.target.value as Filter, 1)}>{Object.entries(statuses).map(([value, label]) => <option value={value} key={value}>{t(label)}</option>)}<option value="all">{t("All submissions")}</option></select></label>
          <div className={ui.list}>{state.items.map(item => <button type="button" key={item.id} disabled={busy} aria-pressed={selected?.id === item.id} onClick={() => void select(item)}><span className={ui.rowTitle}>{item.draft.name || t("Untitled app")}<small>{t(statuses[item.status])}</small></span><span className={ui.rowMeta}>{item.draft.publisher || t("Publisher not provided")}</span><time dateTime={item.updatedAt}>{date(item.updatedAt)}</time></button>)}</div>
          {state.items.length === 0 && <p className={ui.empty}>{t("No submissions match this status.")}</p>}
          <nav className={ui.pagination} aria-label={t("Submission pages")}><button type="button" className="admin-button" aria-label={t("Previous submission page")} disabled={busy || state.pagination.page <= 1} onClick={() => void navigate(filter, state.pagination.page - 1)}><ChevronLeft size={16} /></button><span>{t("Page {page} of {pages}", { page: state.pagination.page, pages: state.pagination.pages })}</span><button type="button" className="admin-button" aria-label={t("Next submission page")} disabled={busy || state.pagination.page >= state.pagination.pages} onClick={() => void navigate(filter, state.pagination.page + 1)}><ChevronRight size={16} /></button></nav>
        </section>
        {!selected ? <section className={`admin-panel ${ui.empty}`}><h3>{t("Choose a submission")}</h3><p>{t("Open an entry to inspect its store links, app details, contact information and private images.")}</p></section>
          : <section className={`admin-panel ${ui.detail}`} aria-labelledby="submission-detail-title">
            <div className={ui.heading}><div><span className="admin-badge">{t(statuses[selected.status])}</span><h3 id="submission-detail-title">{selected.draft.name || t("Untitled app")}</h3><p>{selected.draft.tagline}</p></div><small>{t("Revision {revision}", { revision: selected.revision })}</small></div>
            <p className={ui.warning}>{t("Applicant information is unverified. A submission does not prove app ownership, store approval or the accuracy of its claims.")}</p>
            <dl className={ui.metadata}><div><dt>{t("Publisher")}</dt><dd>{selected.draft.publisher || t("Not provided")}</dd></div><div><dt>{t("Category")}</dt><dd>{t(categories[selected.draft.category])}</dd></div><div><dt>{t("Content language")}</dt><dd>{selected.draft.sourceLocale}</dd></div><div><dt>{t("Pricing model")}</dt><dd>{t(pricing[selected.draft.pricingModel])}</dd></div><div><dt>{t("Received")}</dt><dd><time dateTime={selected.createdAt}>{date(selected.createdAt)}</time></dd></div><div><dt>{t("Last updated")}</dt><dd><time dateTime={selected.updatedAt}>{date(selected.updatedAt)}</time></dd></div></dl>
            <section><h4>{t("Submitted description")}</h4><p className={ui.description}>{selected.draft.description || t("Not provided")}</p>{selected.draft.tags.length > 0 && <ul className={ui.tags} aria-label={t("Submitted tags")}>{selected.draft.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>}</section>
            <section><h4>{t("Store listings and website")}</h4><ul className={ui.links}>{links.map(([platform, href]) => <li key={platform}><strong>{t(platforms[platform as keyof typeof platforms])}</strong>{safeLink(href!) ? <a href={safeLink(href!)!} target="_blank" rel="noopener noreferrer">{href}<ArrowUpRight size={14} aria-hidden="true" /></a> : <span>{href}</span>}</li>)}{selected.draft.website && <li><strong>{t("Website")}</strong>{safeLink(selected.draft.website) ? <a href={safeLink(selected.draft.website)!} target="_blank" rel="noopener noreferrer">{selected.draft.website}<ArrowUpRight size={14} aria-hidden="true" /></a> : <span>{selected.draft.website}</span>}</li>}</ul></section>
            <section><h4>{t("Private applicant contact")}</h4><p className={ui.note}>{t("Contact details stay in this private submission and are not copied to the catalog app.")}</p><dl className={ui.metadata}><div><dt>{t("Contact name")}</dt><dd>{selected.draft.contactName || t("Not provided")}</dd></div><div><dt>{t("Contact email")}</dt><dd>{selected.draft.contactEmail || t("Not provided")}</dd></div></dl></section>
            <section><h4>{t("Submitted images")}</h4><div className={ui.images}>{selected.icon ? <IntakeImage key={`${selected.id}-${selected.revision}-${selected.icon.assetId}`} submissionId={selected.id} image={selected.icon} title={t("App icon")} /> : <p className={ui.note}>{t("No app icon submitted.")}</p>}{selected.screenshots.map((image, index) => <IntakeImage key={`${selected.id}-${selected.revision}-${image.assetId}`} submissionId={selected.id} image={image} title={t("Screenshot {number}", { number: index + 1 })} />)}</div></section>
            {selected.status === "pending" ? <section className={ui.moderation}><h4>{t("Review decision")}</h4><label className="admin-field"><span>{t("Message to applicant")}</span><textarea rows={4} maxLength={1000} value={reviewNote} disabled={busy} onChange={event => { setReviewNote(event.target.value); setNotice(""); }} /><small>{t("The applicant can read this message with their tracking code. It is not an internal note. A message is required when rejecting.")}</small></label>
              <label className="admin-field"><span>{t("New app record ID")}</span><input value={recordId} maxLength={80} pattern="[a-z0-9][a-z0-9-]{0,79}" aria-invalid={!validRecordId(recordId)} autoCapitalize="none" spellCheck={false} disabled={busy} onChange={event => { setRecordId(event.target.value); setNotice(""); }} /><small>{t("Use lowercase letters, numbers and hyphens, up to 80 characters. Existing records are never overwritten.")}</small></label>
              <label className="admin-check-row"><input type="checkbox" checked={reviewed} disabled={busy} onChange={event => setReviewed(event.target.checked)} />{t("I checked the submitted sources and images and want to create an unpublished app draft.")}</label><p className={ui.note}>{t("Acceptance creates a draft with SEO approval off. Admission checks, editing and publication remain separate.")}</p>
              <div className={ui.actions}><button type="button" className="admin-button primary" disabled={busy || conflict || !reviewed || !validRecordId(recordId) || !selected.icon} onClick={() => void moderate("accept")}><Check size={16} />{t("Create app draft")}</button><button type="button" className="admin-button" disabled={busy || conflict || !reviewNote.trim()} onClick={() => void moderate("reject")}><X size={16} />{t("Reject submission")}</button></div>
            </section> : <section className={ui.moderation}><h4>{t("Review result")}</h4>{selected.reviewNote && <p className={ui.description}>{selected.reviewNote}</p>}{selected.recordId && <p>{t("Created app record")}: <code>{selected.recordId}</code></p>}{selected.status === "draft" && <p className={ui.note}>{t("The applicant has not submitted this draft for review yet.")}</p>}{selected.status === "withdrawn" && <p className={ui.note}>{t("The applicant withdrew this submission. No catalog record was created by withdrawal.")}</p>}
              <div className={ui.actions}>{createdRecord && <button type="button" className="admin-button primary" disabled={busy} onClick={() => onOpenDraft(createdRecord)}>{t("Open app draft")}<ArrowUpRight size={15} /></button>}{["accepted", "rejected", "withdrawn"].includes(selected.status) && <button type="button" className={`admin-button ${ui.delete}`} disabled={busy || conflict} onClick={() => void purge()}><Trash2 size={15} />{t("Purge closed submission")}</button>}</div></section>}
          </section>}
      </div>
    </>}
  </div>;
}
