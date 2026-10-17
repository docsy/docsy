---
title: Git repo info and branch model
linkTitle: Git repos and branches
---

## Monorepo

The [main Docsy repository][] is effectively a **monorepo** containing the
Docsy:

- **Theme** in the `theme` directory
- **Website** in the `docsy.dev` directory. The website uses the Docsy theme, of
  course, with extra styling.

The main Docsy example site is [Goldydocs][], located in the [Docsy example site
repository][].

### Local build

Site builds resolve the theme through the checkout's parent directory
(`--themesDir ../..` with `theme: docsy/theme`), so the checkout directory must
be named `docsy`. From a checkout named differently (a git worktree, for
example), either run npm scripts through the `wt` helper (`npm run wt -- test`),
or set `HUGO_THEME=`_`DIR_NAME`_`/theme`, where _`DIR_NAME`_ is the checkout's
directory name.

With the [prerequisites][prereqs] installed, install and serve the website from
the checkout root:

```sh
npm run install:safe
npm run serve
```

## Branch model

This repository's branch model is as follows:

- `main`: development branch for the next theme release and next site content.
- `release`: release and maintenance branch for the latest theme release.
- `deploy/prod` and `doc-rooted`: publishing branches used by Netlify. These
  branches determine what is published (see the table below); they are not
  feature development branches.

The Goldydocs repo has the same model, except for `doc-rooted` which is not
used.

### Published sites

Netlify publishes the following site variants. A variant's version identity
(`version` and related params) comes from its config directory under
`docsy.dev/config/`:

| Site variant                         | Publishing branch | Version params |
| ------------------------------------ | ----------------- | -------------- |
| [Latest release][prod-site]          | `deploy/prod`     | `production/`  |
| [Next (dev)][next-site]              | `main`            | `_default/`    |
| [Doc-rooted (experimental)][dr-site] | `doc-rooted`      | `doc-rooted/`  |

PR deploy previews build like the Next variant.

### Tags

- Release tags (`vX.Y.Z` and `theme/vX.Y.Z`) mark **official theme releases**.
- They never move: the `release-tag-integrity`
  [ruleset][release-tag-integrity ruleset] blocks their update and deletion,
  with no bypass.
- Only the designated releaser creates them, per the `release-tags`
  [ruleset][release-tags ruleset].

### Workflow

#### Overview

1. Theme and site work is done on `main`.

2. When ready to release:
   - [Release from `main`](#release-from-main) (the usual case).
   - [Patch on `release`](#patch-on-release) (when `main` carries work that
     isn't ready to release).

3. Publish site updates: fast-forward `deploy/prod` from `release`.

4. Netlify deploys from `deploy/prod` and `doc-rooted`.

#### Release from `main`

1. After `git fetch upstream`, if `release` has commits that `main` doesn't
   (`git log upstream/main..upstream/release` lists them, after a
   [patch on `release`](#patch-on-release)), [restore the fast-forward path][]
   before the [release-preparation PR][publishing a release] merges.
2. Once the release tag, _`RELEASE_TAG`_ (for example,
   `{{% dev-version final %}}`), is pushed, fast-forward `release` to it:

   ```sh
   git fetch upstream --tags
   git switch -C release upstream/release
   git merge --ff-only RELEASE_TAG
   git push upstream release
   ```

#### Patch on `release`

Fix on `main` first whenever the fix applies there; a fix that doesn't apply
there lands only on `release`. Then:

1. Open a PR against `release` with the fix (cherry-picked from `main` when it
   landed there) and the [release-preparation changes][publishing a release],
   and merge it.
2. Port the release-facing site updates (changelog, release blog post,
   `tdVersion.latest`) onto a branch off `main` and merge them by PR. A PR from
   `release` itself would carry the patch's version stamps.

### Branch sync and invariants

`main`: for its rules and the merge gates, see [Merge requirements][].

`release`:

- Follows `main`: divergence lasts only from a patch on `release` to the next
  release from `main`.
- Every official release tag is reachable from it.
- Stays at the latest release between releases: it is the base for patches.
- Never rewritten: no force pushes, no deletion (enforced by its
  [ruleset][release ruleset]).
- Receives content only through [releases from `main`](#release-from-main) or
  [patches on `release`](#patch-on-release).
- Checks (including EasyCLA and workflow security analysis) run on PRs into
  `release`; acting on them is the merging maintainer's call. Merge with EasyCLA
  green, though: a miss on `release` can't be undone and blocks the next
  [restore][restore the fast-forward path] until the author signs.

`deploy/prod`: follows `release` as a pointer, never with commits of its own;
the published docs change only when `release` moves.

## Why this model?

- Keeps theme releases predictable while `main` moves quickly.
- Keeps `release` a follower of `main`, so a patch never opens a second line of
  development.
- Protects `release` against rewriting without gating it: requiring `main`'s
  [PR-scoped gates][Merge requirements] there would refuse the fast-forward from
  `main`, whose content already passed them.
- Keeps `deploy/prod` a pointer, so publishing is a deliberate last step,
  separate from cutting the release.

<!-- prettier-ignore-start -->
[Docsy example site repository]: <{{% param github_repo %}}-example>
[dr-site]: https://doc-rooted--docsydocs.netlify.app
[Goldydocs]: <{{% param example_site_url %}}>
[main Docsy repository]: <{{% param github_repo %}}>
[Merge requirements]: /project/about/maintainer-notes/#merge-requirements
[next-site]: https://main--docsydocs.netlify.app
[prereqs]: /docs/get-started/docsy-as-module/installation-prerequisites/
[prod-site]: https://www.docsy.dev
[publishing a release]: /project/about/maintainer-notes/#publishing-a-release
[release ruleset]: <{{% param github_repo %}}/rules/24234982>
[release-tag-integrity ruleset]: <{{% param github_repo %}}/rules/24262989>
[release-tags ruleset]: <{{% param github_repo %}}/rules/20660119>
[restore the fast-forward path]: /project/about/maintainer-notes/#restore-the-fast-forward-path
<!-- prettier-ignore-end -->
