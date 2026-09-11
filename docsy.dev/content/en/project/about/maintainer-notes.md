---
title: Maintainer notes
description: Release, dependency-update, and Hugo-support procedures
aliases: [contributing, ../contributing]
# prettier-ignore
cSpell:ignore: creatordate lycheecache prebuild ETARGET
---

For our main contributing page covering license agreements, code of conduct and
more, see [Contributing][]. This page is for **maintainers only**.

## Content placement

Keep project content DRY by writing each fact in the artifact whose purpose and
audience it serves. Each artifact links to the more detailed ones rather than
restating them:

- **[Changelog][]**: a lean record of _what changed_, for developers who want a
  quick overview. No upgrade advice, implementation detail, or background.
  Entries link to the release report for details and cite a change's key issues;
  PRs only when there is no key issue, such as for contributor credit.
  Maintainer-facing changes get a short **For maintainers** list at the end of
  the release section.
- **Release and upgrade blog posts**: what's new, what to watch out for, and
  actionable upgrade guidance (the historical narrative). Link to the site docs
  for current behavior and reference detail. Don't enumerate PRs and issues;
  link an open tracker only where it adds follow-up context. Upgrades are a
  chore, so keep posts maximally actionable yet lean: the release summary reads
  like a selective table of contents (a link per section with a clause of
  guiding glue) and each fact appears in one section, its home. Each post
  targets upgraders coming from the release just before it; a post that assumes
  otherwise says so. Maintainer-facing changes are summarized in a **For
  maintainers** section at the end of the documented changes.
- **Site docs** (`docs/`): Docsy _as it is now_. Minimal historical references
  or links to issues and PRs.
- **[Release notes][] and [milestones][]**: exhaustive records. Generated
  release notes list every PR, PRs link their motivating issues, and the release
  milestone gathers the issues resolved. The release notes lead with links to
  the changelog entry and the release post. Authored artifacts link to these
  rather than reproducing the enumeration.
- **Project docs** (`project/`): architecture, design decisions, and quality-net
  rationale, for maintainers and contributors. Architecture material lands here,
  not in code comments; a comment keeps a purpose line and links its page.
- **Test and code comments**: local implementation rationale and regression
  background.

**Version values** follow the same ownership rule. An evergreen doc that cites a
pinned or supported version reads it from the pin's source of truth: a config
param (for example, `params.mermaid.version`), or a repo manifest surfaced
through a data mount and shortcode (`sass-embedded-version` reads the root
`package.json` pin), so the page can't drift from the pin. A dated post freezes
its release-specific versions as page front-matter params, and delegates install
and override mechanics to the docs instead of restating commands.

## PR descriptions

Generally speaking, a PR opening comment should be a Markdown list that explains
the “why” behind the changes, and at a very high level what was changed. Start
each item with a verb in the present tense, 3rd person singular.

PR authors are _encouraged_ to flag the **scope of changes** when a PR touches
Docsy's [public customization surface][public] (especially for [breaking
changes][breaking change]) to help reviewers and release-time audits. For
example:

```markdown
- Scope: breaking (removal), user-facing (new)
```

Suggested scope labels (use one or more):

- **breaking**, **user-facing**, **internal-only**, **docs-only**.

Optionally qualify with **kinds** in parentheses, mapping to release-blog and
changelog sections: **new**, **change**, **fix**, **removal**, **deprecation**.

The release-time audit (see [Release-prep audit](#release-prep-audit)) is the
source of truth for what gets documented; PR-level scope labels are a hint, not
a substitute.

## Hugo versions

The repo tracks two distinct Hugo versions, as documented below. Their
declarations, synchronization requirements, and relative-version constraints are
guarded by the [toolchain-versions test](#test-suites).

Only current-state pages (docs and the changelog's
[official support](/project/about/changelog/#official-support) section) render
these versions live, via the `hugoMinVersion` site param and the `hugo-version`
shortcode. Blog posts are historical snapshots and render versions
time-insensitively: a post that renders one of these version params freezes it
in its front matter, so updating the post (say, for a patch release) means
editing one field. (Version literals in narrative text are already
time-insensitive.) Page params take precedence over site params, so the same
`{{%/* param hugoMinVersion */%}}` call is frozen in a post and live in docs.
Guarded by the [toolchain-versions test](#test-suites).

### Minimum Hugo version

Docsy declares the minimum Hugo version required to support the features that
Docsy provides and to cover important security fixes.

This version is declared in three places that must agree:

- [theme/hugo.yaml][] `module.hugoVersion.min` (canonical source)
- [theme/theme.toml][] `min_version`
- [docsy.dev/config/_default/hugo.yaml][] `params.hugoMinVersion`, which feeds
  the requirement statements in user-facing docs (via
  `{{%/* param hugoMinVersion */%}}`) and, through the `&hugoMinVersion` anchor,
  docsy.dev's own `module.hugoVersion.min`.

`theme.toml` is Hugo's legacy theme descriptor: its `min_version` is read only
as a fallback when the module config sets none, and the file's sole remaining
external consumer is the [themes showcase][], which ingests it from the theme's
git repo. Hence the npm package omits it ([theme/package.json][] `files`).

Raising the minimum is a breaking change for theme users, only done to support
new features or security fixes. To validate that a Docsy site actually builds
with Hugo pinned to the declared minimum, run [test:smoke](#test-suites).

### Officially supported Hugo version {#official-hugo-version}

The Hugo version that Docsy [officially supports][] is pinned as the
`hugo-extended` dev dependency in the root [package.json][].

This version is generally kept in sync with the latest Hugo release. Updating it
is a two-step flow, run from the repo root:

1. Review the target [hugo-extended][] release (usually the newest), then run
   `npm run update:hugo -- X.Y.Z`: bumps the pin script-free (the exact,
   reviewed **stable** version only).
2. Run `npm run approve:hugo`: syncs the tree to the lock (script-free),
   approves the new version's install script, re-runs the supply-chain audit --
   which flags any root-`overrides` drift the bump caused (npm applies overrides
   only while re-resolving) **before** the newly approved installer executes --
   then rebuilds the package so the `hugo` binary lands. The approval gates the
   install script only (the hugo binary self-installs at first use), so don't
   run builds between the two steps. Script-enabled installs, CI's
   `install:safe` included, fail until the new version is approved.

Automated version updates don't bump hugo-extended: the
[Renovate config](#dependency-updates) disables them. Security updates (Renovate
vulnerability alerts, GitHub's config-free Dependabot) can still bump it; such a
PR fails CI until the bump is approved (step 2 above).

Docs render this version live through the `hugo-version` shortcode
(`hugo.Version`): docsy.dev builds always run the pinned Hugo.

### Default script-dependency versions {#script-versions}

The versions of the script dependencies that Docsy loads from CDNs by default
are pinned in `theme/hugo.yaml`, in one of two shapes:

- `params.`_`PACKAGE`_`.version` for `mermaid`, `katex`, and `redoc`
- the plugin entry's `version` for `markmap`
  (`params.docsy.plugins.markmap.version`)

The templates and the [user guide][diagrams] read them live, so bumping the one
yaml value per dependency during the [release-prep audit](#release-prep-audit)
is enough; the [script-version-pins test](#test-suites) checks exact pins and
their template reads. Renovate proposes routine bumps (see
[Dependency updates](#dependency-updates)), subject to a minimum release age.
For each bump:

- Check the [npm registry][npm-registry] and [OSV][] for advisories affecting
  the target version.
- Verify that a page using the dependency (the diagrams and formulae page, for
  example) renders with the new pin.

Two dependencies need more than the version line:

- `katex`: the pinned assets style markup generated by Hugo's embedded KaTeX
  engine, so check the KaTeX version that the
  [transform.ToMath docs](https://gohugo.io/functions/transform/tomath/) pair
  with the current Hugo, and verify a math-bearing page renders cleanly.
- `redoc` 3.x: Redoc 3 moves the CDN script from `bundles/redoc.standalone.js`
  to `bundle/redoc.js`, so when Renovate proposes 3.x, the `redoc` shortcode's
  URL change is part of that review.

An emergency security bump (an advisory landing between releases) is a manual
edit to the same line, made directly on a `release` branch and shipped through
the existing patch-release flow (`vX.Y.Z` + `theme/vX.Y.Z` tags), not the next
regular release; it explicitly bypasses Renovate's minimum release-age gate.

<!-- prettier-ignore-start -->
[npm-registry]: https://registry.npmjs.org
[diagrams]: /docs/content/diagrams-and-formulae/
<!-- prettier-ignore-end -->

## Dependency updates

Automated updates are configured through Renovate. Settings rationale:

- `ignorePresets`: the preset's 3-day npm cooldown would override this repo's
  7-day `minimumReleaseAge`. Caution: this exclusion silently stops working if
  the preset is renamed upstream. The preset's age exemptions for update types
  without release timestamps (pin, replacement, rollback) are deliberately not
  restored: such PRs never satisfy the age check and need manual age validation
  at review.
- `lockFileMaintenance` off: wholesale lock re-resolves would churn the
  committed lockfiles; transitive security fixes arrive alert-driven instead.
- Package rules:
  - Patch and minor updates are each grouped into a single PR per wave, to cut
    review overhead; majors stay individual for one-by-one scrutiny, except
    families that Renovate's presets keep in lockstep (for example, the GitHub
    artifact actions).
  - `hugo-extended` updates are [carefully chosen](#official-hugo-version) at
    Docsy release time.
  - Bootstrap and Font Awesome are updated deliberately via
    `npm run update:theme-dep -- PKG X.Y.Z` (declared dependencies only, exact
    stable versions; the chain restores `theme/node_modules`, which a
    workspace-targeted install prunes, and ends with the ScrollSpy-patch
    reminder).
  - The custom manager updates the [script-dependency pins](#script-versions) in
    `theme/hugo.yaml`. All other detected managers are active, including npm and
    GitHub Actions (SHA-digest pins).

The Node toolchain is pinned by two `.nvmrc` files holding the same version, a
platform constraint: workflows and nvm read the root file, while Netlify reads
only its base directory's (`docsy.dev/.nvmrc`), with no root fallback. The
toolchain-versions test guards the sync.

The npm config follows the same two-homes pattern: `theme/.npmrc` is a
byte-identical mirror of the root `.npmrc`, because `--prefix`/`-C` npm runs
(`install:theme-deps`, `_sync:theme-lock`) read only the target directory's
file. Edit the two together; the supply-chain audit guards the sync.

Renovate's vulnerability-alert PRs stay on, beside GitHub's config-free
Dependabot security updates; a rare duplicate PR is accepted. Renovate's alert
PRs bypass its own cooldown but not npm's: lock regeneration for a fix younger
than `min-release-age` (`.npmrc`) fails with `ETARGET` until the release ages.
For a fix that can't wait, run the dependency's manual bump under a
per-invocation `NPM_CONFIG_MIN_RELEASE_AGE` override, set no lower than the
fix's age requires (the override relaxes the cooldown for everything the
invocation resolves). For example, for a three-day-old hugo-extended release:

```sh
NPM_CONFIG_MIN_RELEASE_AGE=3 npm run update:hugo -- X.Y.Z
```

## Test suites

From the repo root:

| Script         | Role                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `test:repo`    | Fast, offline repo checks. For details, see [`package.json`][package.json]                     |
| `test:smoke`   | Builds minimal test sites from the theme package and from GitHub; see [test:smoke](#testsmoke) |
| `test:website` | Full docsy.dev checks: format, links, hugo-build, alt-site, md-output, and favicon tests       |

Notes:

- All but `test:smoke` run in CI.
- To run one `test:repo` suite alone, pass its file(s) to `node --test`, e.g.
  `node --test tests/supply-chain-audit.test.mjs`.

### test:smoke

Run `test:smoke` locally for `main` or PR-branch validation. Its GitHub-sourced
builds auto-target the current branch's GitHub upstream.

- Slow, network-bound
- Builds a minimal test site from:
  - Theme package: packed tarball, npm registry
  - GitHub: NPM, Hugo module, clone
- Builds with the pinned Hugo; the Hugo-module site also with the declared
  minimum Hugo version

Security:

- The npm-registry install test vets an exact version: the checkout's, when its
  release tag is in the checkout's history, otherwise `latest`'s resolution;
  asserting the installed version against the npm registry's own resolution.
- `DOCSY_THEME_PKG` overrides the target: exact version or dist-tag; a
  non-`-dev` prerelease checkout (an RC, for example) requires it.
- The suite never relaxes local npm hardening on its own. When local hardening
  blocks a run:
  - A local install guard's block names its own override; follow it to allow the
    run.
  - For a release-age gate on a fresh Docsy theme package: set
    `DOCSY_THEME_MIN_RELEASE_AGE=N`, N = the release age in whole days (0 on
    release day; higher still blocks, lower over-relaxes), to relax the cooldown
    for the theme-package install commands only: the theme and the dependencies
    those installs resolve; nothing else in the run.
  - Any other pinned scratch dependency younger than a local age gate fails its
    leg until the pin ages (npm's error names the date cutoff).
  - The make-site scratch sites carry their own baked consumer-simulation
    `.npmrc` (7-day gate), which can differ from your machine's settings.

### Structural guards: one concern per file

`test:repo` includes structural guard files, each owning a single concern. Add a
new invariant to the file that owns its concern, or start a new file; never give
an invariant a second home. Each file's header comment carries its scope and
rationale; this table only routes:

| Guard                               | Owns                                                                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `tests/supply-chain-audit.test.mjs` | Install and provenance invariants from committed artifacts: locks, `allowScripts`, `.npmrc`, install scripts, engines, CI installs |
| `tests/npm-scripts.test.mjs`        | npm script-name posture: lifecycle and hook-shaped script names stay out of every manifest, beyond the pinned reviewed exceptions  |
| `tests/npm-audit.test.mjs`          | Online advisory gate over the committed locks                                                                                      |
| `tests/runner-lint.test.mjs`        | Package-runner discipline: bare `npx`/`npm exec` and alternate-runner denial (a lint, not a boundary)                              |
| `tests/workflow-lint.test.mjs`      | Check-execution integrity of the workflows: they run the checks they claim to                                                      |
| `tests/test-wiring.test.mjs`        | Suite wiring: every suite glob resolves to test files, so a rename can't empty a suite silently                                    |
| `scripts/suite-anchor.test.mjs`     | Cross-root anchor: the tests-root guards stay wired into `test:repo`                                                               |

### Golden tests

The md-output and favicon tests compare built output against committed golden
files. When a golden test reports intended drift, run `npm run update:goldens`
to rebuild the site and refresh both suites' goldens, then review the diff and
commit it.

### Sass deprecation warnings

Hugo builds silence all dependency deprecation warnings
(`theme/layouts/_partials/head-css.html`), and under Hugo's importer everything
but the entry stub is a dependency: Docsy's tree, vendored Bootstrap and Font
Awesome, and a site's own project Sass are all silenced. A quiet build log
therefore does not mean the sources are deprecation-clean. Two probes guard
Docsy's theme sources:

- `docsy.dev/tests/hugo-build/no-deprecations.test.mjs`: the real site build
  stays free of deprecation notices (Hugo API deprecations, and any deprecation
  warning that escapes the silencing).
- `tests/sass-deprecations.test.mjs`: Docsy's own Sass stays clean, via a direct
  dart-sass compile that build-level silencing can't blind. Import-class
  warnings are tolerated until the `@use` refactor ([#2732][]).

## Link checking and the link cache

`test:website` checks docsy.dev's links with Lychee, caching external-link
results in the committed `docsy.dev/link-cache.jsonc` (the "link cache", née
refcache) so checks stay fast and offline-friendly. Each entry records the
result, its `when` timestamp, and `via` (the resolver that set it); Lychee's own
`.lycheecache` is derived from it per run and gitignored. Config lives in
`docsy.dev/lychee.toml`. CI installs a pinned lychee binary (see
`.github/workflows/test.yaml` and `link-cache-refresh.yaml`); a plain site build
doesn't need it. A weekly workflow re-verifies the oldest entries; for the
rotation model, see the `link-cache-refresh` workflow's header comment.

- **Refresh** after adding or changing external links: `npm run fix:link-cache`
  re-runs the check, adding any missing entries and renormalizing; then commit
  the updated `link-cache.jsonc`.
- **Inspect or prune** with `npm run link-cache` (`-- -s` for a summary,
  `-- -p 10%` to drop the oldest tenth, `-- -m REGEX` to scope by URL).
- **Seed** a URL that only goes live later (such as release-tag links during
  release prep) by adding an entry with placeholder result `206`,
  `"via": "manual"`, an `"expires"` date (exclusive: `2026-10-01` holds the seed
  through September 30), and a `//` comment noting the reason. Expired seeds are
  pruned by the weekly refresh and re-verified live ([link-cache README][]);
  drop an entry early only to force a re-check.

Both scripts work from the repo root or `docsy.dev/`.

## Release-prep audit

Before drafting the changelog entry and release blog post, run a careful audit
of every PR and raw commit in the release range so nothing user-visible slips
through.

For each PR/commit in `git log v<prev>..main`:

1. Inspect the actual diff (not just the title or PR description). Use
   `gh pr view <num>` and `git show <sha>` as needed.
2. Classify the change: **breaking**, **user-facing**, **internal-only**, or
   **docs-only** (see definitions in [Public customization surface][public] and
   [Breaking change][breaking change]).
3. For every **breaking** or **user-facing** item, verify it appears in **both**
   the [changelog][] and the release blog post, with cross-links to the relevant
   user-guide sections where applicable.
4. Be especially alert to: new/renamed params, partials, shortcodes, layouts,
   CSS classes, i18n keys, default-behavior shifts, and changes to the version
   menu, navigation, or other rendered output.

Also check pinned script dependencies for drift: bump the
[default script-dependency versions](#script-versions) to the latest stable as
part of the prep PR.

Capture the audit as a working document and summarize its findings (the
classifications and where each item is covered) in the release-prep PR
description, so reviewers can sanity-check them.

## Publishing a release

These notes are WIP for creating a **release** from a local copy of the repo.
These instructions assume the release is:

- **{{% dev-version final %}}**

If not adjust accordingly.

> [!IMPORTANT]
>
> Before creating a release, do a [release-prep audit](#release-prep-audit) and
> use it to drive the changelog and release-blog updates in the next two steps.

<!-- markdownlint-disable-next-line no-blanks-blockquote -->

> [!TIP]
>
> A release run can span sessions and days. Consider keeping a running copy of
> the numbered steps below as a checklist in your own notes, ticking steps as
> they complete and marking who each pending step is waiting on.

1.  **Change directory** to your local Docsy repo.
    - Expecting final adjustments as you prepare for the release? Create a
      branch to work from. For example:

      ```sh
      git checkout -b release-{{% dev-version final %}}-prep
      # Or you have a local create-branch alias:
      gcb release-{{% dev-version final %}}-prep
      ```

    - Serve the site and continue working through these steps from the served
      version of these notes.

2.  **Create or update a [changelog][] entry** for {{% dev-version final %}}.
    - This step is driven by the [release-prep audit](#release-prep-audit).
    - The section should provide a brief summary of breaking changes using the
      section template at the end of the file.
    - Ensure to remove the UNRELEASED note, if still present.
    - You'll create a new section for the next release in a later step.

3.  **Update the release report blog post** for {{% dev-version final %}}, if
    any.
    - Remove draft status.
    - Set `date` (or `lastmod` if already published) to today's date.

4.  Run `npm run fix`.

5.  **Update Docsy version** to {{% dev-version final %}} using the following
    from a (bash or zsh) terminal.
    - First set the `VERSION` variable; we use it throughout the steps below.

      ```sh
      VERSION={{% dev-version final %}}
      ```

    - Then run the `set:version` script.

      Docsy is probably already at `{{% dev-version final %}}-dev`, so you can
      run:

      ```sh
      npm run set:version
      ```

      Otherwise, set the version explicitly:

      ```sh
      npm run set:version -- --version $VERSION
      ```

      Both forms update the `version` related fields in [package.json][] and
      [docsy.dev/config][] files.

6.  <a id="ci-test-step">Run `npm run test:full`</a>, which ensures, among other
    things, that vendor assets and [go.mod][] dependencies are up-to-date.

7.  **Submit a PR with your changes**.
    - Set the `BASE` variable to the target branch: `main` if this is a stable
      release, and `release` for patch releases.

      ```sh
      BASE=main # or release for patch releases
      ```

    - Commit any changes accumulated from the previous steps using this title:

      ```text
      Release {{% param tdVersion.latest %}} preparation
      ```

    - Create a PR using the following command that will open a PR-creation page
      in your browser:

      ```sh
      gh pr create --web --title "Release $VERSION preparation" \
        --base $BASE \
        --body "- Contributes to #<ADD-RELEASE-PREP-ISSUE-HERE>"
      ```

    - Use the web interface to fill in the PR details.
    - Submit the PR.

8.  **Test the PR branch**:
    - **Run-edit-cycle**, after each run sub-step below:
      - Push any adjustments to the PR.
      - Restart this step 8 from the top, if justified.
    - Run the [smoke tests](#test-suites), which auto-target the PR branch
      pushed in the previous step and include a build at the
      [minimum Hugo version](#minimum-hugo-version):

      ```sh
      npm run test:smoke
      ```

    - **Test consumer sites**: run the
      [consumer-site test procedure](#consumer-site-test) over its validation
      schedule's pre-release site(s); the schedule assigns the other install
      modes their own later validation points.

9.  **Get PR approved and merged**.

10. **Pull the PR** to get the last changes.

11. **Post-merge check from consumer sites.** In each worktree from step 8,
    update the site's Docsy pin from the PR branch tip to merged `main`, then:
    - Build and confirm zero warnings; re-run the site's sanity checks.
    - Re-run the full [test procedure](#consumer-site-test) only if the merge
      involved a non-trivial conflict or rebase.

12. **Ensure** that you're:
    - On the target `$BASE` branch
    - At the commit that you want to tag as {{% param tdVersion.latest %}}

13. **Create the new tag** for {{% param tdVersion.latest %}}.
    - Set the REL variable to the release version or use the `VERSION` variable
      if you set it in the previous step.

      ```sh
      REL=${VERSION:-{{% param tdVersion.latest %}}}
      REL=v${REL#v} # tags are v-prefixed; normalize to exactly one leading v
      echo "REL=$REL"
      ```

    - Create the new tag.

      ```sh
      git tag $REL
      ```

    - Also create the nested **theme module tag**. Since the theme moved under
      `theme/`, it is its own Go module ([github.com/google/docsy/theme][]), and
      Go resolves it via a subdirectory-prefixed tag. This is what consuming
      sites get when they import `…/docsy/theme`:

      ```sh
      git tag theme/$REL
      ```

    - Double check:

      ```sh
      git tag --sort=-creatordate | head -3
      ```

14. **Push the new tags** (the release tag `$REL` and the theme module tag
    `theme/$REL`): either to all remotes at once, or one at a time.

    <details>
    <summary class="h6 text-info">Push to all remotes</summary>

    <!-- Prevent Prettier from gluing the list to this HTML hunk -->
    - List the remotes so you know what you'll be pushing to:

      ```sh
      git remote
      ```

    - Check that the `push-all-remotes` alias is defined, and if not, define it:

      ```sh
      git config --global --list | grep alias.push-all-remotes
      ```

      <details>
      <summary class="h6 text-primary">Define a `push-all-remotes` alias</summary>

      First check if the `push-all-remotes` alias is already defined:

      ```sh
      git config --global --list | grep alias.push-all-remotes
      ```

      If not, define the alias:

      ```sh
      git config --global alias.push-all-remotes \
        '!f() { for r in $(git remote); do (set -x; git push "$r" "$1"); done; }; f'
      ```

      > [!NOTE]
      >
      > You only need to define the alias once. Omit `--global` from the command
      > above to make the alias available only in the current repository rather
      > than all repositories.

      </details>

    - Push the tags to the remotes (the release tag, then the theme module tag):

      ```console
      $ git push-all-remotes $REL
      + git push origin {{% param tdVersion.latest %}}
      * [new tag]         {{% param tdVersion.latest %}} -> {{% param tdVersion.latest %}}
      + git push upstream {{% param tdVersion.latest %}}
      * [new tag]         {{% param tdVersion.latest %}} -> {{% param tdVersion.latest %}}
      ...
      $ git push-all-remotes theme/$REL
      ...
      ```

    - Sanity check over `upstream` for example:

      ```sh
      git ls-remote --tags upstream | grep $REL
      ```

    </details>

    <details>
    <summary class="h6">Push to a single remote</summary>

    <!-- Prevent Prettier from gluing the list to this HTML hunk -->
    - Push to a single remote at a time, such as `upstream`:

    ```sh
    git push upstream $REL
    git push upstream theme/$REL
    ```

    - Sanity check over `upstream` for example:

      ```sh
      git ls-remote --tags upstream | grep $REL
      ```

    </details>

15. **Verify the npm publish**. Pushing the release tag to `upstream` triggers
    the [publish workflow][], which publishes `@docsy/theme` from the tagged
    commit through npm [trusted publishing][] (OIDC; no npm token involved) once
    a maintainer approves the run (the `npm-publish` environment). The workflow
    only publishes tags on `main`'s history: a patch release tagged on the
    `release` branch needs the workflow's ancestry check deliberately widened
    first.

    When copying this procedure into a release-run tracker, give each substep
    its own checkbox.

    1. **Approve** the waiting `npm-publish` deployment. The guards re-verify
       content and npm-registry order mechanically (an out-of-order or
       inconsistent run fails instead of publishing), and the approval prompt
       only appears after the pack job succeeded, so approval owns **intent**.
       Note that on tag pushes the workflow definition itself comes from the
       tagged commit, so for an unexpected tag don't trust the run's green
       checks; the two checks below are the real barrier:
       - the run's commit is the release commit you drove (the tip of `$BASE` at
         tag time; an unrelated merge landing since is fine), and the tag actor
         is the release driver you expect; anything else: reject and ask;
       - the run is `publish.yaml` on `google/docsy` (another workflow could
         reference the same environment).

    2. **Check** that the workflow run succeeded and that the npm-registry
       version matches the tag:

       ```sh
       npm view @docsy/theme version dist-tags
       ```

    3. **Re-point the `next` dist-tag** at the new stable (dist-tags never move
       on their own, and `next` must stay `>= latest`). OIDC covers only the
       publish itself, so run this inside a narrow auth window (login/logout,
       manual-publish note below), then re-verify the dist-tags:

       ```sh
       npm dist-tag add @docsy/theme@${REL#v} next
       ```

    4. **Vet the published artifact**: run the [smoke tests](#test-suites) from
       `$BASE`; the npm-registry install test vets exactly the just-published
       version. (On a machine with local npm hardening, the first run fails by
       design; rerun as the failure directs.)

       ```sh
       npm run test:smoke
       ```

    Exceptions to the CI flow:

    - **Manual publishes** (prereleases only): the workflow triggers only on
      stable `vX.Y.Z` tags, so prereleases always publish manually. Publish from
      `theme/` inside a narrow auth window: run `npm login` right before and
      `npm logout` right after, whether or not publishing succeeded; if logout
      fails, revoke the access token from your npm account settings:

      ```sh
      npm publish --ignore-scripts=false --tag next
      ```

      `--ignore-scripts=false` is required: the theme `prepack` must run (it
      materializes the LICENSE), even under a script-disabling npm config. Run
      manual npm commands from within the repo: the root `.npmrc` pins the
      `@docsy` scope registry against local overrides.

      Vet a prerelease publish explicitly, before restoring the dev version
      stamp (while the prerelease version is still in `theme/package.json`, the
      npm-registry install test refuses other targets, a bare run's `latest`
      included), and confirm the run's "expecting" line names the prerelease you
      just published:

      ```sh
      DOCSY_THEME_PKG=@docsy/theme@next npm run test:smoke
      ```

    - **If the CI publish is broken for a stable**, prefer fixing CI over a
      laptop publish: a manual publish carries no provenance attestation. As a
      deliberate exception, mirror the workflow's release choices exactly:

      ```sh
      npm publish --ignore-scripts=false --access public --tag latest
      ```

16. Update the [deploy/prod][] branch from `$BASE`.

    For stable releases from `main`, use:

    ```sh
    git checkout deploy/prod
    git merge --ff-only main
    git push-all-remotes deploy/prod
    ```

    For patch releases from `release`, selectively merge from `release`.

    The branch update will trigger a production deploy of the website.

17. Wait for the production deploy to complete and check that [docsy.dev][] has
    been updated to the new release.

18. **[Draft a new release][]** using GitHub web; fill in the fields as follows:
    - Visit [tags][] to find the new release tag {{% param tdVersion.latest %}}.

    - Select Create a new release from the {{% param tdVersion.latest %}} tag
      dropdown menu

    - **Release title**: use the release version.

      ```text
      {{% param tdVersion.latest %}}
      ```

    - Click **Generate release notes** to get the release details inserted into
      the release notes text area.

    - Add the following text atop the generated release notes:

      ```markdown
      {{% release-summary %}}
      ```

    - Select **Create a discussion for this release**.

19. **Publish the release**: click _Publish release_.

20. Test the release with a downstream project and/or the [docsy-example][]
    site.

21. If you find issues, determine whether they need to be fixed immediately. If
    so, get fixes submitted, reviewed and approved. Go back to step 1 to publish
    a dot release.

22. **Update the `release` branch** once the release is final.

    For a stable release, fast-forward `release` to the final release commit
    from `main`:

    ```sh
    git checkout release
    git merge --ff-only main
    git push-all-remotes release
    ```

    For patch releases, the release-prep PR should already target `release`, so
    there is no separate `main` to `release` fast-forward.

23. Update the [doc-rooted][] branch from [deploy/prod][]:

    ```sh
    git checkout doc-rooted
    git merge --ff-only deploy/prod
    npm run doc-rooted -- build
    # Optionally take a look at the preview
    npm run doc-rooted -- serve
    curl http://localhost:1313/index.md
    # Push the changes
    git push-all-remotes doc-rooted
    ```

    If the fast-forward merge fails, stop and reconcile the branch history. Once
    pushed, wait for the Netlify deploy and check the doc-rooted preview.

24. Update, create, or close GitHub milestones as appropriate.

If all is well, release the Docsy example as detailed next.

## Docsy example release

The steps you follow are similar to the ones above for the Docsy release, but
with the following modifications:

1.  **Update the version** of the example to {{% param version %}}:

    ```sh
    VERSION={{% param version %}}
    npm run set:version:example -- --version $VERSION
    ```

2.  Perform [step 6](#ci-test-step) onwards as above to test, create a PR,
    create a release and publish it with one difference:
    - Once the deploy/prod branch has been updated, wait for the production
      deploy to complete and check that [example.docsy.dev][] has been updated
      to the new release.
    - To create a new release draft, visit [Docsy-example release draft][].

3.  **Verify the [Examples page][]** Starter-templates table shows
    {{% dev-version final %}}: its Docsy cells render the site's
    `tdVersion.latest`, which the Docsy release advanced.

[Docsy-example release draft]:
  https://github.com/google/docsy-example/releases/new
[example.docsy.dev]: https://example.docsy.dev

## Post Docsy-release followup

Assuming that both the Docsy and Docsy-example releases {{% param version %}}
have been successfully deployed, and that at least one other project has been
successfully tested with the new release, then perform the following actions
before any further changes are merged into the `main` branch:

1. Update the package version to the next dev version for Docsy and
   Docsy-example (Docsy's build IDs are stamped at pack time, not committed;
   Docsy-example still commits a git-info dev version):

   ```console
   $ npm run -s set:version -- --version 0.14.4-dev
   ✓ Updated docsy.dev/config/_default/params.yaml dev: v0.14.3 → v0.14.4-dev
   ...
   $ npm run -s set:version:example:git-info
   ...
   ```

2. **Retire temporary measures** that the shipped release makes obsolete,
   verifying checks as you go.

   - Remove any temporary ignore rules from `docsy.dev/lychee.toml` and confirm
     that the link check passes.
   - Search for other release-scoped markers and act on those now that the
     release is shipped, for example:

     ```sh
     git grep -En 'Remove after|TODO\(0\.' -- ':(exclude)*public*'
     ```

   - Leave markers naming a later release in place.

3. In the [Changelog][]:
   - **Create a new entry** for the next release by copying the ENTRY TEMPLATE
     at the end of the file.

   - **Fix the new release URL**, which ends with `latest?FIXME=...`, so that it
     refers to the actual release, now that it exists.

4. **Create a draft release report post** for the next release
   (`docsy.dev/content/en/blog/YYYY/X.Y.Z.md`, `draft: true`), modeled on the
   shipped release's post. Like the changelog's new entry, the draft gives
   next-cycle changes a single home to land on.

5. **Submit a PR with your changes**, using a title like:

   ```text
   Set version to {{% param version %}}
   ```

6. **Get PR approved and merged**.

7. **Validate the published release from [docsy-starter][]** (npm package mode),
   per the [consumer-site test procedure](#consumer-site-test), and follow with
   the starter's own Docsy-update PR. Post-tag; doesn't block `main`.

## Consumer-site test procedure {#consumer-site-test}

**Validation schedule** — each install mode has a known consumer that validates
the release at its natural point in the cycle:

- **Pre-release**, on the release-PR branch
  ([Publishing a release](#publishing-a-release), step 8): [opentelemetry.io][]
  or another large production **git submodule** site.
- **At the [Docsy example release](#docsy-example-release)**: [docsy-example][],
  the **Hugo module** template.
- **Post-tag**, against the published release
  ([post-release followup](#post-docsy-release-followup)): [docsy-starter][],
  the **npm package** mode.

Track run outcomes in the release-prep audit's working doc; report guide gaps as
feedback on the release post (step 3 below doubles as its dry run).

To test a Docsy branch or release from a consumer site, for each site:

1. **Create a dedicated worktree + branch** off the site's default branch; keep
   it for the site's post-release Docsy-update PR.
2. **Point the site at the target Docsy commit**, per install mode:
   - Hugo module: map the theme module to the local checkout (env-only, no repo
     edits):

     ```sh
     export HUGO_MODULE_REPLACEMENTS="github.com/google/docsy/theme -> DOCSY_CHECKOUT_PATH/theme"
     ```

   - npm package: `npm install -D file:DOCSY_CHECKOUT_PATH` for sites that npm
     install from GitHub (`google/docsy`); append `/theme` for sites that use
     the registry package (`@docsy/theme`).
   - Git submodule:

     ```sh
     cd themes/docsy
     git fetch FORK BRANCH-NAME
     git checkout FETCH_HEAD
     cd ../.. && git add themes/docsy # stage so prebuild targets this SHA
     ```

3. **Apply the release post's upgrade actions**, all of them, before the first
   build: check every applies-if guard against the site, including the companion
   Hugo guide's actions when the release raises the Hugo minimum. This doubles
   as a dry run of the post; report any gap or inaccuracy as feedback on it.
   - For Hugo-module sites, confirm that the replacement is live once the import
     path targets the theme module:

     ```sh
     hugo mod graph | grep 'github.com/google/docsy/theme'
     ```

4. **Build**: confirm zero errors and warnings.
5. **Run the site's test suite**:
   - Run `npm test` or the site's canonical test script.
   - Confirm that all checks pass.
   - Run the release post's sanity checks.
6. **Spot-check key pages and output files**, in the build output or a served
   preview:
   - Confirm each **page** renders with intact chrome, styles, and favicons:
     - Home page: also confirm that the `generator` meta element reports the
       expected Hugo version (Docsy's version isn't included)
     - Docs landing page, and a random docs page
     - Blog landing page and a random blog post, when the site has a blog
     - Some other random page
     - The 404 page
   - Confirm the other **output files** look sane:
     - The main CSS and JS files
     - When the site enables LLMS support: `llms.txt`, and the `.md` output of
       the pages above
     - `_redirects`, when present
     - `sitemap.xml`: note that some sites normalize it after the build
7. **A/B diff the generated site**:
   - If the site's `public/` folder is a git repository (a setup worth adopting;
     see docsy.dev's `make:public` npm script), build at the current
     (pre-update) pin and commit the output as the baseline. `git diff` then
     reports the changes directly. Do not remove `public/` if it's a symlink to
     a different directory.
   - Otherwise, build at the current pin, set `public/` aside as a baseline
     directory, rebuild at the new pin, and diff, for example:

     ```sh
     diff -rq --exclude='*.map' BASELINE_DIR/ public/
     ```

   - Confirm at least one difference exists.
   - Assess each difference:
     - Map it to an announced change, or flag it as a potential regression.
     - Investigate issues and report their root causes.
   - Report the results.

## Release helper scripts

- NPM scripts: `set:version` and `set:version:*`; `update:hugo`,
  `update:theme-dep`, and `approve:hugo` (see [Hugo versions](#hugo-versions))
- `scripts/get-build-id.sh`: Builds `X.Y.Z-dev+…-over-main-…` from the latest
  semver tag on `main`, commit offset, and tip SHA; if **`package.json`**’s
  X.Y.Z core is already **greater** than that git-derived core, keeps the higher
  core (release prep ahead of tagging).
- `scripts/pack-stamp.mjs`: `prepack`/`postpack` helper for `theme/package.json`
  that stamps dev tarballs with the packed commit's SHA (`+g<sha8>`) and
  restores the committed manifest; release and RC versions pack unchanged. An
  interrupted pack can leave the stamp in the working tree; the next pack
  self-heals it, but don't commit the stamped version.
- `scripts/set-package-version/index.mjs`: Low-level version manager. See script
  help for usage.

<!-- prettier-ignore-start -->
[#2732]: <{{% param github_repo %}}/issues/2732>
[breaking change]: /project/about/changelog/#breaking-change
[changelog]: /project/about/changelog/
[contributing]: /docs/contributing/
[deploy/prod]: <{{% param github_repo %}}/tree/deploy/prod>
[doc-rooted]: <{{% param github_repo %}}/tree/doc-rooted>
[docsy-example]: <{{% param github_repo %}}-example>
[docsy-starter]: https://github.com/chalin/docsy-starter
[docsy.dev]: <{{% _param baseURL %}}>
[docsy.dev/config]: <{{% param github_repo %}}/blob/main/docsy.dev/config/>
[docsy.dev/config/_default/hugo.yaml]: <{{% param github_repo %}}/blob/main/docsy.dev/config/_default/hugo.yaml>
[Draft a new release]: <{{% param github_repo %}}/releases/new>
[Examples page]: /examples/
[github.com/google/docsy/theme]: <{{% param github_repo %}}/blob/main/theme/>
[go.mod]: <{{% param github_repo %}}/blob/main/theme/go.mod>
[hugo-extended]: https://github.com/jakejarvis/hugo-extended/releases
[link-cache README]: https://github.com/chalin/link-cache#readme
[milestones]: <{{% param github_repo %}}/milestones>
[officially supports]: /project/about/changelog/#official-support
[opentelemetry.io]: https://github.com/open-telemetry/opentelemetry.io
[osv]: https://osv.dev/list?ecosystem=npm
[package.json]: <{{% param github_repo %}}/blob/main/package.json>
[public]: /project/about/changelog/#public
[publish workflow]: <{{% param github_repo %}}/actions/workflows/publish.yaml>
[Release notes]: <{{% param github_repo %}}/releases>
[tags]: <{{% param github_repo %}}/tags>
[theme/hugo.yaml]: <{{% param github_repo %}}/blob/main/theme/hugo.yaml>
[theme/package.json]: <{{% param github_repo %}}/blob/main/theme/package.json>
[theme/theme.toml]: <{{% param github_repo %}}/blob/main/theme/theme.toml>
[themes showcase]: https://github.com/gohugoio/hugoThemesSiteBuilder#theme-configuration
[trusted publishing]: https://docs.npmjs.com/trusted-publishers/
<!-- prettier-ignore-end -->
