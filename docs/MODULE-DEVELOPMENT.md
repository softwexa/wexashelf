# Module development

WexaShelf supports **installable declarative packages** and **source-registered homepage modules**. Module API 1 adds localized links; API 2 renders curated apps, evidence-based comparisons and latest articles from the published catalogue. Website owners install JSON packages without a Node.js server. Executable behavior still requires reviewed source and a rebuilt release.

There is no executable ZIP installer, remote module registry, arbitrary PHP upload, runtime JavaScript loader, dependency resolver, or module permission sandbox. Do not distribute a PHP file and tell users to upload it through admin.

## Installable Module API 1 packages

Start with [`examples/community-module/manifest.json`](../examples/community-module/manifest.json). The server contract is [`Extensions::validatePackage`](../php/app/Extensions.php). Validate it without a database:

```sh
php examples/community-module/verify.php
```

| Field | Contract |
| --- | --- |
| `schemaVersion` | `1` |
| `id` | 3–64 lowercase letters, digits, or hyphens; starts with a letter |
| `name`, `description` | Required metadata; up to 100 and 500 bytes respectively |
| `version` | Three numeric parts, such as `1.0.0`; up to 40 bytes |
| `requires` | Exactly `wexashelf-module-api:1` |
| `cards` | Up to 12 declarative cards |
| Card `id` | Unique within the package; 2–64 lowercase letters, digits, or hyphens, starting with a letter |
| Card `locales` | Up to 24 language entries; `en` required |
| Locale copy | Exactly `title`, `description`, `href`; text limits 120 and 500 bytes |
| `href` | Installation-relative public path, e.g. `/en/apps`; no query, fragment, external URL, traversal, or protected endpoint |

Use plain text. CSS, JavaScript, PHP, HTML, external images, arbitrary metadata, and runtime hooks are outside the format. Locale codes use a two- or three-letter language and optional uppercase region. A card without copy for the current language is omitted, avoiding an untranslated fallback.

In **Themes & modules**, choose a JSON manifest (up to 128 KB), review the candidate, and install it. Installations always start disabled. Enabling and disabling are separate actions. Uninstall removes the package. Replacing an existing ID requires a strictly higher three-part version. An upgrade is previewed before installation, then disables the package and clears its previous review. Same-version replacement and downgrade are rejected; there is no dependency resolver or automatic update service.

The site holds up to 40 packages. Stored packages include a SHA-256 checksum, installation timestamp, enabled state, and an optimistic state revision. The checksum is an integrity check, not a signature or trust assessment. Module state is included in backups.

## Installable Module API 2 packages

Three ready packages ship with the installation and are browsable in **Themes and modules**:

| Package | Handler | Published content used |
| --- | --- | --- |
| `wexa-focus-kit` | `curated-apps` | Notion, Obsidian, Todoist and TickTick, in explicit ID order |
| `wexa-notes-comparison` | `comparison` | Recorded offline/sync/export facts for Notion and Obsidian |
| `wexa-latest-reading` | `latest-articles` | The three latest available articles by their publication date |

Each includes English and Turkish block copy. The [portable manifests](../examples/functional-modules/README.md) match the [bundled catalogue](../php/resources/bundled-modules.json). They do not add or publish content. An empty installation may have nothing to preview until editors publish suitable records.

API 2 keeps the same metadata fields but uses `schemaVersion: 2`, `requires: "wexashelf-module-api:2"` and `blocks` instead of `cards`. There are 1–4 blocks per package. Each has a unique `id`, a supported `type`, and `locales` containing plain `title` and `description`; English is required. Copy limits and locale codes match API 1. There are no configurable SQL queries, HTML, CSS, code, external assets or arbitrary handlers.

```json
{
  "schemaVersion": 2,
  "id": "my-notes-comparison",
  "name": "My notes comparison",
  "description": "Compare recorded facts before choosing a notes tool.",
  "version": "1.0.0",
  "requires": "wexashelf-module-api:2",
  "blocks": [{
    "id": "notes",
    "type": "comparison",
    "appIds": ["notion", "obsidian"],
    "factKeys": ["offline", "sync", "export"],
    "locales": {
      "en": {"title": "Compare notes tools", "description": "Check the recorded evidence for each platform."},
      "tr": {"title": "Not araçlarını karşılaştır", "description": "Her platform için kayıtlı kanıtları incele."}
    }
  }]
}
```

| Handler | Configuration | Public behavior |
| --- | --- | --- |
| `curated-apps` | `appIds`: 1–12 unique stable IDs | Published/admitted applications in explicit order, localized names and detail links; omitted if none are available |
| `comparison` | `appIds`: 2–4 unique IDs; `factKeys`: 1–5 keys from `offline`, `sync`, `export`, `account-free`, `ad-free`, `ocr` | Actual platform facts, status, evidence URLs and check dates; missing facts remain unrecorded; omitted if fewer than two apps are available |
| `latest-articles` | `limit`: integer 1–6 | Available published articles in the requested language, ordered by recorded publication date descending, then stable ID; not traffic, popularity or update-time ranking |

Check `Validation::FACTS` when extending source code; the package allowlist follows the application domain. All active API 2 packages together are limited to 12 blocks and 96 unique app references. Candidate queries select only referenced apps and at most six articles. Publication, admission, schedule and locale gates are applied again on public requests. Missing localized block copy never falls back to another language. Withdrawing a record or translation removes it from the module automatically.

The comparison uses the catalogue's existing evidence; installing a package does not verify a claim. Public PHP HTML and React show the same resolved blocks. Links use the locale routing helpers and respect a subdirectory installation. The package's selected app IDs remain stable across languages.

The administration workspace can create a separate editable copy of an API 2 package. The copy starts with a distinct package ID and editable metadata; app-reference blocks can search the published catalogue in the selected preview language, while existing unavailable references remain until removed. Selecting IDs only edits the copy's manifest and does not create, publish or modify app records. Preview the customized manifest through the server and review its normalized result and SHA-256 checksum before installation. Installation and upgrades remain disabled until separately reviewed and enabled; enabling must match the installed checksum and selected preview language.

## Review, activation, upgrades and export

1. Browse a bundled package or upload a manifest of up to 128 KB. The server validates it and builds a read-only preview from currently available content. Review its locale, references, missing-content notices, checksum and install/upgrade status.
2. Confirm review and install. Both new packages and upgrades start **disabled**. Installation changes package state only, not catalogue publication.
3. Review the installed version, then choose **Enable reviewed version**. API 2 requires the exact installed SHA-256 checksum and at least one available block in the selected preview language. Missing blocks remain omitted; preview notices explain partial availability.
4. Disable, uninstall or export the installed JSON manifest from the package card. Export includes no database, credentials or catalogue content. An export is portable but its references still need matching published IDs on the destination site.

Review records protect against enabling an unreviewed replacement; they are not signatures or third-party trust certificates. Backups include manifests, versions, integrity hashes, enabled states and review metadata. Restore validates that an enabled API 2 package's reviewed checksum matches its contents. The optimistic package revision protects concurrent changes; a 409 requires refreshing and reviewing current state. A candidate remains available in the interface after a conflict.

Owner-authenticated operations are:

```text
GET  /api/admin/extensions
POST /api/admin/extensions/preview {manifest, locale}
GET  /api/admin/extensions/export?id=PACKAGE_ID
POST /api/admin/extensions {revision, action: "install", manifest}
POST /api/admin/extensions {revision, action: "enable", id, reviewedChecksum, locale}
POST /api/admin/extensions {revision, action: "disable" | "uninstall", id}
```

GET state includes `modules`, `available`, `siteSettings`, `themeHistory`, `previewLocale`, `previewLocales` and the bounded preview `catalog`. Preview returns `{preview}` with the normalized manifest, checksum, `operation` (`install`, `upgrade`, `identical`, `incompatible-version`), prior version, install/enable eligibility, resolved `blocks`/`cards` and warnings. It performs no writes. Export returns `{manifest, checksum}`. A mutation returns `{modules}`. API 1 activation remains compatible without `reviewedChecksum`; the admin interface still offers review. Authentication, owner authorization, same-origin POST checks and server validation apply independently of the interface.

## Source-registered module contract

[`PluginDefinition`](../src/lib/plugins.ts) has these fields:

```ts
interface PluginDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  sections: HomeSectionId[];
  defaultEnabled: boolean;
}
```

Definitions live in `PLUGINS` in `src/lib/plugins.ts`. Current section IDs are `discovery`, `weekly`, `trending`, `toolbox`, `guides`, and `workflows`.

The helpers have specific behavior:

- `normalizeEnabledPlugins` retains only registered unique string IDs. An empty array means all optional modules are intentionally disabled. Missing or structurally invalid preferences use defaults.
- `getActiveSections(theme, enabledIds)` preserves the theme order. A section with module owners is visible if at least one owner is enabled. A section with no owner remains a core section.
- Adding a module owner to a core section changes that section's visibility semantics. Review this explicitly.
- Module toggles control homepage contributions. They are not authorization checks and do not disable direct URLs, delete content, or prevent server operations.

Run the [community learning guides example](../examples/community-module/README.md):

```sh
npx tsx examples/community-module/verify.ts
```

It exercises the real production helpers with an in-memory registration. It is a working source-contract example, not an installable package or a new content engine.

## Integrate a source module

1. Choose a unique stable ID and add the definition to `PLUGINS`. Keep default-enabled changes deliberate; existing visitors and sites may already have saved module lists.
2. For an existing section, reuse its renderer. For a new section, extend `HOME_SECTION_IDS` in `src/lib/themes.ts`, the section rendering map in `src/components/discovery/HomePage.tsx`, and relevant theme miniature labels/rendering.
3. Extend `Validation::siteSettings` in `php/app/Validation.php`: both allowed plugin IDs/count and, if needed, section IDs/count. The PHP and TypeScript allowlists must agree. Keep legacy Next routes compatible when maintaining that runtime.
4. Add authored UI copy through the locale layer. Stable record IDs, route keys, prices, source URLs, and permissions must not be translated. Localized navigation should use the existing link helper; a missing translation must not create a duplicate indexed page.
5. If the feature needs data or privileged actions, implement explicit server storage, input validation, admin authentication, same-origin mutation checks, and revision control. A `PluginDefinition` provides none of those automatically.
6. Include new persistent data in backup/restore. Keep schema upgrades safe for both new installs and existing cPanel sites. Document the exact rollback boundary before distributing a database migration.
7. Rebuild PHP assets and package the complete release. Source imports are compiled by the build; the host runs PHP and serves the generated browser assets.

## Verification

```sh
php examples/community-module/verify.php
php examples/functional-modules/verify.php
php php/tests/functional-modules.php /absolute/private/path/disposable-database.json
npx tsx examples/community-module/verify.ts
npx tsx --test tests/extensions.test.ts tests/theme-templates.test.ts
npm run typecheck
npm run build:php
```

The functional-module PHP suite always uses the empty disposable `wexashelf_modules_080` schema, migrates it, and rolls back synthetic catalogue changes. Never point it at an existing installation.

Add targeted checks for actual new behavior: enabled/disabled display, section ownership, saved preferences, unsupported ID rejection, PHP/client parity, translation coverage, subdirectory links, and any new authorization or database behavior. Check public metadata and content without relying only on a hydrated browser UI. Do not invoke external providers or paid APIs merely to validate a module toggle.

## Current scope and remaining extension work

The current implementation deliberately separates declarative packages from executable extensions:

| Capability | Present state | Next implementation boundary |
| --- | --- | --- |
| Theme import | Validated JSON, draft preview, explicit activation | Keep executable assets outside the declarative import contract |
| Full theme preview | Actual homepage catalogue in a read-only admin preview | Additional route previews and shareable preview tokens are not implemented |
| Theme rollback | Up to 100 complete appearance revisions, restore as a new revision | External exports remain useful for portable recovery |
| Module installation | API 1 cards plus API 2 functional blocks, bundled catalogue, server preview, version checks, disabled upgrades, review-bound activation and export | Executable modules still require source registration and rebuild |
| Module dependencies | No resolver | Declarative dependency graph and cycle/version-conflict rejection |
| Module migrations | Feature-specific source code | Versioned migration records, backup policy, recovery procedures |

Executable third-party installation is a separate design problem and must not be implied by the JSON upload screen. Appearance history is restored with `POST /api/admin/extensions/restore-theme` using `{revision, currentRevision}`; the response contains `{settings}`.
