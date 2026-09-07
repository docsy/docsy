---
title: Changelog
description: Breaking changes and release highlights, per release
aliases: [../changelog]
# prettier-ignore
cSpell:ignore: deining FOUC gitmodules gtag lookandfeel mhchem navs notoc tabpane onedark shurup
---

We document **breaking changes** and release **highlights** in this page, with
maintainer-facing changes summarized at the end of each release section. For the
full list of changes of any particular release, see the [release
notes][releases].

Useful links: [Releases][] & [tags][], jump to the [latest][] release, and view
the [milestones][].

[latest]: https://github.com/google/docsy/releases/latest
[milestones]: https://github.com/google/docsy/milestones
[releases]: https://github.com/google/docsy/releases
[tags]: https://github.com/google/docsy/tags

## Style guide

- Use past tense when when describing releases.
- Generally, start each change entry with a verb (in the past tense). For
  example: Added, Changed, Deprecated, Fixed.
- It's ok to follow that with "you can now...". For example:
  > **Feature abc**: you can now...".
- For additional guidance, see
  [Keep a Changelog](https://keepachangelog.com)[^1].

[^1]:
    Old entries might not follow this guidance; feel free to update them as
    needed.

## Definitions

<details>
<summary>Definitions...</summary>

### Public customization surface {#public}

As a Hugo theme, Docsy exposes various features that client projects may rely
on, such as:

- Layouts
- Styles
- Configuration options
- Runtime behavior

Aspects of these features are part of Docsy's **public contract**, which we also
refer to as the **public customization surface**. We refer to such feature
aspects as **public** for short.

Because Docsy follows [semantic versioning][semver], we will not introduce
[breaking changes](#breaking-change) to the public customization surface outside
of major version releases.[^docsy-not-v1-yet]

#### Private/internal features {#private}

Aspects outside the _public customization surface_ are considered **private**
and **internal** features and implementation details.

[^docsy-not-v1-yet]:
    Docsy is not yet at version 1.0.0, so we are bound by the pre-v1 semantic
    versioning rules. We treat minor releases as if they were major releases.

#### Experimental features {#experimental}

Experimental features are not part of the
[public customization surface](#public) and may change or be removed in future
releases.

We release experimental features so that projects can try them out and share
feedback.

### Breaking change

A **breaking change** is a backward-incompatible change to Docsy’s _public
contract_ that requires client projects to update their configuration, content,
or customizations in order to:

- Build successfully (without errors), or
- Preserve existing, significant site functionality or user experience,
  including visual design

See [semver][].

> [!NOTE]
>
> A new build warning alone is not considered a breaking change, but it may
> indicate a future breaking change, such as signaling a deprecation.

### Official support

Docsy is maintained with very limited resources and only supports the latest
releases of Docsy, its dependencies & tools, and operating systems.

Specifically, the Docsy team **officially supports** the following:

- **Production use**: the latest **official release** of Docsy — a stable semver
  version from the following sources:
  - [@docsy/theme][] npm package (`X.Y.Z`)
  - Hugo module (`vX.Y.Z`)
  - GitHub [release][releases] or git tag (`vX.Y.Z`)

  npm installs of Docsy from GitHub (`google/docsy`) are for development and
  testing only, not production use.

- **Issue reports**: over the latest official release, a current pre-release, or
  the `main` branch.

- The tool versions as specified for the Docsy release you are using:
  - **Hugo**:
    - The version pinned as `hugo-extended` in [package.json][]
      ({{% hugo-version %}})
    - Older versions, down to Docsy's declared [minimum Hugo version][], usually
      work.
  - **Node.js**: versions matching `engines.node` in [package.json][]
  - **Dart Sass**: the version pinned as `sass-embedded` in [package.json][]

- Operating systems: macOS (latest minor release) and Linux.

Everything else — including Windows — is supported on a best-effort basis.

<!-- prettier-ignore-start -->
[@docsy/theme]: https://www.npmjs.com/package/@docsy/theme
[minimum Hugo version]: /docs/get-started/docsy-as-module/installation-prerequisites/#install-hugo
[package.json]: https://github.com/google/docsy/blob/main/package.json
<!-- prettier-ignore-end -->

### Bug fixes

We define a bug as undesirable behavior documented through an issue. Classify
bug-fix commits or pull requests (PRs) under **Fixed** or **Other changes**,
unless they extend beyond a fix and affect user-facing functionality. In that
case, classify them as a [Breaking change](#breaking-change) or **New**
functionality, depending on scope. Prefer narrow, focused PRs where possible.

<!-- TODO: look into https://www.conventionalcommits.org/en/v1.0.0/#summary -->

</details>

## v0.18.0 {#next}

> **UNRELEASED: this planned version is still under development**

For the full list of changes, see the [0.18.0][] release page or the [git
history since 0.17.0][].

[**Breaking changes**](#breaking-change):

- **[Dropped jQuery][0.18.0-blog-jquery]**: the theme no longer loads jQuery, so
  `window.jQuery` and `$` are no longer available to site scripts; theme scripts
  now use standard DOM APIs ([#1436][]).
- **[Plugin conversions][0.18.0-blog-plugins]**: moved the script override
  points for MarkMap, tab persistence, and click-to-copy; page-gated MarkMap,
  whose autoloader is now fetched at build time, and tab persistence; reserved
  `params.docsy` for theme settings ([#2789][]).

**New**:

- **[Plugins][ug-plugins]**: added `params.docsy.plugins`, a registry that loads
  site scripts without layout overrides; MarkMap, tab persistence, and
  click-to-copy ship through it. Deprecated `params.markmap.enable`,
  `params.markmap.version`, and `params.disable_click2copy_chroma` in favor of
  registry entries ([#2789][]).

**Other changes**:

- Fixed search-box issues (queries truncating at `&` or `#`; navigation firing
  while committing IME-composed text) and navbar scroll-indicator clicks
  scrolling multiple times after window resizes ([#1436][]).

[**Experimental**](#experimental):

- ...

**For maintainers**:

- Grouped Renovate patch/minor dependency updates into per-update-type batch PRs
  (one per weekly wave), after applying the open update wave (devDep pins and
  bumps, actions v7) ([#2774][], [#2776][]).
- Switched the docsy.dev committed link cache to an owned JSONC format
  ([#2779][]).
- Extended the root `npm run check` to also run the docsy.dev workspace format
  check, matching what CI enforces (`fix:format` already delegated) ([#2781][]).
- Restructured the publish-verify release step into numbered gates and hardened
  the smoke suite's npm-registry vet: exact, registry-resolved versions, with
  local npm hardening never relaxed except by an explicit per-run override
  ([#2786][]).

[#1436]: https://github.com/google/docsy/issues/1436
[#2774]: https://github.com/google/docsy/pull/2774
[#2776]: https://github.com/google/docsy/pull/2776
[#2779]: https://github.com/google/docsy/pull/2779
[#2781]: https://github.com/google/docsy/pull/2781
[#2786]: https://github.com/google/docsy/pull/2786
[#2789]: https://github.com/google/docsy/issues/2789
[0.18.0]: https://github.com/google/docsy/releases/latest?FIXME=v0.18.0
[0.18.0-blog-jquery]: /blog/2026/0.18.0/#jquery
[0.18.0-blog-plugins]: /blog/2026/0.18.0/#plugins
[ug-plugins]: /docs/content/plugins/
[git history since 0.17.0]:
  https://github.com/google/docsy/compare/v0.17.0...main

## v0.17.0 {#v0.17.0}

For an introduction to this release, see the [0.17.0 release report][]. For the
full list of changes, see the [0.17.0][] release page or the [git history since
0.16.0][].

[**Breaking changes**](#breaking-change):

- **[Dart Sass][0.17.0-blog-dart-sass]**: switched the theme's default Sass
  transpiler from Hugo's embedded LibSass (deprecated) to Dart Sass; see
  [Install Dart Sass][]. Some Sass-computed colors in the built CSS change
  serialization form, with no visible rendering change ([#2279][]).

- Changed breadcrumb markup to carry Docsy [semantic classes][] with state keyed
  on `aria-current="page"` instead of an `active` class. If you customized
  breadcrumbs, see the [selector migration table][] ([#2722][]).
- **[Font Awesome 7][0.17.0-blog-fontawesome]**: upgraded from 6.7.2 to 7.3.1;
  icons render at a uniform width by default, and project Sass reaching into
  Font Awesome's Sass surface needs migrating ([#2314][]).
- Renamed the theme-dependencies install command that clone, submodule, and
  GitHub-npm installs run: `npm run postinstall` → `npm run install:theme-deps`;
  Docsy's packages no longer declare npm install hooks. For per-mode actions,
  see the [0.17.0 release report][0.17.0-blog-install] ([#2712][]).

**Other changes**:

- Fixed and documented footer copyright year handling. See the [footer copyright
  docs][] ([#2047][]).
- **[Pinned the default script-dependency versions][0.17.0-blog-script-pins]**:
  Mermaid, KaTeX, markmap-autoloader, and Redoc now load at pinned versions
  instead of resolving from the CDN's `latest` ([#2703][], [#2705][], [#2706][],
  [#2737][]).
- **[Agent directive in page HTML][0.17.0-blog-llms-directive]**
  ([experimental](#experimental)): added a hidden agent-facing pointer to
  `llms.txt` at the top of each page body of sites that enable the index
  ([#2614][]).
- Silenced Sass deprecation warnings in site builds, project style files
  included; see the [release report][0.17.0-blog-dart-sass] ([#2731][]).
- Made the light/dark mode menu labels and assistive text translatable, fixed
  the toggle button's label to reflect the selected mode, filled in missing UI
  strings across locales, and updated the Turkish and Ukrainian locales
  ([#1987][], [#2753][], [#2751][], [#2332][], [#2451][]).
- Dropped broken `Dockerfile` and `docker-compose.yaml` files and retired Docker
  quickstart page ([#2748][]).

**For maintainers**:

- Committed npm lockfiles; dependency installs are now lock-exact, and
  unreviewed dependency scripts are disabled ([#2700][]).
- Guarded dependency and workflow hardening with a committed supply-chain audit
  spanning package runners, the Node toolchain, the lock surface, and npm
  lifecycle script names ([#2714][], [#2757][]).
- Renamed the full test-suite entry point: `ci:test` → `test:full`, with
  `_test:full:pre`/`_test:full:common` phases; the freed `ci:*` names retire. A
  repo clone now installs via `npm run install:safe` ([#2712][]).
- Inlined npm `pre*`/`post*` run-hooks into their parent scripts, so
  `check:links` still builds the site under user-level `ignore-scripts`
  ([#2726][]).
- Committed `ignore-scripts=true` and a 7-day release cooldown to `.npmrc`:
  installs are script-free by default everywhere, and version resolution ignores
  releases younger than a week ([#2760][]).
- Switched stable `@docsy/theme` publishing to CI-based npm trusted publishing
  (OIDC). See the [0.17.0 release report][0.17.0-blog-maintainers] ([#2708][]).
- Moved the default Mermaid version to `theme/hugo.yaml`
  `params.mermaid.version`; the KaTeX, markmap-autoloader, and Redoc pins share
  the home. All are guarded by the repo test suite (`test:repo`). See [Default
  script-dependency versions][script-versions-notes].
- Moved the `hugo-extended` pin to the root `package.json` and adopted a
  two-step update flow; see [Officially supported Hugo
  version][hugo-version-notes] ([#2747][]).

<!-- prettier-ignore-start -->
[#2047]: https://github.com/google/docsy/issues/2047
[#2314]: https://github.com/google/docsy/issues/2314
[#2332]: https://github.com/google/docsy/pull/2332
[#2451]: https://github.com/google/docsy/pull/2451
[#1987]: https://github.com/google/docsy/issues/1987
[#2614]: https://github.com/google/docsy/issues/2614
[#2700]: https://github.com/google/docsy/pull/2700
[#2703]: https://github.com/google/docsy/issues/2703
[#2705]: https://github.com/google/docsy/issues/2705
[#2706]: https://github.com/google/docsy/issues/2706
[#2737]: https://github.com/google/docsy/issues/2737
[#2708]: https://github.com/google/docsy/pull/2708
[#2712]: https://github.com/google/docsy/pull/2712
[#2722]: https://github.com/google/docsy/pull/2722
[#2714]: https://github.com/google/docsy/pull/2714
[#2279]: https://github.com/google/docsy/issues/2279
[#2726]: https://github.com/google/docsy/pull/2726
[#2760]: https://github.com/google/docsy/pull/2760
[#2731]: https://github.com/google/docsy/pull/2731
[#2747]: https://github.com/google/docsy/pull/2747
[#2748]: https://github.com/google/docsy/pull/2748
[#2751]: https://github.com/google/docsy/pull/2751
[#2753]: https://github.com/google/docsy/issues/2753
[#2757]: https://github.com/google/docsy/pull/2757
[0.17.0 release report]: /blog/2026/0.17.0/
[0.17.0-blog-dart-sass]: /blog/2026/0.17.0/#dart-sass
[0.17.0-blog-fontawesome]: /blog/2026/0.17.0/#fontawesome
[0.17.0-blog-install]: /blog/2026/0.17.0/#install-command
[0.17.0-blog-llms-directive]: /blog/2026/0.17.0/#llms-directive
[0.17.0-blog-maintainers]: /blog/2026/0.17.0/#for-maintainers
[0.17.0-blog-script-pins]: /blog/2026/0.17.0/#script-dep-pins
[0.17.0]: https://github.com/google/docsy/releases/tag/v0.17.0
[footer copyright docs]: /docs/content/lookandfeel/#footer-copyright
[git history since 0.16.0]: https://github.com/google/docsy/compare/v0.16.0...v0.17.0
[hugo-version-notes]: /project/about/maintainer-notes/#official-hugo-version
[Install Dart Sass]: /docs/get-started/docsy-as-module/installation-prerequisites/#install-dart-sass
[script-versions-notes]: /project/about/maintainer-notes/#script-versions
[selector migration table]: /blog/2026/0.17.0/#selector-migration-table
[semantic classes]: /docs/content/lookandfeel/#semantic-classes
<!-- prettier-ignore-end -->

## v0.16.0 {#v0.16.0}

For an introduction to this release, see the [0.16.0 release report][]. For
Hugo-specific notes, see the [Hugo 0.158+ upgrade guide][]. For the full list of
changes, see the [0.16.0][] release page or the [git history since 0.15.0][].

**New**:

- **[Docsy on the npm registry][0.16.0-blog-npm-registry]**: published the theme
  as [`@docsy/theme`][@docsy/theme]; npm installs from GitHub (`google/docsy`)
  are now for [development and testing only](#official-support). See [Docsy as
  an NPM package][option-3-npm] ([#2683][]).
- **[Favicon discovery][0.16.0-blog-favicons]**: added automatic discovery and
  linking of conventionally named favicon files from `static/`, and a
  `gen-favicons` helper that generates raster icons from a source SVG. See [Add
  your favicons][favicons] ([#2357][]).

[**Breaking changes**](#breaking-change):

- **[Default favicons][0.16.0-blog-favicons]** removed from the theme; sites
  supply their own (see **Favicon discovery** above) ([#2595][]).
- Raised the theme's minimum supported Hugo version to
  **[0.160.1][hugo-0.160.1]** (was 0.146.0). For the rationale, see the [0.16.0
  release report][0.16.0-blog-hugo] ([#2668][]).
- **[Theme folder move][0.16.0-blog-theme-folder]**: the canonical theme now
  lives in `theme/`; install paths change for every install mode ([#2617][]).
- **[Bootstrap and Font Awesome via npm][0.16.0-blog-npm-deps]**: declared them
  as npm dependencies instead of importing them as Hugo modules; applies to
  Hugo-module installs only ([#2668][]).

**Other changes**:

- Migrated the theme and docs off deprecated Hugo language APIs ([#2593][]).
  Thanks [@deining][] for the groundwork in [#2594][] and [#2578][]!
- Synced and corrected the Russian UI strings. Thanks [@shurup][]!
- Upgraded the project's Hugo build to [0.164.0][hugo-0.164.0]. See [Hugo 0.158+
  upgrade guide][] ([#2581][]).
- **[PostCSS is opt-in for non-RTL sites][0.16.0-blog-postcss]**: sites without
  RTL languages or their own PostCSS config no longer need a PostCSS toolchain
  ([#2668][]).
- Moved cached-sidebar activation on large sites from inline jQuery into the
  shared `chrome-nav.js`, which now loads on every page; rendered navigation is
  unchanged. See the [0.16.0 release report][0.16.0-blog-shared-chrome].

[**Experimental**](#experimental):

- Added a **[`shared` chrome build mode][chrome]** (`td.chrome`) that renders
  the repeated chrome (navbar, footer, left-nav) once per locale, for much
  cheaper link checking of large sites ([#2659][]).

**For maintainers**:

- Reorganized the repository package boundary: `theme/package.json` owns theme
  runtime dependencies, and the root package orchestrates the `docsy.dev` and
  `theme` workspaces ([#2617][]).
- Added build and test guards (Hugo deprecation output, fixture-site
  regressions) and moved link checking from htmltest to Lychee. See [0.16.0
  release report][0.16.0-blog-maintainers].

<!-- prettier-ignore-start -->
[#2357]: https://github.com/google/docsy/issues/2357
[#2578]: https://github.com/google/docsy/pull/2578
[#2581]: https://github.com/google/docsy/issues/2581
[#2593]: https://github.com/google/docsy/issues/2593
[#2594]: https://github.com/google/docsy/pull/2594
[#2595]: https://github.com/google/docsy/issues/2595
[#2617]: https://github.com/google/docsy/issues/2617
[#2659]: https://github.com/google/docsy/issues/2659
[#2668]: https://github.com/google/docsy/issues/2668
[#2683]: https://github.com/google/docsy/issues/2683
[0.16.0 release report]: /blog/2026/0.16.0/
[0.16.0-blog-favicons]: /blog/2026/0.16.0/#favicons
[0.16.0-blog-hugo]: /blog/2026/0.16.0/#hugo
[0.16.0-blog-maintainers]: /blog/2026/0.16.0/#for-maintainers
[0.16.0-blog-npm-deps]: /blog/2026/0.16.0/#npm-deps
[0.16.0-blog-npm-registry]: /blog/2026/0.16.0/#npm-registry
[0.16.0-blog-postcss]: /blog/2026/0.16.0/#postcss
[0.16.0-blog-shared-chrome]: /blog/2026/0.16.0/#shared-chrome
[0.16.0-blog-theme-folder]: /blog/2026/0.16.0/#theme-folder
[0.16.0]: https://github.com/google/docsy/releases/tag/v0.16.0
[chrome]: /docs/deployment/chrome/
[favicons]: /docs/content/iconsimages/#add-your-favicons
[git history since 0.15.0]: https://github.com/google/docsy/compare/v0.15.0...v0.16.0
[Hugo 0.158+ upgrade guide]: /blog/2026/hugo-0.158.0+/
[hugo-0.160.1]: https://github.com/gohugoio/hugo/releases/tag/v0.160.1
[hugo-0.164.0]: https://github.com/gohugoio/hugo/releases/tag/v0.164.0
[option-3-npm]: /docs/get-started/other-options/#option-3-docsy-as-an-npm-package
[@shurup]: https://github.com/shurup
<!-- prettier-ignore-end -->

## v0.15.0 {#v0.15.0}

For an introduction to this release, see the [0.15.0 release report][]. For the
full list of changes, see the [0.15.0][] release page.

**New**:

- **[Agent support][0.15.0-blog-agent-support]**
  ([experimental](#experimental)): added Markdown alternate outputs, "View
  Markdown" links, and `llms.txt` ([#2597][], [#2601][], [#2605][], [#2606][]
- **[Doc-rooted sites][0.15.0-blog-doc-rooted]**
  ([experimental](#experimental)): added a documented pattern and example
  variant for documentation-first sites ([#2563][], [#2587][]).
- **[Version menu entries][0.15.0-blog-version-menu]**: added support for
  headings, separators, per-entry page-link behavior, and kind-specific styling
  ([#2557][], [#2586][]).
- **`card` shortcode rendering**: changed Markdown rendering in card arguments
  to use the _including page's context_, enabling relative Markdown link paths
  and more flexible render-hook behavior. [Details][0.15.0-blog-card]
  ([#2565][]).
- Added optional `rel` attribute values for footer `params.links` ([#2576][]);
  see [Community and footer links][0.15.0-blog-community-footer].

[**Breaking changes**](#breaking-change):

- **Community and footer link paths** changed for multilingual sites; see
  [blog][0.15.0-blog-community-footer] ([#2580][]).
- **Version menu markup and mobile visibility** changed for sites using
  `params.versions`; see [Version menu entries][0.15.0-blog-version-menu]
  ([#2557][], [#2586][]).
- **`card` shortcode rendering** changed for Markdown arguments; breakage risk
  is low. See [blog][0.15.0-blog-card].

**Other changes**:

- **Internationalization**: [added and updated
  translations][0.15.0-blog-internationalization].
- Fixed community/footer links so site-local links no longer open in a new
  browser target ([#2133][], [#2576][]).

<!-- prettier-ignore-start -->
[#2133]: https://github.com/google/docsy/issues/2133
[#2557]: https://github.com/google/docsy/pull/2557
[#2563]: https://github.com/google/docsy/pull/2563
[#2565]: https://github.com/google/docsy/pull/2565
[#2576]: https://github.com/google/docsy/pull/2576
[#2580]: https://github.com/google/docsy/pull/2580
[#2586]: https://github.com/google/docsy/pull/2586
[#2587]: https://github.com/google/docsy/pull/2587
[#2597]: https://github.com/google/docsy/pull/2597
[#2601]: https://github.com/google/docsy/pull/2601
[#2605]: https://github.com/google/docsy/pull/2605
[#2606]: https://github.com/google/docsy/pull/2606
[0.15.0 release report]: /blog/2026/0.15.0/
[0.15.0-blog-agent-support]: /blog/2026/0.15.0/#agent-support
[0.15.0-blog-card]: /blog/2026/0.15.0/#card-shortcode
[0.15.0-blog-community-footer]: /blog/2026/0.15.0/#community-footer-links
[0.15.0-blog-doc-rooted]: /blog/2026/0.15.0/#doc-rooted-sites
[0.15.0-blog-internationalization]: /blog/2026/0.15.0/#internationalization
[0.15.0-blog-version-menu]: /blog/2026/0.15.0/#version-menu
[0.15.0]: https://github.com/google/docsy/releases/v0.15.0
<!-- prettier-ignore-end -->

## v0.14.3 {#v0.14.3}

Patch release [0.14.3][] applies the layout fix for [#2561][], which ensures
`.td-main > .row` grows vertically ([#2569][]).

[#2561]: https://github.com/google/docsy/issues/2561
[#2569]: https://github.com/google/docsy/pull/2569
[0.14.3]: https://github.com/google/docsy/releases/v0.14.3

## v0.14.2 {#v0.14.2}

**Key fix** for this patch: Apply `.td-main` flex only when sidebar exists
([#2546][]).

For the full list of changes, see the [release report][0.14.2-blog] and
[0.14.2][] release page.

[**Breaking changes**](#breaking-change) (style-only):

- **[Default code styles][0.14.2-blog]** changed from `tango`/`onedark` to
  `friendly`/`native` for sites using `td/code-dark` ([#2548][]).

**New**:

- **[Console block content selection][0.14.2-blog]**: selection and copy-code
  now only includes commands, not output ([#2548][]).

**Other changes**:

- Added `name` attribute to search form field for better semantics and autofill
  ([#2549][]).
- Package version build metadata and footer icon tweaks ([#2547][]).

[#2546]: https://github.com/google/docsy/pull/2546
[#2547]: https://github.com/google/docsy/pull/2547
[#2548]: https://github.com/google/docsy/pull/2548
[#2549]: https://github.com/google/docsy/pull/2549
[0.14.2]: https://github.com/google/docsy/releases/v0.14.2
[0.14.2-blog]: /blog/2026/0.14.0/#0.14.2

## v0.14.1 {#v0.14.1}

Patch release [0.14.1][]: fixed **ToC** sidebar width in xl viewports
([#2538][]).

[0.14.1]: https://github.com/google/docsy/releases/v0.14.1

## v0.14.0 {#v0.14.0}

**Resources**:

- [Release 0.14.0 report and upgrade guide][0.14.0-blog]
- [0.14.0][] release page for the full list of changes

[**Breaking changes**](#breaking-change):

- **Navbar styling** changed to a light-theme default (previously dark) and is
  now configurable. See [Navbar style improvements][0.14.0-blog-navbar]
  ([#2477][]).
- **`blocks/cover` shortcode** content processing [changed][0.14.0-blog-cover]
  ([#939][], [#2480][]).
- **Heading aliases/in-page targets**: anchor target class renamed
  (`td-offset-anchor` → `td-anchor-no-extra-offset`), see [Heading
  aliases][0.14.0-blog-heading-aliases].
- **Swagger UI style customization** [changed][0.14.0-blog-swagger].
- **Hugo 0.153+ upgrade** introduced [breaking changes][0.14.0-blog-hugo]
  ([#2431][]).

**New**:

- **[Markdown alert syntax][0.14.0-blog-alerts]**: added support for Hugo's
  Markdown alert syntax ([#2443][]).
- **`td/site-build-info/netlify` shortcode** (experimental), see
  [Shortcodes][0.14.0-blog-shortcodes] ([#2444][]).
- **`td-below-navbar` helper class** for [`blocks/cover`][0.14.0-blog-cover]
  positioning ([#2480][]).

**Other changes**:

- Fixed [navbar color contrast (#2413)][#2413] via [#2477][].
- **Style tweaks**: `<details>` spacing, TOC h1 weight, see [Style improvements
  and fixes][0.14.0-blog-style-fixes].
- Fixed **fragment link scrolling** by using `scroll-padding-top`, see [Heading
  aliases][0.14.0-blog-heading-aliases].
- Internal **SCSS file reorganization**: moved internal SCSS files to
  `assets/scss/td/` ([#1654][]) for [improved separation of project and internal
  SCSS files][0.14.0-blog-scss].
- **Internationalization**: [updated
  translations][0.14.0-blog-internationalization] for multiple locales.
- Fixed nested **`sidebar_root_for`** bug ([#2470][]).
- Fixed Google-search modal colors in dark mode ([#2524][]).
- **RTL**: fixes for code blocks and foldable-nav icons ([#2533][]).

[#1654]: https://github.com/google/docsy/issues/1654
[#2413]: https://github.com/google/docsy/issues/2413
[#2431]: https://github.com/google/docsy/issues/2431
[#2443]: https://github.com/google/docsy/pull/2443
[#2444]: https://github.com/google/docsy/pull/2444
[#2470]: https://github.com/google/docsy/pull/2470
[#2477]: https://github.com/google/docsy/pull/2477
[#2480]: https://github.com/google/docsy/pull/2480
[#2524]: https://github.com/google/docsy/pull/2524
[#2533]: https://github.com/google/docsy/pull/2533
[#2538]: https://github.com/google/docsy/pull/2538
[0.14.0-blog-alerts]: /blog/2026/0.14.0/#alerts
[0.14.0-blog-cover]: /blog/2026/0.14.0/#blocks-cover
[0.14.0-blog-heading-aliases]: /blog/2026/0.14.0/#heading-aliases
[0.14.0-blog-hugo]: /blog/2026/0.14.0/#hugo
[0.14.0-blog-internationalization]: /blog/2026/0.14.0/#internationalization
[0.14.0-blog-navbar]: /blog/2026/0.14.0/#navbar
[0.14.0-blog-scss]: /blog/2026/0.14.0/#improved-scss-soc
[0.14.0-blog-shortcodes]: /blog/2026/0.14.0/#shortcodes
[0.14.0-blog-style-fixes]: /blog/2026/0.14.0/#style-improvements-and-fixes
[0.14.0-blog-swagger]: /blog/2026/0.14.0/#swagger-scss
[0.14.0-blog]: /blog/2026/0.14.0/
[0.14.0]: https://github.com/google/docsy/releases/v0.14.0

## v0.13.0 {#v0.13.0}

**Resources**:

- [Release 0.13.0 report and upgrade guide][0.13.0-blog]
- [0.13.0][] release page for the full list of changes

[**Breaking changes**](#breaking-change):

- **Language menu**: changed visibility, see [Language menu
  visibility][0.13.0-blog-lang-menu] ([#2303][]).
- **Alert shortcode**: Markdown content processing changed, see [Alert shortcode
  improvements][0.13.0-blog-alert] ([#941][]).

**New**:

- [Active TOC entry tracking][0.13.0-blog-toc] using Bootstrap ScrollSpy
  ([#2366][]).
- [Section sidebar root][0.13.0-blog-sidebar] feature ([#2364][]).

**Other changes**:

- **Improved accessibility**: [color contrast and
  typography][0.13.0-blog-accessibility] ([#2285][]).
- **Dark mode** fixes and improvements:
  - [Flash Of Unstyled Content][0.13.0-blog-fouc] (FOUC) ([#2343][]).
  - Improved TOC entry color contrast in dark mode ([#2376][], [#2379][]).
- **Mobile navbar**: added scroll indicators for overflow navigation
  ([#2406][]).
- Better **NPM support**: resolved optional and peer dependency issues
  ([#2115][]). See [breaking changes][0.13.0-blog-breaking] in the blog post.
- **Dependency updates**: Bootstrap 5.3.8, Hugo 0.152.2, Node LTS ≥24.
- **Updated translations**: added Occitan locale ([#2173][]) and refreshed
  Simplified Chinese ([#2313][]) and Ukrainian ([#2331][]).
- **TOC visibility control**: documented the `notoc` page parameter (available
  since 2016) for hiding the table of contents on specific pages ([#2405][]).
- **Build-time rendering of mathematical and chemical formulae**: now uses
  Hugo's embedded KaTeX engine ([#2276][], [#2394][], [#2395][]). For details,
  see [LaTeX support with KaTeX][diagrams-formulae].

[**Experimental**](#experimental):

- **Dark mode**. Added support for:
  - Google search integration ([#2387][]).
  - Sample support for color-contrast adjustments: for details, see [How to pick
    colors with good color-contrast][] ([#2384][]).
- Added `_param` shortcode with support for parameter substitution ([#2371][]).

[#2115]: https://github.com/google/docsy/issues/2115
[#2173]: https://github.com/google/docsy/issues/2173
[#2276]: https://github.com/google/docsy/pull/2276
[#2285]: https://github.com/google/docsy/issues/2285
[#2303]: https://github.com/google/docsy/pull/2303
[#2313]: https://github.com/google/docsy/issues/2313
[#2331]: https://github.com/google/docsy/pull/2331
[#2343]: https://github.com/google/docsy/pull/2343
[#2364]: https://github.com/google/docsy/pull/2364
[#2366]: https://github.com/google/docsy/pull/2366
[#2371]: https://github.com/google/docsy/pull/2371
[#2376]: https://github.com/google/docsy/pull/2376
[#2379]: https://github.com/google/docsy/pull/2379
[#2384]: https://github.com/google/docsy/pull/2384
[#2387]: https://github.com/google/docsy/pull/2387
[#2394]: https://github.com/google/docsy/pull/2394
[#2395]: https://github.com/google/docsy/pull/2395
[#2405]: https://github.com/google/docsy/pull/2405
[#2406]: https://github.com/google/docsy/pull/2406
[#941]: https://github.com/google/docsy/pull/941
[0.13.0]: https://github.com/google/docsy/releases/v0.13.0
[0.13.0-blog]: /blog/2025/0.13.0/
[0.13.0-blog-lang-menu]: /blog/2025/0.13.0/#language-menu-visibility
[0.13.0-blog-alert]: /blog/2025/0.13.0/#alert-shortcode
[0.13.0-blog-toc]: /blog/2025/0.13.0/#active-toc-entry-tracking
[0.13.0-blog-sidebar]: /blog/2025/0.13.0/#section-sidebar-root
[0.13.0-blog-accessibility]: /blog/2025/0.13.0/#accessibility
[0.13.0-blog-fouc]: /blog/2025/0.13.0/#accessibility
[0.13.0-blog-breaking]: /blog/2025/0.13.0/#breaking-changes
[diagrams-formulae]:
  /docs/content/diagrams-and-formulae/#latex-support-with-katex
[How to pick colors with good color-contrast]:
  /docs/content/lookandfeel/#pick-good-color-contrast

## v0.12.0 {#v0.12.0}

For the full list of changes, see the [0.12.0][] release page.

[**Breaking changes**](#breaking-change):

- Renamed the default Docsy heading render hook and heading self-link partials.
  This is a breaking change only if your project uses this feature. For details,
  see [Heading self links][] ([#2223][]).
- Relocated and adapted layouts in response to Hugo's [new template system][].
  For details, see [Adapt to new template system in Hugo v0.146.0 #2243][#2243].
- **IMPORTANT**: if your project overrides any of the layout files mentioned in
  [#2243][], then apply the same name changes in your project files. In
  particular, note that:
  - Taxonomy-related layout files: names have been _swapped_, and `terms.html`
    is now singular ([#2257][]):
    - Renames `_default/taxonomy.html` to `term.html` (singular)
    - Renames `_default/terms.html` to `taxonomy.html`
  - Renames `layouts/**/content.html` by adding a `_td-` filename prefix
    ([#2259][]).

[#2257]: https://github.com/google/docsy/pull/2257
[#2259]: https://github.com/google/docsy/pull/2259
[new template system]: https://gohugo.io/templates/new-templatesystem-overview/

**Potential breaking changes**:

- Removed shortcode `figure`, hugo's built-in shortcode `figure` can/will be
  used instead.

**New**:

- Enhanced and adjusted **[Breadcrumb navigation][]** support:
  - Added `ui.breadcrumb_disable` configuration parameter to disable breadcrumbs
    for an entire project, individual pages, or section. For details, see
    [Breadcrumb navigation][].
  - **Blog** pages now also have breadcrumbs by default ([#1788][]).
  - Index-page single-element breadcrumb lists are hidden by default
    ([#2160][]).
- Added support for a [_td-content-after-header.html][] page-content render
  hook, which can be [content type][] specific ([#2192][]). For details, see the
  [User Guide][before-page-content].

**Other changes**:

- **Blog** section index page content and title were ignored, they are now
  displayed ([#1787][]). To recover the old behavior use the following style
  override: `.td-section.td-blog .td-content { display: none; }`.
- Adds a `comment` shortcode, as a drop-in replacement for the one removed from
  Hugo's built-in shortcode.

[0.12.0]: https://github.com/google/docsy/releases/v0.12.0
[#1787]: https://github.com/google/docsy/issues/1787
[#1788]: https://github.com/google/docsy/issues/1788
[#2160]: https://github.com/google/docsy/pull/2160
[#2192]: https://github.com/google/docsy/pull/2192
[#2223]: https://github.com/google/docsy/pull/2223
[#2243]: https://github.com/google/docsy/pull/2243
[before-page-content]: /docs/content/lookandfeel/#before-page-content
[Breadcrumb navigation]: /docs/content/navigation/#breadcrumb-navigation
[content type]: https://gohugo.io/quick-reference/glossary/#content-type
[Heading self links]: /docs/content/navigation/#heading-self-links
[_td-content-after-header.html]:
  https://github.com/google/docsy/blob/main/theme/layouts/_td-content-after-header.html

## v0.11.0 {#v0.11.0}

For the full list of changes, see the [0.11.0][] release page.

**New**:

- Support for Right-To-Left (RTL) languages is reintroduced via [Bootstrap's
  support for RTL][bs-rtl]. For details, see [Right-to-left languages][rtl].
- The URL to your project's contribution guidelines is configurable. For
  details, see [Adding a community page][].
- When a section's sidebar entries are truncated because there are more than
  [params.ui.sidebar_menu_truncate][] section entries, a warning is issued.

[0.11.0]: https://github.com/google/docsy/releases/v0.11.0
[bs-rtl]: https://getbootstrap.com/docs/5.3/getting-started/rtl/
[Adding a community page]: /docs/content/adding-content/#adding-a-community-page
[params.ui.sidebar_menu_truncate]: /docs/content/navigation/#side-nav-options
[rtl]: /docs/language/#right-to-left-languages

## v0.10.0 {#v0.10.0}

For an introduction to this release, see the [0.10.0 release report][]. For the
full list of changes, see the [0.10.0][] release page.

**New**: color themes and dark-mode support! For details, see [Color themes and
dark-mode support][dark-mode].

**Breaking changes**:

- Removed shortcode `card-code` that was [deprecated in 0.7.0](#v0.7.0); use
  shortcode `card` with named parameter `code=true` instead.
- The following SCSS variables are inlined in favor of dark-mode compatible
  styling: `$border-color`, `$td-sidebar-tree-root-color`,
  `$td-sidebar-bg-color`, `$td-sidebar-border-color` ([#1952][])

**Style changes** (potentially breaking):

- Adjusted the style of various shortcodes and elements so that they are
  compatible with light/dark mode. For details, see **Important style changes**
  in [Color themes and dark-mode support][dark-mode].

[#1952]: https://github.com/google/docsy/pull/1952
[0.10.0]: https://github.com/google/docsy/releases/v0.10.0
[0.10.0 release report]: /blog/2024/0.10.0/
[dark-mode]: /blog/2024/0.10.0/#color-themes-and-dark-mode-support

## v0.9.1 {#v0.9.1}

Patch release. For details, see [0.9.1][].

[0.9.1]: https://github.com/google/docsy/releases/v0.9.1

## v0.9.0 {#v0.9.0}

For an introduction and commentary, see the [0.9.0 release report][]. For the
full list of commits, see the [0.9.0][] release page. The most significant
changes of this release are listed next.

**Breaking changes**:

- **[Repository Links][]** now work for [multi-language][] sites ([#1744][]).

  For any given page, repository links are now computed from a page's _resolved_
  `File` path &mdash; as resolved _through_ mount points, if any. That is, the
  path used is the one that refers to the file's actual location on disk, not
  its logical path in Hugo's [union file system][].

  This is a breaking change for pages of sites that use mounts and
  [path_base_for_github_subdir][]. Projects will need to adjust the value of
  [path_base_for_github_subdir][] to be relative to the file's physical
  location.

- Class names to disable [repository links][] were misnamed with a suffix of the
  form `--KIND`. The new suffix is `__KIND`. For details, see [Disabling
  links][].

- **Heading self-link** support has been reimplemented and projects must now
  explicitly enable the feature. For details, see [Heading self
  links][0.9.0:hsl].

**Footer changes**: refactoring, for easier customization, and simplification.
For details concerning all footer changes, see [#1818][].

- **Footer layout** factored into parts: _left_, _right_, and _center_, with
  _copyright_ a subpart of center. For details see [Footer layout][]
- **Footer copyright**, supports date-range, and site copyright fallback. For
  details, see [Footer copyright][].
- **Footer streamlined**: the About-page footer link and All-rights-reserved
  text are now hidden by default. For details, see [Footer streamlined][].

**Other changes**:

- The latest release of **[Mermaid][] resources** are now fetched at build time
  ([#1410][]).
- [Look and feel][] updates.

[0.9.0]: https://github.com/google/docsy/releases/v0.9.0
[0.9.0 release report]: /blog/2024/0.9.0/
[#1410]: https://github.com/google/docsy/pull/1410
[#1744]: https://github.com/google/docsy/pull/1744
[#1818]: https://github.com/google/docsy/pull/1818
[disabling links]: /docs/content/repository-links/#disabling-links
[Footer layout]: /blog/2024/0.9.0/#footer-layout
[Footer copyright]: /blog/2024/0.9.0/#footer-copyright
[Footer streamlined]: /blog/2024/0.9.0/#footer-streamlined
[0.9.0:hsl]: /blog/2024/0.9.0/#heading-self-links
[look and feel]: /blog/2024/0.9.0/#look-and-feel
[mermaid]: /docs/content/diagrams-and-formulae/#diagrams-with-mermaid
[multi-language]: /docs/language/
[path_base_for_github_subdir]:
  /docs/content/repository-links/#path_base_for_github_subdir-optional
[Repository Links]: /docs/content/repository-links/
[union file system]:
  https://gohugo.io/getting-started/directory-structure/#unified-file-system

## v0.8.0 {#v0.8.0}

For the full list of changes, see the [0.8.0][] release page.

**Breaking changes**:

- Docsy is packaged as a **single Hugo module** ([#1120][]). For details, see
  [Use Docsy as a Hugo Module][].
- **Important**: for non-Hugo-module projects, running `npm install` in the
  Docsy theme directory now creates a `github.com` sibling folder (via Docsy's
  `postinstall` script). For guidance on the Hugo-reported "failed to load
  modules" error, see [#2116][].
- **Page feedback**, or [User feedback][]:
  - In support of projects configuring analytics outside of Docsy, feedback
    functionality is enabled regardless of whether
    `site.Config.Services.GoogleAnalytics.ID` is set ([#1727][]).
  - Feedback-event attribute changes ([#1726][]):
    - Event `name` is `page_helpful`rather than`click`
    - Event `value` for "yes" is 100 by default, rather than 1, allowing for
      more response options in the future. To override the default set
      `params.ui.feedback.max_value`.
- SCSS: `@function prepend()` and file `assets/scss/support/_functions.scss`
  have been dropped. Instead use the more general SASS/SCSS list `join()`
  function ([#1385][]).

[#1120]: https://github.com/google/docsy/issues/1120
[#1385]: https://github.com/google/docsy/issues/1385
[#1726]: https://github.com/google/docsy/pull/1726
[#1727]: https://github.com/google/docsy/pull/1727
[#2116]: https://github.com/google/docsy/issues/2116
[0.8.0]: https://github.com/google/docsy/releases/v0.8.0
[Docsy as an NPM package]:
  /docs/get-started/other-options/#option-3-docsy-as-an-npm-package
[Use Docsy as a Hugo Module]: /docs/get-started/docsy-as-module/
[User feedback]: /docs/content/feedback/#user-feedback

## v0.7.2 {#v0.7.2}

For the full list of changes, see the [0.7.2][] release page. We mention some
noteworthy changes here:

- **Algolia**
  - [#1651][] DocSearch fixed for mobile and for sites with two search boxes (in
    the top and left navs).
  - [#1662][] DocSearch is supported by Docsy through site config.
  - For details, see [Algolia DocSearch][].
- **[Tabbed panes][]**:
  - `persistLang` is deprecated, use `persist` instead
  - Persistence is enabled by default (independent of the old `persistLang`
    parameter value) ; to disable use `persist=disabled`
  - Various fixes and enhancements, with more to come; for details, see
    [#1641][] and [Tabbed panes][].
- **Left-nav**, and **right-nav** (TOC + page meta): spacing issues have been
  resolved; for details, see [#1661][].

[#1641]: https://github.com/google/docsy/issues/1641
[#1651]: https://github.com/google/docsy/pull/1651
[#1661]: https://github.com/google/docsy/pull/1661
[#1662]: https://github.com/google/docsy/pull/1662
[0.7.2]: https://github.com/google/docsy/releases/v0.7.2
[Algolia DocSearch]: /docs/content/search/#algolia-docsearch
[Tabbed panes]: /docs/content/shortcodes/#tabbed-panes

## v0.7.1 {#v0.7.1}

For the full list of changes, see the [0.7.1][] release page.

Followup changes to **Bootstrap (BS) 5.2 upgrade** ([#470][]):

- `td-blog-posts-list__item` and `td-blog-posts-list__body` replace the `.media`
  and `.media-body` classes, dropped by BS 5 [#1560][].
- Docsy test for Bootstrap version has been made more robust, and can be
  disabled. For details, see [#1579][].

[#1560]: https://github.com/google/docsy/issues/1560
[#1579]: https://github.com/google/docsy/issues/1579
[0.7.1]: https://github.com/google/docsy/releases/v0.7.1

## v0.7.0 {#v0.7.0}

For the full list of changes, see the [0.7.0][] release page.

**New**:

- **Click to copy button for Chroma-highlighted code blocks**: If you already
  implemented this functionality on your website, you can disable it. For
  details see [Chroma highlighting docs][chroma-docsy].

**Breaking changes:**

- [**Hugo** release][hugo-releases] **0.110.0** or later is required.
- **Upgraded Bootstrap ([#470][])** to v5.2. For a list of Bootstrap's breaking
  changes, see the [Bootstrap migration page][bsv5mig]. Docsy-specific changes:
  - Clean up of unused, or rarely used, variables, functions, and mixins:
    - Dropped `$primary-light`
    - Dropped `color-diff()`
    - Dropped `bg-gradient-variant()` mixin ([#1369][])
  - Docsy's RTL support has been removed because it is incompatible with BSv5.
    For progress on the reintroduction of RTL support, see [#1442][].
- **Shortcodes**:
  - Now using Hugo's native support for processing HTML & markdown, not file
    extension testing. ([#906][])
  - Dropped support for pre-Hugo-0.54.x behavior of [shortcodes with
    markdown][], `{{%/*...*/%}}`. ([#939][])
  - `blocks/section`: **default** and accepted values of the `type` argument
    have changed! For details, see [blocks/section][] ([#1472][]).
  - **Card shortcodes** ([#1376][])]:
    - Renamed CSS class `td-card-deck` to `td-card-group`.
    - `card`, `card-code`: markup of inner content (HTML/markdown) now depends
      on the syntax of the calling shortcode, not on extension of page file any
      more [#906][].
    - `card-code` is deprecated; use `card` with named parameter `code=true`
      instead.

[chroma-docsy]: /docs/content/lookandfeel/#code-highlighting-with-chroma
[shortcodes with markdown]:
  https://gohugo.io/content-management/shortcodes/#notation

- **Detection of draw.io diagrams** is now **disabled** by default [#1185][]

**Other changes**:

- `$list-inline-padding` is increased in support of footer icons ([#1523][]). If
  this global adjustment is a problem for your project, let us know and we can
  contextualize the adjustment to the footer.
- Non-breaking changes that result from the Bootstrap v5 upgrade:
  - Draw.io diagram edit button: replaced custom colors by BS's outline primary.

[#1185]: https://github.com/google/docsy/issues/1185
[#1369]: https://github.com/google/docsy/issues/1369
[#1376]: https://github.com/google/docsy/issues/1369
[#1442]: https://github.com/google/docsy/issues/1442
[#1472]: https://github.com/google/docsy/issues/1472
[#1523]: https://github.com/google/docsy/pull/1523
[#470]: https://github.com/google/docsy/issues/470
[#906]: https://github.com/google/docsy/issues/906
[#939]: https://github.com/google/docsy/issues/939
[0.7.0]: https://github.com/google/docsy/releases/v0.7.0
[blocks/section]: /docs/content/shortcodes/#blocks-section
[bsv5mig]: https://getbootstrap.com/docs/5.2/migration/
[hugo-releases]: https://github.com/gohugoio/hugo/releases

## v0.6.0 {#v0.6.0}

For the full list of changes, see the [0.6.0][] release page.

With this release we declare a feature freeze while we migrate to the newest
Bootstrap version. See [the announcement][bs-announcement] for more information.

**New**:

- **Simplified use of mermaid diagrams**: when using a `mermaid` code block on
  your page, mermaid is now automatically enabled (needs hugo version >=
  0.93.0). For existing sites built with hugo 0.93.0+, parameter
  `mermaid.enable` can be removed from site config.

- **Add render hook for chem code blocks**: add auto-activation of `math` and
  `chem` blocks via KaTeX and mhchem. Support for formula rendering activation
  on individual pages only. Hugo version >= 0.93.0 required.

[0.6.0]: https://github.com/google/docsy/releases/v0.6.0
[bs-announcement]: https://github.com/google/docsy/discussions/1308

## v0.5.1 {#v0.5.1}

For the full list of changes, see the [0.5.1][] release page. **BREAKING
CHANGES** are documented below.

**After you update** your project's Docsy:

- Update your project setup (see [0.4.0][]) if you haven't already.
- Run `npm install`.

**New**:

- Projects can now install and use [Docsy as an NPM package][].

**Breaking changes**:

- **Tabbed panes, text display**. By default, the content of a tab inside a
  tabbed pane is shown as code. As of version 0.4 of the shortcode, you can add
  the parameter `code=false` to your `tabpane` or `tab` shortcode in order to
  render tab content(s) as text (markdown or html). As of version 0.5 the name
  of this parameter was changed, we now use `text=true` in order to mark content
  as text.
- **Display logo by default**. Most projects show their logo in the navbar. In
  support of this majority, Docsy now displays a logo by default. For details on
  how to hide the logo (or your brand name), see [Styling your project logo and
  name][].
- **Upgraded Bootstrap** to v4.6.2 from v4.6.1, resulting in some style changes
  (such as an adjustment in the size of `small`). For details, see [v4.6.2
  release page].
- **[Upgraded FontAwesome to v6][]** from v5. While many icons were renamed, the
  v5 names still work. For details about icon renames and more, see [What's
  changed in v6][].
- **Search-box**: the HTML structure and class names have changed, due to the
  Font Awesome upgrade, for both online and offline search. This may affect your
  project if you have overridden search styling or scripts.

**Other changes**:

- By default, Docsy now uses the [gtag.js][] analytics library for all site
  tags. For details, see [Adding Analytics > Setup][].

[0.5.1]: https://github.com/google/docsy/releases/v0.5.1
[adding analytics > setup]: /docs/content/feedback/#setup
[v4.6.2 release page]: https://github.com/twbs/bootstrap/releases/tag/v4.6.2
[gtag.js]: https://support.google.com/analytics/answer/10220869
[styling your project logo and name]:
  /docs/content/lookandfeel/#styling-your-project-logo-and-name
[upgraded fontawesome to v6]:
  https://web.archive.org/web/20251117042118/https://docs.fontawesome.com/v6/web/setup/upgrade
[what's changed in v6]:
  https://web.archive.org/web/20251116052945/https://docs.fontawesome.com/v6/web/setup/upgrade/whats-changed

## v0.5.0 {#v0.5.0}

Unpublished.

## v0.4.0 {#v0.4.0}

For the full list of changes, see the [0.4.0][] release page. Potential
**BREAKING CHANGES** are documented below.

**After you update** your project's Docsy, run `npm install`.

**Update your project setup**:

If your project uses Docsy as follows:

- [Hugo Module][], then this change doesn't impact you.
- For [other Docsy setups][], this is a **BREAKING CHANGE** -- read on.

Docsy now fetches Bootstrap and FontAwesome as NPM packages rather than git
submodules. This has an impact on your project-build setup. To migrate your
site, follow these steps (execute commands from your project's root directory):

1.  Delete obsolete Docsy Git submodules:
    ```sh
    git rm themes/docsy/assets/vendor/Font-Awesome
    git rm themes/docsy/assets/vendor/bootstrap
    ```
    These commands remove the submodules from Git's tracking, from the
    `.gitmodules` file, and deletes the submodule files under
    `themes/docsy/assets/vendor`.
2.  Get Docsy dependencies:
    ```sh
    (cd themes/docsy && npm install)
    ```
3.  Update your build scripts to fetch Docsy dependencies automatically. For
    example, if your site build uses NPM scripts, consider getting Docsy
    dependencies via a [prepare][] script as follows:
    ```json
    {
      "name": "my-website",
      "scripts": {
        "prepare": "cd themes/docsy && npm install",
        "...": "..."
      },
      "...": "..."
    }
    ```
4.  (Optional) Build script cleanup. If your project uses Docsy as a git
    submodule, Docsy updates no longer require the `--recursive` flag when
    running `git submodule update`. Consider dropping the flag if you have no
    other recursive git submodules.

Proceed as usual to build or serve your site.

[0.4.0]: https://github.com/google/docsy/releases/v0.4.0
[hugo module]: /docs/get-started/docsy-as-module/
[other docsy setups]: /docs/get-started/other-options/
[prepare]:
  https://docs.npmjs.com/cli/v10/using-npm/scripts#prepare-and-prepublish

## v0.3.0 {#v0.3.0}

For the full list of changes, see the [0.3.0][] release page.

**Breaking changes**:

- Upgrade to
  [Algolia DocSearch v3](https://docsearch.algolia.com/docs/v3/docsearch). If
  your site uses the deprecated DocSearch v2, you must
  [update your DocSearch code](https://docsearch.algolia.com/docs/v3/migrating-from-v2).
- (**Edit**) [#1009][] inadvertently changed the base [Bootstrap styles for
  cards][bs4cards], as well as the Docsy `highlight` style. For details, see
  [issue #1154][]. Release [0.5.1][] includes a fix.

[0.3.0]: https://github.com/google/docsy/releases/v0.3.0
[bs4cards]: https://getbootstrap.com/docs/4.1/components/card/
[#1009]: https://github.com/google/docsy/pull/1009
[issue #1154]: https://github.com/google/docsy/issues/1154

## v0.2.0 {#v0.2.0}

For the full list of changes, see the [0.2.0][] release page.

**New**:

- Add official Docsy support for [Hugo modules][]. Many thanks to the dedicated
  and patient efforts of [@deining][], who researched, experimented, and
  implemented this feature. Thanks to [@deining][] and [@LisaFC][] for the doc
  updates.

  For details, see
  [Migrate to Hugo Modules](/docs/update/convert-site-to-module/).

[@deining]: https://github.com/deining
[@lisafc]: https://github.com/LisaFC
[0.2.0]: https://github.com/google/docsy/releases/v0.2.0
[hugo modules]: https://gohugo.io/hugo-modules/
[semver]: https://semver.org/

<!-- ENTRY TEMPLATE ------------------------------------------------------

```
## v0.X.Y

> **UNRELEASED: this planned version is still under development**

For the full list of changes, see the [0.X.Y][] release page.

[**Breaking changes**](#breaking-change):

- ...

**New**:

- ...

**Other changes**:

- ...

[**Experimental**](#experimental):

- ...

**For maintainers**:

- ...

[0.X.Y]: https://github.com/google/docsy/releases/latest?FIXME=v0.X.Y
```

---------------------------------------------------------------------------->
