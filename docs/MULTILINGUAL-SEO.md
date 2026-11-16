# Multilingual URLs and SEO

English is the default visitor and new-content language. The installer offers English or Turkish; the selected language initializes those defaults. The original seed catalog retains Turkish source records and separate English starter translations. Existing installations and records are not relabeled when defaults change.

`sourceLocale` belongs to each managed app, article or list. It is immutable after creation. Missing fields in older records mean Turkish. `localization.sourceLocale` controls newly created records only; `defaultLocale` controls the root redirect. English originals need no Turkish stub, and Turkish translations of English originals are supported.

## Routes and availability

The root `/` redirects with HTTP 302 to the configured enabled language homepage. It does not use browser language and is excluded from the sitemap. Explicit built-in homepages are `/en` and `/tr`. Legacy Turkish detail paths remain `/uygulama/{id}`, `/blog/{id}` and `/liste/{id}` for original Turkish records. English originals use `/en/apps/{id}`, `/en/blog/{id}` and `/en/lists/{id}`. A translation uses its own locale and slug. Installation subdirectories prefix these paths.

Static categories, guides and workflows now have optional locale-specific `slug` values in their language-pack content. Their stable `id` values and application references do not change. For example, `/en/categories/productivity` corresponds to `/kategori/verimlilik`, and `/en/guides/notes-migration` corresponds to `/rehber/notlarini-tasi`. Earlier Turkish ID paths such as `/kategori/productivity` and `/rehber/notes-migration` redirect permanently to the declared canonical address, preserving query parameters. Existing managed-record Turkish URLs remain unchanged.

The explicit seed tag taxonomy maps known terms to locale labels and URL slugs: `/en/tags/open-source` ↔ `/etiket/acik-kaynak`, `/en/tags/note-taking` ↔ `/etiket/not-alma`. This is presentation metadata; stored source/translation tags and source fingerprints remain unchanged. Unknown owner-authored tags are preserved, not machine-translated. Encoded spaces and Unicode in legacy tag links resolve through the declared mapping. Publishers retain their entity-derived identity while the route prefix changes (`publishers` / `yayinci`). Language navigation follows available equivalents; utility/taxonomy pages keep their existing `noindex` policy.

A public record appears only in its source locale or through an explicit published translation whose publication time has arrived. Source publication and app admission gates apply to every translation. Missing translation pages return 404; the renderer never silently serves another language’s source text. Original IDs and translated slugs are not interchangeable. Source and translation URL collisions are rejected.

A source fingerprint change leaves the previous translated snapshot readable with a review notice and `noindex`. New source wording is not injected into that old translation. Saving changed translation fields, metadata or slug clears its SEO approval; a separate unchanged review can approve it. Source facts, store identities, prices and evidence URLs remain outside the translation field map.

## Canonical, hreflang and sitemap

Every valid public language page has its own canonical URL. Indexing also requires a public HTTPS site with indexing enabled, source SEO approval, no manual source/translation `noindex`, and—for translations—current source fingerprint and translation SEO approval. Filter/query and private utility pages remain outside indexable URL sets.

Hreflang is emitted only for available, indexable equivalents. Clusters contain self-references and reciprocal links; a single-language original does not invent a translation cluster. A standalone approved English original can still enter the sitemap without a Turkish page. Sitemap entries use each actual localized URL and its corresponding update time. Language navigation can expose readable stale translations even while SEO alternates omit them.

The project uses HTML alternate links rather than duplicating the relationship inside sitemap XML. It does not emit `x-default`; there is no separate language-selection landing page. These choices and their purpose follow [Google’s localized-version guidance](https://developers.google.com/search/docs/specialty/international/localized-versions). Hreflang is not an indexing or ranking guarantee.

HTML language/direction, social locale and structured-data `inLanguage` follow the rendered locale. Google determines page language from visible content, not `lang` or a `meta language` tag; these attributes do not substitute for actual translated content. Shared source IDs, source links and business values remain stable. Home title/description overrides are stored per locale in the localization settings.

## Complete runtime language packages

Built-in resources come from the source registry and matching PHP `ui.CODE.json`, `content.CODE.json`, `server.CODE.json` and manifest exports. Owners may additionally preview/import/activate complete declarative JSON packs from the admin without a hosting build. Active private packages supply both server and browser resources, including localized route segments. See [translation guidance](TRANSLATING.md) for the exact envelope, constraints and backup boundaries.

Built-in English/Turkish imports are protected. Incomplete, unsafe or checksum-invalid community packs fail closed. Default-language and content-reference guards prevent disabling an in-use community pack. A UI/static/server pack does not create managed catalog translations or approve SEO.

## Verification scope

```sh
php php/tests/localization.php
php php/tests/localized-slugs.php
php php/tests/source-locales.php
php php/tests/public-seo.php
php php/tests/schema.php
php php/tests/locale-pack.php
php php/tests/installer-locales.php
php php/tests/language-pack-runtime.php /absolute/private/qa-database.json
```

The runtime package suite uses only an empty `wexashelf_locale_070` MySQL schema and temporary private storage. It exercises disabled import, explicit activation, SSR/bootstrap delivery without a rebuild, strict validation, source/default/reference guards and checksum rejection. The German pack is a synthetic extensibility fixture, not a shipped reviewed translation. These local checks do not demonstrate a live deployment, search engine indexing, real traffic or complete RTL layout support.
