# App submissions — local validation

This covers the source addition after the existing 0.8.0 archives. It is not a new release, a live deployment or an installation report for a customer's hosting account. The package version remains 0.8.0; earlier ZIP files have not been overwritten.

## Scope

Wexa Submissions is bundled and disabled by default. Its independent owner setting opens the English `/en/submit-app` and Turkish `/uygulama-gonder` intake flow. Applicants send official store links, descriptive app information, a real icon and up to five screenshots. They use a private receipt to resume, check a decision or withdraw an eligible entry. No developer account, email delivery or application binary hosting is implied.

The independent `/admin` workspace provides settings, status counts, queue filtering, private image review, rejection with an applicant-facing message and accept-to-draft. Acceptance preserves the submitted source language, excludes private contact details, leaves factual evidence empty and forces draft status with SEO approval off. Publication remains an ordinary, separate editorial action. App records support screenshot editing, ordering and removal, with localized alternative text/captions and reserved display dimensions.

## Verification

- TypeScript validation, 88 JavaScript tests and the PHP browser build passed. Locale validation passed with 2 registered languages and 2,272 matching stable UI keys. New authored API errors are covered in English and Turkish.
- The isolated submission suite passed 109 assertions, covering authorization, receipts, retries, conflicts, bounded raster uploads, quotas, duplicate identities, forced draft creation, backup restoration, expiry and purge. The screenshot suite passed 78 assertions for validation, Unicode, publication states, frozen translations and private/public media eligibility.
- Eighteen isolated PHP HTTP checks passed. These use synthetic SQLite/storage and do not by themselves establish native MySQL behavior.
- Five native PHP 8.3/MariaDB 10.11 suites passed against a separate disposable database container: repository, catalog query, translations, editor roles and backup transfer. The temporary database and test runner were removed without changing other installed catalogs.
- Source-locale, public SEO, localization, localized slugs, content media, branding and authored API-error regression checks passed. Initial database-suite invocations without their required private configuration stopped before connecting; configured native runs supersede those invocation failures.

## Actual browser and publication checks

A fresh, empty, source-mounted PHP 8.3/MariaDB 10.11 installation on localhost3180 passed 15 Chromium checkpoints: closed intake/tracking, owner enablement, separate public/admin bundles, browser image conversion, private receipt copy/resume, three-stage submission with rights acknowledgment, protected pending images, owner review, forced unpublished draft, existing screenshot editor, applicant status, and English/Turkish layouts at390px. The final two checks deliberately held the public config request: English desktop and Turkish mobile fields were available from the first render and the footer stayed stationary when the refresh was released. There were no browser JavaScript exceptions or external network requests. A deliberately overheight image was rejected by the documented dimension guard; a bounded synthetic fixture was then used. Earlier locator/capture issues were corrected without product changes. Synthetic unsubmitted preview drafts remain only in the disposable fixture.

Five subsequent HTTP checks on that installation confirmed native MariaDB screenshot selection: accepted drafts deny anonymous media, a separate explicit synthetic publication makes the screenshot readable, English server-rendered detail includes it without contact information, incorrect format requests return404, and returning the record to draft immediately revokes access. The synthetic app was restored to draft, with SEO approval off. An initial harness request used the wrong singular `/en/app/` route; the corrected `/en/apps/` run passed and the earlier attempt is retained separately.

Scoped visual review found the final desktop moderation/editor and EN/TR mobile forms readable without material clipping or overlap. Skip-link duplication in one full-page screenshot was a capture artifact; DOM inspection confirmed one offscreen, unfocused skip link. A native required-checkbox validation tooltip was removed from the final review capture by using the completed form state.

## Performance

An initial separate intake-page measurement found a footer layout shift during its configuration fetch (81 mobile/92 desktop). The public bootstrap now includes only availability, limits, installed languages and categories for this route, so the form renders immediately while availability is refreshed. The legacy loading state reserves space. The failed cohort is retained at `artifacts/performance/submissions-form-final/`.

The final current-source homepage and submission page both measured Lighthouse performance **96 mobile /100 desktop**. The night homepage preloads its actual Latin400 body and Latin600 heading fonts from a generated build manifest, eliminating the measured font-swap layout shift. Preloads are limited to the applicable sans night homepage and preserve the high-priority application script. Homepage CLS was0; submission CLS was0.0035 mobile/0.0013 desktop.

These are local lab results for two exact pages and source hashes, not field Core Web Vitals, a guarantee for every theme/page, or a score on arbitrary hosting. The post-bootstrap homepage run at94 mobile is retained; it prompted the font-loading change, rather than repeated scoring of unchanged bytes. Other template measurements from the earlier theme cohort are historical and were not repeated for this feature.

Local evidence: `artifacts/submissions/browser-check.json`, `publication-check.json`, `regression/receipt.json`, `http-check.json` and `artifacts/performance/submissions-home-fonts/` / `submissions-form-fonts/`.

## Distribution boundary

The new service, UI, language resources, tests and operating guide are included in the source/hosting packaging inputs. No new archive has been generated, uploaded or deployed in this change. A future release must package these exact sources and run its own extracted-package installation/upgrade checks. Existing theme previews remain preset samples; older performance and release receipts are not evidence for new bytes.
