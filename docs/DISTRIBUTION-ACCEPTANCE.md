# Distribution acceptance — 0.8.0 candidate

WexaShelf is a self-hosted PHP/MySQL app catalog by [Softwexa](https://softwexa.com). This ledger defines completion as a usable, reproducibly packaged release, not adoption by every website or support for every hosting provider. Evidence must identify the tested runtime and package; earlier release receipts do not validate new changes.

| Area | Acceptance requirement | Current evidence |
|---|---|---|
| Fresh installation | Empty catalog by default; explicit sample option; English default; site identity; no broken sample links on an empty site | Passed: empty/sample source installs and exact final Docker/flat-ZIP runtime binding |
| Hosting | PHP 8.3+ with required extensions, MySQL 8 or supported MariaDB, root and subdirectory Apache installs, Docker; no Node on production host | Passed locally: PHP 8.3/MariaDB 10.11; PHP 8.4/MySQL 8.4; shipped Compose PHP 8.4/MariaDB 11.8 |
| Administration | Separate private `/admin`; owner/editor/publisher/analyst permissions; system health without secrets; observed worker runs distinguished from scheduled cron | Passed: separate private admin, role/origin checks, owner health and truthful worker evidence |
| Themes | Six working layouts; preview, activate, export/import, history restore; section ordering, mobile navigation, keyboard interaction and real application icons preserved | Passed: six layouts, both languages, actual empty/sample browser preview/activation/restore; final assets bound |
| Modules | API 1 compatibility and three API 2 blocks; bounded public-only reads; install disabled, reviewed checksum activation, upgrade/disable/export/uninstall; EN/TR and subdirectory URLs | Passed: 52 PHP assertions, actual HTTP/browser lifecycle and final runtime binding |
| Locale and SEO | English default, translated slugs, valid available alternates, canonical/HTML/social/schema language, unpublished translations excluded, human approval before indexing | Passed: current source suites and 16 read-only root/subdirectory HTTP locale/SEO/admin cases |
| Blog content | Inline PNG/JPEG/WebP images, app/image shortcodes, private preview, language-safe identities and published-reference media authorization | Passed: shared parser, safe media, immutable translation references, actual browser/HTTP and final asset binding |
| Editorial and AI | Apps/articles/lists and translations remain editable; optional configured providers; generation is initiated by admin, drafts reviewed before publication | Existing implementation; local mocked tests are not paid provider proof |
| Data safety | Backup/restore and copied-fixture upgrade/recovery preserve catalog, localization, modules and configuration; no credentials in public artifacts | Passed on copied fixtures: upgrade/private backup hash, catalog restore, owner recovery; full-media backup requirement documented |
| Accessibility | Keyboard routes/dialogs and focus, mobile overflow, real icon decoding, reduced motion; critical failures fixed | Six-theme 1440/390 overflow, real-icon decoding, directory focus and article editor checks passed; no certification claim |
| Performance | Every bundled theme plus representative content pages reaches 95+ mobile and desktop in a frozen, hash-bound local Lighthouse cohort | Passed: 10 cases/20 frozen 0.8 runs; mobile 95–97 and desktop 100; 77 source hashes and 40 reports bound |
| Packaging | Versioned PHP ZIP, source ZIP, Docker build; exact extracted/runtime asset checks, license/attribution, private-file exclusion, source rebuild | PHP/source manifests, private-file exclusions and runtime binding passed; exact source rebuild and archive hashes recorded in final release receipt |
| Documentation | First use, cPanel/Docker, updates/recovery, translations, theme/module authoring, AI contribution/PR workflow, features and known limits | Updated first-use/theme/module/media/translation/AI handbook; current templates validate and 98 handbook links resolve |
| External validation | Real HTTPS hosting, actual cPanel account, GitHub target and optional real AI provider budget | External activation remains unperformed: no actual cPanel/public HTTPS target, GitHub upstream or paid-provider configuration supplied. This is separate from local distribution acceptance. |

## Evidence policy

Use new isolated fixtures for destructive installation, recovery and performance tests. Preserve older source/preview installations and user data. Keep credentials in private ignored files. Do not enable paid CI, call paid providers, push or deploy without scoped authorization and the target needed to do it.

Record a failed check and its cause; rerun only after a relevant change. A local 95+ score is a measured local result, not a promise for an arbitrary shared host or a real-user Core Web Vitals claim. Module packages are declarative content blocks, not executable PHP/JavaScript uploads.
