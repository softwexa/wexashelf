# Feature ledger — WexaShelf

This ledger describes implemented behavior, its boundaries and remaining external work. “Implemented” means the source contains the behavior with scoped local evidence summarized in the [application status report](../docs/UYGULAMA_DURUMU.md). It does not mean every planned integration or hosting environment has been verified.

Source links below refer to the full source ZIP or checkout, which is required for code, theme and module development. The PHP hosting ZIP is a compiled runtime package. Local `artifacts/` and private QA receipts are excluded from both public archives.

## Current source additions after 0.8.0

- **Editorial selection tools:** authors can insert an app card at the cursor or replace selected text in an article paragraph. Multi-select pickers can add or clear the displayed rows while preserving choices made under other filters. See [article editing](../docs/ARTICLE-CONTENT.md) and [admin picker controls](../docs/ADMIN-INTERFACE.md).
- **Administration redesign:** a grouped, searchable left navigation, light editing canvas, section headings and mobile modal menu replace the flat multi-row tabs. The shell consumes role-filtered sections and preserves unsaved-record guards and the records/AI workflow. See [administration navigation and extension boundaries](../docs/ADMIN-INTERFACE.md). This is a source addition; existing 0.8.0 archives do not include it.
- **Optional app submissions:** Wexa Submissions is bundled but disabled by default, with independent owner controls, private tracking, store links, a real app icon and up to five screenshots. Owner acceptance creates an unpublished app draft; rejection, closed-row purge and later publication are separate actions. The app editor supports screenshot ordering, alternative text/captions and uploads. See [the operating and backup guide](../docs/APP-SUBMISSIONS.md). Integrated local PHP/MariaDB browser and publication checks passed; see [submission validation](../docs/APP-SUBMISSIONS-VALIDATION.md). New package verification is pending; the theme evidence below does not cover it.
- **Ten more themes:** Porcelain, Ember, Fieldnotes, Signal, Lilac Studio, Tide, Copper Desk, Prism, Index and Velvet join the original six. Each has its own homepage composition, portable preset and real runtime `screen.jpg` shown in the gallery. These are implemented templates; the original image-generation concepts are kept separately.
- **Flexible appearance:** owner drafts and browser-local visitor preferences support eight colors, navigation, density, heading typography, content width, corners, hero spacing, card styling and homepage section visibility/order. Live preview and JSON export preserve the declarative contract.
- **Independent site identity:** the site name and PNG/JPEG/WebP logo are saved separately from themes. Private upload preview, explicit publication, display modes, logo width and alternative text work across English/Turkish pages. Changing or restoring a theme preserves the identity.

See [the theme collection](../docs/THEME-COLLECTION.md) and [theme development](../docs/THEME-DEVELOPMENT.md). The [local validation report](../docs/THEME-COLLECTION-VALIDATION.md) records 81 tests, behavior checks and a final ten-theme Lighthouse cohort at mobile 95–97 / desktop 100. These additions describe current local source, not a published release. The package version remains 0.8.0; older 0.8.0 archives do not contain these additions, and their historical performance results do not validate the changed assets.

## 0.8 additions

- **First use:** empty catalog default, explicit sample choice, site identity and genuine application-icon upload with private preview. Bundled guides/workflows require every referenced app in the requested language.
- **Themes:** Editorial Desk and Compact Directory join the original four. Actual empty/sample browser checks covered preview isolation, activation/history restore, EN/TR, 1440/390 layouts, real-icon decoding and directory keyboard access.
- **Functional modules:** three EN/TR packages; bounded published-only data, review/checksum guards, strictly increasing versions and disabled upgrades. API 1 remains supported.
- **Article content:** inline raster images and safe app/image shortcodes, bounded app picker, private upload and live unsaved preview. PHP/React use the same parser contract. Frozen translations preserve their own public media until the last eligible reference is withdrawn.
- **Operations:** owner health, observed worker runs, PHP 8.3/MariaDB 10.11 and PHP 8.4/MySQL 8.4 local installation checks, copied 0.7.1 upgrade and guarded recovery. Enabled language resources must be complete for upgrade.

See [distribution acceptance](../docs/DISTRIBUTION-ACCEPTANCE.md), [article editing](../docs/ARTICLE-CONTENT.md) and [module development](../docs/MODULE-DEVELOPMENT.md). The 0.8 cohort passed 10 cases/20 runs at mobile 95–97 and desktop 100; archive/performance binding is recorded separately. Historical scores below do not validate new bytes.

## 0.7.1 corrections

Application monograms were rejected and genuine icons restored. Administration has an independent `/admin` document and minimal bootstrap; `/yonetim` redirects. Public route segments and static slugs follow the selected language; legacy addresses stay reachable through redirects. The primary developer command starts PHP, while the old Next prototype is explicitly `dev:legacy`.

## Implemented

| Area | Delivered behavior | Source or contract |
| --- | --- | --- |
| PHP catalog and administration | MySQL persistence, revisions, draft/review/publication controls, import/backup workflows and sessions | [Repository](../php/app/Repository.php), [API](../php/app/Api.php) |
| Discovery | Search, categories, tags, platform filters, comparisons and saved local collections | [Catalog interface](../src/components/CatalogExperience.tsx), [Discovery](../src/lib/discovery.ts) |
| Multilingual SEO | English visitor default, Turkish support, per-locale slugs/homepage metadata, canonical URLs, eligible hreflang and sitemaps | [Translations](../php/app/Translations.php), [SEO contract](../docs/MULTILINGUAL-SEO.md) |
| Translation authoring | Source/translation editor, source fingerprints, stale review, publication/SEO approval, history and conflict handling | [Translation workspace](../src/components/admin/TranslationsWorkspace.tsx) |
| Community languages | Stable message keys, complete UI/static/server dictionaries, owner import/preview/activation/export without a host build | [Translation guide](../docs/TRANSLATING.md), [Validator](../scripts/check-locales.mjs) |
| Editorial discovery | Intent pages, permanent comparisons, alternatives, author profiles and test pages with sources and revisions | [Growth service](../php/app/Growth.php), [Editorial guide](../docs/GROWTH-EDITORIAL.md) |
| SEO operations | Topic/intent overlap warnings, orphan/link suggestions, Search Console CSV import and controlled 301/410 rules | [Growth workspace](../src/components/admin/GrowthWorkspace.tsx) |
| Sourced decision tools | Plan quotas, file operations, device/region availability, privacy and migration observations with sources/dates and explicit unknowns | [Capabilities](../php/app/Capabilities.php), [Decision interface](../src/components/discovery/CapabilityTools.tsx) |
| Store history | Dated observations separated by store identity, platform, country and metric | [Store observations](../php/app/StoreObservations.php), [Recorded trends](../src/lib/recorded-trends.ts) |
| Personal setup planning | Browser-local collections, tasks, selected plans/seats, overlap notes, per-currency totals and explicit local follows | [Setup plans](../src/components/discovery/SetupPlans.tsx), [Collections](../src/components/discovery/PersonalCollections.tsx) |
| Developer proposals | Source-linked suggestions enter an editorial queue; marking one reviewed does not apply its facts | [Capabilities service](../php/app/Capabilities.php), [Proposal form](../src/components/discovery/UpdateProposal.tsx) |
| App submissions (current source) | Default-disabled first-party intake; owner-only queue, private store-listing/image review, accept-to-draft, rejection and closed-row purge; integrated local PHP/MariaDB browser and media-publication checks passed; new package verification pending | [Submission guide](../docs/APP-SUBMISSIONS.md), [Submission service](../php/app/AppSubmissions.php), [Admin review](../src/components/admin/AppSubmissionsWorkspace.tsx) |
| AI workflows | Explicit administrator generation, previews, source-aware tasks, draft application, locale-aware suggestions and estimated budget reservations | [AI service](../php/app/AIService.php), [AI studio](../src/components/admin/AIStudio.tsx) |
| Themes and identity | Sixteen built-in homepage templates, real previews for the ten new presets, configurable presentation, independent owner logo/name, full-page draft preview and appearance revision restore | [Theme collection](../docs/THEME-COLLECTION.md), [Theme guide](../docs/THEME-DEVELOPMENT.md), [Extensions workspace](../src/components/admin/ExtensionsWorkspace.tsx) |
| Community modules | Validated API 1 cards and API 2 app collections/comparisons/latest articles; preview, disabled installation, reviewed activation, upgrade, export and uninstall | [Module guide](../docs/MODULE-DEVELOPMENT.md), [Extensions service](../php/app/Extensions.php) |
| Editorial roles | Owner/editor/publisher/analyst permissions enforced by the server; account changes revoke affected sessions | [Roles](../php/app/EditorRoles.php), [Authentication](../php/app/Auth.php) |
| Backed-up upgrades | Private catalog backup/hash receipt, source conflict detection, repeat-safe local schema migration and explicit maintenance recovery | [Upgrade guide](../docs/UPGRADING.md), [Upgrade service](../php/app/Upgrade.php) |
| Performance tooling | Lighthouse checks and optional sampled browser Web Vitals ingestion with bounded p75 reporting | [Audit script](../scripts/performance-audit.mjs), [Performance service](../php/app/Performance.php) |
| Contribution handbook | Local architecture/testing guides, a tool-neutral AI workflow and reviewable contribution prompts | [Handbook](README.md), [AI contribution guide](AI-CONTRIBUTION.md) |

## 0.7 additions

| Area | Implemented contract | Evidence boundary |
| --- | --- | --- |
| Administration and source languages | English-authored administration/installer, EN/TR messages, English-default new originals, legacy Turkish source preservation | Pack validation is not linguistic certification |
| Runtime language packages | Owner preview/import/activate/disable/export; complete private declarative packages without rebuilding | Public delivery retains only current-language public UI keys; admin export remains complete |
| Owner security | Password reauthentication, MFA/recovery codes, session listing/revocation and local CLI recovery | [Account security](../docs/ACCOUNT-SECURITY.md); synthetic tests, no penetration-test claim |
| Backup transfer | Ordered private chunks, checksum, preview/source conflict guards and explicit restore | [Backup recovery](../docs/BACKUP-RECOVERY.md); host memory guard can require CLI |
| Durable AI work | Persisted queue, bounded worker leases, no automatic uncertain resubmission, explicit retry/cancel/archive | [AI jobs](../docs/AI-CONTENT.md), [cron](../docs/CRON-WORKERS.md); no paid call implied |
| Catalog scale | SQL projection, paginated public/admin queries and batched saved IDs | [Scaling](../docs/CATALOG-SCALING.md); local 10k/50k synthetic measurements |
| Store sources | Configured adapters, candidate review and source worker separation | [Source contract](../docs/STORE-SOURCES.md); actual provider access/terms and refresh coverage remain separate |
| Application artwork | Genuine publisher icons, optimized local WebP/SVG delivery; original MIT geometric landscape | Publisher icon provenance and rights remain separate from the project MIT license |
| Hosting operations | Upgrade/private backup runbooks and isolated MySQL 8.4 fixture | [Release validation](../docs/RELEASE-0.7.0-VALIDATION.md); candidate local MySQL8.4 runtime passed; actual cPanel pending |

## Deliberate boundaries

- **Translation preserves business facts.** IDs, store identities, source links, prices, dates and permissions stay unchanged. A UI pack does not create published content translations. Original starter records retain Turkish as their source language. New originals default to English, independently of visitor/admin language; an English original needs no Turkish placeholder.
- **Publication requires editorial action.** Generated content, imported observations and developer proposals do not automatically publish. Changed content can invalidate SEO approval. Enabling a language alone does not make every translation indexable.
- **Submission intake is optional and private.** Enabling it does not verify applicant ownership, create developer accounts or send email. The tracking code is not recoverable if lost; private intake files need a separate filesystem backup. Accepting a submission does not publish its app or grant SEO approval.
- **Popularity needs data.** Editorial selections are not global download rankings. Trends require comparable dated observations; missing prices, quotas or privacy facts remain unknown.
- **AI providers are optional.** OpenAI and compatible provider configuration exists, but passing fixtures does not prove a live commercial integration. USD budget amounts use configured estimates and are not invoices. Visitor requests do not trigger content generation.
- **Search Console input is CSV.** The opportunities table does not imply configured OAuth, live Google account access or actual traffic when synthetic rows are imported.
- **Extensions are declarative.** Theme JSON and module cards do not install arbitrary PHP/JavaScript. Source-level hooks/templates require reviewed code and a build; checksums are not publisher identity signatures.
- **Personal state is local.** Saved setups and follows do not provide cross-device accounts, cloud sync, email delivery or push notifications.
- **Backups have scope.** Upgrade catalog backups do not replace full database/files/credentials/media backups or undo MySQL DDL.
- **Performance results have scope.** The final 0.7.1 local cohort covered eight cases, one mobile/desktop pair each: mobile 95–97 and desktop 100. It uses a small synthetic catalog and is not the 50k SQL benchmark, a repeated-run median, CrUX, field Core Web Vitals proof or an all-host guarantee. See the [measured conditions](../docs/PERFORMANCE-AUDIT-REPORT.md).
- **Contribution files are local infrastructure.** Guides and agent adapters do not configure a GitHub remote, create branches, activate CI, open a PR or grant merge rights.

## External activation or additional work

| Item | Further evidence or work required |
| --- | --- |
| Public repository and releases | Maintainer-selected upstream, reviewed content and explicit publication; local files do not prove a GitHub release exists |
| Production deployment | Actual target-host installation, private-path/HTTPS checks and operational ownership |
| Every cPanel/shared host | Host-specific PHP extensions, database access and rewrite/access rules; local Apache/Docker checks do not cover every host |
| Live commercial AI use | Operator configuration and a separately authorized, observed provider call; cost/usage validation stays distinct from mocks |
| Search Console OAuth | A separately implemented/configured connection; CSV import is the current supported input |
| Continuous three-store coverage | Provider access/terms, identity mapping, refresh operations and comparable observations; no fabricated Apple/Windows download totals |
| Real visitor performance and search results | Actual field/search evidence; local scores and schema validation do not guarantee rankings |
| Additional locales or RTL readiness | Complete registered packs, linguistic review, route/SEO/layout checks and reviewed managed translations |

Human maintainers review feature claims as well as code. Update this ledger when behavior or its evidence boundary changes, and keep [testing instructions](TESTING.md) runnable.
