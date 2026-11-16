"use client";

import {UpdateProposal} from "./UpdateProposal";
import AppScreenshots from './AppScreenshots';
import { CapabilityDetails } from "./CapabilityTools";
import type { AppCapabilities } from "@/lib/capabilities";
import { useI18n } from "@/lib/i18n";

import { publisherSlug } from "../../lib/publishers";
import publisherCss from "./PublisherPages.module.css";
import Link from "next/link";
import { useState } from "react";
import { Check, GitCompareArrows, X } from "lucide-react";
import { CATEGORIES, PLATFORM_LABELS, type Platform } from "../../lib/catalog";
import {
  EVIDENCE_LABELS,
  FACT_LABELS,
  type AppRecord,
  type FactKey,
} from "../../lib/domain";
import { factState, PRICING_LABELS } from "../../lib/discovery";
import type { AdmissionEvaluation } from "../../lib/admission";
import {
  AppIcon,
  AppRow,
  External,
  Heading,
  Platforms,
  SaveButton,
  type AppActions,
} from "./Shared";
export function FeedbackForm({ appId }: { appId: string }) {
  const { t, formatDate, formatNumber, countryName } = useI18n();
  const [field, setField] = useState(t("Genel bilgi"));
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return (
    <details className="home-panel feedback-panel">
      <summary>{t("Yanlış veya eski bilgi bildir")}</summary>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setResult("");
          try {
            const response = await fetch("/api/feedback", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ appId, field, message }),
            });
            const data = await response.json();
            if (!response.ok)
              throw Error(data.error || t("Bildirim gönderilemedi."));
            setError(false);
            setResult(t("Bildirimin inceleme kuyruğuna alındı."));
            setMessage("");
          } catch (err) {
            setError(true);
            setResult(
              err instanceof Error ? err.message : t("Bildirim gönderilemedi."),
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>{t("İlgili alan")}<select value={field} onChange={(e) => setField(e.target.value)}>
            {[
              t("Genel bilgi"),
              t("Platform desteği"),
              t("Fiyat / plan"),
              t("Mağaza bağlantısı"),
              t("Özellik kanıtı"),
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>{t("Düzeltme ve varsa kaynak bağlantısı")}<textarea
            required
            minLength={10}
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("Hangi bilginin değiştiğini ve resmî kaynağını yaz.")}
          />
        </label>
        <p className="settings-note">{t("Kişisel bilgi veya hesap parolası ekleme. Bildirimler yayımlanmaz; editör tarafından incelenir.")}</p>
        <button className="button button-primary" disabled={busy} type="submit">
          {busy ? t("Gönderiliyor…") : t("İncelemeye gönder")}
        </button>
        {result && (
          <p
            role={error ? "alert" : "status"}
            className={error ? "form-error" : "settings-note"}
          >
            {result}
          </p>
        )}
      </form>
    </details>
  );
}
export function AppDetail({
  app,
  apps,
  admission,
  capability,
  previewMode = false,
  ...actions
}: {
  app: AppRecord;
  apps: AppRecord[];
  admission?: AdmissionEvaluation;
  capability?: AppCapabilities;
  previewMode?: boolean;
} & AppActions) {
  const { t, formatDate, formatNumber, countryName } = useI18n();
  const alternatives = apps
    .filter((a) => a.id !== app.id && a.category === app.category)
    .slice(0, 4);
  return (
    <>
      <Link className="back-link" href="/kesfet">{t("← Uygulamalara dön")}</Link>
      <header className="app-detail-heading">
        <AppIcon app={app} large />
        <div>
          <span className="eyebrow">
            {t(CATEGORIES.find((c) => c.id === app.category)?.label || "")}
          </span>
          <h1>{app.name}</h1>
          <p>{app.tagline}</p>
          <Platforms platforms={app.platforms} />
        </div>
        <SaveButton
          app={app}
          saved={actions.saved.includes(app.id)}
          onSave={actions.onSave}
        />
      </header>
      {admission && (
        <section className="home-panel admission-info">
          <h2>
            {admission.state === "passed"
              ? t("Mağaza kabul eşiğini karşılıyor")
              : admission.state === "exception"
                ? t("Editoryal istisnayla listeleniyor")
                : admission.state === "not-configured"
                  ? t("Mağaza kabul eşikleri henüz uygulanmıyor")
                  : t("Katalog kabul değerlendirmesi")}
          </h2>
          <ul>
            {admission.reasons.map((reason) => (
              <li key={reason}>{t(reason)}</li>
            ))}
          </ul>
          {admission.state === "exception" && (
            <p>{t("Bu kayıt, indirme veya değerlendirme eşiğini geçtiği anlamına gelmez.")}</p>
          )}
        </section>
      )}
      <div className="detail-grid">
        <section className="home-panel">
          <h2>{t("Bir bakışta")}</h2>
          <p className="detail-description">{app.description}</p>
          <dl className="fact-list">
            <div>
              <dt>{t("Yayıncı")}</dt>
              <dd>
                {publisherSlug(app.publisher) ? (
                  <Link
                    className={publisherCss.publisherLink}
                    href={`/yayinci/${publisherSlug(app.publisher)}`}
                  >
                    {app.publisher}
                  </Link>
                ) : (
                  t("Henüz belirtilmedi")
                )}
              </dd>
            </div>
            <div>
              <dt>{t("Fiyat modeli")}</dt>
              <dd>{t(PRICING_LABELS[app.pricingModel])}</dd>
            </div>
            {app.featureNotes.map((note) => (
              <div key={note.label}>
                <dt>{note.label}</dt>
                <dd>{note.value}</dd>
              </div>
            ))}
          </dl>
          <div className="app-tags">
            {app.tags.map((tag) => (
              <Link href={`/etiket/${encodeURIComponent(tag)}`} key={tag}>
                {tag}
              </Link>
            ))}
          </div>
          <button
            className="button button-secondary"
            aria-pressed={actions.compare.includes(app.id)}
            onClick={() => actions.onCompare(app.id)}
          >
            <GitCompareArrows size={16} />
            {actions.compare.includes(app.id)
              ? t("Karşılaştırmadan kaldır")
              : t("Karşılaştırmaya ekle")}
          </button>
        </section>
        <aside className="home-panel download-panel">
          <h2>{t("Resmî kaynaklardan incele")}</h2>
          <p>{t("Cihazını seç; yayıncının güncel bilgisine ulaş.")}</p>
          {app.platforms.map((p) => (
            <External key={p} href={app.storeLinks[p] || app.sourceUrl}>
              {PLATFORM_LABELS[p]} ·{" "}
              {app.storeLinks[p] ? t("Mağazada incele") : t("Yayıncıdan incele")}
            </External>
          ))}
          <External href={app.sourceUrl}>{t("Katalog kaynağı")}</External>
          <p className="settings-note">{t("Kaynak kontrol tarihi:")}{" "}{formatDate(app.checkedAt)}{" "}{t(". Platform desteği, her mağazada doğrulanmış kayıt bulunduğu anlamına gelmez.")}</p>
        </aside>
      </div>
      <AppScreenshots images={app.screenshots} />
      <section className="home-panel detail-section">
        <h2>{t("Cihazına göre özellikler")}</h2>
        <p className="settings-note">{t("Yayıncı beyanları ile uygulamalı denemeler ayrı gösterilir. Boş kanıt hücreleri destek yok anlamına gelmez.")}</p>
        <div
          className="table-scroll"
          tabIndex={0}
          aria-label={t("Platform özellik matrisi")}
        >
          <table className="comparison-table">
            <thead>
              <tr>
                <th>{t("Özellik")}</th>
                {app.platforms.map((p) => (
                  <th key={p}>{PLATFORM_LABELS[p]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(FACT_LABELS).map(([key, label]) => (
                <tr key={key}>
                  <th scope="row">{t(label)}</th>
                  {app.platforms.map((p) => {
                    const fact = app.facts.find(
                      (f) => f.key === key && f.platform === p,
                    );
                    return (
                      <td key={p}>
                        <span>
                          {t(EVIDENCE_LABELS[factState(app, key as FactKey, p)])}
                        </span>
                        {fact && fact.sourceUrl && (
                          <>
                            <p>{fact.detail}</p>
                            <External href={fact.sourceUrl}>
                              {fact.evidence === "tested"
                                ? t("Editör denemesi")
                                : t("Yayıncı bilgisi")}
                            </External>
                            <small>{formatDate(fact.checkedAt)}</small>
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {app.storeMetrics.length > 0 && (
        <section className="home-panel detail-section store-metrics">
          <h2>{t("Mağaza gözlemleri")}</h2>
          <p className="settings-note">{t("Değerler belirtilen ülke, mağaza ve tarihe aittir. Farklı mağazaların puanları birleştirilmez.")}</p>
          {app.storeMetrics
            .slice()
            .sort((a, b) => b.observedAt.localeCompare(a.observedAt))
            .slice(0, 6)
            .map((metric, i) => (
              <article
                key={`${metric.platform}-${countryName(metric.country)}-${formatDate(metric.observedAt)}-${i}`}
              >
                <h3>
                  {PLATFORM_LABELS[metric.platform]} · {countryName(metric.country)}
                </h3>
                <p>{t("Puan:")}{" "}
                  {metric.rating === null ? t("Doğrulanmadı") : metric.rating}{" "}{t("· Değerlendirme sayısı:")}{" "}
                  {metric.ratingCount === null
                    ? t("Doğrulanmadı")
                    : formatNumber(metric.ratingCount)}
                </p>
                {metric.platform === "android" && (
                  <p>{t("İndirme alt sınırı:")}{" "}
                    {metric.downloadsLowerBound === null
                      ? t("Doğrulanmadı")
                      : `${formatNumber(metric.downloadsLowerBound)}+`}
                  </p>
                )}
                <External href={metric.sourceUrl}>{t("Gözlem kaynağı ·")}{" "}{formatDate(metric.observedAt)}
                </External>
              </article>
            ))}
        </section>
      )}
      <section className="home-panel detail-section">
        <h2>{t("Planlar ve sınırlar")}</h2>
        {app.plans.length ? (
          app.plans.map((plan) => (
            <div className="plan-row" key={plan.id}>
              <h3>{plan.name}</h3>
              <p>{plan.note}</p>
              <dl className="fact-list">
                {plan.limits.map((limit) => (
                  <div key={limit.label}>
                    <dt>{limit.label}</dt>
                    <dd>{limit.value}</dd>
                  </div>
                ))}
              </dl>
              <External href={plan.sourceUrl}>{t("Plan kaynağı ·")}{" "}{formatDate(plan.checkedAt)}
              </External>
            </div>
          ))
        ) : (
          <p className="settings-note">{t("Plan kotaları ve fiyatları henüz doğrulanmadı. Yayıncının güncel koşullarını incele.")}</p>
        )}
        <Link className="button button-secondary" href="/maliyet-hesapla">{t("Maliyet senaryosu oluştur")}</Link>
      </section>
      {alternatives.length > 0 && (
        <section className="home-panel detail-section">
          <h2>{t("Bu ihtiyaca başka seçenekler")}</h2>
          <p className="settings-note">{t("Aşağıdaki uygulamalar aynı kullanım kategorisindedir. Özellik veya plan eşitliği iddiası değildir; kaynaklı farkları karşılaştır.")}</p>
          {alternatives.map((a) => (
            <div key={a.id}>
              <AppRow app={a} saved={actions.saved} onSave={actions.onSave} />
              <Link
                className="text-link"
                href={`/karsilastir?apps=${app.id},${a.id}`}
              >
                {app.name}{" "}{t("ve")}{a.name}{" "}{t("karşılaştırması")}</Link>
            </div>
          ))}
        </section>
      )}
      <FeedbackForm appId={app.id} />
      <CapabilityDetails app={app} capability={capability} previewMode={previewMode} />
      <UpdateProposal appId={app.id} previewMode={previewMode}/>
    </>
  );
}
export function ComparisonPage({
  apps,
  compare,
  onCompare,
  onStart,
}: {
  apps: AppRecord[];
  compare: string[];
  onCompare: (id: string) => void;
  onStart: () => void;
}) {
  const { t, formatDate, formatNumber, countryName } = useI18n();
  const [differences, setDifferences] = useState(false);
  const selected = compare
    .map((id) => apps.find((a) => a.id === id))
    .filter((a) => !!a);
  const unavailable = compare.filter(
    (id) => !apps.some((app) => app.id === id),
  );
  const rows: { label: string; values: string[]; unknown?: boolean }[] = [
    {
      label: t("Kullanım alanı"),
      values: selected.map(
        (a) => CATEGORIES.find((c) => c.id === a.category)?.label || a.category,
      ),
    },
    {
      label: "Platformlar",
      values: selected.map((a) =>
        a.platforms.map((p) => PLATFORM_LABELS[p]).join(", "),
      ),
    },
    { label: t("Ne için?"), values: selected.map((a) => a.description) },
    {
      label: t("Fiyat modeli"),
      values: selected.map((a) => t(PRICING_LABELS[a.pricingModel])),
      unknown: selected.some((a) => a.pricingModel === "unknown"),
    },
    ...Object.entries(FACT_LABELS).map(([key, label]) => ({
      label,
      values: selected.map((a) =>
        a.platforms
          .map(
            (p) =>
              `${PLATFORM_LABELS[p]}: ${t(EVIDENCE_LABELS[factState(a, key as FactKey, p)])}`,
          )
          .join(" · "),
      ),
      unknown: selected.some((a) =>
        a.platforms.some((p) => factState(a, key as FactKey, p) === "unknown"),
      ),
    })),
  ];
  return (
    <>
      <Heading
        eyebrow={t("Yan yana bak")}
        title={t("Seçimini netleştir.")}
        description={t("En fazla dört uygulamayı temel bilgileri ve kaynaklı özellikleriyle karşılaştır.")}
      />
      <div className="compare-picker">
        {apps.map((a) => (
          <button
            key={a.id}
            className={compare.includes(a.id) ? "selected" : ""}
            aria-pressed={compare.includes(a.id)}
            onClick={() => onCompare(a.id)}
          >
            <AppIcon app={a} />
            {a.name}
            {compare.includes(a.id) && <Check size={15} />}
          </button>
        ))}
      </div>
      {unavailable.length > 0 && (
        <section className="home-panel unavailable-comparison">
          <h2>{unavailable.length}{" "}{t("seçili uygulama şu anda görünmüyor.")}</h2>
          <p>{t("Seçimlerini koruduk. Bu kayıtlar karşılaştırma tablosuna dahil edilmedi; istersen seçiminden kaldırabilirsin.")}</p>
          <div className="filter-chips">
            {unavailable.map((id) => (
              <button
                key={id}
                aria-label={t("{name} karşılaştırmadan kaldır", {name:id})}
                onClick={() => onCompare(id)}
              >
                {id} ×
              </button>
            ))}
          </div>
        </section>
      )}
      {selected.length ? (
        <>
          <label className="check-label comparison-option">
            <input
              type="checkbox"
              checked={differences}
              onChange={(e) => setDifferences(e.target.checked)}
            />{t("Yalnız farkları göster")}{" "}
            <small>{t("Doğrulanmamış alanlar görünür kalır.")}</small>
          </label>
          <div
            className="table-scroll"
            tabIndex={0}
            aria-label={t("Uygulama karşılaştırma tablosu")}
          >
            <table className="comparison-table">
              <thead>
                <tr>
                  <th scope="col">{t("Bir bakışta")}</th>
                  {selected.map((a) => (
                    <th scope="col" key={a.id}>
                      <AppIcon app={a} />
                      <Link href={`/uygulama/${a.id}`}>{a.name}</Link>
                      <button
                        className="icon-button"
                        aria-label={t("{name} karşılaştırmadan kaldır", {name:a.name})}
                        onClick={() => onCompare(a.id)}
                      >
                        <X size={15} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter(
                    (row) =>
                      !differences ||
                      row.unknown ||
                      new Set(row.values).size > 1,
                  )
                  .map((row) => (
                    <tr key={t(row.label)}>
                      <th scope="row">{t(row.label)}</th>
                      {row.values.map((value, i) => (
                        <td key={selected[i].id}>{value}</td>
                      ))}
                    </tr>
                  ))}
                <tr>
                  <th scope="row">{t("Kaynak ve tarih")}</th>
                  {selected.map((a) => (
                    <td key={a.id}>
                      <External href={a.sourceUrl}>{t("Yayıncı bilgisi")}</External>
                      <p>{formatDate(a.checkedAt)}</p>
                      <Link href={`/uygulama/${a.id}`}>{t("Özellik kanıtlarını incele")}</Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="settings-note">{t("Her platformun bilgisi kendi kaynağına bağlıdır. Plan koşulları ayrıca doğrulanmalıdır.")}</p>
        </>
      ) : (
        <div className="empty-state">
          <GitCompareArrows size={30} />
          <h2>{t("İki seçenekle başla.")}</h2>
          <p>{t("Yukarıdan uygulamaları seçerek karşılaştırmanı oluştur.")}</p>
          <button
            className="button button-primary"
            onClick={onStart}
            disabled={apps.length < 2}
          >{t("İlk iki uygulamayı seç")}</button>
        </div>
      )}
    </>
  );
}
