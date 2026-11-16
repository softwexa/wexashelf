# Community module examples

## Installable declarative package

`manifest.json` is a complete Module API 1 package with English and Turkish public-page cards. Validate it without installing anything:

```sh
php examples/community-module/verify.php
```

In admin **Themes & modules**, choose this JSON file, review its contents, and select **Install package**. Installation starts disabled. Select **Enable** to show the cards; **Disable** hides them without deleting the package. **Uninstall** removes the package. Reinstalling the same ID replaces its manifest and disables it again for review.

The package contains text and local links. It cannot run PHP, JavaScript, HTML, or external assets. A card is shown only when its copy exists in the current language. Its checksum detects stored-content changes; it does not certify the publisher.

## Source-code contribution example

This runnable example demonstrates WexaShelf's current **source-registered section contribution** contract. It contributes the already implemented `guides` section. It does not introduce a new guide database, endpoint, or executable upload format.

```sh
npx tsx examples/community-module/verify.ts
```

The verifier registers the definition in memory, checks enable/disable behavior through the production helpers, and removes it. It does not install anything on your website.

For a real source distribution, add this definition to `PLUGINS` in `src/lib/plugins.ts`, add its ID and capacity to PHP's `Validation::siteSettings` allowlist, test both runtimes, and rebuild the PHP assets. Review default-enabled behavior and existing saved preferences before releasing. The module is initially disabled.

The built-in `migration-guides` module also owns `guides`. A section stays visible while **any** registered owner is enabled, provided the theme includes it. Disable both owners to hide it. This is useful for understanding contribution semantics; a production module should usually own a distinct purpose.

See [the module development guide](../../docs/MODULE-DEVELOPMENT.md) for both contracts, PHP parity, localization, and package-management limits.
