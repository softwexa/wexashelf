# Maintainer GitHub setup

The public upstream is [softwexa/wexashelf](https://github.com/softwexa/wexashelf), maintained by [Softwexa](https://github.com/softwexa). `main` is the default stable line; incoming contributions target `dev`. This guide describes the maintainer policy and the settings to preserve. Check live GitHub settings when changing access or preparing a release; these files do not configure GitHub themselves.

## Establish the contribution target

1. Review the public source package and MIT/third-party notices. Publish intended source and documentation, excluding private state, credentials, artifacts and databases. Attach approved release ZIPs separately.
2. Keep `main` as the default for stable browsing; contributors explicitly choose `dev` as their PR base. Promote reviewed integration changes through a release PR.
3. Keep [CONTRIBUTING.md](../CONTRIBUTING.md) and repository metadata aligned with the real upstream. Verify a contributor can fork, read instructions and open a draft PR against `dev`.
4. [CODEOWNERS](../.github/CODEOWNERS) routes review to `@softwexa`, the repository owner. Add other reviewers only after confirming their accounts and repository access.

## Require human acceptance

Configure protection/rulesets for `main` and `dev`: require PRs and at least one eligible approving reviewer, dismiss stale approvals after changes, resolve review conversations, and restrict direct/force pushes and deletion as appropriate. Require code-owner review once ownership is configured. Keep bypass access deliberately limited and automatic merging disabled for this workflow. Verify available settings in the actual account/repository. [Protected branch documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

An author cannot provide their own independent approval. A sole maintainer needs another eligible reviewer for their own PRs under a required-review policy. The repository owner retains an administrative exception for initial publication and explicitly approved maintenance or release work; administrators are not included in branch-review enforcement. Ordinary contributions must still use a reviewed PR. Assistants may not invoke that exception without authorization for the specific action. Markdown instructions do not enforce review.

## Keep automation deliberate

GitHub Actions is disabled for the upstream, and this kit includes no workflow or hosted coding-agent integration. Start with local evidence and maintainer review. Do not require a named CI status before an authorized check exists; it could block PRs indefinitely. If automation is added later, scope permissions and spend, inspect fork execution behavior, and keep secrets out of untrusted contribution code.

Contributors use their own assistant and GitHub authentication. They push to a fork or explicitly permitted topic branch; upstream write permission and merge authority are separate. Community contributions do not need a shared maintainer token.

## Verify the AI contribution handoff

`AGENTS.md` is the shared contributor instruction; `CLAUDE.md` imports it and the Copilot adapter links to it. The documented end-of-task behavior is: implement and validate locally, prepare the exact diff and PR draft, inspect real Git/checkout/history/remotes/base/authentication, then offer publication to the computer owner. A specific approval authorizes only the named commit/push/PR scope. An existing matching approval is honored without another prompt. Git installation or GitHub login never substitutes for this decision.

Before announcing community contributions, use a disposable contributor fork to check that the actual upstream URL and integration branch are discoverable, the instructions render, and a contributor with approval can submit a draft PR to the intended base. Verify the PR destination and visibility with the contributor. Also verify that a missing upstream, missing `HEAD`, absent authentication or declined approval produces a local handoff rather than automatic publication. Do not create this external test PR without authorization.

These Markdown adapters are guidance, not a cross-tool enforcement system. An assistant must read and follow them; unsupported tools need the explicit task prompt in [AI-CONTRIBUTION.md](AI-CONTRIBUTION.md). Branch rules, repository permissions and maintainer review remain necessary. No updater, background contribution uploader or telemetry is installed by this workflow.

## Complete repository settings

- Enable Issues and verify the four issue templates and PR template render from the published branch.
- Keep GitHub private vulnerability reporting enabled and the reporting link in [SECURITY.md](../SECURITY.md) current.
- Define actual reviewers and release ownership. Promote reviewed `dev` changes through a release PR to `main`; target urgent fixes at `main` only when directed, then synchronize them back to `dev`.
- Publish release notes with artifact hashes, supported runtime and observed verification scope. A local Lighthouse score is not a guarantee for every host.

Repository visibility, branches, review rules and reporting settings must be verified through GitHub. An external contributor's fork-to-PR journey needs its own check; repository configuration alone is not evidence that this journey has been exercised.
