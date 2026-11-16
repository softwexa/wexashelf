# WexaShelf contributor instructions

These instructions are shared by human contributors and coding assistants. Read [CONTRIBUTING.md](CONTRIBUTING.md), the [contributor documentation index](documents/README.md), [AI contribution workflow](documents/AI-CONTRIBUTION.md), and [testing guide](documents/TESTING.md) before changing the project. Follow more specific instructions in a directory when present.

## Runtime and ownership

- The primary deployment is PHP 8.3+ with MySQL. React and TypeScript provide the browser interface; Node.js builds assets on the development machine and is not required on the PHP host. Start with [README.md](README.md) and [the cPanel installation guide](docs/KURULUM_CPANEL.md).
- PHP application code lives in `php/app`, browser entry points and compatibility shims in `php/client`, and shared/public UI in `src`. Generated browser assets and PHP resources must match their source at release time. The retained Next.js development path does not replace the primary PHP runtime.
- Make small, reviewable changes within the agreed scope. Check the working tree before editing; preserve unrelated changes and coordinate ownership when others are working. Do not reset, overwrite or revert another contributor's work.
- Inspect the existing implementation and relevant tests before choosing an approach. Reuse the established theme, accessibility and component patterns. Explain intentional contract changes and update affected documentation.

## Content, languages and evidence

- English is the default interface language; Turkish remains supported and is the canonical source language of the original catalog. Preserve existing Turkish URLs, stable record IDs, store identities and source references.
- Use the registered language packs and explicit locale routing. Translate presentation text without changing identifiers, prices, dates, permissions or publication state. A missing content translation must not silently become a published source-language page under another locale. See [translation guidance](docs/TRANSLATING.md) and [multilingual SEO](docs/MULTILINGUAL-SEO.md).
- Keep unknown facts unknown. Prices, store observations, quotas, compatibility, test claims and rankings require the evidence appropriate to their field. Do not invent sources, measurements, reviews, traffic or performance results.
- AI output is a suggestion for editorial review. Keep generation, draft application, saving and publication separate. Translations belong to their own record/version workflow; never overwrite canonical source content with another language's output.

## Public and private boundaries

- Keep credentials, API keys, private storage, databases, sessions, local configuration and personal data out of source files, examples, public assets, logs and distribution archives. Use placeholders in documentation.
- Preserve authentication, authorization, same-origin mutation checks, input validation and optimistic revision checks. Public submissions enter their existing review workflow; they do not grant publication rights or verify identity.
- Do not make paid provider calls, publish content, migrate real installations or change external services without authorization for that action. Backups and reversible local edits do not authorize deployment.
- Community modules and themes must stay within their documented contracts. See [theme development](docs/THEME-DEVELOPMENT.md), [module development](docs/MODULE-DEVELOPMENT.md) and [upgrade boundaries](docs/UPGRADING.md).

## Validation and review

- Use isolated synthetic fixtures for database, installer, browser and administrative tests. Never run destructive tests against a contributor's working installation or real user data.
- Run checks appropriate to the change and record the exact scope and result. Distinguish source/unit tests, local PHP runtime checks, mocked providers, real provider calls and live hosting verification. Do not describe a mock or local receipt as production proof.
- Typical checks include `npm run typecheck`, `npm test`, `node scripts/check-locales.mjs`, and the relevant PHP tests. Follow the testing guide for runtime setup, browser checks and build/package sequencing. Do not rebuild measured assets during a frozen performance cohort.
- Keep automated CI opt-in: do not add or enable workflows, trigger hosted runs or assume external runners are available without the contributor's authorization.
- Do not push, open a pull request, merge or publish a release without the contributor's actual authorization for that action. A request to edit or test locally is not authorization to publish. Maintainers review contributions before accepting them; an assistant's passing checks do not replace that review.
- Summarize what changed, why, the checks performed and any remaining limitations. Leave the working tree and evidence understandable to the next contributor.

## Finish a development task with a contribution handoff

- After implementation and relevant checks, inspect whether Git is available **and** this directory is a repository. Check the repository root, current branch, whether `HEAD` exists, the working tree and actual remote destinations. An installed Git executable, a `.git` directory or a signed-in GitHub account is not permission to publish.
- Prepare the exact proposed file scope, reviewed diff, test results and local PR title/body before requesting publication approval. Verify the real upstream repository, its existing maintainer-approved base branch, the contributor's fork or permitted topic-branch destination, and available authentication. Never guess a repository URL, assume `origin` is the maintainer's repository, or substitute `main`, `master` or `dev` without checking.
- If publication is feasible and not already explicitly authorized for this scope and destination, **ask the computer owner once whether to submit this reviewed contribution**. Name the files/change, commit and push scope, destination repository/topic branch, upstream/base and proposed draft PR visibility. Explain relevant external automation or costs if this submission would trigger them. Honor an existing specific authorization instead of asking again.
- After approval, commit only approved paths, push the approved topic branch and open the agreed PR for maintainer review. Do not include another contributor's edits. Verify the resulting PR and report its actual URL. Approval to contribute does not authorize direct protected-branch pushes, automatic merge, release, deployment or application self-update.
- If the owner declines, has not answered, or Git/checkout/history/authentication/destination is missing, keep the work local and provide the prepared diff or patch, PR description and exact next step. Do not invent an upstream, silently initialize/publish a repository, repeatedly prompt, or send updates in the background. Read [the complete handoff workflow](documents/AI-CONTRIBUTION.md#5-offer-the-reviewed-contribution-to-the-computer-owner).

These files guide assistants that read them; they are not a universal enforcement mechanism. GitHub permissions, branch rules and human review must enforce repository acceptance. There is no telemetry or automatic upstream reporting in this workflow.

## Retained Next.js guidance

The generated instructions below apply when working on the retained Next.js path. Preserve this block when updating contributor guidance.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
