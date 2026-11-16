## Problem and result

What problem does this solve, and what changes for a user? Include a small before/after example when useful.

## Scope

List the affected areas and any migration, compatibility or licensing implications. Link a related issue if one exists.

## Validation

Record the exact commands or manual steps you ran and their results. State what remains untested and any known limitations. Local checks are not proof of deployment, provider activation or production performance.

<!-- Choose checks that fit the change; do not claim checks you did not run.
Frontend: npm run typecheck; npm test; npm run build:php
PHP: php -l PATH; relevant php/tests/*.php; changed routes on isolated PHP/MySQL
Browser: targeted Playwright tests against an explicitly isolated synthetic catalog
-->

## Applicable review notes

<!-- Delete irrelevant prompts. -->
- **Locales:** English default, Turkish legacy URLs, complete authored locale packs, and unchanged canonical IDs/business values.
- **PHP:** PHP/MySQL behavior, installation subdirectory paths, and backup/migration behavior where affected.
- **Security and privacy:** Authorization, input/output handling, secret exclusion, and synthetic test data.
- **Assets or modules:** Source/license provenance and the documented theme/module contract.

## Contributor responsibility

- [ ] I reviewed the changes and can explain their behavior; submitted code/assets have appropriate rights and provenance.
- [ ] I have not included credentials, private catalogs, backups, browser profiles or personal data.
- [ ] The person responsible for this checkout authorized publishing this contribution to the stated repository and base branch; unrelated local changes are excluded.

If AI assisted this contribution, briefly describe its role and what you checked yourself. You remain responsible for the submission; generated claims or test summaries need actual verification. Do not attach private conversations, account credentials or an authorization transcript.
