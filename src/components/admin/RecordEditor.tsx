"use client";
import {useI18n} from "@/lib/i18n";
import {localeRegistry} from "@/lib/i18n-registry";
import { useEffect, useId, useRef, useState } from "react";
import ArticleContentEditor from "./ArticleContentEditor";
import {insertArticleReference} from "@/lib/article-insertion";
import EditorAppPicker from "./EditorAppPicker";
import AppIconUpload from "./AppIconUpload";
import AppScreenshotEditor from "./AppScreenshotEditor";
import type {InlineArticleImage} from "../discovery/ArticleContent";
import StoreIdentityEditor from "./StoreIdentityEditor";
import type { StoreIdentity } from "@/lib/store-identities";
import { Save, History, RotateCcw } from "lucide-react";
import { CATEGORIES, PLATFORM_LABELS } from "@/lib/catalog";
import type {
  ArticleImage,
  ManagedRecord,
  PublicationStatus,
  RecordKind,
} from "@/lib/domain";

export const STATUS_LABELS: Record<PublicationStatus, string> = {
  draft: "Taslak",
  review: "İncelemede",
  scheduled: "Zamanlanmış",
  published: "Yayında",
  archived: "Arşivde",
};
export const KIND_LABELS: Record<RecordKind, string> = {
  app: "Uygulama",
  article: "Yazı",
  list: "Editoryal liste",
};
const date = () => new Date().toISOString().slice(0, 10);
export function blankRecord(kind: RecordKind,sourceLocale="en") {
  if (kind === "app")
    return {
      id: "",
      name: "",
      tagline: "",
      description: "",
      category: "productivity",
      platforms: ["android"],
      icon: "",
      color: "#65d8be",
      website: "",
      storeLinks: {},
      pricingLabel: sourceLocale==="tr"?"Planları incele":"Review plans",
      featureNotes: [],
      sourceUrl: "",
      checkedAt: date(),
      publisher: "",
      tags: [],
      aliases: [],
      pricingModel: "unknown",
      facts: [],
      plans: [],
      storeMetrics: [],
    };
  if (kind === "article")
    return {
      id: "",
      title: "",
      summary: "",
      kind: "guide",
      author: "",
      sections: [{ heading: "", paragraphs: [""] }],
      appIds: [],
      sources: [],
      method: "source-research",
      publishedAt: date(),
      updatedAt: date(),
    };
  return {
    id: "",
    title: "",
    summary: "",
    period: "evergreen",
    startDate: date(),
    endDate: "",
    entries: [{ appId: "", reason: "" }],
    method:
      sourceLocale==="tr"?"Editoryal değerlendirme; indirme veya popülerlik sıralaması değildir.":"Editorial assessment; not a download or popularity ranking.",
  };
}
type JsonData = Record<string, unknown>;
export type SavePayload = {
  kind: RecordKind;
  data: JsonData;
  status: PublicationStatus;
  revision?: number;
  seoApproved: boolean;
  publishAt: string | null;
  reviewNote: string;
  admissionException?: string;
  sourceLocale?:string;
};
export type EditorPatch = { token: number; fields: Record<string, unknown> };
type Props = {
  defaultSourceLocale?:string;
  aiPatch?: EditorPatch | null;
  kind: RecordKind;
  record: ManagedRecord | null;
  busy: boolean;
  onSave: (payload: SavePayload) => Promise<boolean>;
  onDirty: (dirty: boolean) => void;
  onHistory: () => void;
  history: ManagedRecord[];
  onRestore: (revision: number) => void;
};

function TextField({
  label,
  value,
  onChange,
  required = false,
  multiline = false,
  type = "text",
  readOnly = false,
  hint,
  onTextSelection,
  onTextBlur,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  type?: string;
  readOnly?: boolean;
  hint?: string;
  onTextSelection?: (field: HTMLTextAreaElement) => void;
  onTextBlur?: (field: HTMLTextAreaElement) => void;
}) {
 const {t,intlLocale}=useI18n();

  const id = useId();
  return (
    <div className={`admin-field ${multiline ? "wide" : ""}`}>
      <label htmlFor={id}>
        {t(label)}
        {required && " *"}
      </label>
      {multiline ? (
        <textarea
          id={id}
          aria-describedby={hint ? `${id}-hint` : undefined}
          value={value}
          required={required}
          onChange={(event) => onChange(event.target.value)}
          onSelect={event => onTextSelection?.(event.currentTarget)}
          onFocus={event => onTextSelection?.(event.currentTarget)}
          onBlur={event => onTextBlur?.(event.currentTarget)}
          rows={4}
        />
      ) : (
        <input
          id={id}
          aria-describedby={hint ? `${id}-hint` : undefined}
          value={value}
          type={type}
          required={required}
          readOnly={readOnly}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {hint && <small id={`${id}-hint`}>{t(hint)}</small>}
    </div>
  );
}
export default function RecordEditor({
  defaultSourceLocale="en",
  kind,
  record,
  busy: parentBusy,
  onSave,
  onDirty,
  onHistory,
  history,
  onRestore,
  aiPatch,
}: Props) {
  const {t,intlLocale}=useI18n();
  const [mediaBusy,setMediaBusy]=useState(false);
  const busy=parentBusy||mediaBusy;
  const [sourceLocale,setSourceLocale]=useState((record as (ManagedRecord & {sourceLocale?:string})|null)?.sourceLocale||(record?"tr":defaultSourceLocale));
  const [data, setData] = useState<JsonData>(() =>
    record
      ? (structuredClone(record.data) as unknown as JsonData)
      : blankRecord(kind,sourceLocale),
  );
  const [status, setStatus] = useState<PublicationStatus>(
    record?.status || "draft",
  );
  const [seoApproved, setSeoApproved] = useState(record?.seoApproved || false);
  const [publishAt, setPublishAt] = useState(() => {
    if (!record?.publishAt) return "";
    const value = new Date(record.publishAt);
    return new Date(value.getTime() - value.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [admissionException, setAdmissionException] = useState(
    (record as (ManagedRecord & { admissionException?: string }) | null)
      ?.admissionException || "",
  );
  const [reviewNote, setReviewNote] = useState(record?.reviewNote || "");
  const [listText, setListText] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      ["tags", "aliases", "appIds"].map((key) => [
        key,
        (
          ((record?.data as unknown as JsonData | undefined)?.[
            key
          ] as string[]) || []
        ).join(", "),
      ]),
    ),
  );
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [advanced, setAdvanced] = useState(() =>
    Object.fromEntries(
      (kind === "app"
        ? ["facts", "plans", "featureNotes", "storeMetrics"]
        : ["sources"]
      ).map((key) => [
        key,
        JSON.stringify(
          (record?.data as unknown as JsonData | undefined)?.[key] || [],
          null,
          2,
        ),
      ]),
    ),
  );
  useEffect(() => {
    onDirty(dirty);
  }, [dirty, onDirty]);
  const appliedPatch = useRef<number | null>(null);
  useEffect(() => {
    if (!aiPatch || appliedPatch.current === aiPatch.token) return;
    appliedPatch.current = aiPatch.token;
    const allowed = kind === "app" ? ["name", "tagline", "description", "seo"] : kind === "article" ? ["title", "summary", "sections", "seo", "cover", ...(!record ? ["sources", "appIds", "method"] : [])] : ["title", "summary", "seo"];
    const fields = Object.fromEntries(Object.entries(aiPatch.fields).filter(([key]) => allowed.includes(key)));
    if (!Object.keys(fields).length) return;
    setData(previous => ({ ...previous, ...structuredClone(fields), ...(fields.seo ? { seo: { ...((previous.seo as object) || {}), ...((fields.seo as object) || {}) } } : {}) }));
    if (Array.isArray(fields.appIds)) setListText(previous => ({ ...previous, appIds: (fields.appIds as string[]).join(", ") }));
    if (Array.isArray(fields.sources)) setAdvanced(previous => ({ ...previous, sources: JSON.stringify(fields.sources, null, 2) }));
    setStatus("draft");
    setSeoApproved(false);
    setPublishAt("");
    setDirty(true);
  }, [aiPatch, kind, record]);
  const update = (key: string, value: unknown) => {
    setData((previous) => ({ ...previous, [key]: value }));
    setDirty(true);
  };
  const text = (key: string) =>
    typeof data[key] === "string" ? (data[key] as string) : "";
  const field = (
    key: string,
    label: string,
    options: Partial<Parameters<typeof TextField>[0]> = {},
  ) => (
    <TextField
      key={key}
      label={t(label)}
      value={text(key)}
      onChange={(value) => update(key, value)}
      {...options}
    />
  );
  const select = (
    key: string,
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <label className="admin-field">
      <span>{t(label)}</span>
      <select
        value={text(key)}
        onChange={(event) => update(key, event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
  const jsonFields =
    kind === "app"
      ? ["facts", "plans", "featureNotes", "storeMetrics"]
      : kind === "article"
        ? ["sources"]
        : [];
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if(busy)return;
    setError("");
    if (
      kind === "app" &&
      admissionException.trim() &&
      admissionException.trim().length < 20
    ) {
      setError(t("Editör istisnası gerekçesi en az 20 karakter olmalıdır."));
      return;
    }
    const next = { ...data };
    for (const key of kind === "app"
      ? ["tags", "aliases"]
      : kind === "article"
        ? ["appIds"]
        : [])
      next[key] = (listText[key] || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    try {
      for (const key of jsonFields) {
        next[key] = JSON.parse(advanced[key] || "[]");
        if (!Array.isArray(next[key]))
          throw new Error(t("{p0}: JSON dizisi kullanın.",{p0:key}));
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "JSON alanlarını kontrol edin.",
      );
      return;
    }
    if (status === "scheduled" && !publishAt) {
      setError(t("Zamanlanmış yayın için tarih ve saat seçin."));
      return;
    }
    const ok = await onSave({
      kind,
      sourceLocale,
      data: next,
      status,
      revision: record?.revision,
      seoApproved,
      reviewNote,
      ...(kind === "app"
        ? { admissionException: admissionException.trim() }
        : {}),
      publishAt: publishAt ? new Date(publishAt).toISOString() : null,
    });
    if (ok) setDirty(false);
  }
  const sections = (data.sections || []) as {
    heading: string;
    paragraphs: string[];
  }[];
  // Retain the exact section object and text; a replacement/removal invalidates the target.
  const [articleSection, setArticleSection] = useState(0);
  const articleTarget = useRef<{section: typeof sections[number]; index: number; field: HTMLTextAreaElement; text: string; start: number; end: number; record: ManagedRecord | null} | null>(null);
  function captureArticleSelection(index: number, field: HTMLTextAreaElement) {
    setArticleSection(index);
    articleTarget.current = {section: sections[index], index, field, text: field.value, start: field.selectionStart, end: field.selectionEnd, record};
  }
  function validArticleTarget() {
    const target = articleTarget.current;
    return target && target.record === record && target.field.isConnected && sections[target.index] === target.section && target.text === target.section.paragraphs.join("\n\n") ? target : null;
  }
  function insertAppReference(code: string) {
    const target = validArticleTarget();
    if (!target) { articleTarget.current = null; return false; }
    const inserted = insertArticleReference(target.text, target.start, target.end, code);
    const nextSection = {...target.section, paragraphs: inserted.text.split("\n\n")};
    update("sections", sections.map((item, index) => index === target.index ? nextSection : item));
    const nextTarget = {...target, section: nextSection, text: inserted.text, start: inserted.caret, end: inserted.caret};
    articleTarget.current = nextTarget;
    // Applying closes the picker synchronously and focuses its trigger before this frame.
    requestAnimationFrame(() => {
      if (
        articleTarget.current !== nextTarget ||
        nextTarget.record !== latestArticleRecord.current ||
        !nextTarget.field.isConnected ||
        latestArticleSections.current[nextTarget.index] !== nextTarget.section ||
        nextTarget.field.value !== nextTarget.text
      ) return;
      nextTarget.field.focus();
      nextTarget.field.setSelectionRange(nextTarget.start, nextTarget.end);
      articleTarget.current = nextTarget;
    });
    return true;
  }
  const latestArticleSections = useRef(sections); latestArticleSections.current = sections;
  const latestArticleRecord = useRef(record); latestArticleRecord.current = record;
  const entries = (data.entries || []) as { appId: string; reason: string }[];
  return (
    <form className="admin-editor" onSubmit={submit}><label className="admin-field"><span>{t("Source language")}</span><select value={sourceLocale} disabled={!!record||busy} onChange={e=>{setSourceLocale(e.target.value);setDirty(true);}}>{Object.values(localeRegistry).map(pack=><option key={pack.locale} value={pack.locale}>{pack.label}</option>)}</select><small>{t("Source language is fixed after creation. Legacy records without metadata use Turkish.")}</small></label>
      <fieldset className="admin-edit-fields" disabled={busy}>
        <div className="admin-panel-heading">
          <div>
            <span className="admin-kicker">
              {record ? t("Sürüm {p0}",{p0:record.revision}) : t("Yeni kayıt")}{" "}{t("·")}{" "}
              {t(KIND_LABELS[kind])}
            </span>
            <h2>
              {record
                ? "name" in record.data
                  ? record.data.name
                  : record.data.title
                : t("{p0} oluştur",{p0:t(KIND_LABELS[kind])})}
            </h2>
          </div>
          <span className={`admin-badge ${dirty ? "warning" : ""}`}>
            {dirty ? t("Kaydedilmemiş değişiklikler") : t("Değişiklik yok")}
          </span>
        </div>
        <div className="admin-form-grid">
          {field("id", t("Kayıt kimliği"), {
            required: true,
            readOnly: !!record,
            hint: t("Küçük harf, rakam ve tire. Kaydedildikten sonra değişmez."),
          })}
          {field(
            kind === "app" ? "name" : "title",
            kind === "app" ? t("Uygulama adı") : t("Başlık"),
            { required: true },
          )}
          {field(kind === "app" ? "tagline" : "summary", t("Kısa açıklama"), {
            required: true,
            multiline: true,
          })}
          <TextField label={t("SEO başlığı")} value={(data.seo as { title?: string } | undefined)?.title || ""} onChange={value => update("seo", { ...((data.seo as object) || {}), title: value })} />
          <TextField label={t("SEO açıklaması")} multiline value={(data.seo as { description?: string } | undefined)?.description || ""} onChange={value => update("seo", { ...((data.seo as object) || {}), description: value })} />
          <label className="admin-check"><input type="checkbox" checked={(data.seo as { noindex?: boolean } | undefined)?.noindex === true} onChange={event => update("seo", { ...((data.seo as object) || {}), noindex: event.target.checked })} />{t("Bu sayfayı arama sonuçlarından hariç tut (noindex)")}</label>
          {kind === "app" && (
            <>
              {field("description", t("Açıklama"), {
                required: true,
                multiline: true,
              })}
              {select(
                "category",
                "Kategori",
                CATEGORIES.filter((item) => item.id !== "all").map((item) => ({
                  value: item.id,
                  label: item.label,
                })),
              )}
              {field("publisher", t("Yayıncı"), { required: true })}
              <TextField
                label={t("Editör istisnası gerekçesi")}
                multiline
                value={admissionException}
                onChange={(value) => {
                  setAdmissionException(value);
                  setDirty(true);
                }}
                hint={t("İsteğe bağlı, en az 20 karakter. Mağaza eşiğini karşılamayan kaydı elle kabul etme gerekçesidir; eşik başarısı olarak gösterilmez. Boşaltmak istisnayı kaldırır.")}
              />
              <fieldset className="admin-field">
                <legend>{t("Platformlar")}</legend>
                <div className="admin-check-row">
                  {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                    <label key={value}>
                      <input
                        type="checkbox"
                        checked={(data.platforms as string[]).includes(value)}
                        onChange={(event) =>
                          update(
                            "platforms",
                            event.target.checked
                              ? [...(data.platforms as string[]), value]
                              : (data.platforms as string[]).filter(
                                  (item) => item !== value,
                                ),
                          )
                        }
                      />
                      {t(label)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <TextField
                label={t("Etiketler")}
                value={listText.tags}
                onChange={(value) => {
                  setListText((previous) => ({ ...previous, tags: value }));
                  setDirty(true);
                }}
                hint={t("Virgülle ayırın.")}
              />
              <TextField
                label={t("Alternatif arama adları")}
                value={listText.aliases}
                onChange={(value) => {
                  setListText((previous) => ({ ...previous, aliases: value }));
                  setDirty(true);
                }}
              />
              {field("icon", "Yerel ikon yolu", {
                required: true,
                hint: t("Örnek: /icons/uygulama.png. Uygulamanın kendi yerel ikonunu kullanın; bu alan dosya yüklemez."),
              })}
              <AppIconUpload name={String(data.name||"")} icon={String(data.icon||"")} disabled={busy} onBusy={setMediaBusy} onChange={icon=>{setData(previous=>({...previous,icon}));setDirty(true);}}/>
              <AppScreenshotEditor name={String(data.name||"")} screenshots={(data.screenshots || []) as ArticleImage[]} disabled={busy} onBusy={setMediaBusy} onDraftTouched={() => setDirty(true)} onChange={screenshots => update("screenshots", screenshots)} />
              {field("color", "Vurgu rengi", { type: "color" })}
              {field("website", t("Yayıncı sitesi"), {
                required: true,
                type: "url",
              })}
              {field("sourceUrl", "Resmî kaynak URL", {
                required: true,
                type: "url",
              })}
              {field("checkedAt", "Kaynak kontrol tarihi", {
                required: true,
                type: "date",
              })}
              {select(
                "pricingModel",
                t("Fiyatlandırma modeli"),
                [
                  ["unknown", t("Doğrulanmadı")],
                  ["free", t("Ücretsiz")],
                  ["freemium", t("Ücretsiz + ücretli")],
                  ["subscription", "Abonelik"],
                  ["one-time", t("Tek ödeme")],
                ].map(([value, label]) => ({ value, label })),
              )}
              {field("pricingLabel", t("Plan bağlantısı etiketi"))}
              <StoreIdentityEditor
                value={(data.storeIds || []) as StoreIdentity[]}
                onChange={(value) => update("storeIds", value)}
              />
              {Object.entries(PLATFORM_LABELS).map(([platform, label]) => (
                <TextField
                  key={platform}
                  label={t("{p0} resmî mağaza URL",{p0:label})}
                  type="url"
                  value={
                    (data.storeLinks as Record<string, string>)[platform] || ""
                  }
                  onChange={(value) => {
                    const links = {
                      ...(data.storeLinks as Record<string, string>),
                    };
                    if (value) links[platform] = value;
                    else delete links[platform];
                    update("storeLinks", links);
                  }}
                />
              ))}
            </>
          )}
          {kind === "article" && (
            <>
              {field("author", "Yazar", { required: true })}
              {!!data.cover && <>
                <TextField label={t("Kapak alternatif metni")} value={(data.cover as { alt?: string }).alt || ""} onChange={value => update("cover", { ...(data.cover as object), alt: value })} />
                <TextField label={t("Kapak açıklaması")} value={(data.cover as { caption?: string }).caption || ""} onChange={value => update("cover", { ...(data.cover as object), caption: value })} />
                <button type="button" className="admin-button subtle" onClick={() => { setData(previous => { const next = { ...previous }; delete next.cover; return next; }); setDirty(true); }}>{t("Kapağı kaldır")}</button>
              </>}

              {select(
                "kind",
                t("Yazı türü"),
                [
                  ["guide", "Rehber"],
                  ["comparison", t("Karşılaştırma")],
                  ["alternatives", "Alternatifler"],
                  ["review", t("İnceleme")],
                  ["news", "Haber"],
                ].map(([value, label]) => ({ value, label })),
              )}
              {select("method", t("Çalışma yöntemi"), [
                { value: "source-research", label: t("Kaynak araştırması") },
                {
                  value: "editor-tested",
                  label: t("Editör tarafından test edildi"),
                },
              ])}
              {field("publishedAt", t("Yazı yayın tarihi"), { type: "date" })}
              {field("updatedAt", t("Yazı güncelleme tarihi"), { type: "date" })}
              <EditorAppPicker label={t("İlgili uygulama kimlikleri")} multiple disabled={busy}
                value={(listText.appIds || "").split(",").map(id => id.trim()).filter(Boolean)}
                onChange={ids => { setListText(previous => ({ ...previous, appIds: ids.join(", ") })); setDirty(true); }} />
              <div className="wide admin-repeat">
                <h3>{t("Yazı bölümleri")}</h3>
                {sections.map((section, index) => (
                  <fieldset key={index}>
                    <legend>{t("Bölüm")}{" "}{index + 1}</legend>
                    <TextField
                      label={t("Bölüm {p0} başlığı",{p0:index + 1})}
                      value={section.heading}
                      onChange={(value) =>
                        update(
                          "sections",
                          sections.map((item, i) =>
                            i === index ? { ...item, heading: value } : item,
                          ),
                        )
                      }
                    />
                    <TextField
                      label={t("Bölüm {p0} paragrafları",{p0:index + 1})}
                      multiline
                      value={section.paragraphs.join("\n\n")}
                      onTextSelection={field => captureArticleSelection(index, field)}
                      onTextBlur={field => {
                        // A section choice may invalidate this field before it loses focus.
                        // Blur refreshes a live target but must never recreate a discarded one.
                        if (articleTarget.current?.field === field) captureArticleSelection(index, field);
                      }}
                      onChange={(value) =>
                        update(
                          "sections",
                          sections.map((item, i) =>
                            i === index
                              ? { ...item, paragraphs: value.split("\n\n") }
                              : item,
                          ),
                        )
                      }
                      hint={t("Paragraflar arasında boş satır bırakın.")}
                    />
                    <button
                      type="button"
                      className="admin-button subtle"
                      onClick={() =>
                        update(
                          "sections",
                          sections.filter((_, i) => i !== index),
                        )
                      }
                    >{t("Bölümü kaldır")}</button>
                  </fieldset>
                ))}
                <button
                  type="button"
                  className="admin-button"
                  onClick={() =>
                    update("sections", [
                      ...sections,
                      { heading: "", paragraphs: [""] },
                    ])
                  }
                >{t("Bölüm ekle")}</button>
              </div>
              <ArticleContentEditor onInsertApp={insertAppReference} selectedSection={articleSection} onSectionChange={index=>{setArticleSection(index);articleTarget.current=null;}} sections={sections} images={(data.images||[]) as InlineArticleImage[]} cover={data.cover as {assetId:string;alt:string;caption:string;aiGenerated?:boolean}|undefined} sourceLocale={sourceLocale} disabled={busy} onBusy={setMediaBusy} onDraftTouched={()=>setDirty(true)} onChange={patch=>{setData(previous=>({...previous,...patch}));setDirty(true);}}/>
            </>
          )}
          {kind === "list" && (
            <>
              {select("period", t("Dönem"), [
                { value: "week", label: "Hafta" },
                { value: "month", label: "Ay" },
                { value: "evergreen", label: t("Kalıcı seçki") },
              ])}
              {field("startDate", t("Başlangıç tarihi"), { type: "date" })}
              {field("endDate", t("Bitiş tarihi"), { type: "date" })}
              {field("method", t("Seçim yöntemi"), {
                multiline: true,
                required: true,
              })}
              <div className="wide admin-repeat">
                <h3>{t("Seçkideki uygulamalar")}</h3>
                {entries.map((entry, index) => (
                  <fieldset key={index}>
                    <legend>{t("Uygulama")}{" "}{index + 1}</legend>
                    <EditorAppPicker
                      label={t("Uygulama {p0} kimliği",{p0:index + 1})}
                      disabled={busy}
                      value={entry.appId ? [entry.appId] : []}
                      onChange={(ids) =>
                        update(
                          "entries",
                          entries.map((item, i) =>
                            i === index ? { ...item, appId: ids[0] || "" } : item,
                          ),
                        )
                      }
                    />
                    <TextField
                      label={t("Uygulama {p0} seçim nedeni",{p0:index + 1})}
                      multiline
                      value={entry.reason}
                      onChange={(value) =>
                        update(
                          "entries",
                          entries.map((item, i) =>
                            i === index ? { ...item, reason: value } : item,
                          ),
                        )
                      }
                    />
                    <button
                      type="button"
                      className="admin-button subtle"
                      onClick={() =>
                        update(
                          "entries",
                          entries.filter((_, i) => i !== index),
                        )
                      }
                    >{t("Uygulamayı kaldır")}</button>
                  </fieldset>
                ))}
                <button
                  type="button"
                  className="admin-button"
                  onClick={() =>
                    update("entries", [...entries, { appId: "", reason: "" }])
                  }
                >{t("Uygulama ekle")}</button>
              </div>
            </>
          )}
        </div>
        {!!jsonFields.length && (
          <details className="admin-advanced">
            <summary>
              {kind === "app"
                ? t("Özellikler, planlar ve kanıt alanları")
                : t("Yazı kaynakları")}{" "}{t("· JSON düzenleyici")}</summary>
            <p>{t("JSON dizileri sunucuda şema ve kaynak kurallarıyla doğrulanır. Bilinmeyen özellikleri doğrulanmış gibi işaretlemeyin.")}</p>
            {jsonFields.map((key) => (
              <TextField
                key={key}
                label={key}
                multiline
                value={advanced[key] || "[]"}
                onChange={(value) => {
                  setAdvanced((previous) => ({ ...previous, [key]: value }));
                  setDirty(true);
                }}
              />
            ))}
          </details>
        )}
        <fieldset className="admin-publication">
          <legend>{t("Yayın kontrolü")}</legend>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>{t("Kayıt durumu")}</span>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as PublicationStatus);
                  setDirty(true);
                }}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {t(label)}
                  </option>
                ))}
              </select>
            </label>
            <TextField
              label={t("Planlanan yayın (yerel saat)")}
              type="datetime-local"
              value={publishAt}
              onChange={(value) => {
                setPublishAt(value);
                setDirty(true);
              }}
            />
            <TextField
              label={t("İnceleme notu")}
              multiline
              value={reviewNote}
              onChange={(value) => {
                setReviewNote(value);
                setDirty(true);
              }}
            />
          </div>
          <label className="admin-check-row">
            <input
              type="checkbox"
              checked={seoApproved}
              onChange={(event) => {
                setSeoApproved(event.target.checked);
                setDirty(true);
              }}
            />{t("Başlık, açıklama, kaynaklar ve SEO alanlarını inceledim.")}</label>
          <p>{t("Yayın ve zamanlama kaynak ve içerik kontrollerinden geçer. SEO onayı yayın durumundan bağımsızdır; eksik kaynak bilgisinin yerine geçmez. İçerik değişince önceki onay kaldırılır: değişikliği kaydettikten sonra tekrar inceleyip onaylayın.")}</p>
        </fieldset>
        {error && (
          <p role="alert" className="admin-error">
            {t(error)}
          </p>
        )}
        <div className="admin-editor-actions">
          <button
            className="admin-button primary"
            disabled={busy}
            type="submit"
          >
            <Save size={16} />
            {busy ? t("Kaydediliyor…") : t("Kaydı kaydet")}
          </button>
          {record && (
            <button
              className="admin-button"
              type="button"
              onClick={onHistory}
              disabled={busy}
            >
              <History size={16} />{t("Sürüm geçmişi")}</button>
          )}
        </div>
        {!!history.length && (
          <section className="admin-history">
            <h3>{t("Önceki sürümler")}</h3>
            {history.map((item) => (
              <div key={item.revision}>
                <span>{t("Sürüm")}{" "}{item.revision}{" "}{t("·")}{" "}{t(STATUS_LABELS[item.status])}{" "}{t("·")}{" "}
                  {new Date(item.updatedAt).toLocaleString(intlLocale)}
                </span>
                <button
                  type="button"
                  className="admin-button"
                  disabled={busy || item.revision === record?.revision}
                  onClick={() => onRestore(item.revision)}
                >
                  <RotateCcw size={14} />{t("Bu sürümü geri yükle")}</button>
              </div>
            ))}
          </section>
        )}
      </fieldset>
    </form>
  );
}
