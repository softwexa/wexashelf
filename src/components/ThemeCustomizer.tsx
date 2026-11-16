"use client";

import { useEffect, useId, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { HOME_SECTION_IDS, PRESENTATION_OPTIONS, getThemePresentation, type HomeSectionId, type ThemeManifest, type ThemePresentation } from "@/lib/themes";
import editor from "./ThemeCustomizer.module.css";

const colorLabels: Record<keyof ThemeManifest["tokens"], string> = {
  background: "Page background", surface: "Card background", surfaceRaised: "Raised surface",
  foreground: "Primary text", muted: "Secondary text", accent: "Accent color",
  accentContrast: "Text on accent", border: "Borders",
};
const sectionLabels: Record<HomeSectionId, string> = {
  discovery: "Yeni bir şey keşfet", weekly: "Haftanın seçkisi", trending: "Göz atmaya değer",
  toolbox: "Karar araçları", guides: "Rehberler", workflows: "İş akışları",
};
const optionLabels = {
  font: "Heading typography", width: "Page width", radius: "Corner shape", hero: "Hero spacing", cardStyle: "Card appearance",
};
const valueLabels: Record<string, string> = {
  sans: "Sans serif", serif: "Serif", mono: "Monospace", display: "Display",
  standard: "Standard", wide: "Wide", full: "Full width", square: "Square", soft: "Soft", round: "Rounded",
  compact: "Compact", spacious: "Spacious", flat: "Flat", outline: "Outlined", elevated: "Elevated",
};
const isColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

type Props = {
  theme: ThemeManifest;
  onChange: (theme: ThemeManifest) => void;
  onValidityChange?: (valid: boolean) => void;
};

/** Only validated values leave this editor; partial text input stays local. */
export function ThemeCustomizer({ theme, onChange, onValidityChange }: Props) {
  const { t } = useI18n();
  const id = useId();
  const [name, setName] = useState(theme.name);
  const [colors, setColors] = useState(theme.tokens);
  const [announcement, setAnnouncement] = useState("");
  const validName = !!name.trim() && name.length <= 80 && !/[\u0000-\u001f\u007f]/.test(name);
  const validColors = Object.values(colors).every(isColor);
  const valid = validName && validColors;
  useEffect(() => { setName(theme.name); }, [theme.name, theme.id]);
  useEffect(() => { setColors(theme.tokens); }, [theme.tokens, theme.id]);
  useEffect(() => { onValidityChange?.(valid); }, [valid, onValidityChange]);
  const presentation = getThemePresentation(theme);
  const orderedSections = [...theme.sections, ...HOME_SECTION_IDS.filter(section => !theme.sections.includes(section))];

  function colorChange(key: keyof ThemeManifest["tokens"], value: string) {
    setColors(previous => ({ ...previous, [key]: value }));
    if (isColor(value)) onChange({ ...theme, tokens: { ...theme.tokens, [key]: value } });
  }
  function move(section: HomeSectionId, direction: -1 | 1) {
    const sections = [...theme.sections];
    const from = sections.indexOf(section), to = from + direction;
    if (from < 0 || to < 0 || to >= sections.length) return;
    [sections[from], sections[to]] = [sections[to], sections[from]];
    onChange({ ...theme, sections });
    setAnnouncement(t("Moved {name} to position {position}.", { name: t(sectionLabels[section]), position: to + 1 }));
  }

  return <section className={editor.customizer} aria-labelledby={`${id}-title`}>
    <div className={editor.heading}><h3 id={`${id}-title`}>{t("Customize this theme")}</h3><p>{t("Adjust the presentation without changing your content.")}</p></div>
    <label className={editor.field}><span>{t("Theme display name")}</span><input value={name} maxLength={80} aria-invalid={!validName} aria-describedby={!validName ? `${id}-name-error` : undefined} onChange={event => {
      const next = event.target.value;
      setName(next);
      if (next.trim() && !/[\u0000-\u001f\u007f]/.test(next)) onChange({ ...theme, name: next });
    }} /></label>
    {!validName && <p className={editor.error} id={`${id}-name-error`}>{t("Enter a theme name between 1 and 80 characters.")}</p>}
    <fieldset className={editor.group}><legend>{t("Layout and typography")}</legend><div className={editor.fields}>
      <label className={editor.field}><span>{t("Navigation layout")}</span><select value={theme.layout} onChange={event => onChange({ ...theme, layout: event.target.value as ThemeManifest["layout"] })}><option value="topbar">{t("Üst menü")}</option><option value="sidebar">{t("Yan menü")}</option></select></label>
      <label className={editor.field}><span>{t("Content density")}</span><select value={theme.density} onChange={event => onChange({ ...theme, density: event.target.value as ThemeManifest["density"] })}><option value="comfortable">{t("Rahat")}</option><option value="compact">{t("Sıkı")}</option></select></label>
      {(Object.keys(PRESENTATION_OPTIONS) as (keyof ThemePresentation)[]).map(key => <label className={editor.field} key={key}><span>{t(optionLabels[key])}</span><select value={presentation[key]} onChange={event => onChange({ ...theme, presentation: { ...presentation, [key]: event.target.value } })}>{PRESENTATION_OPTIONS[key].map(value => <option key={value} value={value}>{t(valueLabels[value])}</option>)}</select></label>)}
    </div></fieldset>
    <fieldset className={editor.group}><legend>{t("Color palette")}</legend><p className={editor.help}>{t("Check text contrast after changing colors. Use six-digit hex values.")}</p><div className={editor.colors}>
      {(Object.keys(colorLabels) as (keyof ThemeManifest["tokens"])[]).map(key => <div className={editor.color} key={key}>
        <label htmlFor={`${id}-${key}`}>{t(colorLabels[key])}</label>
        <div><input type="color" value={theme.tokens[key]} aria-label={t("Pick {name}", { name: t(colorLabels[key]) })} onChange={event => colorChange(key, event.target.value)} /><input id={`${id}-${key}`} value={colors[key]} maxLength={7} spellCheck={false} autoCapitalize="off" aria-invalid={!isColor(colors[key])} aria-describedby={!isColor(colors[key]) ? `${id}-color-error` : undefined} onChange={event => colorChange(key, event.target.value)} /></div>
      </div>)}
    </div>{!validColors && <p className={editor.error} id={`${id}-color-error`}>{t("Use a color such as #176C68. Incomplete colors are not applied.")}</p>}</fieldset>
    <fieldset className={editor.group}><legend>{t("Homepage sections")}</legend><p className={editor.help}>{t("Choose sections and move them into order. Keep at least one section enabled. Some sections also require their module.")}</p>
      <ol className={editor.sections}>{orderedSections.map(section => {
        const index = theme.sections.indexOf(section), enabled = index >= 0;
        return <li key={section} data-enabled={enabled}><label><input type="checkbox" checked={enabled} disabled={enabled && theme.sections.length === 1} onChange={event => onChange({ ...theme, sections: event.target.checked ? [...theme.sections, section] : theme.sections.filter(value => value !== section) })} /><span>{t(sectionLabels[section])}</span></label><div className={editor.order}>
          <button type="button" disabled={!enabled || index === 0} onClick={() => move(section, -1)} aria-label={t("Move {name} up", { name: t(sectionLabels[section]) })}><ArrowUp size={17} aria-hidden="true" /></button>
          <button type="button" disabled={!enabled || index === theme.sections.length - 1} onClick={() => move(section, 1)} aria-label={t("Move {name} down", { name: t(sectionLabels[section]) })}><ArrowDown size={17} aria-hidden="true" /></button>
        </div></li>;
      })}</ol>
      <p role="status" className={editor.srOnly}>{announcement}</p>
    </fieldset>
  </section>;
}
