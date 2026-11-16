"use client";

import { useI18n } from "@/lib/i18n";

import Link from "next/link";
import { useState } from "react";
import type { CatalogSnapshot } from "../../lib/domain";
import { PLATFORM_LABELS } from "../../lib/catalog";
import {
  findPublisher,
  getPublishers,
  publisherSearchText,
} from "../../lib/publishers";
import { AppIcon, Heading } from "./Shared";
import css from "./PublisherPages.module.css";

export function PublisherPages({
  catalog,
  slug,
}: {
  catalog: CatalogSnapshot & {publisherDirectory?:{slug:string;name:string;appCount:number;platforms:import("../../lib/catalog").Platform[]}[];publisherQuery?:string;pagination?:{total:number}};
  slug?: string;
}) {
  const { t, formatDate, formatNumber, countryName } = useI18n();
  const [search, setSearch] = useState(catalog.publisherQuery||"");
  const publisher = slug ? findPublisher(catalog, slug) : undefined;
  const groups = catalog.publisherDirectory?.map(group=>({...group,apps:[],appCount:group.appCount})) || getPublishers(catalog).map(group=>({...group,appCount:group.apps.length})).filter((group) =>
    publisherSearchText(group.name).includes(
      publisherSearchText(search.trim()),
    ),
  );
  return (
    <section className={css.page}>
      {slug && (
        <Link className={css.back} href="/yayincilar">{t("← Tüm yayıncılar")}</Link>
      )}
      <Heading
        eyebrow={t("Katalog dizini")}
        title={slug ? publisher?.name || t("Yayıncı bulunamadı") : t("Yayıncılar")}
        description={t("Katalogdaki yayıncı adlarına göre uygulamaları keşfet. Bu adlar web sitesi alan adı da olabilir; doğrulanmış şirket kimliği veya sahiplik bilgisi değildir.")}
      />
      {slug ? (
        publisher ? (
          <>
            <p className={css.summary}>
              {publisher.apps.length}{" "}{t("uygulama ·")}{" "}
              {publisher.platforms
                .map((platform) => PLATFORM_LABELS[platform])
                .join(" · ")}
            </p>
            <div className={css.grid}>
              {publisher.apps.map((app) => (
                <Link
                  className={css.card}
                  key={app.id}
                  href={`/uygulama/${encodeURIComponent(app.id)}`}
                >
                  <AppIcon app={app} />
                  <div>
                    <h2>{app.name}</h2>
                    <p>{app.tagline}</p>
                    <small>
                      {app.platforms
                        .map((platform) => PLATFORM_LABELS[platform])
                        .join(" · ")}
                    </small>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p>{t("Bu yayıncı için herkese açık bir uygulama bulunamadı.")}</p>
        )
      ) : (
        <>
          <form className={css.search} method="get" onSubmit={catalog.publisherDirectory?undefined:e=>e.preventDefault()}>
            <label htmlFor="publisher-search">{t("Yayıncı ara")}</label>
            <input
              id="publisher-search"
              name="q"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("Yayıncı adı veya alan adı")}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}>{t("Aramayı temizle")}</button>
            )}
            {catalog.publisherDirectory&&<button type="submit">{t("Yayıncı ara")}</button>}
          </form>
          <p className={css.summary} role="status">
            {catalog.publisherDirectory?catalog.pagination?.total:groups.length}{" "}{t("yayıncı")}</p>
          <div className={css.grid}>
            {groups.map((group) => (
              <Link
                className={css.card}
                key={group.slug}
                href={`/yayinci/${group.slug}`}
              >
                <div>
                  <h2>{group.name}</h2>
                  <p>{group.appCount}{" "}{t("uygulama")}</p>
                  <small>
                    {group.platforms
                      .map((platform) => PLATFORM_LABELS[platform])
                      .join(" · ")}
                  </small>
                </div>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
          {!groups.length && (
            <p>
              {search
                ? t("Bu aramayla eşleşen yayıncı bulunamadı. Başka bir ad deneyebilirsin.")
                : t("Henüz herkese açık yayıncı kaydı yok.")}
            </p>
          )}
        </>
      )}
    </section>
  );
}
