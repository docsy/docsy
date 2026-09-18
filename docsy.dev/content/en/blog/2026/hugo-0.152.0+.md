---
title: Hugo 0.152.0-0.155.x upgrade guide
linkTitle: Hugo 0.152+ upgrade guide
date: 2026-02-09
author: >-
  [Patrice Chalin](https://github.com/chalin) ([CNCF](https://www.cncf.io/)),
  for the [Docsy Steering Committee](/blog/2022/hello/#introducing-the-psc)
body_class: release-highlights
tags: [hugo, upgrade]
params:
  hugoMinVersion: 0.157.0
# prettier-ignore
cSpell:ignore: dartsass libsass IPTC multihost libwebp opentelemetry
---

This post summarizes the breaking and notable changes in Hugo 0.152.0 to
0.155.3. It is a companion post to the Docsy [0.14.0](0.14.0/) and
[0.13.0](../2025/0.13.0/) release and upgrade guides.

## Upgrade summary

This guide highlights breaking changes in Hugo 0.152.0–0.155.x and the actions
you may need to take.

- Review {{% _param BADGE BREAKING warning %}} changes:
  <a id="breaking-changes"></a>
  - {{% _param BREAKING %}} [YAML yes/no tokens are strings](#yaml-yes-no-etc)
  - {{% _param BREAKING %}}
    [Build order changes for multidimensional sites](#build-order)
- Review **deprecations** (non-breaking, but recommended):
  <a id="deprecations"></a>
  - [`lang` mount option deprecated](#lang-mount-deprecation)
  - [`includeFiles`/`excludeFiles` deprecated](#use-files)
- Optionally skim:
  - [Known issues and fixes](#known-issues)
  - [Notable changes](#notable-changes)
- {{% _param FAS rocket primary %}} Jump to [Upgrade to Hugo 0.155.x](#upgrade)
  once you're ready

## {{% _param BREAKING %}} YAML yes/no tokens are strings (0.152.0) <a id="0.152.0"></a> {#yaml-yes-no-etc}

Release [0.152.0][] (2025-10-21) upgrades to a more modern YAML library, which
introduces a breaking change to the way that YAML interprets certain tokens
across configuration files and page front matter.

Previously, the bare (unquoted) tokens `yes`, `no`, `on`, `off`, etc. were
treated as boolean values. They are now treated as strings. For the complete
list of tokens, see [0.152.0 release notes][yes-no-list].

### Actions: required and optional {#yaml-actions}

- {{% _param BREAKING %}} **Applies if** your project has YAML with unquoted
  `yes`, `no`, `on`, `off`, and similar tokens. Update them to `true` or
  `false`.

  Search for these unquoted key or value tokens:
  - `yes`, `Yes`, `YES`, `y`, `Y`, `on`, `On`, `ON`: change to `true`
  - `no`, `No`, `NO`, `n`, `N`, `off`, `Off`, `OFF`: change to `false`

  Example:

  ```yaml
  # OLD (now broken in 0.152.0+)
  enabled: yes
  disabled: no

  # NEW (correct)
  enabled: true
  disabled: false
  ```

- **Applies if** your project has custom page [Feedback][] configuration. You
  can now drop quotes around keys (or values) containing the tokens [`yes`,
  `no`, etc.][yes-no-list].

  ```yaml
  # OLD
  params:
    ui:
      feedback:
        enable: true
        'yes': Glad to hear it! ...
        'no': Sorry to hear that. ...

  # NEW
  params:
    ui:
      feedback:
        enable: true
        yes: Glad to hear it! ...
        no: Sorry to hear that. ...
  ```

[Feedback]: /docs/content/feedback/#user-feedback

## Multidimensional content model (0.153.0) {#0.153.0}

Release [0.153.0][] (2025-12-19) introduces, among other things, a powerful new
[multidimensional content model][] (over versions and roles in addition to the
previously supported languages dimension) through the new [sites.matrix][]
configuration option.

Breaking and deprecation changes related to multidimensional sites are
summarized next.

### {{% _param BREAKING %}} Build order for multidimensional sites {#build-order}

Hugo now builds sites based on sorted dimensions (by weight, then name) instead
of starting with the default content language. This also affects `.Site.Sites`
sort order.

<!-- TODO: can we use weights to fix the order of sites? -->

### Actions: required and optional {#build-order-actions}

**Applies if** your project relies on a specific site build order or indexing
into `.Site.Sites` by position, for example by accessing `.Site.Sites` by index.
Update your logic to select the default site explicitly.

How you fix your code will depend on how you access the sites. For example, if
your code contains `index site.Sites 0`, then replace it with
`site.Sites.Default`. For more concrete examples, see
[open-telemetry/opentelemetry.io#8850][].

## Deprecations

### `lang` mount deprecation {#lang-mount-deprecation}

#### Actions (recommended) {#sites-matrix-actions}

**Applies if** you use `lang` on mounts. Switch to [sites.matrix][] to avoid
deprecation warnings.

For example:

```yaml
# OLD (deprecated)
- source: content/fr
  target: content
  lang: fr

# NEW
- source: content/fr
  target: content
  sites:
    matrix:
      languages: ['fr']
```

For a concrete example, see [open-telemetry/opentelemetry.io#9070][].

### `includeFiles`/`excludeFiles` deprecation {#use-files}

The `includeFiles`/`excludeFiles` file mount options are deprecated in favor of
the [files][] filter with negation support.

#### Actions (recommended) {#files-actions}

**Applies if** you use `includeFiles` or `excludeFiles` in mounts. Switch to
[files][] to avoid deprecation warnings.

For example:

```yaml
# OLD (deprecated)
- source: content
  target: content
  excludeFiles: ['drafts/**']

# NEW
- source: content
  target: content
  files: ['! drafts/**']
```

> [!CAUTION]
>
> The file exclusion syntax has a leading `!` **followed by a space**. Without
> the space, the glob pattern is treated as a literal path starting with `!`,
> which will fail to exclude the desired files. For a discussion on the topic,
> see [Why does glob negation require a space after?][56651]

For a concrete example, see [open-telemetry/opentelemetry.io#9070][].

## Known issues and fixes {#known-issues}

### Alias handling in 0.153.x {#aliases-issues}

<details>
<summary class="h6 text-primary">Known issues with <b>aliases</b></summary>

In Hugo 0.153.x, alias handling had regressions that affected at least one
Docsy-based site ([docsy.dev][]). The issues were:

- **Default language alias**: behavior changes could cause refresh-page issues.
  See [gohugoio/hugo#14363][#14363] and [gohugoio/hugo#14361][#14361].
- **Page aliases**: could point to the wrong language in some configurations.
  See [Docsy #2433](https://github.com/docsy/docsy/issues/2433). Fixed in
  0.154.0 and 0.155.0 (alias handling improvements).

[#14361]: https://github.com/gohugoio/hugo/issues/14361
[#14363]: https://github.com/gohugoio/hugo/pull/14363

</details>

[docsy.dev]: https://docsy.dev

## Notable changes {#notable-changes}

Notable changes that are non-breaking include:

### 0.155.0 {#notable-0.155.0}

- Version and dimension range queries are now supported in the sites matrix
  (e.g., `>= v1.0.0`).
- Page aliases now work properly in multidimensional sites.
- XMP and IPTC image metadata support was added.

### 0.154.0–0.154.5 {#notable-0.154.x}

- [Partial decorators][] introduced (`inner` keyword) for powerful template
  composition.
- New [`Page.OutputFormats.Canonical`][] method ([0.154.4][]).
- New `reflect.*` functions, such as `reflect.IsPage`.
- Critical fixes for alias handling and site redirects in
  multidimensional/multihost setups.

### 0.153.0 {#notable-0.153.0}

- WebP encoding/decoding now uses `libwebp` via WASM. The extended edition is no
  longer required for WebP.
- Animated WebP support, including conversion to/from animated GIFs.
- `GoogleAnalytics.RespectDoNotTrack` default changed to `true`.
- Duplicate content path warnings were removed (less noisy, but may hide
  issues).
- **macOS distributions** are now distributed solely as signed and notarized
  `.pkg` installers, `.tar.gz` is no longer supported. See the notes below.

> [!NOTE] macOS distributions and the `hugo-extended` NPM package
>
> - You can still extract Hugo executables from macOS installer `.pkg` files;
>   see [hugo-extended#183][] for the `pkgutil` command.
> - The [hugo-extended][] NPM package briefly required `sudo` in versions
>   0.153.0–0.153.3.

## {{% _param FAS rocket primary %}} Upgrade to Hugo 0.155.x {#upgrade}

After addressing all [breaking changes](#breaking-changes) and
[deprecations](#deprecations), upgrade to the latest release of Hugo 0.155.x. If
you use the [hugo-extended][] NPM package, you can upgrade to the latest version
by running:

```sh
npm install hugo-extended@latest
```

If you use [hvm][] to manage your Hugo version, you can upgrade to the latest
version by running:

```sh
hvm use latest
```

<section class="td-checkbox-list-wrapper">

### Sanity checks

After upgrading your project to Hugo 0.155.x, review the following:

- [ ] **Build output**: ensure that your site builds without errors, warnings,
      and deprecation notices.
- [ ] **Aliases**: verify default-language redirects and that page aliases
      resolve to the correct language version (see
      [Alias handling in 0.153.x](#aliases-issues)).
- [ ] **Sites matrix build order**: if you use multidimensional sites, ensure
      that any build-order assumptions still hold (see
      [Build order for multidimensional sites](#build-order)).

### Cross-checks

Ensure that you have addressed all [breaking changes](#breaking-changes). For
your convenience, we link to required and optional actions for each section.

#### Required actions (as applicable) {#required-actions}

- [ ] [YAML token actions](#yaml-actions)
- [ ] [`sites.matrix` actions](#sites-matrix-actions)
- [ ] [`files` actions](#files-actions)
- [ ] [Build order actions](#build-order-actions)

#### Optional review {#optional-review}

- [ ] [Known issues with aliases](#aliases-issues)
- [ ] [Notable changes](#notable-changes)

</section>

### Recommended minimum Hugo version {#min-hugo-version}

For projects using the new sites matrix features who also want the latest fixes
and updated support for aliases in the context of multidimensional sites, we
recommend using Hugo [{{% param hugoMinVersion %}}][hugo-min-version] or later:

```yaml
module:
  hugoVersion:
    min: '{{% _param hugoMinVersion %}}'
```

[0.152.0]: https://github.com/gohugoio/hugo/releases/tag/v0.152.0
[0.153.0]: https://github.com/gohugoio/hugo/releases/tag/v0.153.0
[0.154.4]: https://github.com/gohugoio/hugo/releases/tag/v0.154.4
[56651]:
  https://discourse.gohugo.io/t/why-does-glob-negation-require-a-space-after/56651
[files]: https://gohugo.io/configuration/module/#files
[hugo-extended]: https://www.npmjs.com/package/hugo-extended
[hugo-min-version]:
  <https://github.com/gohugoio/hugo/releases/tag/v{{% param hugoMinVersion %}}>
[hvm]: https://github.com/jmooring/hvm
[multidimensional content model]:
  https://gohugo.io/about/features/#multidimensional-content-model
[open-telemetry/opentelemetry.io#8850]:
  https://github.com/open-telemetry/opentelemetry.io/pull/8850
[open-telemetry/opentelemetry.io#9070]:
  https://github.com/open-telemetry/opentelemetry.io/pull/9070
[hugo-extended#183]: https://github.com/jakejarvis/hugo-extended/issues/183
[Partial decorators]:
  https://gohugo.io/quick-reference/glossary/#partial-decorator
[`Page.OutputFormats.Canonical`]:
  https://gohugo.io/methods/page/outputformats/#canonical
[sites.matrix]: https://gohugo.io/quick-reference/glossary/#sites-matrix
[yes-no-list]: https://github.com/gohugoio/hugo/releases/tag/v0.152.0
