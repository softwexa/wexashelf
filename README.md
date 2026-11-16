# WexaShelf · Self-hosted app directory

WexaShelf is a self-hosted app directory for Android, iOS and Windows. Use it to publish app listings, comparisons and guides on your own domain.

WexaShelf links to official store pages; it does not host APK, EXE or other application binaries. Its public catalog can include app guides, comparisons, alternatives, editorial lists and articles, with source references kept alongside the content.

## What it includes

- Catalog search, platform and category browsing, comparisons, saved apps and personal collections.
- Editorial pages for app guides, comparisons, alternatives, authors and test-lab notes.
- Source references, dated observations, revision history and a review workflow for translations and content changes.
- English by default, Turkish support and community language packs. Each language has its own URLs and SEO metadata, while record IDs and source facts stay consistent.
- Sixteen built-in themes with real browser-captured previews, configurable appearance and separate site identity. [Browse the theme guide](docs/THEME-COLLECTION.md).
- Owner, editor, publisher and analyst roles, with guarded saves, revision checks, backups and upgrade tools.
- An optional AI content helper for draft titles, descriptions and related editorial work; generated text remains a draft for human review.
- Optional app submissions, disabled by default. Owners can receive official store links and images, review them, and create an unpublished catalog draft. [Read the submissions workflow](docs/APP-SUBMISSIONS.md).

## Preview

![Fieldnotes theme showing app discovery, comparison and editorial sections](public/themes/fieldnotes/screen.jpg)

Fieldnotes is one of sixteen included themes. This screenshot shows the running application with sample catalog content. [See the collection and customization options](docs/THEME-COLLECTION.md).

## Runtime and hosting

The primary application runs on PHP 8.3+ with MySQL or MariaDB. It is designed for compatible shared hosting and cPanel installations, with Docker also included. Node.js and npm are development/build tools; the PHP hosting package does not require Node.js on the server.

The public site uses localized routes and keeps legacy Turkish paths working. The administration panel is available at `/admin`, and the installer starts at `/install`.

## Install

For a hosting installation, create an empty MySQL database and user, select PHP 8.3+ with `pdo_mysql`, `curl`, `mbstring`, `intl`, `session` and `fileinfo`, upload the PHP package, and open `/install`. Choose an empty or sample catalog, set a unique owner password, then review the owner health panel before enabling indexing.

- [cPanel installation](docs/KURULUM_CPANEL.md)
- [Installation and owner operations](docs/INSTALL-OPERATIONS.md)
- [Local development and Docker](docs/YEREL_DAGITIM.md)
- [Upgrade and recovery](docs/UPGRADING.md)

For Docker, copy `.env.example` to a private `.env`, replace every required secret, and run:

```sh
docker compose up -d --build
```

Keep `storage/config.php`, installation keys, provider settings, backups, logs and database files private. Do not overwrite private storage during an upgrade.

## Develop

Development requires Node.js 24+, npm, PHP and a MySQL/MariaDB fixture. Use isolated synthetic data for tests and local browser checks.

```sh
npm ci
npm run typecheck
npm test
node scripts/check-locales.mjs
npm run build:php
npm run dev
```

The primary PHP development server listens on `http://127.0.0.1:3141`. `npm run dev:legacy` starts the retained Next.js reference line on port 3140; it is not the primary runtime.

For packaging and the relevant release checks:

```sh
npm run package:php
npm run package:source
node scripts/test-release-package.mjs
```

Read [TESTING.md](documents/TESTING.md) before running browser, installer or database checks. Detailed validation, performance observations and historical release measurements belong in the linked reports, not in the product summary: [0.8 validation](docs/RELEASE-0.8.0-VALIDATION.md), [performance report](docs/PERFORMANCE-AUDIT-REPORT.md) and [distribution acceptance](docs/DISTRIBUTION-ACCEPTANCE.md). Older 0.8 archives do not contain every addition in the current source tree.

## Contributing

Start with [AGENTS.md](AGENTS.md), [CONTRIBUTING.md](CONTRIBUTING.md), the [contributor handbook](documents/README.md) and the [AI contribution workflow](documents/AI-CONTRIBUTION.md). Human and AI-assisted contributors should keep changes focused, use synthetic fixtures, preserve language and source-data boundaries, and report the commands actually run. An assistant must prepare the reviewed local diff and PR text, verify the real repository, account, fork and base branch, and ask the computer owner for explicit consent before committing, pushing or opening a PR unless that exact publication scope is already authorized.

## License

Developed by [Softwexa](https://softwexa.com). WexaShelf uses the [MIT license](LICENSE). Third-party libraries, application icons, names and trademarks retain their own terms; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
