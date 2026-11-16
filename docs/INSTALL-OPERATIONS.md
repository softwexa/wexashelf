# Installation and owner operations

The installer defaults to **Empty catalog** and English. Enter your site name and choose the site language before installing. Empty mode creates no sample apps, articles, lists or managed translations. Sample mode is optional demonstration content: original Turkish records retain Turkish source language even when the visitor/default authoring language is English. Both modes start with search indexing disabled.

The site name is saved in the existing SEO settings. You can change it later. The installation choice does not grant source verification, SEO approval or publication readiness. After installation, use the owner System health panel to review the local checks and first-use checklist.

## cPanel setup

1. Create a new empty MySQL database and a user with access only to it. Record the account-prefixed database/user names privately.
2. Select PHP 8.3+ with `pdo_mysql`, `curl`, `mbstring`, `intl`, `session` and `fileinfo`. Upload the flat PHP ZIP into the intended document root/subdirectory, including hidden `.htaccess` files.
3. Create a unique private `storage/install.key` with at least 24 random characters. Use private file permissions and PHP-writable storage; never use public writable permissions as a workaround.
4. Open `/install`, enter the exact site URL including its subdirectory, choose Empty catalog or Sample catalog, and set a unique owner password. The owner interface is `/admin`. Legacy Turkish GET paths redirect to these canonical paths.
5. Confirm the installer locks. Check that private configuration, setup key, app/resources and CLI URLs return 403/404; an `.htaccess` file alone does not prove the host enforces it. Remove the setup key after successful installation.
6. Review System health, configure owner MFA/recovery codes, create your first app with source references, and review its publication/SEO settings. Use a public HTTPS origin before enabling indexing.

System health is owner-only. It reports extension availability, database version/connectivity, runtime/schema versions, bounded catalog counts and storage configuration evidence. It does not expose credentials, private paths, session tokens or provider prompts. A green local check does not certify production hosting. The panel does not make network probes against your domain; HTTP protection remains an explicit host check.

## Optional workers

Replace every placeholder with the host's actual PHP CLI and installation paths. A source checkout includes an additional `php/` directory; the flat hosting ZIP does not.

```sh
WEXA_STORAGE_PATH=/absolute/private/storage /path/to/php /path/to/site/cli/worker.php --queue=ai --max-jobs=5 --max-seconds=50
WEXA_STORAGE_PATH=/absolute/private/storage /path/to/php /path/to/site/cli/source-worker.php --max-jobs=5 --max-seconds=50
```

Run manually once, then configure cPanel Cron Jobs if desired. CLI and web PHP can differ in version/extensions. Recorded worker evidence contains timestamps, outcome and bounded processed counts in private0600 files. It proves only that an invocation finished; it does not establish that a recurring schedule is active or that a provider account is enabled. Failed evidence recording cannot trigger another job submission. Missing/corrupt records appear as unknown.

## Update and recovery

Use [UPGRADING.md](UPGRADING.md) for the protected backup/receipt workflow and preserve private storage. Keep a full hosting/database backup: catalog JSON cannot restore PHP files, owner credentials, provider secrets or all operational state. Use [BACKUP-RECOVERY.md](BACKUP-RECOVERY.md) for checksum/preview/explicit catalog restore and [ACCOUNT-SECURITY.md](ACCOUNT-SECURITY.md) for local owner recovery. No HTTP password-reset endpoint is provided.

An existing installation is never converted to empty mode by re-opening the installer. Changing the default language does not relabel existing source records. Unknown worker/hosting state stays unknown until you perform and record the relevant action.

## Verification boundary

Focused source tests cover empty/sample initialization, site-name validation, source-language preservation, private health output and nonfatal worker-evidence recording. A local PHP/database version matrix must be recorded with its actual versions and commands before claiming compatibility. No remote cPanel account is configured by these changes; local Apache containers do not certify every shared host.

### Current local compatibility evidence

The operations source checkpoint was exercised through real web installation against two isolated synthetic environments:

| PHP | Database | Installation choice | Result |
| --- | --- | --- | --- |
| 8.4.27 | MySQL8.4.13 | Empty | Zero managed records; English public page and owner health API passed |
| 8.3.36 | MariaDB10.11.19 | Sample | Seventeen sample records, preserved Turkish source language and chosen site name passed |

Both checked installer rejection/lock behavior and health access as owner200, anonymous401 and analyst403. The empty fixture rejected missing sample-guide routes. Separate copied080 fixture checks exercised upgrade preparation/application, CLI catalog dry run/restore and local owner recovery. That initial upgrade check used the current installed target; it is not a historical-version migration claim. A separate copy of the synthetic0.7.1 installation was then upgraded to the generated0.8.0 target: protected backup download/SHA-256, explicit apply, record/revision preservation and owner login passed. The old installation had no stored schema-version value (`unrecorded`); its0.7.1 provenance comes from the earlier immutable installation receipt. The original baseline was not modified. This does not claim the wizard can roll back PHP or DDL.

Local receipts are under `artifacts/goal-080/operations/`; they are private workstation evidence, not distributed runtime files. MariaDB11.8 and remote cPanel were not part of this two-environment checkpoint. No paid provider calls were made. Observed worker execution with empty queues was verified separately from cron scheduling.
