"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, ChevronRight, Circle, Layers3, LogOut, Menu, RefreshCw, Search, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useI18n } from "@/lib/i18n";
import { ADMIN_DEFAULT_ICON, ADMIN_DESCRIPTIONS, ADMIN_GROUPS, ADMIN_ICONS, type AdminNavigationItem } from "./admin-navigation";
import ui from "./AdminShell.module.css";

export type { AdminNavigationItem } from "./admin-navigation";
export type AdminShellProps = {
  items: AdminNavigationItem[];
  activeId: string;
  onNavigate: (id: string) => boolean;
  busy: boolean;
  dirty: boolean;
  locale: string;
  locales: { code: string; label: string }[];
  onLocaleChange: (value: string) => void;
  username: string;
  roleLabel: string;
  onRefresh: () => void;
  onLogout: () => void;
  onLeave: () => boolean;
  children: ReactNode;
};

type NavigationProps = Pick<AdminShellProps, "items" | "activeId" | "onNavigate" | "busy" | "username" | "roleLabel" | "onLogout" | "onLeave"> & { mobile?: boolean; onClose?: () => void };
function Navigation({ items, activeId, onNavigate, busy, username, roleLabel, onLogout, onLeave, mobile = false, onClose }: NavigationProps) {
  const { t, intlLocale } = useI18n();
  const id = useId();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ workspace: true });
  const search = query.trim().toLocaleLowerCase(intlLocale);
  const groups = useMemo(() => ADMIN_GROUPS.map(group => ({ ...group, entries: group.items.map(itemId => items.find(item => item.id === itemId)).filter((item): item is AdminNavigationItem => !!item) })).filter(group => group.entries.length), [items]);
  const visible = groups.map(group => ({ ...group, entries: group.entries.filter(item => !search || t(item.label).toLocaleLowerCase(intlLocale).includes(search) || t(group.label).toLocaleLowerCase(intlLocale).includes(search)) })).filter(group => group.entries.length);
  const activeGroup = groups.find(group => group.entries.some(item => item.id === activeId))?.id;
  useEffect(() => {
    if (activeGroup) setExpanded(value => value[activeGroup] ? value : { ...value, [activeGroup]: true });
  }, [activeId, activeGroup]);
  const userInitials = username.trim().slice(0, 2).toLocaleUpperCase(intlLocale) || "WS";
  return <div className={ui.navigation}>
    <div className={ui.brandRow}>
      <button type="button" className={ui.brand} onClick={() => onNavigate(items.some(item => item.id === "overview") ? "overview" : items[0]?.id || activeId)} disabled={busy} aria-label={t("Open admin overview")}>
        <span className={ui.brandMark}><Layers3 size={25} strokeWidth={1.7} aria-hidden="true" /></span>
        <span>{BRAND.name}<small>{t("Editorial workspace")}</small></span>
      </button>
      {mobile && <button type="button" className={ui.closeMenu} onClick={onClose} aria-label={t("Close navigation")}><X size={20} aria-hidden="true" /></button>}
    </div>
    <div className={ui.searchBox}>
      <Search size={17} aria-hidden="true" />
      <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t("Find a section…")} aria-label={t("Search admin sections")} autoComplete="off" />
      {query && <button type="button" onClick={() => setQuery("")} aria-label={t("Clear section search")}><X size={15} aria-hidden="true" /></button>}
    </div>
    <nav className={ui.menu} aria-label={t("Yönetim bölümleri")}>
      {visible.map(group => {
        const open = !!search || (expanded[group.id] ?? (group.id === "workspace" || group.id === activeGroup));
        return <section key={group.id} className={ui.group}>
          <button type="button" className={ui.groupToggle} aria-expanded={open} aria-controls={`${id}-${group.id}`} onClick={() => setExpanded(value => ({ ...value, [group.id]: !open }))} disabled={!!search}>
            <span>{t(group.label)}</span><ChevronDown size={14} aria-hidden="true" className={open ? ui.chevronOpen : ""} />
          </button>
          <div id={`${id}-${group.id}`} hidden={!open} className={ui.groupItems}>
            {group.entries.map(item => {
              const Icon = ADMIN_ICONS[item.id] || ADMIN_DEFAULT_ICON;
              return <button type="button" key={item.id} className={ui.navItem} aria-current={activeId === item.id ? "page" : undefined} disabled={busy} onClick={() => onNavigate(item.id)}>
                <Icon size={18} strokeWidth={1.7} aria-hidden="true" /><span>{t(item.label)}</span>
                {typeof item.count === "number" && item.count > 0 && <small className={ui.count}>{new Intl.NumberFormat(intlLocale).format(item.count)}</small>}
              </button>;
            })}
          </div>
        </section>;
      })}
      {visible.length === 0 && <div className={ui.noResults}><Search size={22} aria-hidden="true" /><p>{t("No matching sections.")}</p><button type="button" onClick={() => setQuery("")}>{t("Show all sections")}</button></div>}
    </nav>
    <div className={ui.sidebarBottom}>
      <Link href="/" className={ui.siteLink} onClick={event => { if (!onLeave()) event.preventDefault(); }}>{t("Siteyi aç")}<ArrowUpRight size={17} aria-hidden="true" /></Link>
      <div className={ui.account}>
        <span className={ui.avatar} aria-hidden="true">{userInitials}</span><div><strong title={username}>{username}</strong><span>{t(roleLabel)}</span></div>
        <button type="button" disabled={busy} onClick={onLogout} className={ui.logout} aria-label={t("Çıkış")} title={t("Çıkış")}><LogOut size={18} aria-hidden="true" /></button>
      </div>
    </div>
  </div>;
}

export default function AdminShell(props: AdminShellProps) {
  const { t } = useI18n();
  const { items, activeId, busy, dirty, locale, locales, onLocaleChange, children } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null), menuButton = useRef<HTMLButtonElement>(null), heading = useRef<HTMLHeadingElement>(null);
  const closeFocusTarget = useRef<"trigger" | "heading" | "none">("trigger");
  const dialogTitle = useId();
  const activeItem = items.find(item => item.id === activeId);
  const activeGroup = ADMIN_GROUPS.find(group => group.items.some(id => id === activeId));
  const closeNavigation = useCallback((focusTarget: "trigger" | "heading" | "none" = "trigger") => {
    closeFocusTarget.current = focusTarget;
    dialog.current?.close();
    setMobileOpen(false);
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previous; };
  }, [mobileOpen]);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 901px)");
    const changed = () => { if (media.matches) closeNavigation("none"); };
    media.addEventListener("change", changed);
    return () => media.removeEventListener("change", changed);
  }, [closeNavigation]);
  const navigate = (id: string) => {
    if (busy || !props.onNavigate(id)) return false;
    const changed = id !== activeId;
    if (changed) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (dialog.current?.open) closeNavigation(changed ? "heading" : "trigger");
    else if (changed) requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
    return true;
  };
  const navigationProps: NavigationProps = { ...props, onNavigate: navigate };
  return <div className={ui.shell}>
    <a className={ui.skipLink} href="#admin-workspace-content">{t("Skip to workspace")}</a>
    <aside className={ui.sidebar}><Navigation {...navigationProps} /></aside>
    <dialog ref={dialog} className={ui.drawer} aria-labelledby={dialogTitle} onClose={() => {
      const focusTarget = closeFocusTarget.current;
      setMobileOpen(false);
      requestAnimationFrame(() => {
        if (focusTarget === "heading") heading.current?.focus({ preventScroll: true });
        else if (focusTarget === "trigger") menuButton.current?.focus({ preventScroll: true });
      });
    }} onCancel={event => { event.preventDefault(); closeNavigation(); }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeNavigation();
    }}>
      <h2 id={dialogTitle} className={ui.srOnly}>{t("Admin navigation")}</h2>
      <Navigation {...navigationProps} mobile onClose={() => closeNavigation()} />
    </dialog>
    <div className={ui.canvas}>
      <header className={ui.topbar}>
        <div className={ui.location}>
          <button type="button" ref={menuButton} className={ui.openMenu} onClick={() => setMobileOpen(true)} aria-label={t("Open navigation")} aria-haspopup="dialog" aria-expanded={mobileOpen}><Menu size={22} aria-hidden="true" /></button>
          <span className={ui.mobileBrand}>{BRAND.name}</span>
          <div className={ui.breadcrumb}><span>{t("Admin")}</span><ChevronRight size={14} aria-hidden="true" /><strong>{t(activeGroup?.label || "Workspace")}</strong></div>
        </div>
        <div className={ui.headerTools}>
          {dirty && <span className={ui.dirty}><Circle size={7} fill="currentColor" aria-hidden="true" />{t("Unsaved changes")}</span>}
          <label className={ui.locale}><span className={ui.srOnly}>{t("Admin language")}</span><select value={locale} onChange={event => onLocaleChange(event.target.value)}>{locales.map(language => <option key={language.code} value={language.code}>{language.label}</option>)}</select></label>
          {["overview", "records", "feedback"].includes(activeId) && <button type="button" className={ui.refresh} disabled={busy} onClick={props.onRefresh} aria-label={t("Listeyi yenile")} title={t("Listeyi yenile")}><RefreshCw size={17} aria-hidden="true" /><span>{t("Refresh")}</span></button>}
        </div>
      </header>
      <main id="admin-workspace-content" className={ui.content}>
        <div className={ui.pageHeading}>
          <div><span className={ui.sectionLabel}>{t(activeGroup?.label || "Workspace")}</span><h1 ref={heading} tabIndex={-1}>{t(activeItem?.label || "Workspace")}</h1><p>{t(ADMIN_DESCRIPTIONS[activeId] || "Manage your editorial workspace.")}</p></div>
        </div>
        <div className={ui.workspace}>{children}</div>
      </main>
    </div>
  </div>;
}
