

import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import {
  Apple,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  GitCompareArrows,
  Monitor,
  Smartphone,
} from "lucide-react";
import {
  PLATFORM_LABELS,
  type CatalogApp,
  type Platform,
} from "../../lib/catalog";
import { type AppRecord } from "../../lib/domain";
import { appIconUrl } from "@/lib/asset-url";
export function AppIcon({
  app,
  large = false,
}: {
  app: CatalogApp;
  large?: boolean;
}) {
  return (
    <img
      className={`app-icon${large ? " large" : ""}`}
      src={appIconUrl(app.icon)}
      alt=""
      width={large ? 76 : 44}
      height={large ? 76 : 44}
    />
  );
}
export function Platforms({ platforms }: { platforms: Platform[] }) {
  return (
    <span className="platform-icons">
      {platforms.map((p) => (
        <span
          key={p}
          aria-label={PLATFORM_LABELS[p]}
          title={PLATFORM_LABELS[p]}
        >
          {p === "windows" ? (
            <Monitor size={13} />
          ) : p === "ios" ? (
            <Apple size={13} />
          ) : (
            <Smartphone size={13} />
          )}
        </span>
      ))}
    </span>
  );
}
export function External({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <ArrowUpRight size={14} aria-hidden="true" />
    </a>
  );
}
export function Heading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="page-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}
export function SectionHeading({
  title,
  detail,
  href,
}: {
  title: string;
  detail: string;
  href: string;
}) {
  const { t } = useI18n();
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
      <Link href={href} aria-label={t("{name}: tümünü gör", {name:title})}>
        <ArrowUpRight size={19} />
      </Link>
    </div>
  );
}
export function SaveButton({
  app,
  saved,
  onSave,
}: {
  app: CatalogApp;
  saved: boolean;
  onSave: (id: string) => void;
}) {
  const { t, formatDate, formatNumber, countryName } = useI18n();
  return (
    <button
      type="button"
      className={`icon-button save-button ${saved ? "is-saved" : ""}`}
      aria-label={`${app.name} ${saved ? t("kaydını kaldır") : t("kaydet")}`}
      aria-pressed={saved}
      onClick={() => onSave(app.id)}
    >
      <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
export interface AppActions {
  saved: string[];
  compare: string[];
  onSave: (id: string) => void;
  onCompare: (id: string) => void;
}
export function AppRow({
  app,
  saved,
  onSave,
}: {
  app: CatalogApp;
  saved: string[];
  onSave: (id: string) => void;
}) {
  return (
    <div className="app-row">
      <Link href={`/uygulama/${app.id}`} className="app-row-main">
        <AppIcon app={app} />
        <div>
          <h3>{app.name}</h3>
          <p>{app.tagline}</p>
        </div>
      </Link>
      <Platforms platforms={app.platforms} />
      <SaveButton app={app} saved={saved.includes(app.id)} onSave={onSave} />
    </div>
  );
}
export function AppCard({ app, ...actions }: { app: AppRecord } & AppActions) {
  const { t, formatDate, formatNumber, countryName } = useI18n();
  return (
    <article className="catalog-card">
      <div className="catalog-card-top">
        <Link
          href={`/uygulama/${app.id}`}
          aria-label={t("{name} uygulamasını incele", {name:app.name})}
        >
          <AppIcon app={app} />
        </Link>
        <SaveButton
          app={app}
          saved={actions.saved.includes(app.id)}
          onSave={actions.onSave}
        />
      </div>
      <Link href={`/uygulama/${app.id}`}>
        <h2>{app.name}</h2>
      </Link>
      <p>{app.description}</p>
      <Platforms platforms={app.platforms} />
      {app.tags.length > 0 && (
        <div className="app-tags">
          {app.tags.slice(0, 3).map((tag) => (
            <Link href={`/etiket/${encodeURIComponent(tag)}`} key={tag}>
              {tag}
            </Link>
          ))}
        </div>
      )}
      <div className="catalog-card-actions">
        <Link href={`/uygulama/${app.id}`}>{t("İncele")}<ArrowRight size={14} />
        </Link>
        <button
          className={`compare-button ${actions.compare.includes(app.id) ? "selected" : ""}`}
          aria-pressed={actions.compare.includes(app.id)}
          onClick={() => actions.onCompare(app.id)}
        >
          {actions.compare.includes(app.id) ? (
            <Check size={14} />
          ) : (
            <GitCompareArrows size={14} />
          )}{" "}{" "}{t("Karşılaştır")}</button>
      </div>
    </article>
  );
}
