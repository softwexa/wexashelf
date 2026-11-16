# Security policy

Report suspected vulnerabilities privately through [GitHub's vulnerability reporting form](https://github.com/softwexa/wexashelf/security/advisories/new). Private vulnerability reporting is enabled for this repository. Do not include exploitable details, credentials, personal data or database copies in public issues.

Include the affected version or commit, a minimal reproduction using synthetic data, the likely impact and any suggested mitigation. Redact secrets and customer data. Maintainers assess reports against the current source; no response-time, bounty or long-term support commitment is made. Historical local release archives may differ from current source.

Use unique administrator credentials, a restricted MySQL user, the exact site origin and HTTPS. Protect application code, resources and storage with the supplied Apache rules or equivalent server configuration. Keep `storage/config.php`, installation keys, logs and backups private. Never place a source ZIP in the public document root. Follow [cPanel installation](docs/KURULUM_CPANEL.md), [local deployment](docs/YEREL_DAGITIM.md) and [upgrade guidance](docs/UPGRADING.md). Search indexing settings are not access control.

The retained Next.js/SQLite development path has separate `.local` credentials and data. Excluding these from release archives does not clean Git history or protect a misconfigured web server.
