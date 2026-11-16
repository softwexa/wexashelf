# WexaShelf 0.8.0 — local distribution validation

This release adds six usable themes, three functional module packages, empty-first installation, owner system health, inline article images/app shortcodes and genuine application-icon upload. English remains the default; Turkish URLs and source identities are preserved. The main distribution is PHP/MySQL with compiled browser assets, a flat Apache/cPanel ZIP and Docker Compose.

## Source and behavior

- 75 JavaScript tests and TypeScript checking passed. The EN/TR inventory contains 1,871 stable keys; current community templates validate against the same UI/content/server shapes.
- Sixteen current root/subdirectory HTTP cases passed for localized URLs, HTML/Content-Language, canonical/social/schema language and standalone private admin.
- All 15 requested PHP regression suites passed across two isolated MySQL environments (eight on the existing QA instance, seven remaining suites on a fresh instance). An initial backup-test trigger privilege error, MySQL1419, is retained as a fixture-environment failure; its rerun passed with binary logging disabled only on the new isolated test instance. No shared server globals or SUPER privileges were changed.
- Focused PHP checks cover locale/slug/canonical behavior, schema, literal API errors, media validation, shortcode parity, source freshness, worker evidence, themes and publication boundaries. Functional modules passed 52 assertions, including bounded selection, actual publication-date ordering with timezone offsets, review checksums and API 1 compatibility.
- Independent focused integration review found no actionable regression. A 101-record media test proves that 100 unused image metadata entries cannot hide the actual referenced image behind the selection limit.
- Actual browser checks covered all six themes on empty and sample catalogs, EN/TR, 1440/390 widths, full-preview isolation, activation/history restoration, real icon decoding and directory keyboard focus. Article and app-icon uploads retain unsaved edits across tabs; they do not save or publish automatically.
- Real HTTP checks cover owner/editor/publisher/analyst restrictions, anonymous and cross-origin rejection, upload size/type limits, private previews, publication/scheduling/withdrawal and frozen translated media. Source changes do not silently remove still-published translated images; withdrawal of the last eligible reference revokes access.

## Installation, updates and recovery

The source runtime was installed in separate synthetic environments:

| Environment | Installation and checks |
|---|---|
| PHP 8.3.36 + MariaDB 10.11.19 | Explicit sample catalog, site identity, locale preservation and owner/anonymous/analyst health access |
| PHP 8.4.27 + MySQL 8.4.13 | Empty and sample installs, Docker and `/catalog` flat ZIP, private-path denial, locking, health, genuine icons |
| PHP 8.4.27 + MariaDB 11.8.9 | Shipped Compose configuration, fresh volumes, empty installer and healthy web/database services |

The local Docker host had exhausted its automatic subnet pools. Only the new Compose project network was precreated with an unused explicit subnet; the shipped Compose file was unchanged for this workaround. No existing networks or volumes were removed.

A separate copy of the 0.7.1 installation passed upgrade preparation, protected backup download/hash checks, apply, record/revision preservation and owner login. Its older installer had not stored a schema-version setting, so the receipt honestly reports `unrecorded` for that field; provenance comes from the separate known 0.7.1 fixture. Copied-fixture catalog restoration and owner CLI recovery passed. Catalog JSON is not a full database/files/credentials/media backup and does not roll back DDL.

Final runtime image: `sha256:40568f504f2993e90c6c8e50b0960b1b16b86a24a0d2138873b0b8bea58c1c2f`. All 115 runtime files matched the PHP archive. Earlier candidate installer receipts are retained separately; refreshing seven changed runtime files did not relabel those earlier installer checks as a second fresh installation.

## Performance

All **10 cases / 20 runs** met 95+: mobile **95–97**, desktop **100**. This is one mobile/desktop pair for each of six themes, Turkish home, app, article and list. All 77 measured source hashes matched the immutable runtime, with 40 raw/summary report hashes retained. See [the detailed report](PERFORMANCE-AUDIT-REPORT.md).

These are local Lighthouse Performance measurements on a small sample catalog with default modules. They are not a Lighthouse SEO-category score, CrUX/real-user INP, a 50,000-app browser benchmark, every possible image/module configuration, live-host proof or a search-ranking promise.

## Packages and evidence

The PHP archive includes compiled browser assets and requires no Node/npm/Composer on the host. The source archive includes contributor instructions, MIT code, publisher-asset notices, current language templates, theme/module examples and focused tests. Secret/private-file exclusions, entry hashes and bundled dependency licenses are checked by `scripts/test-release-package.mjs`.

Use `scripts/verify-source-build.mjs` to rebuild a clean extracted source ZIP. Its receipt explicitly states that workstation dependencies are reused; it is not a fresh network `npm ci` claim. Final archive hashes, source-rebuild results, PHP regression details and runtime binding are in the local `artifacts/verification/release-0.8.0-final.json` receipt and accompanying SHA256SUMS. Private evidence and credentials are excluded from distribution archives.

No Git commit/push, GitHub release, live cPanel/public HTTPS deployment, paid AI call or automated hosted CI was performed. Those need an actual target/account or optional provider configuration. The delivered archives and local compatibility checks are distinct from those external activation steps.
