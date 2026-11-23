"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { appIconUrl } from "@/lib/asset-url";
import css from "./AdminRecordPicker.module.css";

export type AdminPickerOption = {
  id: string; label: string; detail?: string; icon?: string; keywords?: string;
  facets?: Record<string, readonly string[]>;
  /** The exact query for which the server returned this option. */
  matchedQuery?: string;
};
export type AdminPickerFilter = {
  key: string; label: string; choices: readonly { value: string; label: string }[];
};
type Props = {
  options: readonly AdminPickerOption[]; filters?: readonly AdminPickerFilter[];
  value: readonly string[]; onChange: (next: string[]) => void; label: string;
  multiple?: boolean; maxSelections?: number; minSelections?: number; disabled?: boolean;
  onQueryChange?: (query: string) => void; onLoadMore?: () => void; hasMore?: boolean;
  loading?: boolean; error?: string; onOpenChange?: (open: boolean) => void;
};
const PAGE_SIZE = 60;
const normalize = (text: string) => text.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i");

export default function AdminRecordPicker({ options, filters = [], value, onChange, label, multiple = false, maxSelections, minSelections = 0, disabled = false, onQueryChange, onLoadMore, hasMore = !!onLoadMore, loading = false, error, onOpenChange }: Props) {
  const { t } = useI18n();
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const resultList = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const selectedMetadata = useRef(new Map<string, AdminPickerOption>());
  const keyboardNavigation = useRef(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [facets, setFacets] = useState<Record<string, string>>({});
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [active, setActive] = useState(0);
  const indexed = useMemo(() => {
    const seen = new Set<string>();
    return options.filter(option => !seen.has(option.id) && !!seen.add(option.id)).map(option => ({ option, text: normalize(`${option.label} ${option.id} ${option.detail ?? ""} ${option.keywords ?? ""}`) }));
  }, [options]);
  const byId = useMemo(() => new Map([...selectedMetadata.current, ...indexed.map(({ option }) => [option.id, option] as const)]), [indexed, value, draft]);
  useEffect(() => {
    // Retain only selected identities: remote search pages may replace all options.
    const selected = new Set([...value, ...(open ? draft : [])]);
    selectedMetadata.current = new Map([...selected].flatMap(key => {
      const option = byId.get(key);
      return option ? [[key, option] as const] : [];
    }));
  }, [byId, value, draft, open]);
  const matches = useMemo(() => {
    const words = normalize(query).trim().split(/\s+/).filter(Boolean);
    return indexed.filter(({ option, text }) => (option.matchedQuery === query || words.every(word => text.includes(word))) && filters.every(filter => !facets[filter.key] || option.facets?.[filter.key]?.includes(facets[filter.key]))).map(({ option }) => option);
  }, [indexed, query, facets, filters]);
  const visible = matches.slice(0, limit);
  const maximum = multiple ? maxSelections : 1;
  const valid = draft.length >= minSelections && (maximum === undefined || draft.length <= maximum);

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    search.current?.focus();
    return () => { dialog.current?.close(); };
  }, [open]);
  useEffect(() => {
    if (!open || !keyboardNavigation.current) return;
    keyboardNavigation.current = false;
    const list = resultList.current;
    const row = list?.children[active] as HTMLElement | undefined;
    if (!list || !row) return;
    const scroller = list.scrollHeight > list.clientHeight ? list : body.current;
    if (!scroller) return;
    const bounds = scroller.getBoundingClientRect();
    const item = row.getBoundingClientRect();
    if (item.top < bounds.top) scroller.scrollTop -= bounds.top - item.top;
    else if (item.bottom > bounds.bottom) scroller.scrollTop += item.bottom - bounds.bottom;
  }, [active, id, open]);

  function close() {
    dialog.current?.close();
    setOpen(false);
    onOpenChange?.(false);
    trigger.current?.focus();
  }
  function choose(option: AdminPickerOption) {
    if (draft.includes(option.id)) setDraft(draft.filter(item => item !== option.id));
    else if (!multiple) setDraft([option.id]);
    else if (maximum === undefined || draft.length < maximum) setDraft([...draft, option.id]);
  }
  function move(index: number, offset: number) {
    const next = [...draft];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setDraft(next);
  }
  function resetResults() { setLimit(PAGE_SIZE); setActive(0); }

  return <div className={css.picker}>
    <span id={`${id}-label`} className={css.label}>{label}</span>
    <button ref={trigger} type="button" className={css.trigger} disabled={disabled} aria-labelledby={`${id}-label ${id}-value`} aria-haspopup="dialog" aria-expanded={open} onClick={() => {
      setDraft([...new Set(value)]); setQuery(""); setFacets({}); resetResults(); setOpen(true); onOpenChange?.(true); onQueryChange?.("");
    }}>
      <span id={`${id}-value`}>{value.length ? value.map(item => byId.get(item)?.label ?? item).join(", ") : t("Kayıt seç")}</span>
      <span aria-hidden="true">⌕</span>
    </button>
    <dialog ref={dialog} className={css.dialog} aria-labelledby={`${id}-title`} onKeyDownCapture={event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); } }} onCancel={event => { event.preventDefault(); close(); }}>
      <div className={css.header}><div><h2 id={`${id}-title`}>{label}</h2><p>{t("Değişiklikler Uygula ile forma aktarılır.")}</p></div><button type="button" className={css.small} aria-label={t("Kapat")} onClick={close}>×</button></div>
      <div className={css.controls}>
        <label className={css.search}><span>{t("Kayıtlarda ara")}</span><input ref={search} type="search" value={query} placeholder={t("Ad, kimlik veya anahtar kelime")} role="combobox" aria-autocomplete="list" aria-expanded={true} aria-controls={`${id}-results`} aria-activedescendant={visible[active] ? `${id}-option-${active}` : undefined} onChange={event => { setQuery(event.target.value); onQueryChange?.(event.target.value); resetResults(); }} onKeyDown={event => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); keyboardNavigation.current = true; setActive(current => Math.max(0, Math.min(visible.length - 1, current + (event.key === "ArrowDown" ? 1 : -1)))); }
          if (event.key === "Enter") { event.preventDefault(); if (visible[active]) choose(visible[active]); }
        }} /></label>
        {filters.map(filter => <label key={filter.key}><span>{filter.label}</span><select aria-label={filter.label} value={facets[filter.key] ?? ""} onChange={event => { setFacets({ ...facets, [filter.key]: event.target.value }); resetResults(); }}><option value="">{t("Tümü")}</option>{filter.choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select></label>)}
      </div>
      <div ref={body} className={css.body}>
        <section className={css.results} aria-busy={loading}>{loading && <p role="status">{t("Kayıtlar yükleniyor…")}</p>}{error && <p role="alert">{error}</p>}<p className={css.count} role="status">{t("{count} sonuç", { count: matches.length })} · {t("{count} gösteriliyor", { count: visible.length })}</p>
          <div ref={resultList} id={`${id}-results`} role="listbox" aria-label={t("Arama sonuçları")} aria-multiselectable={multiple} className={css.list}>
            {visible.map((option, index) => {
              const selected = draft.includes(option.id);
              const blocked = !selected && multiple && maximum !== undefined && draft.length >= maximum;
              return <div key={option.id} id={`${id}-option-${index}`} role="option" aria-selected={selected} aria-disabled={blocked} tabIndex={-1} className={`${css.option} ${active === index ? css.active : ""}`} onFocus={() => setActive(index)} onClick={() => { if (!blocked) choose(option); }} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (!blocked) choose(option); } }}>
                {option.icon && <img src={appIconUrl(option.icon)} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} />}
                <span className={css.optionText}><strong>{option.label}</strong><small>{option.detail || option.id}</small></span><span aria-hidden="true" className={css.check}>{selected ? "✓" : "+"}</span>
              </div>;
            })}
          </div>
          {!loading && !error && !matches.length && <p className={css.empty}>{t("Eşleşen kayıt yok. Aramayı veya filtreleri değiştirin.")}</p>}
          {(matches.length > limit || hasMore) && <button type="button" className={css.more} disabled={loading} onClick={() => { if (matches.length > limit) setLimit(limit + PAGE_SIZE); else { setLimit(limit + PAGE_SIZE); onLoadMore?.(); } }}>{t("Daha fazla göster")}</button>}
        </section>
        <section className={css.selection} aria-label={t("Seçilen kayıtlar")}><h3>{t("Seçilen kayıtlar")} <span>{draft.length}{maximum !== undefined ? ` / ${maximum}` : ""}</span></h3>
          {!draft.length && <p className={css.empty}>{t("Henüz kayıt seçilmedi.")}</p>}
          <ol>{draft.map((item, index) => <li key={item}><div><strong>{byId.get(item)?.label ?? item}</strong>{!byId.has(item) && <small>{t("Katalogda bulunamayan kayıt")}</small>}</div><div className={css.actions}>{multiple && <><button type="button" className={css.small} disabled={index === 0} aria-label={`${t("Yukarı taşı")}: ${byId.get(item)?.label ?? item}`} onClick={() => move(index, -1)}>↑</button><button type="button" className={css.small} disabled={index === draft.length - 1} aria-label={`${t("Aşağı taşı")}: ${byId.get(item)?.label ?? item}`} onClick={() => move(index, 1)}>↓</button></>}<button type="button" className={css.small} aria-label={`${t("Seçimi kaldır")}: ${byId.get(item)?.label ?? item}`} onClick={() => setDraft(draft.filter(entry => entry !== item))}>×</button></div></li>)}</ol>
        </section>
      </div>
      <div className={css.footer}><p role="status">{!valid ? t("Seçim sayısını kontrol edin: en az {min}, en fazla {max}.", { min: minSelections, max: maximum ?? "∞" }) : t("Seçim sırası korunur.")}</p><button type="button" className="admin-button" onClick={close}>{t("Vazgeç")}</button><button type="button" className="admin-button primary" disabled={!valid || disabled} onClick={() => { if (draft.length !== value.length || draft.some((entry, index) => entry !== value[index])) onChange([...draft]); close(); }}>{t("Uygula")}</button></div>
    </dialog>
  </div>;
}
