# Translating WexaShelf

English is the main interface language. Turkish remains an explicitly supported language and the source language of the original catalog. New content defaults to English; each managed record stores its own immutable source language. Records imported from older releases without that field retain Turkish. A language change must not change record IDs, store identities, prices, dates, permissions or publication decisions.

## Three separate layers

- **Interface messages:** navigation, forms, guidance, theme labels and authored policy paragraphs. These are JSON language packs.
- **Static content:** bundled guides, workflows, categories and page names. These have reviewed content JSON files and stable references.
- **Managed content:** apps, articles and editorial lists. These use the admin translation workflow with their own publication, SEO approval and source-staleness checks. A UI pack does not translate catalog records.

## Files

| Purpose | Location |
| --- | --- |
| Authoritative English messages | `src/lib/i18n-packs/en.json` |
| Turkish messages | `src/lib/i18n-packs/tr.json` |
| Compatibility aliases | `src/lib/i18n-source-keys.json` |
| Registration and validators | `src/lib/i18n-registry.ts` |
| Server messages and route segments | `src/lib/i18n-packs/server.en.json`, `server.tr.json` |
| Static content | `src/lib/i18n-packs/content.en.json`, `content.tr.json` |
| Contributor templates | `examples/locales/ui-template.json`, `content-template.json`, `server-template.json` |

The current `ui.…` identifiers are stable keys. English message values are the authority. Existing Turkish `t(...)` arguments are compatibility aliases, not the specification for new translations. Do not rename IDs when wording changes.

## Contribute a language

1. Copy the three templates to `src/lib/i18n-packs/de.json` `content.de.json` and `server.de.json`, substituting your language code. The templates contain English reference text; `xx` is an unregistered placeholder, not a completed language.
2. Set `locale`, native-language `label`, `intlLocale` and `direction` (`ltr` or `rtl`). Translate every value in `messages`; preserve keys and placeholders exactly. Placeholders such as `{name}`, `{count}` and `{months}` may move within a sentence but must not be renamed or removed.
3. Translate static titles, descriptions, steps and label values. Preserve object keys, array order/length and every `id`, `appId`, `appIds` and `kind` value. Policy paragraphs are UI entries and need translating too. Server-rendered policies must use the corresponding resource rather than a second hardcoded copy.
4. Validate the candidate:

```sh
node scripts/check-locales.mjs src/lib/i18n-packs/de.json src/lib/i18n-packs/content.de.json src/lib/i18n-packs/server.de.json
```

Checks cover completeness, unknown keys, placeholders, metadata and stable static-content structure. They do not certify linguistic accuracy. Review wording in context, preserve uncertainty and never add unsupported claims of testing, security, popularity or price. Use plain text, not executable HTML. Do not add credentials or user data.

## Install a complete pack from the admin

An owner can export the English reference package from **Language packs**, translate it, preview validation, import it disabled, and explicitly activate it. This runtime path needs no Node build on hosting. The envelope is:

```json
{
  "schemaVersion": 1,
  "locale": "de",
  "ui": { "schemaVersion": 1, "locale": "de", "label": "Deutsch", "intlLocale": "de-DE", "direction": "ltr", "messages": {} },
  "content": {},
  "server": { "messages": {}, "routes": {} }
}
```

The empty objects above show structure only; they are not an installable pack. Start with the exported reference, which contains every required key. Preview enforces exact keys, stable IDs/references, placeholders, plain text, safe route segments and collision rules. Index/detail aliases may share a segment only when the reference routes already share it. Package size is limited to 1 MiB and 20 community packs. Built-in English and Turkish packages cannot be replaced through imports.

Categories, guides and workflows may define an optional `slug` alongside their immutable `id`; translate the slug, not the ID. Use unique lowercase ASCII words separated by hyphens, at most 100 characters. Slugs must not collide with another entry’s slug or legacy ID. An optional `content.tags` array declares the built-in taxonomy as `{ "id": "açık kaynak", "label": "open source", "slug": "open-source" }` entries: IDs/order stay fixed, while labels and slugs are translated. A supplied tag taxonomy must be complete. Do not add invented translations for arbitrary user tags.

Previously complete community packs without these optional slug/tag fields remain valid and keep their legacy ID URLs; no guessed translations are inserted. Supplying malformed fields or collisions fails validation. Changes to a declared static slug create redirects from the legacy ID form; arbitrary earlier custom slugs are not retained automatically, so maintainers should add explicit URL-lifecycle redirects when renaming one. Test server rendering and browser links, including encoded spaces and Unicode, after enabling a pack.

Imported JSON is stored privately in `storage/language-packs.json` with a checksum. Activation supplies the validated UI/static/server resources to PHP and the browser bootstrap. The public build includes only public UI message keys; an active custom language sends those same keys for the current page locale. Administration and exported packages always retain the complete key set. Deploy matching browser assets and `resources/ui-public-keys.json` together. Public-key extraction includes shared label maps and dynamic message fragments; preserve that coverage when adding templates. No uploaded PHP or JavaScript is executed. A corrupt or incomplete package is unavailable publicly. Disable an active package before replacement; disabling is blocked while it is the default visitor/new-content language or referenced by source, translation or editorial records. Save a private backup of this file alongside the database/configuration: a catalog JSON export is not a complete hosting backup.

Validation checks structure, not translation quality. An English reference relabeled as German is a test fixture, not a reviewed German translation. Check actual pages before enabling your completed translation.

## Contribute a built-in pack and build

Import the reviewed set in `src/lib/i18n-registry.ts`, then add it to `localeRegistry`:

```ts
import germanPack from './i18n-packs/de.json';
import germanContent from './i18n-packs/content.de.json';
import germanServer from './i18n-packs/server.de.json';
// Entry inside localeRegistry:
de: { ...germanPack, content: germanContent, serverMessages: germanServer },
```

The server pack contains stable semantic message keys and internal-route keys. Translate message values and choose lowercase ASCII route segments (letters, digits and single hyphens). Preserve all keys and placeholders. Shared route segments can be intentional for index/detail pages; test collisions in the PHP router. Do not enable a language before its exact route, canonical and alternate-link behavior passes integration checks.

The bundled registry controls message selection and locale formatting, with English as interface fallback. Adding a pack to the source registry is a build-time code change; the owner-only runtime package workflow above is the alternative for installed hosts. Visitors cannot install language packages. Before enabling the language, ensure the generated PHP-supported-language resource, server renderer, route mapping and policies support it. Do not enable a language whose server pages still assume English/Turkish. Registering a UI pack does not create published catalog translations.

```sh
node scripts/check-locales.mjs
npm run typecheck
node --import tsx --test src/lib/i18n.test.ts
npm run build:php
```

Deploy matching PHP resources and browser assets together. No npm build is required on hosting. Preserve private storage and the database; do not reinstall or reseed to add a language. Check desktop/mobile layouts, all six themes, accessibility names, query parameters, dates, numbers, legal pages and a translated record. RTL needs separate layout verification; a metadata value alone is not proof of RTL compatibility.

## Routes and publication

Fresh installations default to English. The root entry redirects to the configured language; explicit home pages are `/en` and `/tr`. Legacy Turkish detail paths and stable record IDs remain unchanged. Client links use server-declared `localizedPaths`; the language chooser uses only explicit equivalents. There is no forced browser-language redirect. A record appears under its own source language without a translation stub. Another language requires a published explicit translation. Missing translations never relabel source text under another language URL; an English original has no Turkish detail page until a Turkish translation is published.

Select a record before choosing its translation language; the target must differ from that record’s source language. The localization source default controls future records only. Existing source languages cannot be changed by ordinary saves or by changing defaults. Managed translations have independent slugs, text fields, source fingerprints, statuses and SEO approval. Use the supplied field map. Source URLs, identities and pricing are not editable translation fields. Complete and review text before publishing; stale translations need review again. Language activation is not SEO approval or an indexing guarantee. A validated third-language file set alone does not prove that its live deployment, routes or catalog translations work.

## English starter overlays

`php/client/english-seed.ts` exports `buildEnglishSeedTranslations(records)`: hand-authored English overlays for 17 original records and 210 nonempty text fields. It does not write a database and fails when changed source copy lacks a reviewed translation. Installation code may apply it only to a fresh seed. Existing user content must never be overwritten automatically. Starter SEO approval remains false.

## Theme and module authors

Use explicit translation helpers or stable message keys for authored UI; do not inspect or replace DOM text. Theme, section and module IDs and stored business values are language-independent. Add authoritative English messages and complete pack translations without removing IDs still used by code. Localize displayed theme names/descriptions and module copy, not imported identifiers. Theme JSON is a declarative visual configuration, not a script or language-pack installer.

Validate long labels, focus behavior, accessibility text and mobile wrapping in all six themes. JSON validation does not replace editorial or visual review.

## Focused PHP checks

```sh
php php/tests/localization.php
php php/tests/localized-slugs.php
php php/tests/source-locales.php
php php/tests/locale-pack.php
php php/tests/installer-locales.php
php php/tests/language-pack-runtime.php /absolute/private/qa-database.json
```

The final command requires an empty dedicated `wexashelf_locale_070` schema. It uses temporary private package storage and rolls back catalog changes; it must never target a working installation. The installer locale test checks forms/errors and lock preservation without installing a database. These checks do not certify live hosting, linguistic accuracy or every RTL layout.

### API error messages

PHP API errors use `WexaShelf\ServerErrors::message()` at the response boundary. English is the default; the first `Accept-Language` tag selects Turkish when it is `tr` or a Turkish regional tag. The admin sends its selected interface language. Curated exact-message catalogs live in `php/resources/error.en.json` and `error.tr.json`; they do not depend on a browser rebuild. Known dynamic templates preserve field names and identifiers. Unknown messages remain unchanged instead of being rewritten as user prose.

When adding an authored `ApiException` or validation `check` message, add its counterpart to these catalogs and run `php php/tests/server-errors.php`. The test inventories literal messages, validates both catalogs and checks that unrelated text is untouched. Community interface packs do not override this security-sensitive error catalog; unsupported API error languages currently fall back to English.
