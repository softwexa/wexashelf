"use client";

import { useI18n } from "@/lib/i18n";

import Link from "next/link";
import { useState } from "react";
import {
  CATEGORIES,
  PLATFORM_LABELS,
  type Category,
  type Platform,
} from "../../lib/catalog";
import { FACT_LABELS, type AppRecord, type FactKey } from "../../lib/domain";
import { calculatePlanCost, recommendApps } from "../../lib/discovery";
import { Heading, External } from "./Shared";
export function SelectionWizard({ apps }: { apps: AppRecord[] }) {
  const { t, intlLocale, formatDate, formatNumber, countryName } = useI18n();
  const [category, setCategory] = useState<Category>("all");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [required, setRequired] = useState<FactKey[]>([]);
  const [ran, setRan] = useState(false);
  const [showExcluded, setShowExcluded] = useState(false);
  const recommendations = recommendApps(apps, category, platforms, required);
  const matches = recommendations.filter((r) => r.state === "match");
  const research = recommendations.filter((r) => r.state === "research");
  const excluded = recommendations.filter((r) => r.state === "excluded");
  return (
    <>
      <Heading
        eyebrow={t("Karar desteği")}
        title={t("Sana uyanı, nedenleriyle bul.")}
        description={t("Önce işini ve cihazlarını seç. Zorunlu bir özellik doğrulanmamışsa uygulamayı tam eşleşme saymayız.")}
      />
      <form
        className="home-panel decision-form"
        onSubmit={(e) => {
          e.preventDefault();
          setRan(true);
        }}
      >
        <label>{t("Ne yapmak istiyorsun?")}<select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as Category);
              setRan(false);
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {t(c.label)}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>{t("Hangi cihazlarının hepsinde çalışmalı?")}</legend>
          <div className="check-row">
            {(["android", "ios", "windows"] as Platform[]).map((p) => (
              <label className="check-label" key={p}>
                <input
                  type="checkbox"
                  checked={platforms.includes(p)}
                  onChange={() => {
                    setPlatforms(
                      platforms.includes(p)
                        ? platforms.filter((v) => v !== p)
                        : [...platforms, p],
                    );
                    setRan(false);
                  }}
                />
                {PLATFORM_LABELS[p]}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t("Vazgeçemediğin özellikler")}</legend>
          <div className="check-row">
            {Object.entries(FACT_LABELS).map(([key, label]) => (
              <label className="check-label" key={key}>
                <input
                  type="checkbox"
                  checked={required.includes(key as FactKey)}
                  onChange={() => {
                    setRequired(
                      required.includes(key as FactKey)
                        ? required.filter((v) => v !== key)
                        : [...required, key as FactKey],
                    );
                    setRan(false);
                  }}
                />
                {t(label)}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          className="button button-primary"
          type="submit"
          disabled={!platforms.length}
        >{t("Eşleşmeleri göster")}</button>
        {!platforms.length && (
          <p className="settings-note">{t("Devam etmek için en az bir cihaz seç.")}</p>
        )}
      </form>
      {ran && (
        <section className="recommendation-results" aria-live="polite">
          <h2>
            {matches.length}{" "}{t("tam eşleşme ·")}{" "}{research.length}{" "}{t("araştırılacak aday")}</h2>
          {!matches.length && (
            <p className="settings-note">{t("Tüm zorunlu koşullarını kaynaklarıyla doğrulayabildiğimiz bir uygulama bulunamadı. Koşulların otomatik olarak gevşetilmedi.")}</p>
          )}
          {[...matches, ...research, ...(showExcluded ? excluded : [])].map(
            (r) => (
              <article className="home-panel recommendation" key={r.app.id}>
                <div>
                  <span className={`evidence-badge ${r.state}`}>
                    {r.state === "match"
                      ? t("Koşullar eşleşiyor")
                      : r.state === "research"
                        ? t("Doğrulama gerekiyor")
                        : t("Koşulları karşılamıyor")}
                  </span>
                  <h3>
                    <Link href={`/uygulama/${r.app.id}`}>{r.app.name}</Link>
                  </h3>
                  <ul>
                    {r.reasons.map((reason) => (
                      <li key={reason}>{t(reason)}</li>
                    ))}
                  </ul>
                </div>
                <Link
                  className="button button-secondary"
                  href={`/uygulama/${r.app.id}`}
                >{t("Kanıtları incele")}</Link>
              </article>
            ),
          )}
          {excluded.length > 0 && (
            <button
              className="button button-secondary"
              onClick={() => setShowExcluded(!showExcluded)}
            >
              {showExcluded
                ? t("Elenenleri gizle")
                : t("{count} elenen uygulamanın nedenini göster", {count:excluded.length})}
            </button>
          )}
          <p className="settings-note">{t("Kural sürümü 1 · Sıralama katalog sırasıdır; ücretli öne çıkarma veya rastgele uyum puanı kullanılmaz.")}</p>
        </section>
      )}
    </>
  );
}
export function CostCalculator({ apps }: { apps: AppRecord[] }) {
  const { t, intlLocale, formatDate, formatNumber, countryName } = useI18n();
  const [appId, setAppId] = useState(apps[0]?.id || "");
  const app = apps.find((a) => a.id === appId);
  const [planId, setPlanId] = useState("");
  const plan = app?.plans.find((p) => p.id === planId) || app?.plans[0];
  const [months, setMonths] = useState<12 | 36>(12);
  const [seats, setSeats] = useState(1);
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const result = plan ? calculatePlanCost(plan, months, seats, billing) : null;
  return (
    <>
      <Heading
        eyebrow={t("Planını hesapla")}
        title={t("Bir aylık fiyatın ötesine bak.")}
        description={t("Kayıtlı plan fiyatlarıyla 12 veya 36 aylık bir senaryo oluştur. Para birimlerini birbirine çevirmeyiz.")}
      />
      <div className="calculator-layout">
        <form
          className="home-panel decision-form"
          onSubmit={(e) => e.preventDefault()}
        >
          <label>{t("Uygulama")}<select
              value={appId}
              onChange={(e) => {
                setAppId(e.target.value);
                setPlanId("");
              }}
            >
              {apps.map((a) => (
                <option value={a.id} key={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>{t("Plan")}<select
              value={plan?.id || ""}
              onChange={(e) => setPlanId(e.target.value)}
              disabled={!app?.plans.length}
            >
              {app?.plans.length ? (
                app.plans.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))
              ) : (
                <option value="">{t("Doğrulanmış plan bulunmuyor")}</option>
              )}
            </select>
          </label>
          <div className="filter-fields">
            <label>{t("Süre")}<select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value) as 12 | 36)}
              >
                <option value="12">{t("12 ay")}</option>
                <option value="36">{t("36 ay")}</option>
              </select>
            </label>
            <label>{t("Faturalama")}<select
                value={billing}
                onChange={(e) =>
                  setBilling(e.target.value as "monthly" | "annual")
                }
              >
                <option value="annual">{t("Yıllık")}</option>
                <option value="monthly">{t("Aylık")}</option>
              </select>
            </label>
            <label>{t("Kişi sayısı")}<input
                type="number"
                min="1"
                max="10000"
                value={Number.isNaN(seats) ? "" : seats}
                onChange={(e) =>
                  setSeats(e.target.value ? Number(e.target.value) : NaN)
                }
              />
            </label>
          </div>
        </form>
        <section className="home-panel cost-result" aria-live="polite">
          <span className="eyebrow">{t("Senaryo toplamı")}</span>
          <h2>
            {result?.total != null
              ? `${result.total.toLocaleString(intlLocale, { maximumFractionDigits: 2 })} ${result.currency}`
              : t("Kesin toplam hesaplanamıyor")}
          </h2>
          <p>
            {(result?.reason ? t(result.reason) : "") ||
              t("Bu uygulamanın kaynaklı plan fiyatı henüz kataloğa girilmedi. Eksik fiyatı sıfır olarak saymıyoruz.")}
          </p>
          {plan && (
            <>
              <p>{plan.note}</p>
              <p className="settings-note">{t("Kaynak kontrolü:")}{" "}{formatDate(plan.checkedAt)} ·{" "}
                {plan.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")}
              </p>
              <External href={plan.sourceUrl}>{t("Güncel plan koşulları")}</External>
              <dl className="fact-list">
                {plan.limits.map((l) => (
                  <div key={l.label}>
                    <dt>{l.label}</dt>
                    <dd>{l.value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          {!plan && app && (
            <External href={app.website}>{t("Yayıncının planlarını incele")}</External>
          )}
        </section>
      </div>
    </>
  );
}
