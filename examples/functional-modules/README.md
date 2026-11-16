# Installable functional modules

These three Module API 2 packages are ready to preview and install in **Admin → Themes and modules**. They match the bundled module catalogue. They use published records already present on the destination site; installation never creates content, publishes drafts or invents evidence.

- [Focus kit](wexa-focus-kit.json): a curated shortlist of note and task applications.
- [Notes comparison](wexa-notes-comparison.json): recorded offline, sync and export facts, with unknowns kept explicit.
- [Latest reading](wexa-latest-reading.json): up to three published articles by publication date.

Each package includes English and Turkish copy. App references use stable IDs, not translated names. Missing content or locale copy is omitted and explained in the admin preview. A comparison needs at least two available apps. A newly installed or upgraded package remains disabled until its exact version is reviewed and enabled.

```sh
php examples/functional-modules/verify.php
```

This validates the three portable manifests against the server contract and confirms they match the bundled copies. It does not install anything or access a database.

To adapt a package, change its ID, name, localized copy and supported configuration. Increment its three-part version before replacing an installed version. Upload JSON through the admin review workflow; do not upload PHP or JavaScript. Read the [full contract](../../docs/MODULE-DEVELOPMENT.md) for limits, server/API validation, export, backup and source-code extension boundaries. Use the full source archive for development; the hosting archive contains the compiled runtime and these reference examples.
