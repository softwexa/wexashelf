# AI-assisted contributions

You can use your preferred coding assistant or work manually. No particular model, paid service or external review provider is required by this guide. The contributor remains responsible for the code, evidence, licenses and statements submitted for review.

Start from the full source ZIP or a source checkout for code, theme and module work. The PHP hosting ZIP is the compiled deployment runtime with reference guides. Neither public archive includes local `artifacts/` receipts or private QA data; generate evidence in your own isolated environment.

Start with [AGENTS.md](../AGENTS.md) and [CONTRIBUTING.md](../CONTRIBUTING.md). Tool adapters point to repository instructions; this page explains the workflow rather than copying those rules. User authorization, the actual checkout and maintainer policy determine what actions are appropriate. Do not infer publication or merge permission from the availability of a tool.

## 1. Define a bounded change

Describe one user-visible problem, the desired behavior and acceptance conditions. Read the relevant [architecture](ARCHITECTURE.md), [feature boundaries](featured.md) and domain guide. Identify affected files and which existing data/behavior must remain stable. Resolve missing requirements before changing contracts or publication rules.

Inspect the current working tree and actual repository/branch configuration. Preserve unrelated edits. The upstream is [softwexa/wexashelf](https://github.com/softwexa/wexashelf); normal contributions target `dev`, as documented in [CONTRIBUTING.md](../CONTRIBUTING.md). Verify those values in your checkout rather than assuming remote names identify the correct repository. A contributor's fork and credentials do not grant upstream write or merge rights.

## 2. Implement and inspect

Give the assistant explicit file/module scope. Keep source changes focused and review the diff yourself. Prefer existing contracts and extension points; do not invent PHP plugin hooks, provider integrations or schemas that the application does not support.

For multilingual changes, distinguish UI/static packs from managed translations. Preserve stable identities and business facts. For AI features, retain explicit generation, review and publication boundaries. For server features, validate permissions and inputs in PHP; hiding a control in React is not authorization.

Use synthetic data and offline provider fixtures where applicable. Credentials, user catalogs and private backups should not be included in prompts, screenshots or submissions. Follow the [security policy](../SECURITY.md) for sensitive findings.

## 3. Run relevant checks

Use [TESTING.md](TESTING.md) to select source, PHP, browser and package checks that exercise the change. Ask the assistant to explain which runtime was tested, what data was synthetic, which checks were skipped and what remains unverified.

Do not accept “tests should pass” as a result. Preserve concise command output or a redacted evidence summary. Inspect generated assets when a build is relevant. An AI reviewer can help find issues; its opinion does not replace actual checks or a human maintainer's review.

## 4. Prepare a reviewable PR draft

Write a local PR draft with the problem, resulting behavior, scope and validation. Review the exact intended files and diff for secrets, accidental generated files, licensing and unrelated changes. Include newly created/untracked files in that review: an ordinary `git diff` does not show their contents. Keep the draft and any patch local until the publication decision below.

## 5. Offer the reviewed contribution to the computer owner

After completing the local work, check the following without changing repository history or publishing anything:

1. Is Git installed, and is the working directory actually inside the intended repository? Inspect its root, working tree, current branch and whether a `HEAD` commit exists. A source ZIP, missing repository or unborn branch requires a local handoff first; do not silently initialize a repository or stage every file.
2. Which real repositories do the remotes identify? Verify the maintainer's upstream, the existing approved base branch, the contributor's fork relationship or explicitly permitted topic destination, and the branch that would be pushed. Do not assume `origin` means upstream or `dev` exists. Treat credential-bearing remote URLs as private.
3. Is the selected tool authenticated with the intended contributor account and able to perform the proposed action? GitHub login does not grant upstream write or merge rights and is not consent to publish. Do not request or reuse a maintainer token.

When the target is known and the work is ready, ask the computer owner once to approve the **concrete** contribution: reviewed files/change, commit and push destination, topic branch, upstream repository/base, and draft PR visibility. Show the local PR title/body and actual checks first. Mention relevant external automation/costs if this submission would trigger them; do not enable CI as part of the offer. If the owner already explicitly authorized these exact steps and destination in the current task, continue without a duplicate question.

For example, after filling in verified values:

> The reviewed change updates [files/behavior]; [checks] passed and [limitations] remain. May I commit only this scope, push [topic branch] to [your verified fork], and open a draft PR against [verified upstream/base]? The code and PR will be visible to [the repository audience].

This instruction requires offering a ready contribution, not sending it automatically. If approval is declined or unanswered, retain the local work, patch/diff and PR draft. If Git, commit history, authentication or an upstream is missing, state the precise missing prerequisite and provide the prepared handoff; do not invent a destination or repeatedly ask for approval of an undefined action. Do not create background submission jobs, telemetry, automatic maintainer messages or application self-updates.

## 6. Submit the approved scope and report the result

When authorized and authenticated, use the maintainer's documented fork/topic-branch/PR flow. Review the staged paths before committing and the comparison with the verified upstream base before pushing; preserve unrelated work. Create only the agreed PR and verify its actual destination, base, head and returned URL. Report that URL if created; if any step fails, report the completed local/remote steps and exact blocker instead of claiming submission succeeded.

The maintainer reviews the change and decides whether to merge or release it. Do not enable automatic merging, publish packages, deploy a site, activate paid providers or disclose credentials as a side effect of preparing a contribution. Repository instruction files guide assistants that read them; permissions and branch rules enforce acceptance. Tools that do not automatically read these files need an explicit prompt to load them.

## Copyable task prompt

```text
Work on WexaShelf in this checkout.

Problem: [concrete user-visible issue]
Desired behavior: [expected result and acceptance conditions]
Scope: [files/modules you may change]
Constraints: [compatibility, data, locale or hosting requirements]

First read AGENTS.md, CONTRIBUTING.md, documents/ARCHITECTURE.md and
the domain guide relevant to this change. Inspect the actual repository
state and preserve unrelated edits. Briefly state the implementation
approach and acceptance checks before making the scoped change.

Implement the change using existing contracts. Use isolated synthetic
data for mutations and offline provider fixtures when appropriate.
Preserve stable record/store identities, facts, permissions and editorial
publication gates. Do not put secrets or private catalogs in artifacts.

Run the relevant commands from documents/TESTING.md. Report exact results,
skips, fixture boundaries and unresolved checks. Do not claim live provider,
hosting, CI, traffic or ranking verification from local tests.

Review the final diff and prepare a local PR description with:
- the problem and resulting behavior;
- affected contracts and migration/compatibility notes, if applicable;
- commands actually run and their results;
- remaining limitations requiring human review.

After the work and checks, follow the completion handoff in AGENTS.md and
documents/AI-CONTRIBUTION.md. Inspect Git availability, the actual checkout,
HEAD/branch, remotes, verified upstream/base and contributor authentication.
Do not invent a remote or branch. Review untracked files as well as the diff.

If the target and prerequisites are ready, show the concrete file scope,
PR title/body, validation and destination, then ask me once whether to
commit, push and open that draft PR. Honor any existing explicit approval
for the same scope and destination instead of asking again. If I decline,
do not answer, or prerequisites are missing, keep a local handoff and state
the exact next step. Do not send updates automatically or in the background.

No commit, push, PR publication, merge, release, deployment or paid provider
activation is authorized by this prompt alone.
```

Replace the scope and constraints before using the prompt. A separately authorized publication request can extend the task, but it should name the actual destination and still preserve human maintainer review.

## Optional prompt: authorize a draft PR

Use this after reviewing the change and filling in real repository values. It authorizes the named contribution steps once; it does not grant upstream merge rights.

```text
Publish the reviewed WexaShelf contribution as a draft PR.
Actual upstream repository: [owner/repository or repository URL]
My actual fork: [owner/repository or repository URL]
Existing upstream base branch: [maintainer-approved branch]
Topic branch on my fork: [branch name]
Approved files/changes: [explicit reviewed scope]
Reviewed PR title/body: [local draft or exact text]
Expected repository/PR audience: [public or verified private audience]

I authorize committing only this scope, pushing its topic branch to my
fork, and creating a draft PR to the named upstream/base after relevant
required checks pass. Preserve unrelated edits. Verify existing account
authentication, remote destinations, fork relationship and base branch
before acting; never print credentials. Follow CONTRIBUTING.md.

Do not request duplicate permission for these authorized steps. If access,
destinations or required checks are unavailable, retain a local PR draft
and state the exact blocker. Do not invent a remote or base branch.
No force-push, direct upstream push, merge, release, deployment or paid
CI activation is authorized. Report the real draft PR link if created;
human maintainer review is still required.
```

## Maintainer review

The maintainer should be able to understand the change without reading the AI conversation. Check the resulting behavior, authorization/data boundaries, translation and SEO effects, tests, licenses and any installation impact. Treat generated explanations as claims to verify. Merge and release decisions remain human decisions under the repository's contribution policy; a clean local run does not itself authorize them.
