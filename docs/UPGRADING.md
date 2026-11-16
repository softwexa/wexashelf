# Backed-up PHP upgrades

The owner-only upgrade wizard prepares a private catalog backup, validates its SHA-256 receipt, and runs the migrations in the currently uploaded local release. It does not download releases, extract arbitrary ZIPs, upload PHP files, activate providers or deploy a site.

1. Back up the full hosting files, private configuration and database using your hosting tools. Keep the previous release files. The wizard catalog backup does not include admin credentials, API keys, PHP code or all operational tables and cannot roll back PHP files or DDL.
2. Upload the reviewed release through cPanel according to the package installation instructions, preserving private storage and configuration. The generated `resources/release.json` identifies the local target version; no remote version claim is made.
3. Open the owner upgrade panel and resolve the preflight checks. Database connectivity does not prove DDL privileges; these are exercised during Apply.
4. Prepare a backup. Download the protected JSON attachment and retain its SHA-256 receipt. Backups use private storage with file mode 0600 and directory mode 0700. Docker keeps storage outside the public web root; flat cPanel installations protect it with Apache access rules. Verify that direct HTTP access is denied before using the installation.
5. Explicitly Apply the prepared receipt. If catalog content changed after preparation, prepare a new backup. The service holds the ordinary-write maintenance gate while migrations run.
6. Confirm the final state and perform application checks. The installed schema version is recorded only after migrations complete.

MySQL DDL can implicitly commit. A failed migration may have partially changed the schema; the wizard reports failure and keeps the backup rather than claiming atomic rollback. Inspect hosting logs and use the full hosting/database backup if restoration is necessary. Normal exceptions clear maintenance. After a process crash, the owner may explicitly Recover the maintenance gate, then prepare a new backup; recovery does not reverse DDL. An OS file lock prevents recovery from interrupting an actively running wizard request.

The API uses optimistic revisions and request IDs for repeat-safe preparation/application. Owner-only `GET /api/admin/upgrade?download=RECEIPT_ID` streams the current verified catalog backup. No filesystem path is accepted from the browser. Repeating a completed request returns its current state without rerunning migrations. At most 30 retained backups may be prepared before the owner archives old private files through hosting storage.

Custom language packs must contain the target release's complete UI, static-content and server-message key sets. A pack that was complete in an earlier release can become incomplete when new features add keys; incomplete packs are excluded from the public runtime. Before upgrading a site with custom languages, export and privately back up `storage/language-packs.json`, update the pack against the target release's English template, and validate the upgrade on an isolated copy, including default-language and content routes. Do not rename stable message IDs or assume the upgrade wizard translates missing copy. Follow the [language-pack replacement workflow](TRANSLATING.md) and its reference/default-language guards; a referenced active pack cannot simply be disabled to bypass those checks.

`php php/tests/upgrade.php SYNTHETIC_QA_DATABASE_JSON` validates the workflow against an isolated disposable database, including corrupt backup rejection, source conflicts, repeat requests, real migrations, credential preservation, injected partial-DDL failure and explicit recovery. These local checks are not proof of a live hosting upgrade.

## 0.7.1 routes and application icons

Version 0.7.1 restores genuine application icons under `assets/icons/`. The 0.7.0 instruction to delete those icon files is obsolete: do not apply it to 0.7.1. Upload the new compiled assets and matching `resources/icon-assets.json` together. Preserve custom icons, private media and unrelated files. The background remains the original geometric MIT landscape; publisher icons retain their separate rights described in `THIRD_PARTY_NOTICES.md`.

Administration now uses `/admin` and installation uses `/install`. Old `/yonetim` and `/kurulum` browser links redirect; old installer POST submissions remain supported. Existing private storage, accounts and catalog data are not replaced. Public legacy static URLs redirect to locale-specific canonical slugs without changing stable IDs.

After an overlay, verify application icons load from `assets/icons/`, the standalone admin page has no public discovery shell, and EN/TR language switches reach the corresponding page. Unused old `images/night-landscape.png` and `images/night-landscape.webp` can be removed after a private backup only when you have confirmed custom themes do not reference them. Do not recursively delete directories.

## Language resources and minimum PHP during upgrades

The runtime requires PHP8.3 or newer, including `intl`; the upgrade preflight checks the same minimum. It also checks that every enabled/default/source language still has complete UI, static content and server resources matching the uploaded release. A missing or incompatible custom pack blocks preparation/application with repair guidance. It does not silently disable that language, replace its content with English/Turkish or delete translations.

Preflight executes the files already uploaded to the installation. Test the release and your language packages on a local/staging copy **before replacing production files**; upload matching rebuilt resources/custom packs together. If a pack is missing afterward, restore its matching files/private package from the full hosting backup and recheck. A catalog-only backup cannot restore those filesystem resources. Retain the previous full application files and database backup for a manual hosting rollback; the wizard does not reverse PHP changes or MySQL DDL.
