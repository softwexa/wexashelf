# Private catalog backup transfer

The owner Restore workspace uploads ordered384KiB raw chunks (at most512KiB Base64) without changing the global HTTP body limit. Total transfer size is bounded at100MiB. Files use0600 and the private directory0700; flat Apache installations also depend on packaged access-denial rules, which must be verified on the host.

A transfer belongs to its authenticated owner session and security revision, expires after one hour, and can resume in the same browser tab with the same file. Size and SHA-256 identify that file. Exact chunk retries are safe; changed/out-of-order chunks and revoked sessions are rejected. At most three transfers coexist. Cancel old transfers or wait for expiry; a new transfer cleans expired files.

The server verifies SHA-256 and strictly validates the backup before preview. Restore is a separate explicit action, bound to a preview token and unchanged current-catalog fingerprint. If the catalog changes, preview again. Repository restore is transactional, with no DDL inside the transaction; failures roll back catalog changes. A database receipt prevents duplicate apply after a lost response or filesystem-state write.

Catalog backups exclude passwords, MFA/provider secrets, sessions and PHP files. Keep a separate full hosting/database backup. Catalog restoration does not roll back PHP or recover an account.

## Memory limits and CLI fallback

100MiB is transfer capacity, not a promise that every cPanel process can decode that much JSON. Repository validation uses memory. A conservative guard rejects validation before decoding when the configured PHP memory budget is insufficient; it retains the upload and does not raise public body or host memory limits.

Validate a private local backup without changing data:

```sh
WEXA_STORAGE_PATH=/absolute/private/storage php php/cli/backup-restore.php \
  --file=/absolute/private/catalog.json --sha256=THE_VERIFIED_SHA256
```

After reviewing the preview and saving the current catalog separately, add `--apply --confirm-catalog-replacement` to restore. A hosting administrator may deliberately set PHP `-d memory_limit=...` to a suitable available amount; no fixed amount is guaranteed for arbitrary JSON. The CLI uses the installed private configuration, checksum and strict validation, then the same atomic restore. Upgrade the schema first when necessary: this command does not run migrations.

`php php/tests/backup-transfer.php /private/synthetic-database.json` uses only the empty `wexashelf_backup_070` schema and temporary private storage. It covers ordered/resumable chunks, session binding, checksum/preview rejection, catalog conflicts, injected transactional failure, duplicate apply, expiry and revocation.
