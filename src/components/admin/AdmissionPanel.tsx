"use client";
import {useI18n} from "@/lib/i18n";
import { useEffect, useState } from "react";
import { Check, Eye, RefreshCw, SlidersHorizontal } from "lucide-react";
import {
  validateAdmissionRules,
  type AdmissionRules,
  type AdmissionEvaluation,
} from "@/lib/admission";
import { PLATFORM_LABELS, type Platform } from "@/lib/catalog";

type Preview = {
  total: number;
  accepted: number;
  rejected: number;
  exceptions: number;
  items: ({ id: string; name: string } & AdmissionEvaluation)[];
};
type ResponseData = { rules: AdmissionRules; preview: Preview };
type Props = {
  onDirty: (value: boolean) => void;
  onBusy: (value: boolean) => void;
};
const states: Record<AdmissionEvaluation["state"], string> = {
  "not-configured": "Eşik kapalı",
  passed: "Eşiği karşılıyor",
  exception: "Editör istisnası",
  rejected: "Kabul edilmiyor",
};
export default function AdmissionPanel({ onDirty, onBusy }: Props) {
 const {t,intlLocale}=useI18n();

  const [current, setCurrent] = useState<AdmissionRules | null>(null);
  const [draft, setDraft] = useState<AdmissionRules | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [reviewed, setReviewed] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [conflict, setConflict] = useState(false);
  const dirty =
    !!current && !!draft && JSON.stringify(current) !== JSON.stringify(draft);
  useEffect(() => {
    onDirty(dirty);
  }, [dirty, onDirty]);
  useEffect(() => {
    onBusy(busy);
  }, [busy, onBusy]);
  useEffect(() => {
    let active = true;
    fetch("/api/admin/admission", { cache: "no-store" })
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok)
          throw new Error(value.error || "Kabul kuralları yüklenemedi.");
        const rules = validateAdmissionRules(value.rules);
        if (active) {
          setCurrent(rules);
          setDraft(structuredClone(rules));
          setPreview(value.preview);
        }
      })
      .catch((caught) => {
        if (active)
          setError(
            caught instanceof Error ? caught.message : "Kurallar yüklenemedi.",
          );
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
      onBusy(false);
    };
  }, [onBusy]);
  function update(next: AdmissionRules) {
    setDraft(next);
    setReviewed("");
    setPreview(null);
    setSuccess("");
    setError("");
  }
  async function load() {
    if (
      dirty &&
      !window.confirm(
        t("Güncel kuralları yüklemek bu taslağı kaldıracak. Devam edilsin mi?"),
      )
    )
      return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/admission", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Kurallar yüklenemedi.");
      const rules = validateAdmissionRules(result.rules);
      setCurrent(rules);
      setDraft(structuredClone(rules));
      setPreview(result.preview);
      setReviewed("");
      setConflict(false);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Kurallar yüklenemedi.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit(dryRun: boolean) {
    if (!draft || busy) return;
    if (!dryRun && reviewed !== JSON.stringify(draft)) {
      setError(t("Önce güncel taslağın etkisini önizleyin."));
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    setConflict(false);
    try {
      const rules = validateAdmissionRules(draft);
      const response = await fetch("/api/admin/admission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules, dryRun }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) setConflict(true);
        throw new Error(result.error || "Kurallar uygulanamadı.");
      }
      const value = result as ResponseData;
      setPreview(value.preview);
      if (dryRun) {
        setReviewed(JSON.stringify(draft));
        setSuccess(
          t("Etki önizlemesi hazır. Kabul kuralları henüz değiştirilmedi."),
        );
      } else {
        setCurrent(value.rules);
        setDraft(structuredClone(value.rules));
        setReviewed("");
        setSuccess(t("Kabul kuralları uygulandı · Sürüm {p0}",{p0:value.rules.revision}));
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Kurallar uygulanamadı.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!current || !draft)
    return (
      <section className="admin-panel">
        <h2>{t("Kabul kuralları")}</h2>
        {busy ? (
          <p role="status">{t("Kabul kuralları yükleniyor…")}</p>
        ) : (
          <>
            <p className="admin-error" role="alert">
              {t(error)}
            </p>
            <button className="admin-button" onClick={() => void load()}>{t("Yeniden dene")}</button>
          </>
        )}
      </section>
    );
  return (
    <section className="admin-admission">
      <div className="admin-appearance-intro">
        <div>
          <span className="admin-kicker">{t("Mağaza kanıtına göre kabul")}</span>
          <h2>{t("Önce etkisini gör, sonra uygula.")}</h2>
          <p>{t("Android için indirme alt sınırı; iOS ve Windows için değerlendirme sayısı kullanılır. Açık platformlardan en az birinin eşiği karşılanmalıdır. Eksik veya kaynaklanmamış gözlem eşik geçişi sayılmaz.")}</p>
        </div>
        <span className={`admin-badge ${dirty ? "warning" : ""}`}>
          {dirty ? t("Uygulanmamış taslak") : t("Etkin sürüm {p0}",{p0:current.revision})}
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
          <p>{t("Taslağın korunuyor. Başka oturumun değişikliklerini yükleyip eşikleri yeniden değerlendirin.")}</p>
          <button
            className="admin-button"
            disabled={busy}
            onClick={() => void load()}
          >{t("Güncel kabul kurallarını yükle")}</button>
        </div>
      )}
      <fieldset className="admin-edit-fields" disabled={busy}>
        <section className="admin-panel">
          <div className="admin-admission-country">
            <label className="admin-field">
              <span>{t("Mağaza ülkesi (iki harf)")}</span>
              <input
                value={draft.country}
                maxLength={2}
                autoCapitalize="characters"
                onChange={(event) =>
                  update({
                    ...draft,
                    country: event.target.value.toUpperCase(),
                  })
                }
              />
            </label>
            <p>{t("Örnek: TR veya US. Yalnız bu ülkeye ait resmî kaynaklı gözlemler değerlendirilir; değerlendirme sayısı indirme sayısı değildir.")}</p>
          </div>
          <div className="admin-rule-grid">
            {(["android", "ios", "windows"] as Platform[]).map((platform) => (
              <section className="admin-rule-card" key={platform}>
                <div>
                  <h3>{PLATFORM_LABELS[platform]}</h3>
                  <button
                    type="button"
                    className="admin-plugin-switch"
                    role="switch"
                    aria-label={t("{p0} kabul eşiği",{p0:t(PLATFORM_LABELS[platform])})}
                    aria-checked={draft.profiles[platform].enabled}
                    onClick={() =>
                      update({
                        ...draft,
                        profiles: {
                          ...draft.profiles,
                          [platform]: {
                            ...draft.profiles[platform],
                            enabled: !draft.profiles[platform].enabled,
                          },
                        },
                      })
                    }
                  >
                    <span />
                  </button>
                </div>
                <label className="admin-field">
                  <span>
                    {platform === "android"
                      ? t("Android minimum indirme alt sınırı")
                      : t("{p0} minimum değerlendirme sayısı",{p0:t(PLATFORM_LABELS[platform])})}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    disabled={!draft.profiles[platform].enabled}
                    value={draft.profiles[platform].minimum}
                    onChange={(event) =>
                      update({
                        ...draft,
                        profiles: {
                          ...draft.profiles,
                          [platform]: {
                            ...draft.profiles[platform],
                            minimum:
                              event.target.value === ""
                                ? 0
                                : Number(event.target.value),
                          },
                        },
                      })
                    }
                  />
                </label>
                <p>
                  {draft.profiles[platform].enabled
                    ? t("Bu platformun eşiği değerlendirmeye katılır.")
                    : t("Kapalı · Bu platform için kabul eşiği uygulanmaz.")}
                </p>
              </section>
            ))}
          </div>
          <div className="admin-editor-actions">
            <button
              type="button"
              className="admin-button"
              onClick={() => void submit(true)}
            >
              <Eye size={16} />{t("Etkiyi önizle")}</button>
            <button
              type="button"
              className="admin-button subtle"
              onClick={() => void load()}
            >
              <RefreshCw size={15} />{t("Kaydedilmiş kuralları yükle")}</button>
          </div>
        </section>
        {preview && (
          <section className="admin-panel admin-admission-preview">
            <div className="admin-panel-heading">
              <div>
                <span className="admin-kicker">
                  {reviewed
                    ? t("Taslak etki önizlemesi")
                    : t("Kaydedilmiş kuralların değerlendirmesi")}
                </span>
                <h3>{t("Kayıtlar nasıl etkileniyor?")}</h3>
              </div>
              <SlidersHorizontal size={20} />
            </div>
            <div className="admin-admission-counts">
              <span>
                <strong>{preview.total}</strong>{t("uygulama")}</span>
              <span>
                <strong>{preview.accepted}</strong>{t("kabul")}</span>
              <span>
                <strong>{preview.rejected}</strong>{t("kabul dışı")}</span>
              <span>
                <strong>{preview.exceptions}</strong>{t("editör istisnası")}</span>
            </div>
            <p>{t("Önizleme taslaklar dahil tüm uygulama kayıtlarını içerir. Kabul, tek başına yayın anlamına gelmez; yayın durumu ayrıca korunur.")}</p>
            <div className="admin-admission-items">
              {preview.items.map((item) => (
                <article key={item.id}>
                  <div>
                    <h4>{item.name}</h4>
                    <span
                      className={`admin-badge ${item.state === "rejected" ? "warning" : ""}`}
                    >
                      {states[item.state]}
                    </span>
                  </div>
                  <ul>
                    {item.reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}
        <div className="admin-appearance-publish">
          <div>
            <SlidersHorizontal size={20} />
            <p>{t("Bu kurallar genel katalogda görünürlüğü etkiler.")}<br />
              <span>{t("Editör istisnası eşik başarısı değildir; kayıt formunda gerekçesi ayrı tutulur.")}</span>
            </p>
          </div>
          <button
            type="button"
            className="admin-button primary"
            disabled={!dirty || reviewed !== JSON.stringify(draft) || busy}
            onClick={() => void submit(false)}
          >
            <Check size={16} />{t("Kabul kurallarını uygula")}</button>
        </div>
      </fieldset>
    </section>
  );
}
