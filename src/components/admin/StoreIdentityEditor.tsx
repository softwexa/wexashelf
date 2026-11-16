"use client";
import {useI18n} from "@/lib/i18n";
import { PLATFORM_LABELS } from "@/lib/catalog";
import { extractStoreId, type StoreIdentity } from "@/lib/store-identities";
import css from "./source-maintenance.module.css";

export default function StoreIdentityEditor({
  value,
  onChange,
}: {
  value: StoreIdentity[];
  onChange: (value: StoreIdentity[]) => void;
}) {
 const {t,intlLocale}=useI18n();

  const change = (index: number, patch: Partial<StoreIdentity>) =>
    onChange(
      value.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  return (
    <section className={`wide ${css.identities}`}>
      <h3>{t("Mağaza kimlikleri")}</h3>
      <p>{t("URL’den çıkarılan kimlik yalnızca adaydır. Mağaza kaydını ve ülkeyi kontrol ettikten sonra kontrol tarihini girin. Değişiklikler “Kaydı kaydet” ile doğrulanır ve kaydedilir.")}</p>
      {value.map((item, index) => (
        <fieldset key={index} className={css.identity}>
          <legend>{t("Mağaza kimliği")}{" "}{index + 1}</legend>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>{t("Platform")}</span>
              <select
                value={item.platform}
                onChange={(e) =>
                  change(index, {
                    platform: e.target.value as StoreIdentity["platform"],
                  })
                }
              >
                {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {t(label)}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>{t("Mağaza kimliği")}</span>
              <input
                required
                value={item.storeId}
                onChange={(e) => change(index, { storeId: e.target.value })}
              />
            </label>
            <label className="admin-field">
              <span>{t("Ülke kodu")}</span>
              <input
                required
                maxLength={2}
                pattern="[A-Z]{2}"
                placeholder={t("TR")}
                value={item.country}
                onChange={(e) =>
                  change(index, { country: e.target.value.toUpperCase() })
                }
              />
            </label>
            <label className="admin-field">
              <span>{t("Kontrol tarihi")}</span>
              <input
                required
                type="date"
                value={item.checkedAt.slice(0, 10)}
                onChange={(e) => change(index, { checkedAt: e.target.value })}
              />
            </label>
            <label className="admin-field wide">
              <span>{t("Resmî mağaza ürün URL’si")}</span>
              <input
                required
                type="url"
                value={item.sourceUrl}
                onChange={(e) => change(index, { sourceUrl: e.target.value })}
              />
            </label>
          </div>
          <div className={css.actions}>
            <button
              type="button"
              className="admin-button"
              disabled={!extractStoreId(item.platform, item.sourceUrl)}
              onClick={() => {
                const id = extractStoreId(item.platform, item.sourceUrl);
                if (id) change(index, { storeId: id });
              }}
            >{t("URL’den aday kimliği al")}</button>
            <button
              type="button"
              className="admin-button subtle"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >{t("Kimliği kaldır")}</button>
          </div>
        </fieldset>
      ))}
      <button
        type="button"
        className="admin-button"
        onClick={() =>
          onChange([
            ...value,
            {
              platform: "ios",
              storeId: "",
              country: "TR",
              sourceUrl: "",
              checkedAt: "",
            },
          ])
        }
      >{t("Mağaza kimliği ekle")}</button>
    </section>
  );
}
