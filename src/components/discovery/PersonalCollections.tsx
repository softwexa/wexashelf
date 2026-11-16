"use client";

import { useI18n } from "@/lib/i18n";

import {SetupPlans,type SetupSelections} from "./SetupPlans";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, Plus, X } from "lucide-react";
import type { AppRecord } from "../../lib/domain";
interface Collection {
  id: string;
  name: string;
  note: string;
  appIds: string[];
  selections?:SetupSelections;
}
export function PersonalCollections({
  apps,
  saved,
}: {
  apps: AppRecord[];
  saved: string[];
}) {
  const { t, formatDate, formatNumber, countryName } = useI18n();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteId, setDeleteId] = useState("");
  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("app-guide.collections.v1") || "[]",
      );
      if (Array.isArray(stored))
        setCollections(
          stored
            .filter(
              (c) =>
                c &&
                typeof c.id === "string" &&
                typeof c.name === "string" &&
                typeof c.note === "string" &&
                Array.isArray(c.appIds),
            )
            .slice(0, 32)
            .map((c) => ({
              selections: Object.fromEntries(Object.entries(c.selections&&typeof c.selections==='object'?c.selections:{}).slice(0,100).filter(([,v])=>v&&typeof v==='object').map(([id,raw])=>{const value=raw as Record<string,unknown>;return [id,{planId:typeof value.planId==='string'?value.planId.slice(0,100):'',seats:typeof value.seats==='number'&&Number.isFinite(value.seats)?Math.min(10000,Math.max(1,Math.floor(value.seats))):1,tasks:typeof value.tasks==='string'?value.tasks.slice(0,500):''}];})),
              id: c.id.slice(0, 80),
              name: c.name.slice(0, 60),
              note: c.note.slice(0, 1000),
              appIds: [
                ...new Set(
                  c.appIds.filter((id: unknown) => typeof id === "string"),
                ),
              ].slice(0, 100) as string[],
            })),
        );
    } catch {
      setNotice(
        t("Koleksiyon kayıtları okunamadı. Yeni koleksiyon oluşturabilirsin."),
      );
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        "app-guide.collections.v1",
        JSON.stringify(collections),
      );
    } catch {
      setNotice(
        t("Koleksiyonlar tarayıcıya kaydedilemedi. Dışa aktarma ile bir kopya alabilirsin."),
      );
    }
  }, [ready, collections]);
  const update = (id: string, patch: Partial<Collection>) =>
    setCollections((previous) =>
      previous.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
  function exportCollections() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ schemaVersion: 1, collections }, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "uygulama-koleksiyonlarim.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="personal-collections detail-section">
      <div className="section-heading">
        <div>
          <h2>{t("Kendi uygulama düzenlerin")}</h2>
          <p>{t("İşine göre küçük koleksiyonlar oluştur. Hepsi bu tarayıcıda özel kalır.")}</p>
        </div>
        <button
          className="icon-button"
          aria-label={t("Koleksiyonları dışa aktar")}
          disabled={!collections.length}
          onClick={exportCollections}
        >
          <Download size={19} />
        </button>
      </div>
      <form
        className="collection-create"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || collections.length >= 32) return;
          setCollections([
            ...collections,
            {
              id: crypto.randomUUID(),
              name: name.trim(),
              note: "",
              appIds: [...saved],
            },
          ]);
          setName("");
        }}
      >
        <label>{t("Koleksiyon adı")}<input
            aria-label={t("Koleksiyon adı")}
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("Örn. Ders çalışma düzenim")}
          />
        </label>
        <button
          className="button button-secondary"
          type="submit"
          disabled={collections.length >= 32}
        >
          <Plus size={16} />{t("Kaydettiklerimle oluştur")}</button>
      </form>
      {notice && (
        <p role="status" className="settings-note">
          {notice}
        </p>
      )}
      <div className="collection-grid">
        {collections.map((c) => (
          <article className="home-panel" key={c.id}>
            <label className="collection-name">{t("Koleksiyon adı")}<input
                aria-label={t("{name} koleksiyon adı", {name:c.name})}
                maxLength={60}
                value={c.name}
                onChange={(e) => update(c.id, { name: e.target.value })}
              />
            </label>
            <label className="collection-note">{t("Neden bu araçlar?")}<textarea
                aria-label={t("{name} notu",{name:c.name})}
                maxLength={1000}
                value={c.note}
                onChange={(e) => update(c.id, { note: e.target.value })}
                placeholder={t("Her uygulamanın iş akışındaki rolünü yaz.")}
              />
            </label>
            <ul className="collection-apps">
              {c.appIds.map((id) => {
                const app = apps.find((a) => a.id === id);
                return (
                  <li key={id}>
                    {app ? (
                      <Link href={`/uygulama/${id}`}>{app.name}</Link>
                    ) : (
                      <span>{id}{" "}{t("· şu anda katalogda görünmüyor")}</span>
                    )}
                    <button
                      className="icon-button"
                      aria-label={t("{name} koleksiyondan kaldır", {name:app?.name || id})}
                      onClick={() =>
                        update(c.id, {
                          appIds: c.appIds.filter((value) => value !== id),
                        })
                      }
                    >
                      <X size={15} />
                    </button>
                  </li>
                );
              })}
            </ul>
            <label className="collection-add">{t("Uygulama ekle")}<select
                aria-label={t("{name} koleksiyonuna uygulama ekle",{name:c.name})}
                value=""
                onChange={(e) => {
                  if (e.target.value)
                    update(c.id, { appIds: [...c.appIds, e.target.value] });
                }}
              >
                <option value="">{t("Bir uygulama seç")}</option>
                {apps
                  .filter((a) => !c.appIds.includes(a.id))
                  .map((a) => (
                    <option value={a.id} key={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </label>
            <SetupPlans apps={apps} appIds={c.appIds} selections={c.selections} onChange={selections=>update(c.id,{selections})}/>
            <div className="collection-actions">
              <button className="text-button" onClick={() => setDeleteId(c.id)}>{t("Koleksiyonu sil")}</button>
              {deleteId === c.id && (
                <>
                  <span>{t("Bu koleksiyon silinecek.")}</span>
                  <button
                    className="button button-secondary"
                    onClick={() => {
                      setCollections(
                        collections.filter((item) => item.id !== c.id),
                      );
                      setDeleteId("");
                    }}
                  >{t("Silmeyi onayla")}</button>
                  <button
                    className="text-button"
                    onClick={() => setDeleteId("")}
                  >{t("Vazgeç")}</button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
