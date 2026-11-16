# Release 0.7.0 local validation

## Scope and current state

Candidate validation completed: fresh Docker and flat ZIP subdirectory installations, in-place 0.6.0 upgrade, role/security/backup HTTP flows and empty-queue CLI invocation passed on isolated MySQL 8.4.13. Final documentation-only archive rebinding remains a separate step. No cPanel account, GitHub publication or paid AI provider call is verified. Separate read-only probes observed three public store sources; these are not paid AI activation or continuous store coverage.

The isolated MySQL 8.4 fixture uses container `wexashelf-release-070-mysql84`, network `wexashelf-release-070`, and localhost port 33076. Private synthetic credentials remain under ignored artifacts. Existing preview databases are not reused.

## Asset provenance limitations

This is a local inventory of missing release permission evidence, not legal clearance or a new verification of publisher terms. `THIRD_PARTY_NOTICES.md` and `docs/KATALOG_ORNEKLERI.md` record acquisition sources for ten catalog icons, but do not establish a blanket redistribution license. The AntennaPod media-kit source is recorded; its current terms and compliance of these copies have not been verified. The existing landscape illustration has no verified creation/redistribution evidence in these records. Re-encoding an image does not resolve the original rights uncertainty.

Exact existing paths affected:

- `php/public/assets/icons/acrobat.jpg`
- `php/public/assets/icons/acrobat.webp`
- `php/public/assets/icons/antennapod.svg`
- `php/public/assets/icons/firefox.jpg`
- `php/public/assets/icons/firefox.webp`
- `php/public/assets/icons/notion.jpg`
- `php/public/assets/icons/notion.webp`
- `php/public/assets/icons/obsidian.jpg`
- `php/public/assets/icons/obsidian.webp`
- `php/public/assets/icons/powertoys.png`
- `php/public/assets/icons/powertoys.webp`
- `php/public/assets/icons/ticktick.jpg`
- `php/public/assets/icons/ticktick.webp`
- `php/public/assets/icons/todoist.jpg`
- `php/public/assets/icons/todoist.webp`
- `php/public/assets/icons/vlc.jpg`
- `php/public/assets/icons/vlc.webp`
- `php/public/assets/icons/xodo.jpg`
- `php/public/assets/icons/xodo.webp`
- `php/public/icons/acrobat.jpg`
- `php/public/icons/antennapod.svg`
- `php/public/icons/firefox.jpg`
- `php/public/icons/notion.jpg`
- `php/public/icons/obsidian.jpg`
- `php/public/icons/powertoys.png`
- `php/public/icons/ticktick.jpg`
- `php/public/icons/todoist.jpg`
- `php/public/icons/vlc.jpg`
- `php/public/icons/xodo.jpg`
- `php/public/images/night-landscape.png`
- `php/public/images/night-landscape.webp`
- `public/icons/acrobat.jpg`
- `public/icons/antennapod.svg`
- `public/icons/firefox.jpg`
- `public/icons/notion.jpg`
- `public/icons/obsidian.jpg`
- `public/icons/powertoys.png`
- `public/icons/ticktick.jpg`
- `public/icons/todoist.jpg`
- `public/icons/vlc.jpg`
- `public/icons/xodo.jpg`
- `public/images/night-landscape.png`

Machine-readable inventory: `artifacts/verification/asset-provenance-0.7.0.json`. Legacy assets were not modified or visually inspected. Original neutral replacements now exist under `public/artwork/` with MIT provenance in `php/resources/artwork-manifest.json`; candidate archive/image checks passed: legacy originals/derivatives are absent, all eleven replacement SVGs return HTTP200 on fresh Docker and ZIP installations, and sampled legacy URLs are denied. Existing-installation overlays can leave old files behind and require deliberate cleanup. Bundled dependency license texts are a separate evidence layer and do not clear app trademarks, icons or Softwexa branding.

## Planned release checks

- Bind receipts to actual archive/image hashes and actual MySQL/PHP versions.
- Fresh web installer with private setup key; English default, Turkish legacy routes, authentication and private-path denial.
- Install archived 0.6.0 on a separate schema, upload final runtime, prepare protected backup and explicitly apply upgrade; preserve catalog/authentication.
- Exercise owner security controls, ordered private chunk restore and isolated cron invocation with no configured paid provider.
- Deny direct HTTP access to CLI files and record local-only hosting limitations.

## Historical candidate checks

- PHP ZIP SHA-256: `c07e232dc7e550984d8ae2cf0e58729657613fea3183c27ebf2d0e5f557e7657`.
- Docker image identifier: `sha256:11231501a405946d852d65f0e13f028c929bdf02bcefc45db19bb5dcabfbb3d3`; image configuration: `sha256:6c83df035dd71374556a6a1761de7499f5861f9beb712da1072556f274d8c4c6`.
- MySQL `8.4.13`, isolated local Apache ports3162/3163/3164. Real web installer rejection/lock/auth/private-path checks passed on fresh Docker and `/catalog` ZIP. Each passed 25 additional hosting checks.
- Archived 0.6 runtime upgraded via private backup/receipt and explicit migration; record data/revisions and owner access remained intact.
- Ten HTTP operational checks passed: editor denial of owner endpoints, multiple backup chunks and exact retry, strict preview/restore, MFA and one-use recovery, revocation and password rotation. Legacy missing sourceLocale normalizes to `tr` on restore as specified.
- Packaged AI and source worker CLI commands completed with zero jobs and no external calls. This verifies executable packaging, not scheduled cron activation or real provider behavior.
- Eleven original SVGs loaded on fresh root/subdirectory; legacy sampled URLs were denied. Six selected runtime/source SHA-256 comparisons matched.

Local combined receipt: `artifacts/verification/release-0.7.0-hosting.json`, with separate fresh/sub/upgrade/operations receipts. Local artifacts are not included in public archives. A later docs-only package has a different ZIP hash and must be bound explicitly; these results do not claim public hosting or production deployment.

## Final runtime and performance binding

The final Docker image/configuration identifier is `sha256:f623e07c79a7c16dd38e07ab30e16e6852112308eee22823678e35047d4c2da6`. It retains the isolated MySQL 8.4 installation and private configuration. Earlier fresh-install, upgrade and security/restore receipts remain evidence of their explicitly recorded runtime revisions; they were not relabeled as repeated final-image tests.

The reduced visitor locale bundle is 551,246 bytes. Its runtime passed 25 scoped HTTP checks, English/Turkish SSR checks, eleven replacement SVG requests and selected source/image SHA-256 comparisons before the final wording-only change. The final performance cohort completed eight mobile/desktop pairs: mobile 95–97, desktop 100. See [performance conditions and results](PERFORMANCE-AUDIT-REPORT.md). These are local laboratory measurements, not field Core Web Vitals, every-host guarantees or a repeated-run median.

After that cohort, exactly one `SourceRefresh.php` error literal changed from `Invalid app identity.` to the existing localized key `Geçersiz uygulama kimliği.`. Actual final-image requests returned HTTP400 with `Invalid app ID.` for English and `Geçersiz uygulama kimliği.` for Turkish. Comparing 107 runtime files against the preserved measured candidate ZIP (`12c298aa6e87afff32330e333eb3911c6b0acf4db1f82735c53dd1b4d6f88a4a`) found only that file changed; the saved before/after bytes verify the exact literal substitution. Public assets, renderers and generated resources remain unchanged. Lighthouse was not rerun for this error-only delta, and its measured revision remains explicit.

Local evidence: `artifacts/verification/release-0.7.0-final-runtime.json`, `release-0.7.0-wording-delta.json`, `error-wording-0.7.0-http.json` and `performance-final-0.7.0-verified.json`. Historical candidate archive/image hashes above are retained deliberately. The final documentation-inclusive archives are bound by a separate release receipt after packaging; embedding their own hashes here would create a self-referential archive. No archive path in this document implies that private local evidence is distributed.
