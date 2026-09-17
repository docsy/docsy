# AGENTS.md: Docsy repo guide for AI agents

The website content tree `docsy.dev/content/en/project/` ([project][]) is the
authoritative source for project structure, branching model, CI/CD, and release
process; note in particular [git-info.md][].

[project]: docsy.dev/content/en/project/_index.md
[git-info.md]: docsy.dev/content/en/project/build/git-repo.md

## Code, test, and documentation conventions

- Assume the maintainers and readers of the code you write are senior web
  developers and designers who know the site's tools, including Hugo and
  Bootstrap.
- Write lean and DRY, in code, comments, and commit messages.
- npm package scripts run under Bash on every platform (`script-shell` is pinned
  in the root `.npmrc`, which covers workspace runs too; audited): write them as
  POSIX, never cmd.exe syntax. Exception: consumer-run scripts published with
  the theme package (e.g. `install:theme-deps`) get no `.npmrc` and must stay
  shell-neutral (bare commands, double quotes only).
- Don't use comments to explain the obvious; use self-explanatory names and
  short names when the context is clear.
- This project has a long history; look for existing helpers (partials,
  shortcodes, SCSS mixins, and similar) before adding new ones.
- In site content, `version` is the published variant's identity, not always a
  git ref; anything needing a resolvable release ref (install commands, etc.)
  uses `tdVersion.latest` (`docsy.dev/config/_default/params.yaml`).
- Add an explicit heading ID (`{#id}`) only when it differs from the ID that
  Hugo generates; verify against the rendered HTML, not by guessing. Nuances:
  - Icon/badge shortcodes and inline HTML are ID-transparent (no explicit ID
    needed): `## Ready to upgrade? <a id="legacy"></a>` and
    `### {{%/* _param FAS square-check primary */%}} Sanity checks` generate
    `ready-to-upgrade` and `sanity-checks`.
  - Literal punctuation between shortcodes is not:
    `## {{%/* _param BREAKING */%}} / {{%/* _param NEW */%}} Favicons` generates
    `--favicons`, so keep `{#favicons}`.
  - Keep deliberate short or stable IDs that inbound links rely on (e.g.
    `{#check}` on "Check your site", `{#update-order}` surviving retitles).

## User guide

Enforce the [style guide][] when reviewing user guide additions or
modifications.

[style guide]: docsy.dev/content/en/project/style-guide.md

## Separation of concerns

For which artifact owns which content (changelog, blog posts, docs, release
notes), see the maintainer notes' [Content placement][] section.

[Content placement]:
  docsy.dev/content/en/project/about/maintainer-notes.md#content-placement

## Pull requests

When creating a PR whose changes will land in the upcoming release, set the PR's
milestone to that release (e.g. `0.17.0`); the open release milestones are
listed at <https://github.com/docsy/docsy/milestones>.

## Monorepo layout

The repo root orchestrates two npm workspaces:

- `theme/`: the Docsy theme module (the published Hugo module). Consuming sites
  import `github.com/docsy/docsy/theme`; npm/clone installs use
  `theme: docsy/theme`. `theme/package.json` owns Bootstrap and Font Awesome.
- `docsy.dev/`: the project website (this content tree).

Releases publish a nested module tag `theme/vX.Y.Z` alongside `vX.Y.Z`.

Site builds resolve the theme through the checkout's parent directory
(`--themesDir ../..` with `theme: docsy/theme`), so the checkout directory must
be named `docsy`. From a checkout named differently (a git worktree, for
example), either run npm scripts through the `wt` helper (`npm run wt -- test`),
or set `HUGO_THEME=`_`DIR_NAME`_`/theme`, where _`DIR_NAME`_ is the checkout's
directory name.

## Release prep

Release prep is driven by the `docsy-release-artifacts` skill, with a living
workspace kept outside the repo. The canonical process is the maintainer notes'
[Release-prep audit][] section; the skill operationalizes it.

[Release-prep audit]:
  docsy.dev/content/en/project/about/maintainer-notes.md#release-prep-audit
