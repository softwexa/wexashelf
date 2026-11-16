# Architecture

WexaShelf's primary deployable application is PHP/MySQL. React and shared TypeScript modules provide browser behavior and build-time resources. The retained Next.js/SQLite implementation is a separate development/reference path, not the PHP backend.

Paths and source links here use the full source ZIP/checkout layout. Obtain that package for code, theme or module development; the PHP hosting ZIP contains compiled runtime files and reference guides, not the full source/test/build tree.

## Request and build paths

```text
Browser request
  -> php/public/index.php
  -> public PHP renderer OR authenticated API service
  -> Repository / domain services
  -> MySQL

TypeScript / React / locale sources
  -> scripts/build-php.mjs
  -> php/public/assets + php/resources
  -> PHP HTML and bootstrap data
  -> compiled visitor or administrator interface
```

Public PHP responses provide readable content, metadata, language information and structured data before JavaScript runs. The visitor entry renders the shared React catalog interface into its root using bootstrap data. Server-rendered editorial routes also exist. Do not assume every page is a Next.js route or uses the same client entry.

## Where changes belong

| Layer | Locations | Responsibility |
| --- | --- | --- |
| PHP entry points | [index.php](../php/public/index.php), [router.php](../php/public/router.php) | Request dispatch, installation boundary and local development routing |
| Server HTML | [PublicSite](../php/app/PublicSite.php), [EnglishPublicSite](../php/app/EnglishPublicSite.php), [GrowthSite](../php/app/GrowthSite.php) | Public content, canonical/meta/schema output and locale-aware routing |
| API and authorization | [Api](../php/app/Api.php), [Auth](../php/app/Auth.php), [EditorRoles](../php/app/EditorRoles.php) | Method/body validation, sessions, role checks and mutation boundaries |
| Persistence | [Database](../php/app/Database.php), [Repository](../php/app/Repository.php) | MySQL schema, records/settings, revisions, audit and supported backup data |
| Feature services | [Translations](../php/app/Translations.php), [Growth](../php/app/Growth.php), [Capabilities](../php/app/Capabilities.php), [Extensions](../php/app/Extensions.php) | Text overlays, editorial pages, sourced observations and declarative packages |
| AI and upgrades | [AIService](../php/app/AIService.php), [AIBudget](../php/app/AIBudget.php), [Upgrade](../php/app/Upgrade.php) | Explicit generation jobs, reservations and owner-controlled local migrations |
| Shared interface | [CatalogExperience](../src/components/CatalogExperience.tsx), [AdminWorkspace](../src/components/admin/AdminWorkspace.tsx) | Visitor/admin interactions and workspaces |
| Shared contracts | [domain.ts](../src/lib/domain.ts), [themes.ts](../src/lib/themes.ts), [plugins.ts](../src/lib/plugins.ts) | Record shapes and theme/module contracts; PHP independently validates API inputs |
| PHP browser adapters | [entry.tsx](../php/client/entry.tsx), [admin.tsx](../php/client/admin.tsx), [runtime.ts](../php/client/runtime.ts) | Entry points, installation base paths, localized links and navigation adapters |
| Build resources | [build-php.mjs](../scripts/build-php.mjs), [export-seed.ts](../php/client/export-seed.ts) | Bundles, font/icon derivatives, locale resources, initial seed and release manifest |

Edit authored sources and rebuild generated assets when relevant. Replacing only `app.js` or only locale resources can leave PHP and browser behavior on different contracts. A build does not deploy files or migrate an existing database. Hosting uses the compiled output and needs neither Node.js nor Composer.

## Content and language boundaries

Managed records have stable identities, revisions and publication controls. Translations are whitelisted text overlays with their own locale, slug, revision and source fingerprint. Source language and visitor default are separate settings. Source changes may make an overlay stale; public visibility and search eligibility are related but separate decisions.

[Locale registration](../src/lib/i18n-registry.ts) joins UI messages, static content and server messages/routes. PHP reads the generated resources. Pack completeness does not establish linguistic quality or publish managed records. See [TRANSLATING.md](../docs/TRANSLATING.md) and the [multilingual SEO contract](../docs/MULTILINGUAL-SEO.md).

Source URLs, store identities, dates, prices, permissions and unknown values survive translation and theme changes unchanged. Lists and statistics come from eligible records and sourced observations, not presentation assumptions.

## Storage and extension boundaries

Private PHP storage is selected by `WEXA_STORAGE_PATH`, otherwise `php/storage`. Configuration, installation keys, provider settings, media, operational files and upgrade backups must not become public assets. MySQL is the primary store. Supported catalog exports omit credentials and do not constitute full hosting backups.

Themes are validated tokens/layout/section settings on known templates. Installable Module API 1 packages provide declarative localized cards; API 2 packages resolve curated app, comparison and latest-article blocks from eligible published content. Neither contract permits arbitrary code upload. Source-level extensions require explicit integration and a reviewed rebuild. See the [theme](../docs/THEME-DEVELOPMENT.md) and [module](../docs/MODULE-DEVELOPMENT.md) guides.

## Legacy Next.js boundary

`npm run dev`, `npm run build` and `npm start` use Next.js. [src/lib/server/store.ts](../src/lib/server/store.ts) uses `node:sqlite`, with `APP_DATA_DIR` or `.local/data`. [admin-init.ts](../scripts/admin-init.ts) initializes that legacy administrator; it does not initialize PHP/MySQL.

Do not import, reseed or overwrite legacy SQLite data automatically while working on PHP. Shared interface changes may need checks on both paths, but Next.js success proves neither PHP persistence nor server-rendered SEO. Primary PHP commands and isolated fixtures are in [TESTING.md](TESTING.md).

## 0.7 queue, security and query paths

`CatalogQuery` reads the transactionally maintained `ws_catalog_index` projection for bounded public/admin discovery; selected full records are loaded by ID. Projection rebuilds are explicit install/upgrade/repair operations. Bulk export and editorial analysis remain operator paths and can need more memory.

`AccountSecurity` extends `Auth` with owner reauthentication, security revisions, optional TOTP and hashed one-use recovery codes. MFA runs before session creation. `BackupTransfer` stores ordered chunks in private storage, binds them to the owner session/security revision, validates checksum and catalog preview, then delegates explicit restore to a repository transaction. It does not increase the public JSON body limit or include account/provider secrets in catalog exports.

`AIService` enqueues durable records through `AIStore`; `AIWorker` and `cli/worker.php --queue=ai` perform provider work outside browser requests. Leases cap concurrent work and abandoned submissions become uncertain rather than automatically generating again. The browser polls saved state. `SourceWorker` is a separate source-refresh process; source candidates still require editorial application. Neither worker installs its own cron entry.

The historical 0.7 artwork checkpoint used authored fallback artwork. Current builds retain verified genuine publisher icons and their licensing/provenance records; do not substitute monograms or infer redistribution permission from an acquisition URL. Preserve the current icon manifest and source-to-optimized-asset mappings.

## 0.8 presentation, installation and media

The sixteen known theme templates are `night`, `atlas`, `workflow`, `catalog`, `magazine`, `directory`, `porcelain`, `ember`, `fieldnotes`, `signal`, `lilac`, `tide`, `copper`, `prism`, `index` and `velvet`. Tokens, optional bounded presentation choices, section order and module toggles remain validated settings. Branding is a separate revisioned SEO setting; theme import, activation and history restoration do not replace site identity. Admin full preview passes temporary settings into the visitor interface without changing live settings or browser preferences; activation and history restoration are separate revisioned writes. See [theme development](../docs/THEME-DEVELOPMENT.md).

Module API 2 manifests remain data, not executable plugins. The server resolves published localized records, reports missing content, and binds activation to the reviewed installed checksum. An upgrade is disabled until reviewed again. PHP and React render resolved blocks; packages cannot invent facts or publish referenced records. See [module development](../docs/MODULE-DEVELOPMENT.md).

The installer offers an empty catalog or optional sample content. Empty installation does not expose bundled guides/workflows whose referenced apps are absent: all required app references must be available in the current public language. Independently authored eligible articles and lists retain their own publication rules. Owner-only System health reports local configuration and bounded operational evidence without exposing secrets or certifying the host. See [installation operations](../docs/INSTALL-OPERATIONS.md).

Article paragraphs remain strings parsed by the bounded shared shortcode contract. App references resolve against the current eligible localized catalog; image references resolve verified metadata and private stored bytes. Unknown syntax is escaped text. The editor uses the same public body component for its private preview. See [article authoring](../docs/ARTICLE-CONTENT.md) and [media validation](../docs/IMAGE-CONTENT.md).

App icon upload prepares the genuine supplied image as a WebP of at most 256 pixels per side, preserving aspect ratio and transparency. It updates only the unsaved icon path. Authenticated media previews do not grant public access: published eligible app/article references determine public media availability. Catalog JSON preserves metadata, not image bytes; full backups must include private media storage. Manual custom icon paths remain distinct from known optimized built-in mappings.

[Distribution acceptance](../docs/DISTRIBUTION-ACCEPTANCE.md) defines the release evidence boundary. A source build or local installation does not establish external hosting, paid-provider activation or final performance scores.
