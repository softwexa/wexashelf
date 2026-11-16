"use client";
import SourceOperations from "./SourceOperations";
import {useI18n} from "@/lib/i18n";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ManagedRecord } from "@/lib/domain";
import type { RefreshCandidate, RefreshState } from "@/lib/source-refresh";
import css from "./source-maintenance.module.css";
const statusNames = {
  pending: "İnceleme bekliyor",
  applied: "Uygulandı",
  dismissed: "Reddedildi",
  error: "Hata",
};
const freshnessNames = {
  fresh: "Yakın zamanda kontrol edildi",
  stale: "Kontrol tarihi eski",
  unknown: "Kontrol tarihi bilinmiyor",
};
class RefreshError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function request<T>(body?: unknown, appId?: string): Promise<T> {
  const query = !body && appId ? `?${new URLSearchParams({ appId })}` : "";
  const response = await fetch(`/api/admin/refresh${query}`, {
    method: body ? "POST" : "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response
    .json()
    .catch(() => ({ error: "Sunucu yanıtı okunamadı." }));
  if (!response.ok)
    throw new RefreshError(
      result.error || "İşlem tamamlanamadı.",
      response.status,
    );
  return result;
}
export default function SourceMaintenance({
  records,
  onApplied,
  onBusy,
  onAuthLost,
  onEdit,
}: {
  records: ManagedRecord[];
  onApplied: () => Promise<unknown>;
  onBusy: (busy: boolean) => void;
  onAuthLost: () => void;
  onEdit: (record: ManagedRecord) => void;
}) {
 const {t,intlLocale}=useI18n();

  const apps = records.filter((record) => record.kind === "app");
  const [appId, setAppId] = useState(apps[0]?.id || "");
  const [country, setCountry] = useState("TR");
  const [state, setState] = useState<RefreshState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const authLost = useRef(onAuthLost);
  authLost.current = onAuthLost;
  const load = useCallback(
    async () => setState(await request<RefreshState>(undefined, appId)),
    [appId],
  );
  useEffect(() => {
    let active = true;
    request<RefreshState>(undefined, appId)
      .then((data) => {
        if (active) setState(data);
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          if (e.status === 401) authLost.current();
        }
      });
    return () => {
      active = false;
    };
  }, [appId]);
  async function run(
    action: "fetch" | "apply" | "dismiss" | "reload",
    id?: string,
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    onBusy(true);
    setError("");
    setMessage("");
    try {
      const result =
        action !== "reload"
          ? await request<RefreshCandidate>(
              action === "fetch"
                ? { action, appId, country, platform: "ios" }
                : { action, id },
            )
          : null;
      if (action === "apply") {
        setMessage(
          "Kaynak verisi uygulandı. Yayın durumu korundu; SEO için yeniden inceleme ve onay gerekir.",
        );
        await onApplied();
      }
      if (action === "fetch") {
        if (result?.status === "error")
          setError(result.error || "Kaynak okunamadı. Katalog değiştirilmedi.");
        else
          setMessage(
            "Kaynak adayı alındı. Katalog henüz değişmedi; farkları inceleyin.",
          );
      }
      if (action === "dismiss")
        setMessage("Aday reddedildi. Katalog değiştirilmedi.");
      await load();
    } catch (e) {
      setError(
        e instanceof RefreshError && e.status === 409
          ? "Kayıt veya aday değişti. Üzerine yazılmadı. Listeyi yenileyip yeni bir aday alın."
          : e instanceof Error
            ? e.message
            : "İşlem tamamlanamadı.",
      );
      if (e instanceof RefreshError && e.status === 401) authLost.current();
    } finally {
      lock.current = false;
      setBusy(false);
      onBusy(false);
    }
  }
  const selected = apps.find((app) => app.id === appId);
  const freshness = state?.freshness.find((item) => item.appId === appId);
  const candidates =
    state?.candidates.filter((item) => item.appId === appId) || [];
  return (
    <section className={`admin-panel ${css.panel}`} aria-busy={busy}>
      <div className="admin-panel-heading">
        <div>
          <span className="admin-kicker">{t("Kaynak takibi")}</span>
          <h2>{t("Kaynak bakımı")}</h2>
        </div>
        <button
          className="admin-button"
          disabled={busy}
          onClick={() => run("reload")}
        >{t("Listeyi yenile")}</button>
      </div>
      <p>{t("Aday almak kataloğu değiştirmez. Uygula yalnızca adayda gösterilen mağaza verisini günceller. Tarih güncelliği bilginin doğruluğunu garanti etmez.")}</p>
      <div className="admin-form-grid">
        <label className="admin-field">
          <span>{t("Uygulama")}</span>
          <select
            disabled={busy}
            value={appId}
            onChange={(e) => {
              setAppId(e.target.value);
              setMessage("");
              setError("");
            }}
          >
            <option value="">{t("Uygulama seçin")}</option>
            {apps.map((app) => (
              <option key={app.id} value={app.id}>
                {"name" in app.data ? app.data.name : app.id}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          <span>{t("Store country")}</span>
          <input
            disabled={busy}
            maxLength={2}
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            placeholder={t("TR")}
          />
        </label>
      </div>
      <div className={css.actions}>
        {selected && (
          <button
            className="admin-button"
            disabled={busy}
            onClick={() => onEdit(selected)}
          >{t("Kaydı elle düzenle")}</button>
        )}
      </div>
      <SourceOperations appId={appId} country={country} onChanged={load} onBusy={onBusy}/>
      {error && (
        <p className="admin-error" role="alert">
          {t(error)}
        </p>
      )}
      {message && <p role="status">{t(message)}</p>}
      {!state && !error && <p role="status">{t("Kaynak geçmişi yükleniyor…")}</p>}
      <h3>{t("Alan bazında güncellik")}</h3>
      {freshness?.fields.length ? (
        <ul className={css.freshness}>
          {freshness.fields.map((field, index) => (
            <li key={`${field.field}-${index}`}>
              <strong>{field.field}</strong>
              <span>{t(freshnessNames[field.state])}</span>
              <time>{field.checkedAt || t("Tarih yok")}</time>
            </li>
          ))}
        </ul>
      ) : (
        <p>{t("Bu kayıt için güncellik bilgisi yok.")}</p>
      )}
      <h3>{t("Adaylar ve işlem geçmişi")}</h3>
      {state && !candidates.length && <p>{t("Bu uygulama için kaynak adayı yok.")}</p>}
      {candidates.map((candidate) => (
        <article className={css.candidate} key={candidate.id}>
          <div className={css.actions}>
            <strong>{t(statusNames[candidate.status])}</strong>
            <span>{t("Temel sürüm")}{" "}{candidate.baseRevision}{" "}{t("· Güncel sürüm")}{" "}
              {selected?.revision ?? "—"}
            </span>
          </div>
          <p className={css.break}>{t("Kaynak:")}{" "}{candidate.source}</p>
          <p>{t("Alınma:")}{" "}{candidate.createdAt}{" "}{t("· Son işlem:")}{" "}{candidate.updatedAt}
          </p>
          <p>{t("Değişen alanlar:")}{" "}
            {candidate.diff.length
              ? candidate.diff.join(", ")
              : t("Değişiklik yok")}
          </p>
          {candidate.error && <p className="admin-error">{candidate.error}</p>}
          <details>
            <summary>{t("Önce / sonra ve kontrol tarihlerini incele")}</summary>
            <div className={css.diff}>
              <div>
                <h4>{t("Önce")}</h4>
                <pre>{JSON.stringify(candidate.before, null, 2)}</pre>
              </div>
              <div>
                <h4>{t("Sonra")}</h4>
                <pre>{JSON.stringify(candidate.after, null, 2)}</pre>
              </div>
            </div>
          </details>
          {candidate.status === "pending" && (
            <>
              <p>{t("Uygulama mağaza alanlarını değiştirir ve SEO onayını kaldırır. Yayın durumu korunur.")}</p>
              {selected?.revision !== candidate.baseRevision && (
                <p role="status">{t("Bu aday eski sürüme ait. Yeni aday alın.")}</p>
              )}
              <div className={css.actions}>
                <button
                  className="admin-button primary"
                  disabled={
                    busy || selected?.revision !== candidate.baseRevision
                  }
                  onClick={() => run("apply", candidate.id)}
                >{t("Kaynak değişikliklerini uygula")}</button>
                <button
                  className="admin-button"
                  disabled={busy}
                  onClick={() => run("dismiss", candidate.id)}
                >{t("Adayı reddet")}</button>
              </div>
            </>
          )}
        </article>
      ))}
    </section>
  );
}
