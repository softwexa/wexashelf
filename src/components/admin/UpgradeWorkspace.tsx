"use client";
import {useI18n} from "@/lib/i18n";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Download, RefreshCw, ShieldCheck } from "lucide-react";
import ui from "./UpgradeWorkspace.module.css";

type Receipt = { id: string; sha256: string; bytes: number; createdAt: string; sourceFingerprint: string; sourceVersion: string; targetVersion: string };
type State = {
  revision: number;
  status: "idle" | "prepared" | "applying" | "applied" | "failed";
  installedVersion: string; targetVersion: string;
  preflight: { ready: boolean; checks: { id: string; ok: boolean; detail: string }[] };
  receipt?: Receipt; error?: string; appliedAt?: string;
};
type Action = { action: "prepare" | "apply" | "recover"; revision: number; requestId: string; receiptId?: string; sha256?: string };
type Props = { onBusy: (value: boolean) => void; onAuthLost: () => void };
const statuses = { idle: "Not prepared", prepared: "Backup prepared", applying: "Database upgrade in progress", applied: "Database upgrade applied", failed: "Needs attention" };
const version = (value: string) => value === "unrecorded" ? "Not yet recorded" : value || "Unavailable";
class UpgradeError extends Error { constructor(message: string, public status: number) { super(message); } }
async function request(body?: Action): Promise<State> {
  const response = await fetch("/api/admin/upgrade", { method: body ? "POST" : "GET", credentials: "same-origin", cache: "no-store", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json().catch(() => ({ error: "The server response could not be read. Reload the upgrade status before continuing." }));
  if (!response.ok) throw new UpgradeError(data.error || `Request failed (${response.status}).`, response.status);
  return data as State;
}
function uuid() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16)); bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export default function UpgradeWorkspace({ onBusy, onAuthLost }: Props) {
 const {t,intlLocale}=useI18n();

  const [state, setState] = useState<State | null>(null), [busy, setBusy] = useState(false);
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [downloaded, setDownloaded] = useState(""), [savedBackup, setSavedBackup] = useState(false);
  const [hostingBackup, setHostingBackup] = useState(false), [releaseFiles, setReleaseFiles] = useState(false), [recoveryAck, setRecoveryAck] = useState(false);
  const [retry, setRetry] = useState<Action | null>(null);
  const fail = useCallback((caught: unknown) => {
    if (caught instanceof UpgradeError && caught.status === 401) onAuthLost();
    setError(caught instanceof Error ? caught.message : "The upgrade request could not be completed.");
  }, [onAuthLost]);
  useEffect(() => { let active = true; request().then(value => { if (active) setState(value); }).catch(caught => { if (active) fail(caught); }); return () => { active = false; }; }, [fail]);
  function working(value: boolean) { setBusy(value); onBusy(value); }
  function clearChecks() { setDownloaded(""); setSavedBackup(false); setHostingBackup(false); setReleaseFiles(false); setRecoveryAck(false); }
  async function reload() {
    if (busy) return; working(true); setError(""); setNotice("");
    try { const value = await request(); setState(value); setRetry(null); clearChecks(); setNotice("Upgrade status refreshed. Confirm the backup and release files again before applying."); }
    catch (caught) { fail(caught); } finally { working(false); }
  }
  async function execute(action: Action) {
    if (busy) return; working(true); setError(""); setNotice(""); setRetry(action);
    try {
      const value = await request(action); setState(value); setRetry(null);
      if (action.action === "prepare") { clearChecks(); setNotice("A private catalogue backup is ready. Download it before applying the database upgrade."); }
      else if (action.action === "recover") { clearChecks(); setNotice("The maintenance gate was cleared. Existing backups remain. Inspect the failure and prepare a new backup before retrying."); }
      else if (value.status === "applied") { clearChecks(); setNotice("The local database upgrade completed. This does not verify a fresh deployment or restore hosting files."); }
      else setNotice("The upgrade did not finish successfully. Review the status and retained backup below.");
    } catch (caught) {
      if (caught instanceof UpgradeError && caught.status < 500) setRetry(null);
      fail(caught);
    } finally { working(false); }
  }
  async function download() {
    if (!state?.receipt || busy) return;
    const receipt = state.receipt; working(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/upgrade?download=${encodeURIComponent(receipt.id)}`, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new UpgradeError(data.error || "The private backup could not be downloaded.", response.status); }
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== receipt.bytes) throw new Error("Backup size does not match the receipt. Prepare a new backup.");
      if (crypto.subtle) {
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
        if (hash !== receipt.sha256) throw new Error("Backup checksum does not match the receipt. Do not apply this upgrade.");
      }
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/json" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `wexashelf-catalog-${receipt.id}.json`; document.body.appendChild(anchor);
      try { anchor.click(); } finally { anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
      setDownloaded(receipt.id); setSavedBackup(false);
      setNotice(t("Backup download started. Confirm that you saved the file.{p0}",{p0:crypto.subtle ? " Its SHA-256 checksum matches the receipt." : " The server verified its stored checksum."}));
    } catch (caught) { fail(caught); } finally { working(false); }
  }
  const canApply = !!state && state.status === "prepared" && state.preflight.ready && !!state.receipt && downloaded === state.receipt.id && savedBackup && hostingBackup && releaseFiles;
  return <div className={ui.workspace} lang="en" aria-busy={busy}>
    <div className={ui.heading}><div><span className="admin-kicker">{t("Owner-controlled local upgrade")}</span><h2>{t("Upgrade")}</h2></div><button type="button" className="admin-button" disabled={busy} onClick={() => void reload()}><RefreshCw size={15} />{t("Reload upgrade status")}</button></div>
    <p className={ui.note}>{t("This wizard prepares a private catalogue backup and runs database migrations for the release files already on this host. Uploading PHP files and restoring a full hosting backup remain operator tasks.")}</p>
    {error && <p className="admin-error" role="alert">{t(error)}</p>}{notice && <p className="admin-success" role="status">{t(notice)}</p>}
    {retry && <div className={ui.warning}><p>{t("The last response was uncertain. Reload the status first, or retry the exact same request. A retry reuses its request ID to prevent duplicate execution.")}</p><button type="button" className="admin-button" disabled={busy} onClick={() => void execute(retry)}>{t("Retry the same upgrade request")}</button></div>}
    {!state ? <p className={ui.note}>{error ? t("Use reload to check the current server state.") : t("Loading upgrade checks…")}</p> : <>
      <section className="admin-panel"><dl className={ui.versions}><div><dt>{t("Recorded database version")}</dt><dd>{version(state.installedVersion)}</dd></div><div><dt>{t("Local release target")}</dt><dd>{version(state.targetVersion)}</dd></div><div><dt>{t("Upgrade status")}</dt><dd>{statuses[state.status]}</dd></div></dl>{state.appliedAt && <p className={ui.note}>{t("Last applied:")}{" "}{new Date(state.appliedAt).toLocaleString(intlLocale)}{" "}{t(".")}</p>}{state.error && <p className={ui.warning}>{state.error}</p>}</section>
      <section className={`admin-panel ${ui.step}`}><h3>{t("1. Check the local environment")}</h3><ul className={ui.checks}>{state.preflight.checks.map(check => <li className={ui.check} key={check.id}><span>{check.ok ? <CheckCircle2 size={17} className={ui.good} aria-hidden="true" /> : <CircleAlert size={17} className={ui.bad} aria-hidden="true" />}{check.detail}</span><strong className={check.ok ? ui.good : ui.bad}>{check.ok ? t("Passed") : t("Needs attention")}</strong></li>)}</ul><p className={ui.note}>{state.preflight.ready ? t("The listed checks passed. Database migration permissions are verified during apply.") : t("Resolve the failed checks in your hosting environment, then reload this screen.")}</p></section>
      <section className={`admin-panel ${ui.step}`}><h3>{t("2. Prepare and download a private catalogue backup")}</h3><p className={ui.note}>{t("The backup covers the catalogue and supported application settings. It is not a full hosting-file backup and does not replace backups of uploaded files, configuration, credentials, or your hosting database. Keep it private.")}</p><div className={ui.actions}><button type="button" className="admin-button primary" disabled={busy || !state.preflight.ready || state.status === "applying" || !!retry} onClick={() => void execute({ action: "prepare", revision: state.revision, requestId: uuid() })}><ShieldCheck size={16} /> {state.receipt ? t("Prepare a new catalogue backup") : t("Prepare catalogue backup")}</button>{state.receipt && <button type="button" className="admin-button" disabled={busy} onClick={() => void download()}><Download size={16} />{t("Download private catalogue backup")}</button>}</div>
        {state.receipt && <><dl className={ui.receipt}><dt>{t("Backup receipt")}</dt><dd>{state.receipt.id}</dd><dt>{t("Created")}</dt><dd>{new Date(state.receipt.createdAt).toLocaleString(intlLocale)}</dd><dt>{t("Size")}</dt><dd>{state.receipt.bytes.toLocaleString(intlLocale)}{" "}{t("bytes")}</dd><dt>{t("SHA-256")}</dt><dd>{state.receipt.sha256}</dd><dt>{t("Version transition")}</dt><dd>{version(state.receipt.sourceVersion)}{" "}{t("→")}{" "}{version(state.receipt.targetVersion)}</dd></dl><label className="admin-check-row"><input type="checkbox" disabled={busy || downloaded !== state.receipt.id || state.status !== "prepared"} checked={savedBackup} onChange={event => setSavedBackup(event.target.checked)} />{t("I saved this catalogue backup in a private location.")}</label></>}
      </section>
      <section className={`admin-panel ${ui.step}`}><h3>{t("3. Confirm the hosting files and apply the database upgrade")}</h3><p className={ui.note}>{t("Use your hosting control panel or deployment process to back up the current installation and upload the intended release. Preserve configuration and storage. This wizard does not download, extract, or install executable packages.")}</p><label className="admin-check-row"><input type="checkbox" disabled={busy || state.status !== "prepared"} checked={hostingBackup} onChange={event => setHostingBackup(event.target.checked)} />{t("I have a separate hosting backup and a recovery plan for files, configuration, uploads, and the database.")}</label><label className="admin-check-row"><input type="checkbox" disabled={busy || state.status !== "prepared"} checked={releaseFiles} onChange={event => setReleaseFiles(event.target.checked)} />{t("I have uploaded or verified the PHP release files for target")}{" "}{version(state.targetVersion)}{" "}{t("on this host.")}</label><p className={ui.note}>{t("Avoid changing catalogue content between preparing the backup and applying. If content or release files change, prepare a new backup. Database schema changes may not be reversible as a single transaction.")}</p><div><button type="button" className="admin-button primary" disabled={busy || !canApply || !!retry} onClick={() => state.receipt && void execute({ action: "apply", revision: state.revision, requestId: uuid(), receiptId: state.receipt.id, sha256: state.receipt.sha256 })}>{t("Apply local database upgrade")}</button></div></section>
      {(state.status === "applying" || state.status === "failed") && <section className={`admin-panel ${ui.step}`}><h3>{t("Interrupted upgrade recovery")}</h3><p className={ui.note}>{t("Reload first to check whether an active request completed. Clearing the maintenance gate does not undo schema changes or restore files. Existing backups are retained; inspect hosting logs and prepare a new backup before trying again.")}</p><label className="admin-check-row"><input type="checkbox" disabled={busy} checked={recoveryAck} onChange={event => setRecoveryAck(event.target.checked)} />{t("I checked the upgrade state and understand that clearing maintenance does not roll back the upgrade.")}</label><div><button type="button" className="admin-button" disabled={busy || !recoveryAck} onClick={() => void execute({ action: "recover", revision: state.revision, requestId: uuid() })}>{t("Clear interrupted maintenance gate")}</button></div></section>}
    </>}
  </div>;
}
