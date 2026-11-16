# Contributing to WexaShelf

Human and AI-assisted contributions are welcome. Use your own coding tool and account; no particular model or paid service is required. You are responsible for understanding and reviewing your contribution. Contributions use the [MIT license](LICENSE); preserve third-party licenses and asset provenance.

Start with [AGENTS.md](AGENTS.md), the [documentation index](documents/README.md), [feature ledger](documents/featured.md) and [AI workflow](documents/AI-CONTRIBUTION.md). Codex uses `AGENTS.md`; `CLAUDE.md` imports the same instructions. These files guide tools; GitHub permissions and branch rules control repository writes.

## Choose a contribution

Good starting points include a reproducible bug fix, complete translation pack, theme or module, accessibility improvement, regression test or clearer documentation. Discuss large architecture/dependency changes in an issue first. Use the issue templates and synthetic examples; keep secrets, customer data and vulnerability details private. See [SECURITY.md](SECURITY.md).

## Branch and review policy

```text
your fork → topic branch → local checks → Pull Request to dev
          → maintainer review → integration → release PR to main
```

- The upstream is [softwexa/wexashelf](https://github.com/softwexa/wexashelf). `main` is the stable line and default branch; normal contributions target `dev`. Verify the upstream and base in your checkout before submitting, especially when working from a fork or source archive.
- Use a separate branch, for example `codex/fix-locale-links`, `fix/installer-path` or `docs/module-example`. The prefix does not restrict which assistant you use.
- External contributors normally push to their own fork. Signing into GitHub does not grant upstream write permission. Contributors with upstream access still use a topic branch and PR.
- Open a draft PR while work is incomplete; mark it ready after your checks and review. Maintainers decide acceptance and publication. Do not directly push to `main`/`dev`, force-push shared branches, bypass protection, automatically merge or deploy an ordinary contribution.

The [GitHub setup guide](documents/GITHUB-SETUP.md) covers the actual repository and review settings. Adding Markdown files does not enable those settings.

## End-of-task contribution offer

Coding assistants should finish the local change and its relevant checks, then offer a reviewable contribution to the person responsible for the computer/checkout. They must first inspect Git availability, the actual repository root, branch, commit history and remotes. Git may be installed without a repository, and a new repository may have no `HEAD` commit yet. Neither state should trigger automatic initialization, an initial bulk commit or publication.

Before asking, prepare the intended file list/diff, test results and PR title/body; verify the real upstream, existing maintainer-approved base, fork/topic destination and authentication. Remote names are conventions, not proof of ownership. Do not expose credentials embedded in configuration or remote URLs when reporting these checks.

Ask once for the concrete commit/push/draft-PR scope and target, including the visibility of the repository receiving the files. If that exact action is already explicitly authorized in the current task, proceed within that authorization without asking again. Relevant hosted automation must be disclosed and remain opt-in. An unanswered or declined offer leaves the result local. Missing Git, history, authentication or destination should produce a clear local handoff and next step, not repeated approval prompts or background updates.

After approval, submit only the reviewed changes through the fork/topic-branch/PR route and report the actual PR URL. The maintainer decides whether to merge. This is an assistant instruction, not an application self-update service or a guarantee that every AI tool reads these files. For tools without repository-instruction support, explicitly ask them to read `AGENTS.md` and [the complete AI workflow](documents/AI-CONTRIBUTION.md).

## Develop and validate

The primary runtime is PHP 8.3+ and MySQL/MariaDB. Node.js 24+ builds the React assets on a developer machine; the hosting ZIP needs no Node or Composer runtime. Follow [testing](documents/TESTING.md), [architecture](documents/ARCHITECTURE.md) and [installation](docs/KURULUM_CPANEL.md) guidance.

```sh
npm ci
npm run typecheck
npm test
node scripts/check-locales.mjs
npm run build:php
```

Run checks relevant to your change using isolated synthetic data. Changed PHP behavior needs PHP/MySQL runtime verification; retained Next.js tests alone are insufficient. Never run destructive database scripts against a working installation. Preserve Turkish URLs and stable store identifiers. Exclude private storage, installation keys, logs, backups, browser profiles and `.env` files from submissions. State which checks you could not run.

For extensions, follow the [translation](docs/TRANSLATING.md), [theme](docs/THEME-DEVELOPMENT.md) and [module](docs/MODULE-DEVELOPMENT.md) guides. Update affected documentation and the feature ledger when behavior changes.

## Submit with GitHub or an assistant

Fork the real repository, clone your fork and create a topic branch from the agreed upstream base. Review changes, commit only intended paths and push the branch to your fork. In GitHub choose **Compare across forks**, the original repository and agreed base, then complete the PR template. [GitHub's fork PR guide](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request-from-a-fork).

Codex or Claude can help when the tool has GitHub access and the computer owner authorizes the reviewed commit, push and PR. Follow the end-of-task offer above; local coding or login alone does not establish that authorization. Without access, leave reviewed local changes and a PR description explaining what remains. Do not share a maintainer token or paste credentials into prompts.

For an already cloned fork and reviewed topic branch, GitHub CLI can submit explicitly. Replace placeholders, verify the remotes and base, and authenticate through the CLI's own login flow if needed:

```sh
WEXA_UPSTREAM_REPO='softwexa/wexashelf'
WEXA_GITHUB_LOGIN='YOUR_LOGIN'
WEXA_BASE_BRANCH='dev'
WEXA_TOPIC_BRANCH='codex/fix-short-description'
gh auth status
git remote -v
```

Confirm `origin` is your fork and `upstream` is the original repository, then fetch and verify the chosen upstream base. After authorizing and creating the focused commit:

```sh
git push -u origin "$WEXA_TOPIC_BRANCH"
mkdir -p artifacts/contribution
cp .github/PULL_REQUEST_TEMPLATE.md artifacts/contribution/pr-body.md
```

Edit that ignored file with the real problem, result, checks and limitations. Review it and confirm the target before running:

```sh
gh pr create --repo "$WEXA_UPSTREAM_REPO" --base "$WEXA_BASE_BRANCH" \
  --head "$WEXA_GITHUB_LOGIN:$WEXA_TOPIC_BRANCH" --draft \
  --title 'Describe the resulting behavior' \
  --body-file artifacts/contribution/pr-body.md
```

These instructions do not execute automatically. `--head` selects the already pushed branch; use the GitHub interface when your fork ownership is unsupported by this syntax. See the [CLI reference](https://cli.github.com/manual/gh_pr_create). Its `--dry-run` option is not a guarantee against pushing changes.

## Review and release

Explain the problem, resulting behavior and observed checks. Include minimal before/after evidence when useful, and relevant language, accessibility, SEO or hosting effects. Briefly describe AI assistance if used, without private conversations. Do not mark a check passed because an assistant suggested it.

Checks run locally by default: this kit adds no Actions workflow, hosted AI job or recurring paid automation. Maintainers preparing releases run `npm run package:php`, `npm run package:source` and `node scripts/test-release-package.mjs`. Packaging does not publish a release. `package.json` has `private: true` to prevent accidental npm publication, without changing the MIT license.
