"use client";
import AdminShell, { type AdminShellProps } from "./AdminShell";
import { activityLabel } from "./admin-activity";
import SystemHealthWorkspace from "./SystemHealthWorkspace";
import AccountSecurityWorkspace from "./AccountSecurityWorkspace";
import BackupRestoreWorkspace from "./BackupRestoreWorkspace";
import LanguagePacksWorkspace from "./LanguagePacksWorkspace";
import {LocaleProvider,useI18n} from "@/lib/i18n";
import {localeRegistry,registerRuntimeLocalePacks} from "@/lib/i18n-registry";
import { BRAND } from "@/lib/brand";

import Link from "next/link";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  ArrowUpRight,
  Download,
  Layers3,
  Plus,
  ShieldCheck,
  Upload,
} from "lucide-react";
import type {
  AuditEvent,
  FeedbackRecord,
  ManagedRecord,
  RecordKind,
} from "@/lib/domain";
import AIStudio, { type AITranslationDraft } from "./AIStudio";
import SEOSettings from "./SEOSettings";
import TranslationsWorkspace from "./TranslationsWorkspace";
import GrowthWorkspace from "./GrowthWorkspace";
import ExtensionsWorkspace from "./ExtensionsWorkspace";
import CapabilitiesWorkspace from "./CapabilitiesWorkspace";
import EditorsWorkspace from "./EditorsWorkspace";
import PerformanceWorkspace from "./PerformanceWorkspace";
import UpgradeWorkspace from "./UpgradeWorkspace";
import AppleCandidate from "./AppleCandidate";
import AdmissionPanel from "./AdmissionPanel";
import SiteAppearance from "./SiteAppearance";
import AppSubmissionsWorkspace from "./AppSubmissionsWorkspace";
import SourceMaintenance from "./SourceMaintenance";
import RecordEditor, {
  KIND_LABELS,
  STATUS_LABELS,
  type SavePayload,
  type EditorPatch,
} from "./RecordEditor";

type WorkspaceData = {
 defaultSourceLocale?:string;runtimeLocalePacks?:unknown;
 pagination?:{total:number;page:number;pages:number;pageSize:number};counts?:Record<string,number>;
  records: ManagedRecord[];
  feedback: FeedbackRecord[];
  audit: AuditEvent[];
};
type Session = { authenticated: boolean; configured: boolean; principal?: { id: string; name: string; role: "owner" | "editor" | "publisher" | "analyst" } | null };
type Preview = {
  mode: "import" | "backup";
  data: unknown;
  count: number;
  lines: string[];
};
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function api<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    credentials: "same-origin",
  });
  const data = await response
    .json()
    .catch(() => ({ error: "Sunucu yanıtı okunamadı." }));
  if (!response.ok)
    throw new ApiError(
      data.error || `İşlem tamamlanamadı (${response.status}).`,
      response.status,
    );
  return data as T;
}
const recordName = (record: ManagedRecord) =>
  "name" in record.data ? record.data.name : record.data.title;
export default function AdminWorkspace(){
 const [adminLocale,setAdminLocale]=useState("en");
 useEffect(()=>{try{const stored=localStorage.getItem("wexashelf.admin.locale");if(stored&&localeRegistry[stored])setAdminLocale(stored);}catch{}},[]);
 useEffect(()=>{const previous=document.documentElement.lang;document.documentElement.lang=adminLocale;return()=>{document.documentElement.lang=previous;};},[adminLocale]);
 return <LocaleProvider locale={adminLocale}><AdminWorkspaceContent adminLocale={adminLocale} onLocaleChange={value=>{setAdminLocale(value);try{localStorage.setItem("wexashelf.admin.locale",value);}catch{}}}/></LocaleProvider>;
}
function AdminFrame({ authenticated, ...props }: AdminShellProps & { authenticated: boolean }) {
 return authenticated ? <AdminShell {...props} /> : <>{props.children}</>;
}
function AdminWorkspaceContent({adminLocale,onLocaleChange}:{adminLocale:string;onLocaleChange:(value:string)=>void}) {
 const {t,intlLocale}=useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState("owner");
  const [password, setPassword] = useState("");
  const [loginCode,setLoginCode]=useState("");
  const [workspace, setWorkspace] = useState<WorkspaceData>({
    records: [],
    feedback: [],
    audit: [],
  });
  const [tab, setTab] = useState<
    | "overview"
    | "records"
    | "feedback"
    | "transfer"
    | "appearance"
    | "submissions"
    | "admission"
    | "sources"
    | "ai"
    | "seo"
    | "translations"
    | "growth"
    | "extensions"
    | "language-packs"
    | "system-health"
    | "security"
    | "backup-transfer"
    | "capabilities"
    | "editors"
    | "performance"
    | "upgrade"
  >("overview");
  const [aiPatch, setAiPatch] = useState<EditorPatch | null>(null);
  const [translationPatch, setTranslationPatch] = useState<(AITranslationDraft & { token: number }) | null>(null);
  const [kind, setKind] = useState<RecordKind>("app");
  const [selected, setSelected] = useState<ManagedRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [query, setQuery] = useState("");
  const recordFilter=useRef({q:"",kind:"app" as RecordKind,page:1});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState<ManagedRecord[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [conflict, setConflict] = useState(false);
  const dirtyChange = useCallback((value: boolean) => setDirty(value), []);
  const translationPatchConsumed = useCallback(() => setTranslationPatch(null), []);
  const isOwner = session?.principal?.role === "owner";
  const ownerTabs = new Set(["system-health", "ai", "admission", "sources", "appearance", "submissions", "extensions", "transfer", "editors", "performance", "upgrade", "language-packs", "security", "backup-transfer"]);
  const translationAuthLost = useCallback(() => {
    setSession(previous => previous ? { ...previous, authenticated: false } : null);
  }, []);
  const load = useCallback(async () => {
    const params=new URLSearchParams({q:recordFilter.current.q,kind:recordFilter.current.kind,page:String(recordFilter.current.page)});
    const result = await api<WorkspaceData>(`/api/admin?${params}`);
    registerRuntimeLocalePacks(result.runtimeLocalePacks);
    setWorkspace(result);
    return result;
  }, []);
  const fail = useCallback((caught: unknown) => {
    if (caught instanceof ApiError && caught.status === 401)
      setSession((previous) =>
        previous ? { ...previous, authenticated: false } : null,
      );
    setError(caught instanceof Error ? caught.message : "İşlem tamamlanamadı.");
  }, []);
  useEffect(() => {
    api<Session>("/api/admin/session")
      .then(async (result) => {
        setSession(result);
        if (result.authenticated) await load();
      })
      .catch(fail);
  }, [load, fail]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const discard = () =>
    !dirty ||
    window.confirm(
      t("Kaydedilmemiş değişiklikler var. Bu değişikliklerden vazgeçilsin mi?"),
    );
  function selectRecord(
    record: ManagedRecord | null,
    nextKind: RecordKind = kind,
  ) {
    if (busy || !discard()) return;
    setAiPatch(null);
    setSelected(record);
    setKind(nextKind);
    setEditing(true);
    setDirty(false);
    setHistory([]);
    setConflict(false);
    setError("");
    setSuccess("");
    setEditorKey((value) => value + 1);
    setTab("records");
  }
  function changeTab(next: typeof tab): boolean {
    if (busy) return false;
    const editorTransition = ["records", "ai"].includes(tab) && ["records", "ai"].includes(next);
    if (next !== tab && !editorTransition && !discard()) return false;
    if (next !== tab && !editorTransition) {
      setDirty(false);
      setEditing(false);
    }
    setTab(next);
    setError("");
    setSuccess("");
    return true;
  }
  async function act(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await fn();
    } catch (caught) {
      fail(caught);
    } finally {
      setBusy(false);
    }
  }
  async function save(payload: SavePayload) {
    setBusy(true);
    setError("");
    setSuccess("");
    setConflict(false);
    let saved = false;
    try {
      const result = await api<{ record: ManagedRecord }>(
        "/api/admin/records",
        payload,
      );
      setAiPatch(null);
      setSelected(result.record);
      setDirty(false);
      setEditorKey((value) => value + 1);
      saved = true;
      setSuccess(
        t("Kayıt kaydedildi · {p0} · Sürüm {p1}",{p0:t(STATUS_LABELS[result.record.status]),p1:result.record.revision}),
      );
      await load();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        setConflict(!!selected);
        setError(
          selected
            ? "Bu kayıt başka bir oturumda değişti. Formdaki değişikliklerin korunuyor. Güncel sürümü yüklemeden önce değişikliklerini kopyala."
            : "Bu kimlikte bir kayıt zaten var. Yeni bir kimlik seçin veya mevcut kaydı listeden açın; formdaki değişiklikleriniz korunuyor.",
        );
      } else fail(caught);
    } finally {
      setBusy(false);
    }
    return saved;
  }
  async function upload(file: File | undefined, mode: Preview["mode"]) {
    if (!file) return;
    setPreview(null);
    await act(async () => {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("JSON dosyası en fazla 5 MB olabilir.");
      let data: unknown;
      try {
        data = JSON.parse(await file.text());
      } catch {
        throw new Error("Dosya geçerli JSON içermiyor.");
      }
      if (mode === "import") {
        const records = Array.isArray(data)
          ? data
          : (data as { records?: unknown })?.records;
        if (!Array.isArray(records) || !records.length || records.length > 100)
          throw new Error(
            "İçe aktarma 1–100 kayıt içeren bir dizi veya { records: [...] } nesnesi olmalıdır.",
          );
        const result = await api<{
          valid: boolean;
          errors: string[];
          records: ManagedRecord[];
        }>("/api/admin/import", { records, dryRun: true });
        if (!result.valid) throw new Error(result.errors.join("\n"));
        setPreview({
          mode,
          data: records,
          count: records.length,
          lines: records.map(
            (record) =>
              `${record.kind || "?"} · ${record.data?.id || record.id || "?"} · ${record.data?.name || record.data?.title || ""}`,
          ),
        });
      } else {
        const result = await api<{ valid: boolean; count: number }>(
          "/api/admin/restore-backup",
          { backup: data, dryRun: true },
        );
        if (!result.valid) throw new Error("Yedek doğrulanamadı.");
        const records = (data as { records?: ManagedRecord[] }).records;
        setPreview({
          mode,
          data,
          count: result.count,
          lines: Array.isArray(records)
            ? records
                .slice(0, 100)
                .map(
                  (record) =>
                    `${record.kind} · ${record.id} · ${recordName(record)}`,
                )
            : [],
        });
      }
    });
  }
  async function applyPreview() {
    if (!preview) return;
    await act(async () => {
      if (
        preview.mode === "backup" &&
        !window.confirm(
          t("Mevcut içerikler, sürümler ve bildirimler yedekle değiştirilecek; yedekte olmayanlar kaldırılacak. Kaynak yenileme adayları ve işlem geçmişi temizlenecek. Güncel yedeği indirdin mi? Geri yükleme uygulansın mı?"),
        )
      )
        return;
      const result =
        preview.mode === "import"
          ? await api<{ imported: number; valid: boolean; errors: string[] }>(
              "/api/admin/import",
              { records: preview.data, dryRun: false },
            )
          : await api<{ restored: number }>("/api/admin/restore-backup", {
              backup: preview.data,
              dryRun: false,
            });
      if ("valid" in result && !result.valid)
        throw new Error(result.errors.join("\n"));
      setPreview(null);
      setSuccess(
        "imported" in result
          ? t("{p0} kayıt içe aktarıldı.",{p0:result.imported})
          : t("{p0} kayıt geri yüklendi.",{p0:result.restored}),
      );
      await load();
    });
  }
  const matching = workspace.records.filter(record=>record.kind===kind);
  const sourceApps = workspace.records.filter(
    (record) => record.kind === "app",
  );
  const oldSources = sourceApps.filter((record) => {
    const checked =
      "checkedAt" in record.data ? Date.parse(record.data.checkedAt) : NaN;
    return !Number.isFinite(checked) || Date.now() - checked > 90 * 86400000;
  });
  const nav = [
    ["overview", "Genel bakış"],
    ["records", "İçerikler"],
    ["submissions", "App submissions"],
    ["ai", "AI içerik stüdyosu"],
    ["seo", "SEO ayarları"],
    ["translations", "Languages and translations"],
    ["growth", "Content growth"],
    ["extensions", "Themes & modules"],
    ["language-packs", "Community language packs"],
    ["system-health", "System health"],
    ["security", "Account security"],
    ["backup-transfer", "Restore catalog backup"],
    ["capabilities", "Verified facts"],
    ["editors", "Editors & roles"],
    ["performance", "Performance"],
    ["upgrade", "Upgrade"],
    ["feedback", "Geri bildirim"],
    ["transfer", "İçe aktarma ve yedek"],
    ["appearance", "Site görünümü"],
    ["admission", "Kabul kuralları"],
    ["sources", "Kaynak bakımı"],
  ] as const;
  const logout = () => {
    if (!discard()) return;
    void act(async () => {
      await api("/api/admin/logout", {});
      setSession(previous => previous ? { ...previous, authenticated: false } : null);
      setWorkspace({ records: [], feedback: [], audit: [] });
      setSelected(null);
      setEditing(false);
      setDirty(false);
      setTab("overview");
      setPassword("");
    });
  };
  const authenticated = session?.authenticated === true;
  const ContentTag = authenticated ? "div" : "main";
  const visibleNavigation = nav.filter(([id]) => isOwner || !ownerTabs.has(id)).map(([id,label]) => ({id,label:t(label),count:id==='feedback'?workspace.feedback.filter(item=>item.status==='open').length:undefined}));
  return (
    <div className={`admin-root${authenticated ? "" : " admin-auth-root"}`} lang={adminLocale}>
      <AdminFrame authenticated={authenticated} items={visibleNavigation} activeId={tab}
        onNavigate={id => visibleNavigation.some(item=>item.id===id) && changeTab(id as typeof tab)}
        busy={busy} dirty={dirty} locale={adminLocale}
        locales={Object.values(localeRegistry).map(pack=>({code:pack.locale,label:pack.label}))}
        onLocaleChange={onLocaleChange} username={session?.principal?.name || username}
        roleLabel={t(({owner:"Owner",editor:"Editor",publisher:"Publisher",analyst:"Analyst"} as const)[session?.principal?.role || "editor"])}
        onRefresh={()=>void act(async()=>{await load();setSuccess(t("İçerik listesi yenilendi."));})}
        onLogout={logout} onLeave={()=>!busy && discard()}>
      {!authenticated &&
      <header className="admin-topbar"><label className="admin-field"><span>{t("Admin language")}</span><select value={adminLocale} onChange={e=>onLocaleChange(e.target.value)}>{Object.values(localeRegistry).map(pack=><option key={pack.locale} value={pack.locale}>{pack.label}</option>)}</select></label>
        <Link
          href="/admin"
          className="admin-brand"
          onClick={(event) => {
            if (!discard()) event.preventDefault();
          }}
        >
          <Layers3 size={26} />
          <span>
            {BRAND.name}<small>{t("İçerik yönetimi")}</small>
          </span>
        </Link>
        <div>
          <Link
            href="/"
            onClick={(event) => {
              if (!discard()) event.preventDefault();
            }}
          >{t("Siteyi aç")}<ArrowUpRight size={15} />
          </Link>
        </div>
      </header>}
      <ContentTag className="admin-main">
        {error && (
          <div className="admin-error" role="alert">
            {t(error)}
          </div>
        )}
        {success && (
          <div className="admin-success" role="status">
            {t(success)}
          </div>
        )}
        {!session ? (
          <section className="admin-login">
            <h1>{t("Yönetim alanı")}</h1>
            <p role="status">{t("Oturum kontrol ediliyor…")}</p>
            {error && (
              <button
                className="admin-button"
                onClick={() => location.reload()}
              >{t("Yeniden dene")}</button>
            )}
          </section>
        ) : !session.configured ? (
          <section className="admin-login">
            <ShieldCheck size={30} />
            <h1>{t("Yönetimi etkinleştir")}</h1>
            <p>{t("Bu kurulumda yönetici parolası henüz oluşturulmadı.")}</p>
            <p>{t("Sunucuda")}<code>{t("npm run admin:init")}</code>{t("komutunu çalıştırın. Oluşturulan parola dosyasını güvenli bir yerde saklayın.")}</p>
            <button className="admin-button" onClick={() => location.reload()}>{t("Kurulumu yeniden kontrol et")}</button>
          </section>
        ) : !session.authenticated ? (
          <form
            className="admin-login"
            onSubmit={(event) => {
              event.preventDefault();
              void act(async () => {
                await api("/api/admin/login", { username: username.trim(), password,code:loginCode });
                setPassword("");
                const currentSession = await api<Session>("/api/admin/session");
                setSession(currentSession);
                setTab("overview");
                await load();
              });
            }}
          >
            <ShieldCheck size={30} />
            <span className="admin-kicker">{t("Yalnız yetkili editörler")}</span>
            <h1>{t("Yönetim alanı")}</h1>
            <p>{t("Kayıtları düzenlemek ve yayın kontrolünü yönetmek için giriş yapın.")}</p>
            <label className="admin-field">
              <span>{t("Username")}</span>
              <input type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={80} value={username} onChange={(event) => setUsername(event.target.value)} required />
            </label>
            <label className="admin-field">
              <span>{t("Yönetici parolası")}</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label><label className="admin-field"><span>{t("One-time or recovery code (if enabled)")}</span><input value={loginCode} onChange={e=>setLoginCode(e.target.value)} autoComplete="one-time-code" maxLength={100}/></label>
            <button
              className="admin-button primary"
              disabled={busy}
              type="submit"
            >
              {busy ? t("Giriş yapılıyor…") : t("Giriş yap")}
            </button>
          </form>
        ) : (
          <>
            {["ai","sources"].includes(tab)&&<p className="admin-panel">{t("Targets below are limited to the current record page. Use Content search and pagination to load another selection.")}</p>}
            {tab === "ai" && <AIStudio defaultSourceLocale={workspace.defaultSourceLocale||"en"} records={workspace.records} busy={busy} onBusy={setBusy} onTranslationApply={(proposal) => {
              if (!discard()) return false;
              setTranslationPatch({ ...proposal, token: Date.now() });
              setTab("translations"); setDirty(false); setEditing(false);
              setError(""); setSuccess("");
              return true;
            }} onApply={(target, fields) => {
              const same = editing && (target ? selected?.id === target.id && kind === target.kind : !selected && kind === "article");
              if (busy) return false;
              if (same && dirty && !window.confirm(t("Seçilen AI alanları formdaki aynı alanların üzerine yazılacak. Diğer değişiklikler korunacak. Uygulansın mı?"))) return false;
              if (!same && !discard()) return false;
              if (!same) {
                setSelected(target); setKind(target?.kind || "article"); setEditing(true);
                setEditorKey(value => value + 1); setHistory([]); setConflict(false);
              }
              setAiPatch({ token: Date.now(), fields }); setDirty(true); setTab("records");
              setError(""); setSuccess(t("AI önerisi kaydedilmemiş taslak forma uygulandı. İnceleyip Kaydet düğmesini kullanın."));
              return true;
            }} />}
            {tab === "seo" && <SEOSettings onDirty={dirtyChange} onBusy={setBusy} />}
            {tab === "translations" && <TranslationsWorkspace onDirty={dirtyChange} onBusy={setBusy} onAuthLost={translationAuthLost} initialDraft={translationPatch} onInitialDraftConsumed={translationPatchConsumed} />}
            {tab === "growth" && <GrowthWorkspace records={workspace.records} onDirty={dirtyChange} onBusy={setBusy} onAuthLost={translationAuthLost} />}
            {tab === "extensions" && <ExtensionsWorkspace onManageSubmissions={() => changeTab("submissions")} />}
            {tab === "submissions" && isOwner && <AppSubmissionsWorkspace onDirty={dirtyChange} onBusy={setBusy} onAuthLost={translationAuthLost} onRecordsChanged={() => { void load().catch(fail); }} onOpenDraft={record => selectRecord(record, "app")} />}
            {tab === "language-packs" && <LanguagePacksWorkspace />}
            {tab === "system-health" && <SystemHealthWorkspace onBusy={setBusy} onAuthLost={translationAuthLost}/>}
            {tab === "security" && <AccountSecurityWorkspace onBusy={setBusy} onAuthLost={translationAuthLost}/>}
            {tab === "backup-transfer" && <BackupRestoreWorkspace onBusy={setBusy} onAuthLost={translationAuthLost} onRestored={()=>{void load().catch(fail);}}/>}
            {tab === "capabilities" && <CapabilitiesWorkspace onDirty={dirtyChange} onBusy={setBusy} onAuthLost={translationAuthLost} />}
            {tab === "editors" && isOwner && <EditorsWorkspace />}
            {tab === "performance" && isOwner && <PerformanceWorkspace />}
            {tab === "upgrade" && isOwner && <UpgradeWorkspace onBusy={setBusy} onAuthLost={translationAuthLost} />}
            {tab === "sources" && (
              <SourceMaintenance
                records={workspace.records}
                onApplied={load}
                onBusy={setBusy}
                onAuthLost={() =>
                  setSession((previous) =>
                    previous ? { ...previous, authenticated: false } : null,
                  )
                }
                onEdit={(record) => selectRecord(record, "app")}
              />
            )}
            {tab === "admission" && (
              <AdmissionPanel onDirty={dirtyChange} onBusy={setBusy} />
            )}
            {tab === "appearance" && (
              <SiteAppearance onDirty={dirtyChange} onBusy={setBusy} />
            )}
            {tab === "overview" && (
              <>
                <section
                  className="admin-metrics"
                  aria-label={t("Kayıt durumu özeti")}
                >
                  {Object.entries(STATUS_LABELS).map(([status, label]) => (
                    <div key={status}>
                      <span>{t(label)}</span>
                      <strong>
                        {
                          workspace.counts?.[status] ?? workspace.records.filter(
                            (record) => record.status === status,
                          ).length
                        }
                      </strong>
                    </div>
                  ))}
                </section>
                <div className="admin-overview-grid">
                  <section className="admin-panel">
                    <h2>{t("Kaynak güncelliği")}</h2><p>{t("Freshness checks below cover only the currently loaded record page.")}</p>
                    <p>{t("Uygulama kaynaklarında son kontrolden itibaren 90 gün eşiği kullanılır. Bu sayı kaynakların hâlâ doğru olduğunu kanıtlamaz.")}</p>
                    <div className="admin-source-count">
                      {oldSources.length}
                      <span>{t("kayıt yeniden incelenmeli")}</span>
                    </div>
                    {oldSources.slice(0, 8).map((record) => (
                      <button
                        className="admin-row-link"
                        key={`${record.kind}-${record.id}`}
                        onClick={() => selectRecord(record, record.kind)}
                      >
                        <span>{recordName(record)}</span>
                        <small>
                          {"checkedAt" in record.data
                            ? record.data.checkedAt
                            : t("Tarih yok")}
                        </small>
                      </button>
                    ))}
                    {!oldSources.length && (
                      <p>{t("Bu eşikte bekleyen uygulama kaynağı yok.")}</p>
                    )}
                  </section>
                  <section className="admin-panel">
                    <h2>{t("Son işlemler")}</h2>
                    <div className="admin-audit">
                      {workspace.audit.slice(0, 12).map((event) => (
                        <div key={event.id}>
                          <strong>{t(activityLabel(event.action))}</strong>
                          <time dateTime={event.createdAt}>
                            {new Date(event.createdAt).toLocaleString(intlLocale)}
                          </time>
                          <details>
                            <summary>{t("Activity details")}</summary>
                            <p><code>{event.action}</code> · {event.subject}</p>
                            {event.detail && <p>{event.detail}</p>}
                          </details>
                        </div>
                      ))}
                      {!workspace.audit.length && <p>{t("Henüz işlem kaydı yok.")}</p>}
                    </div>
                  </section>
                </div>
              </>
            )}
            {(tab === "records" || tab === "ai") && (
              <div style={tab === "ai" ? { display: "none" } : undefined} className="admin-content-grid">
                <aside className="admin-records">
                  <div className="admin-kind-tabs">
                    {Object.entries(KIND_LABELS).map(([value, label]) => (
                      <button
                        key={value}
                        aria-pressed={kind === value}
                        disabled={busy}
                        onClick={() => {
                          if (!discard()) return;
                          setAiPatch(null);
                          setKind(value as RecordKind);
                          recordFilter.current={q:query,kind:value as RecordKind,page:1};
                          void act(async()=>{await load();});
                          setEditing(false);
                          setDirty(false);
                          setSelected(null);
                        }}
                      >
                        {t(label)}
                      </button>
                    ))}
                  </div>
                  <label className="admin-field">
                    <span>{t("Kayıtlarda ara")}</span>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={t("Başlık veya kimlik")}
                      onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();recordFilter.current={q:query,kind,page:1};void act(async()=>{await load();});}}}
                    />
                  </label>
                  <button className="admin-button" disabled={busy} onClick={()=>{recordFilter.current={q:query,kind,page:1};void act(async()=>{await load();});}}>{t("Search catalog records")}</button>
                  {workspace.pagination&&<nav aria-label={t("Record pages")}><p>{t("Matching records")}: {workspace.pagination.total} · {t("Page")} {workspace.pagination.page} / {Math.max(1,workspace.pagination.pages)}</p><button className="admin-button" disabled={busy||workspace.pagination.page<=1} onClick={()=>{recordFilter.current.page=workspace.pagination!.page-1;void act(async()=>{await load();});}}>{t("Previous page")}</button><button className="admin-button" disabled={busy||workspace.pagination.page>=workspace.pagination.pages} onClick={()=>{recordFilter.current.page=workspace.pagination!.page+1;void act(async()=>{await load();});}}>{t("Next page")}</button></nav>}
                  <button
                    className="admin-button primary"
                    disabled={busy}
                    onClick={() => selectRecord(null)}
                  >
                    <Plus size={16} />{t("Yeni")}{" "}{t(KIND_LABELS[kind])}
                  </button>
                  <div className="admin-record-list">
                    {matching.map((record) => (
                      <button
                        key={record.id}
                        disabled={busy}
                        className={
                          selected?.id === record.id && editing
                            ? "selected"
                            : ""
                        }
                        onClick={() => selectRecord(record)}
                      >
                        <strong>{recordName(record) || record.id}</strong>
                        <span>{record.id}</span>
                        <small>
                          {t(STATUS_LABELS[record.status])}{" "}{t("· v")}{" "}{record.revision}
                        </small>
                      </button>
                    ))}
                    {!matching.length && <p>{t("Bu filtrede kayıt yok.")}</p>}
                  </div>
                </aside>
                <section className="admin-panel admin-editor-panel">
                  {editing ? (
                    <>
                      {conflict && (
                        <div className="admin-conflict">
                          <p>{t("Güncel sürümü yüklemek formdaki değişiklikleri kaldırır.")}</p>
                          <button
                            className="admin-button"
                            onClick={() => {
                              if (!discard()) return;
                              void act(async () => {
                                await load();
                                const record = selected?(await api<{record:ManagedRecord}>(`/api/admin/record?${new URLSearchParams({kind,id:selected.id})}`)).record:null;
                                if (record) {
                                  setAiPatch(null);
                                  setSelected(record);
                                  setEditorKey((value) => value + 1);
                                  setDirty(false);
                                  setConflict(false);
                                }
                              });
                            }}
                          >{t("Güncel sürümü yükle")}</button>
                        </div>
                      )}
                      <RecordEditor
                        key={`${kind}-${editorKey}`}
                        kind={kind}
                        defaultSourceLocale={workspace.defaultSourceLocale||"en"}
                        aiPatch={aiPatch}
                        record={selected}
                        busy={busy}
                        onSave={save}
                        onDirty={dirtyChange}
                        history={history}
                        onHistory={() =>
                          void act(async () => {
                            if (!selected) return;
                            const result = await api<{
                              revisions: ManagedRecord[];
                            }>(
                              `/api/admin/history?kind=${kind}&id=${encodeURIComponent(selected.id)}`,
                            );
                            setHistory(result.revisions);
                            if (!result.revisions.length)
                              setSuccess(t("Bu kaydın önceki sürümü yok."));
                          })
                        }
                        onRestore={(revision) => {
                          if (
                            !selected ||
                            !discard() ||
                            !window.confirm(
                              t("Sürüm {p0} yeni bir revizyon olarak geri yüklensin mi?",{p0:revision}),
                            )
                          )
                            return;
                          void act(async () => {
                            await api("/api/admin/restore", {
                              kind,
                              id: selected.id,
                              revision,
                            });
                            await load();
                            setSelected((await api<{record:ManagedRecord}>(`/api/admin/record?${new URLSearchParams({kind,id:selected.id})}`)).record);
                            setAiPatch(null);
                            setDirty(false);
                            setHistory([]);
                            setEditorKey((value) => value + 1);
                            setSuccess(t("Önceki sürüm geri yüklendi."));
                          });
                        }}
                      />
                    </>
                  ) : (
                    <div className="admin-empty">
                      <Layers3 size={32} />
                      <h2>{t("Bir kayıtla başla.")}</h2>
                      <p>{t("Soldan mevcut içeriği seç veya yeni kayıt oluştur.")}</p>
                    </div>
                  )}
                </section>
              </div>
            )}
            {tab === "feedback" && (
              <section className="admin-panel">
                <h2>{t("Okuyucu bildirimleri")}</h2>
                <p>{t("Kaynakta doğruladıktan sonra bildirimin durumunu güncelleyin.")}</p>
                <div className="admin-feedback">
                  {workspace.feedback.map((item) => (
                    <article key={item.id}>
                      <div>
                        <span className="admin-kicker">{t("#")}{" "}{item.id}{" "}{t("·")}{" "}{item.appId}{" "}{t("·")}{" "}{item.field}
                        </span>
                        <p>{item.message}</p>
                        <time>
                          {new Date(item.createdAt).toLocaleString(intlLocale)}
                        </time>
                      </div>
                      <label className="admin-field">
                        <span>{t("Bildirim #")}{" "}{item.id}{" "}{t("durumu")}</span>
                        <select
                          disabled={busy}
                          value={item.status}
                          onChange={(event) =>
                            void act(async () => {
                              await api("/api/admin/feedback", {
                                id: item.id,
                                status: event.target.value,
                              });
                              await load();
                              setSuccess(t("Bildirim durumu güncellendi."));
                            })
                          }
                        >
                          <option value="open">{t("Açık")}</option>
                          <option value="resolved">{t("Çözüldü")}</option>
                          <option value="dismissed">{t("Kapatıldı")}</option>
                        </select>
                      </label>
                    </article>
                  ))}
                  {!workspace.feedback.length && (
                    <p>{t("Henüz okuyucu bildirimi yok.")}</p>
                  )}
                </div>
              </section>
            )}
            {tab === "transfer" && (
              <>
                <AppleCandidate />
                <div className="admin-transfer-grid">
                  <section className="admin-panel">
                    <Upload size={24} />
                    <h2>{t("JSON içe aktar")}</h2>
                    <p>{t("Bir seferde en fazla 100 kayıt. Dosya önce sunucuda doğrulanır; önizlemeyi kabul edene kadar kayıt yapılmaz.")}</p>
                    <label className="admin-field">
                      <span>{t("İçe aktarılacak JSON dosyası")}</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        disabled={busy}
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          event.currentTarget.value = "";
                          void upload(file, "import");
                        }}
                      />
                    </label>
                    <details>
                      <summary>{t("Beklenen kayıt biçimi")}</summary>
                      <pre>
                        {JSON.stringify(
                          [
                            {
                              kind: "app",
                              data: {
                                id: "uygulama-kimligi",
                                name: t("Uygulama adı"),
                              },
                              status: "draft",
                              seoApproved: false,
                            },
                          ],
                          null,
                          2,
                        )}
                      </pre>
                      <p>{t("Yukarıdaki örnek yalnız zarfı gösterir. data alanı tam uygulama, yazı veya liste şemasını içermelidir. Yalnız yeni kimlikler alınır; mevcut kayıtları içerik düzenleyicisinden güncelleyin. İçe aktarılan kayıtlar taslak olarak oluşturulur.")}</p>
                    </details>
                  </section>
                  <section className="admin-panel">
                    <Download size={24} />
                    <h2>{t("Yedek ve geri yükleme")}</h2>
                    <p>{t("İçerik yedeğini indir; geri yüklemeden önce dosyayı doğrula ve kapsamını incele. Geri yükleme mevcut içerikleri, sürümleri ve bildirimleri yedekle değiştirir; yedekte olmayanları kaldırır. Kaynak yenileme adayları ve yenileme geçmişi temizlenir; uygulanan mağaza verileri içerik yedeğinde korunur.")}</p>
                    <a
                      className="admin-button"
                      href="/api/admin/backup"
                      download="uygulama-rehberi-yedek.json"
                    >{t("İçerik yedeğini indir")}</a>
                    <label className="admin-field">
                      <span>{t("Geri yüklenecek yedek dosyası")}</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        disabled={busy}
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          event.currentTarget.value = "";
                          void upload(file, "backup");
                        }}
                      />
                    </label>
                  </section>
                </div>
                {preview && (
                  <section className="admin-panel admin-preview">
                    <span className="admin-kicker">{t("Henüz uygulanmadı")}</span>
                    <h2>
                      {preview.mode === "import"
                        ? t("İçe aktarma")
                        : t("Yedek geri yükleme")}{" "}{t("önizlemesi")}</h2>
                    <p>
                      {preview.count}{" "}{t("kayıt doğrulandı. Kabul etmeden önce kimlikleri ve kapsamı inceleyin.")}</p>
                    {preview.mode === "backup" && (
                      <p className="admin-error">{t("Mevcut")}{" "}{workspace.records.length}{" "}{t("kayıt yedekteki")}{" "}
                        {preview.count}{" "}{t("kayıtla değiştirilecek. Sürüm geçmişi ve bildirimler de yedekten alınır; yedekte bulunmayan veriler kaldırılır.")}</p>
                    )}
                    <ul>
                      {preview.lines.map((line, index) => (
                        <li key={index}>{line}</li>
                      ))}
                    </ul>
                    <div className="admin-editor-actions">
                      <button
                        className="admin-button primary"
                        disabled={busy}
                        onClick={() => void applyPreview()}
                      >{t("Önizlemeyi kabul et ve")}{" "}
                        {preview.mode === "import" ? t("içe aktar") : t("geri yükle")}
                      </button>
                      <button
                        className="admin-button"
                        disabled={busy}
                        onClick={() => setPreview(null)}
                      >{t("Vazgeç")}</button>
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </ContentTag>
      </AdminFrame>
    </div>
  );
}
