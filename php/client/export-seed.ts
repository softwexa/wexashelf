import { localeRegistry, supportedLocales } from '../../src/lib/i18n-registry';
import { buildEnglishSeedTranslations } from './english-seed';
import { localeContent } from '../../src/lib/i18n-content';
import { APPS, GUIDES, WORKFLOWS, CATEGORIES, PLATFORM_LABELS } from '../../src/lib/catalog';
import { APP_ENRICHMENTS, ARTICLES, EDITORIAL_LISTS } from '../../src/lib/editorial';
import { DEFAULT_SITE_SETTINGS } from '../../src/lib/site-settings';
import { DEFAULT_ADMISSION_RULES } from '../../src/lib/admission';
import { BUILTIN_THEMES } from '../../src/lib/builtin-themes';
import { FACT_LABELS, EVIDENCE_LABELS } from '../../src/lib/domain';
import { PAGE_NAMES } from '../../src/lib/seo';
const updatedAt = '2026-11-16T00:00:00.000Z';
const records = [
 ...APPS.map(a => ({ kind: 'app', id: a.id, data: {...a, publisher: new URL(a.website).hostname, tags: [], aliases: [], pricingModel: 'unknown', facts: [], plans: [], storeMetrics: [], ...APP_ENRICHMENTS[a.id]}, reviewNote: 'Resmi kaynaklara dayalı başlangıç kaydı; uygulamalı test değildir.' })),
 ...ARTICLES.map(data => ({kind: 'article', id: data.id, data, reviewNote: 'Editoryal başlangıç içeriği.'})),
 ...EDITORIAL_LISTS.map(data => ({kind: 'list', id: data.id, data, reviewNote: 'Editoryal başlangıç içeriği.'})),
].map(record => ({...record, status: 'published', revision: 1, updatedAt, seoApproved: false, publishAt: null}));
export const seed = { records, translations: buildEnglishSeedTranslations(records), siteSettings: DEFAULT_SITE_SETTINGS, admissionRules: DEFAULT_ADMISSION_RULES, builtinThemes: BUILTIN_THEMES };
export const content = { guides: GUIDES, workflows: WORKFLOWS, categories: CATEGORIES, platformLabels: PLATFORM_LABELS, factLabels: FACT_LABELS, evidenceLabels: EVIDENCE_LABELS, pageNames: PAGE_NAMES };

export const englishContent = localeContent('en');

export const locales = supportedLocales;
export const localeContents = Object.fromEntries(Object.entries(localeRegistry).map(([code, pack]) => [code, pack.content]));

export const serverLocaleContents = Object.fromEntries(Object.entries(localeRegistry).map(([code, pack]) => [code, pack.serverMessages]));

export const uiLocaleContents = Object.fromEntries(Object.entries(localeRegistry).map(([code, {content, serverMessages, ...ui}]) => [code, ui]));
