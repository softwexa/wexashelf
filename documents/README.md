# WexaShelf contributor handbook

WexaShelf is an open-source app discovery and editorial catalog by [Softwexa](https://softwexa.com). The primary application uses PHP and MySQL, with a shared React interface compiled before deployment. Project code is MIT licensed; third-party assets retain their own terms.

This is an English starting point for human contributors and AI-assisted work. It describes the current source, including additions after the validated 0.8.0 archives, without treating planned integrations or local test results as production guarantees.

## Start here

1. Read [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution and branch policy, then [AGENTS.md](../AGENTS.md) for repository instructions. This handbook does not override them.
2. Check [featured.md](featured.md) for delivered behavior and remaining boundaries.
3. Use [ARCHITECTURE.md](ARCHITECTURE.md) to find the correct server, interface or content layer.
4. Select relevant checks from [TESTING.md](TESTING.md). Use a disposable local catalog and preserve existing developer/user data.
5. For AI-assisted work, follow [AI-CONTRIBUTION.md](AI-CONTRIBUTION.md), then prepare a reviewable change with actual evidence.
6. Maintainers setting up an upstream repository should use [GITHUB-SETUP.md](GITHUB-SETUP.md). Its setup steps do not imply that a remote or branch already exists.

## Choose a contribution

| Contribution | Read first | Starting point |
| --- | --- | --- |
| Translate an interface or add a language | [Translation guide](../docs/TRANSLATING.md) | [Locale templates](../examples/locales/README.md) |
| Improve multilingual content or SEO | [URL/SEO contract](../docs/MULTILINGUAL-SEO.md) | [Translation workspace](../src/components/admin/TranslationsWorkspace.tsx) |
| Create a theme | [Theme development](../docs/THEME-DEVELOPMENT.md) | [Theme example](../examples/community-theme/README.md) |
| Create a declarative module | [Module development](../docs/MODULE-DEVELOPMENT.md) | [Module example](../examples/community-module/README.md) |
| Improve editorial discovery | [Editorial page contract](../docs/GROWTH-EDITORIAL.md) | [Growth service](../php/app/Growth.php) |
| Fix server behavior or permissions | [Architecture](ARCHITECTURE.md) | [PHP API](../php/app/Api.php) |
| Improve administration navigation or layout | [Administration interface](../docs/ADMIN-INTERFACE.md) | [Admin shell](../src/components/admin/AdminShell.tsx) |
| Improve upgrades or packaging | [Upgrade guide](../docs/UPGRADING.md) | [Packaging script](../scripts/package-php.mjs) |

Some older operational guides remain in Turkish. The English translation, theme, module and upgrade guides define their contributor contracts; the multilingual SEO guide also contains server-pack rules. Translate prose without changing stable IDs or serialized facts.

## Current source capabilities

- Sixteen built-in layouts, including the [ten-theme collection](../docs/THEME-COLLECTION.md), with configurable appearance, independent branding, isolated full previews, explicit activation and appearance restoration: [theme development](../docs/THEME-DEVELOPMENT.md).
- Reviewed Module API 2 packages for curated apps, comparisons and latest articles: [module development](../docs/MODULE-DEVELOPMENT.md). Packages use available published records and do not publish sample content.
- Empty or optional sample installation, owner System health and first-use checks: [installation operations](../docs/INSTALL-OPERATIONS.md).
- Plain-text article app references and inline images: [article authoring](../docs/ARTICLE-CONTENT.md) and [image/media boundaries](../docs/IMAGE-CONTENT.md). The app editor also uploads genuine publisher icons into the unsaved form; private preview and public publication are separate.
- [Distribution acceptance](../docs/DISTRIBUTION-ACCEPTANCE.md) distinguishes source checks, archive rebuilds, local installations and unverified hosting. Final performance and archive evidence belong to the release report, not this feature list.

## Operations added in 0.7

- [Owner security](../docs/ACCOUNT-SECURITY.md) and [backup transfer/recovery](../docs/BACKUP-RECOVERY.md).
- [AI draft queue](../docs/AI-CONTENT.md) and [PHP cron workers](../docs/CRON-WORKERS.md).
- [Catalog query/scaling contract](../docs/CATALOG-SCALING.md).
- [Store adapters and source workers](../docs/STORE-SOURCES.md).
- [Release validation and asset evidence](../docs/RELEASE-0.7.0-VALIDATION.md).

## Development and installation

Use the full source ZIP or a source checkout for code, theme and module development. Code links in this handbook use that source-tree layout. The PHP hosting ZIP contains the compiled runtime and reference documentation; it is not the complete development tree. Developers need Node.js 24+ to rebuild browser assets; hosting needs neither Node.js, npm nor Composer. See the [repository README](../README.md) and [installation guide](../docs/KURULUM_CPANEL.md) for deployment requirements; use [TESTING.md](TESTING.md) for isolated development checks.

`npm run dev` starts the primary PHP application; `npm run dev:legacy` retains the older Next.js prototype. A successful Next.js check is not evidence for a PHP server change.

## Review and evidence

Include the problem, resulting behavior, focused changes, and commands actually run with their results. Label fixtures and unverified services. A human maintainer reviews behavior, licensing, data handling and applicable checks before merging or publishing; AI-generated output is not that approval.

Keep private configuration, credentials, database exports, session files, raw user content and generated QA artifacts out of submissions. Read [SECURITY.md](../SECURITY.md), [LICENSE](../LICENSE) and [third-party notices](../THIRD_PARTY_NOTICES.md). Use the actual repository location and branch policy supplied by the maintainer; this handbook does not invent a GitHub URL or assume a remote exists.

[Application status](../docs/UYGULAMA_DURUMU.md) and the [performance report](../docs/PERFORMANCE-AUDIT-REPORT.md) preserve the historical 0.6.0 checkpoint alongside current source status. Neither public archive includes `artifacts/`, private QA data or local verification receipts. Any such paths mentioned in reports identify local-only evidence, not promised release files. Obtain evidence for your own change instead of treating an older receipt as verification of another revision or host.
