# WexaShelf 0.7.1 corrections

This revision addresses the user's rejection of monogram replacements, the administration page being embedded in the public document, and inconsistent language-specific URLs.

## Contracts

- Genuine application icons are restored from the retained publisher sources and optimized for local WebP/SVG delivery. Project MIT licensing does not relabel publisher artwork; acquisition references remain in `THIRD_PARTY_NOTICES.md` and the artwork manifest.
- `/admin` has its own document, navigation and assets, with no public catalog bootstrap, discovery shell, schema or visitor performance collector. Authentication and role checks remain server-enforced. `/yonetim` redirects, and `/install` is the installer with a legacy `/kurulum` redirect.
- English and Turkish route/slug equivalents retain stable internal IDs. Declared tags have explicit localized labels/slugs. Old static and encoded-tag addresses redirect while preserving query parameters. Unknown tags are not automatically translated.
- Eligible public equivalents use reciprocal/self `hreflang`, self-canonical URLs, HTML language and localized social/schema metadata. Missing or unapproved content does not become an invented indexable translation.
- `npm run dev` starts the primary PHP application. The retained Next prototype is explicitly `npm run dev:legacy`; its old public routes are not the main PHP distribution.

## Verification

- 61 JavaScript tests, TypeScript checking and complete 1713-key EN/TR validation passed.
- Eight focused PHP suites passed for localization, source locales, public SEO/schema, language-pack compatibility, localized slugs and Growth routes. The catalog query test additionally proves that localized tag slug, displayed label and stable source ID find identical records.
- Seven actual admin browser/HTTP check groups passed: independent document, private cache/noindex, redirect, anonymous 401, EN login/navigation/security, persistent TR locale and logout.
- Fifteen localized URL browser groups passed: five legacy 301 aliases, five EN/TR page pairs with actual language switching and metadata, tag count/direct/reload behavior, encoded tag clicks and publisher identity. No catalog/provider/settings/SEO approval was changed by those checks.
- Fresh immutable Docker at localhost 3168 and flat ZIP `/catalog` at 3169 completed the real installer against separate MySQL 8.4 schemas. Rejected input, installation lock, login and private paths were checked.
- All ten actual app icons returned HTTP 200, matched source-derived bytes, carried cache headers and decoded in the browser in both installations. WebP/SVG delivery totals 44,248 bytes.

Candidate image: `sha256:ce9cbfc5dda0829eceb3ef691c37491813a36c6b14cbe75cc20773965848e97a`. Candidate PHP archive SHA-256: `3746b69913ccd346f0df8917ab9b2f8b8881441a1513509e718fcd1d71f88525`. Documentation-only final packaging will have a separate archive hash; binding is recorded in ignored local receipts, avoiding a self-referential archive hash in this document.

Earlier 0.7.0 scores remain historical. The final 0.7.1 cohort passed all eight cases/sixteen runs: mobile 95–97, desktop 100. All measured runtime hashes match the current files; see [performance report](PERFORMANCE-AUDIT-REPORT.md). Local evidence includes `artifacts/verification/fresh-0.7.1-hosting.json`, `localized-urls-0.7.1.json` and `071/admin-http.json`; these receipts are excluded from public archives.

No GitHub publication, real cPanel deployment or paid AI call is implied by these local changes.
