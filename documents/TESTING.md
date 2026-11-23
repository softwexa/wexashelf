# Testing a contribution

Use the full source ZIP or source checkout and run commands from its root. The compiled PHP hosting ZIP does not contain the complete development/test tree. Pick checks that exercise the changed behavior, then report actual results and skipped coverage. This guide uses the scripts in [package.json](../package.json); it does not assume that CI is configured or that local tests authorize a deployment.

## Prerequisites and isolation

- Node.js 24+ and npm for shared source checks and browser builds.
- PHP 8.3+ with the application's required extensions for PHP checks. The in-memory SEO/growth tests additionally need `pdo_sqlite`; database suites need `pdo_mysql`. See the [installer requirements](../php/app/Installer.php).
- A dedicated local MySQL/MariaDB instance or user restricted to disposable test schemas. Never supply production credentials to a test script.
- Playwright Chromium for browser checks: `npx playwright install chromium` after `npm ci`.

Keep private database JSON, PHP storage, passwords, provider keys and generated artifacts outside version control. Set `WEXA_STORAGE_PATH` to a separate private directory when starting a test PHP server. Use synthetic content and an explicitly isolated installed catalog for mutation tests. Do not reuse the legacy `.local/data` directory.

## Shared source checks

```sh
npm ci
npm run typecheck
npm test
node scripts/check-locales.mjs
```

`npm test` covers shared TypeScript and legacy Node behavior. It does not run the PHP service suites. Locale validation checks structure/placeholders, not linguistic accuracy. For language changes, follow the full [translation workflow](../docs/TRANSLATING.md).

For changed PHP files, run `php -l path/to/file.php`. To check the current entry-point/service directories:

```sh
for file in php/app/*.php php/public/*.php; do
  php -l "$file" || exit 1
done
```

## PHP suites without an external database

These use local fixtures or in-memory storage, including mocked provider transport. The locale-pack test creates an isolated temporary resource copy.

```sh
for suite in editorial-fields seo schema public-seo localization locale-pack growth ai-provider ai-grounding app-submissions app-screenshots server-errors; do
  php "php/tests/$suite.php" || exit 1
done
```

Passing `ai-provider.php` or `ai-grounding.php` is not evidence of a paid provider call, a live API key or a billable usage result.

## PHP suites using disposable MySQL schemas

Read each suite before running it. The current scripts override the database name in the supplied JSON:

| Scripts | Schema actually used |
| --- | --- |
| `repository`, `translations`, `extensions`, `capabilities`, `editor-roles`, `performance-observations` | `wexashelf_repo_test` |
| `ai-service` | `wexashelf_ai_test` |
| `upgrade` | `wexashelf_upgrade_test` |
| `security` | `wexashelf_security_070` |
| `backup-transfer` | `wexashelf_backup_070` |
| `ai-queue` | `wexashelf_aiqueue_070` |
| `catalog-query` | `wexashelf_catalog_070` |
| `language-pack-runtime` | `wexashelf_locale_070` |
| `source-providers`, `source-freshness` | `wexashelf_sources_070` |
| `catalog-scale` benchmark | `wexashelf_catalog_scale_070` |

Create these empty schemas in an isolated database instance and give a dedicated test user access only to them. Merely changing the JSON `name` field does not redirect these suites elsewhere. The upgrade suite requires an empty schema, performs real DDL and injects a failure; transactional cleanup is not a guarantee that schema changes can roll back. Do not run suites concurrently against the same schemas.

Create a private JSON file with your local test connection, using this shape (replace the placeholders privately):

```json
{
  "host": "127.0.0.1",
  "port": 3306,
  "name": "wexashelf_repo_test",
  "user": "your-disposable-test-user",
  "password": "your-private-test-password"
}
```

Then run only the relevant suites, or this full database group:

```sh
export WEXA_QA_CONFIG='/absolute/private/path/database.json'
for suite in repository translations extensions capabilities editor-roles performance-observations ai-service upgrade; do
  php "php/tests/$suite.php" "$WEXA_QA_CONFIG" || exit 1
done
```

The AI service suite injects its own offline transport. Do not add a real provider key to make it pass. Existing user catalogs, API credentials and operational backups are not test fixtures.

## Build and start the primary PHP application

```sh
npm run build:php
WEXA_STORAGE_PATH='/absolute/private/path/php-qa-storage' npm run dev:php
```

Prepare that private storage and complete the web installer against a separate disposable application database as described in the [installation guide](../docs/KURULUM_CPANEL.md). The command starts the PHP development server on `127.0.0.1:3141`; it does not create the database, supply an installation key, initialize an administrator or run the installer for you. The source build regenerates public assets and PHP resources; review those outputs with the source change.

For a root installation with English as the default language and indexing disabled:

```sh
node scripts/check-runtime.mjs http://127.0.0.1:3141
```

This is a read-only HTTP smoke check. Its root-absolute paths and expected `/en` redirect are not a general subdirectory/default-locale validator. Use the PHP parity test below for a subdirectory deployment. The PHP development server does not prove Apache `.htaccess` behavior.

## Browser checks against PHP

Configure a fresh synthetic application first. Set `ADMIN_E2E_PASSWORD` privately to that disposable owner's password; never put a production password in a command, PR or log. The following variables target an already installed local PHP app:

```sh
export WEXA_QA_URL='http://127.0.0.1:3141'
: "${ADMIN_E2E_PASSWORD:?Set the disposable QA owner password privately}"
E2E_BASE_URL="$WEXA_QA_URL" \
ADMIN_E2E_BASE_URL="$WEXA_QA_URL" \
ADMIN_E2E_PASSWORD="$ADMIN_E2E_PASSWORD" \
PRODUCT_FEEDBACK_BASE_URL="$WEXA_QA_URL" \
WEXA_PHP_SMOKE_URL="$WEXA_QA_URL" \
npx playwright test tests/e2e/admin.spec.ts tests/e2e/catalog.spec.ts tests/e2e/expansion.spec.ts tests/e2e/product.spec.ts tests/e2e/php-parity.spec.ts
```

These tests can create/edit catalog content, feedback and appearance settings. Do not point them at user data. A base URL may include an installation subdirectory for the explicit PHP parity check. Read the test's assumptions before applying the entire suite to a customized catalog.

[playwright.config.ts](../playwright.config.ts) starts the retained **Next.js** line through `npm run dev:legacy`, not PHP, when neither `E2E_BASE_URL` nor `ADMIN_E2E_BASE_URL` is set. Admin/feedback/parity cases can skip without their explicit environment variables. Report skips; a green run with missing prerequisites is not full PHP coverage.

The optional [AI browser test](../tests/e2e/ai.spec.ts) requires `AI_E2E_BASE_URL`, the disposable password and [ai-http-router.php](../php/tests/ai-http-router.php). That router requires the dedicated `wexashelf_ai_e2e` database and supplies synthetic provider responses. Start it only with separate fixture storage on a local test server. It is not packaged as a production endpoint. Check current selectors when editing AI Studio; do not replace the fixture with a live paid endpoint to satisfy the test.

To check bulk selection and app insertion at the cursor, use an isolated PHP installation with the sample catalog, an English admin interface and rebuilt browser assets. With `ADMIN_E2E_BASE_URL` and `ADMIN_E2E_PASSWORD` set for that installation, run `npx playwright test tests/e2e/editor-selection.spec.ts`. The test exercises the unsaved editorial form.

## Installer, package and extension checks

The installer test is for a fresh, uninstalled localhost target and an empty disposable application database. Its database JSON has the flat shape above, and its key file contains that target's private installation key:

```sh
node php/tests/install-http.mjs http://127.0.0.1:3141 /absolute/private/path/database.json /absolute/private/path/install.key
```

It refuses an already installed target and deliberately tests rejected input before installation. The fixture uses a known synthetic password; never expose the fixture publicly. Test both root and subdirectory installations on Apache when changing routing, packaging or access rules.

For local package verification after the relevant source/build checks:

```sh
npm run package:source
npm run package:php
node scripts/test-release-package.mjs
```

This creates local archives, not a public release. Verify the exact archive hash used in fresh-install tests. Full installation and private-path checks remain distinct from archive contents/hash checks.

The declarative examples have focused validators:

```sh
npx tsx examples/community-theme/verify.ts
npx tsx examples/community-module/verify.ts
php examples/community-module/verify.php
```

## Performance and evidence

For performance-affecting changes, build the current source, use an isolated installed PHP target and a new report label:

```sh
npm install --prefix artifacts/performance/tooling --no-audit --no-fund lighthouse@13.6.0
node scripts/performance-audit.mjs contributor-review-1 http://127.0.0.1:3141/en --assert95
```

The script runs one mobile and one desktop Lighthouse profile and checks requested URLs, recorded resource failures, source/runtime stability and the score threshold. Reusing a label overwrites that label's reports. Theme coverage requires intentionally selecting and recording each theme on the disposable app; one homepage does not prove every theme or route. See the [performance report](../docs/PERFORMANCE-AUDIT-REPORT.md) for the existing cohort and its limitations.

An evidence note should identify the change/revision, environment, commands, exit results, actual test counts, skips/failures, fixture inputs and unresolved checks. Distinguish shared-source tests, PHP/MySQL tests, browser interaction, package/fresh-install checks, paid providers, deployment and real traffic. Never turn a local fixture, a skipped test, a previous release score or a package build into proof of a live service.

The 0.6.0 [status report](../docs/UYGULAMA_DURUMU.md) records 56 JavaScript tests, 17 PHP suites and 26 distinct successful browser cases across multiple runs; the latter is not a single clean 26-case run. Counts are a release checkpoint, not fixed expected totals for future changes. Both public archives exclude `artifacts/`, local verification receipts and private QA data. The commands above create your own local evidence; referenced historical artifact paths are not promised archive contents. No CI run or hosted activation is implied by these commands.


## 0.7 source checkpoint and focused checks

The historical 0.7 source checkpoint passed **59 JavaScript tests** and this **15-suite sequential PHP regression group**: `repository`, `translations`, `editorial-fields`, `capabilities`, `extensions`, `editor-roles`, `performance-observations`, `upgrade`, `backup-transfer`, `security`, `ai-service`, `ai-provider`, `ai-grounding`, `ai-queue`, `catalog-query`. These results are not a final archive/image or cPanel installation receipt. No 0.7 Lighthouse score is established by this checkpoint.

The independent focused queue test includes a separate PHP process with an injected mock transport. Security tests cover RFC authenticator vectors, replay/recovery codes and revocation. Backup tests cover ordered/retried chunks, checksums, source conflict and rollback after an injected restore failure. These focused runs are additional scope, not extra JavaScript tests or paid-provider evidence.

```sh
php php/tests/security.php "$WEXA_QA_CONFIG"
php php/tests/backup-transfer.php "$WEXA_QA_CONFIG"
php php/tests/ai-queue.php "$WEXA_QA_CONFIG"
php php/tests/catalog-query.php "$WEXA_QA_CONFIG"
```

Provision the named empty schemas first. Run sequentially and inspect each script's cleanup behavior. The bulk benchmark is optional and expensive; use the exact command and bounds in [CATALOG-SCALING.md](../docs/CATALOG-SCALING.md), not the ordinary regression group.

For an already installed disposable Apache fixture, `scripts/verify-release-hosting.mjs` checks English/Turkish routes, owner state and private/CLI HTTP denial using a private synthetic installer fixture. It accepts localhost only. `scripts/prepare-release-mysql.mjs` creates a specifically named MySQL 8.4 fixture and refuses to reset existing state. Neither script establishes real cPanel compatibility, performs a production upgrade or activates a cron job. Final image/archive hashes must be captured separately.


Additional focused source/language suites are separate from the 15-suite regression count: `source-providers` uses the empty `wexashelf_sources_070` schema and mocked transports; `source-locales` and `installer-locales` need no database; `language-pack-runtime` uses `wexashelf_locale_070`. These focused suites passed in this source checkpoint. A separately recorded read-only check observed all three public store sources; download values remained unknown. That narrow observation is not continuous coverage, paid-provider activation or permission to redistribute store artwork. See [STORE-SOURCES.md](../docs/STORE-SOURCES.md).

## Public language bundle changes

`npm run build:php` derives public UI keys with `scripts/public-locales.mjs`; administration keeps the complete dictionaries. Check an activated synthetic runtime language in a real browser after changing this extraction, including public settings and navigation from English. Validate full admin export separately. Literal source coverage alone cannot prove regex-captured fragments, dynamic label maps or runtime-pack validator parity. Extracted QA archives under `artifacts/` are excluded from the source TypeScript project.

## Multi-theme performance fixture

The maintainer cohort runner changes theme settings temporarily on an isolated localhost installation and restores the initial settings afterward. It needs a private JSON fixture containing only `{"adminPassword":"YOUR_SYNTHETIC_OWNER_PASSWORD"}`. Never use a production installation. This file is deliberately not distributed. Supply its absolute path:

```sh
node scripts/performance-cohort.mjs http://127.0.0.1:3168 /absolute/private/fixture.json
```

Install the documented Lighthouse tooling first. Each case runs one mobile and one desktop audit, not repeated-run medians. Choose new report labels before repeating a cohort to preserve previous evidence. A changed script or unrelated admin API message after an audit must be recorded separately from the measured public resource hashes.

## 0.7.1 localized routes and independent admin

After building matching PHP resources, run `php php/tests/localized-slugs.php` and `php php/tests/admin-site.php`. The former covers declared slugs, stable IDs, legacy community packs and hreflang availability; it does not mutate a database. For an isolated installed localhost fixture, `ADMIN_E2E_PASSWORD=<synthetic-password> node php/tests/admin-http.mjs http://127.0.0.1:PORT[/catalog]` checks the actual independent admin document, redirects, authentication, locale persistence and logout. It writes session state only.

## 0.8 focused checks and source archive rebuild

Use the current [distribution acceptance checklist](../docs/DISTRIBUTION-ACCEPTANCE.md) alongside [installation operations](../docs/INSTALL-OPERATIONS.md). Preserve earlier 0.7 receipts as historical evidence; they do not verify changed 0.8 assets.

Focused source checks cover six theme templates, honest empty/partial static content, API 2 module resolution, and article/media parsing and rendering:

```sh
npx tsx --test tests/theme-templates.test.ts tests/available-content.test.ts tests/article-shortcodes.test.ts tests/article-content-render.test.ts tests/content-media.test.ts
php php/tests/themes.php
php php/tests/article-shortcodes.php
php php/tests/content-media.php
php php/tests/localized-slugs.php
```

Read `php/tests/functional-modules.php` and `php/tests/system-health.php` before running their fixture-specific checks. Use their declared isolated database/storage setup; do not infer that every PHP suite is database-free. Installer checks must exercise both empty and optional sample modes, installation locking, owner-only health access and private-path denial. Follow the current installer harness arguments rather than resetting an existing application.

The 0.8 local browser checkpoint exercised all six layouts on separate empty and sample fixtures: preview isolation, explicit activation and history restoration, English/Turkish pages, desktop/mobile overflow, genuine icon decoding and directory-region keyboard focus. Separate unsaved editor checks inserted app shortcodes and uploaded private images, then verified draft preservation across AI-tab navigation without saving records. The app-icon check verified transparent PNG to 256×128 WebP conversion, private preview, anonymous denial and unchanged app records. These are local browser results, not a production or final performance claim. Local receipts under `artifacts/goal-080/` are not distributed files.

For media changes, check [article authoring](../docs/ARTICLE-CONTENT.md) and [image validation/publication](../docs/IMAGE-CONTENT.md). Cover malformed codes, missing localized apps, upload limits, authenticated preview, publication/unpublication access and image dimensions. Do not replace genuine app icons with generated monograms or make paid image calls to test uploads.

After packaging the current source ZIP, verify that it rebuilds in isolation:

```sh
node scripts/verify-source-build.mjs
```

This script derives the version from `package.json`, extracts the corresponding `artifacts/releases/wexashelf-source-VERSION.zip` into a new temporary directory, symlinks the workstation's existing `node_modules`, and runs `scripts/build-php.mjs` there. It compares the extracted `php/public` and `php/resources` files with rebuilt outputs, writes `artifacts/verification/source-build-VERSION.json`, and removes its own temporary directory. It does **not** perform a fresh `npm ci`, edit the main checkout's assets, install a host or publish a release. Run it only after the archive matches the intended frozen source; record final hashes and performance results separately in the release evidence.
