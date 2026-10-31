---
title: Hugo 0.165.0-0.166.0 upgrade guide
linkTitle: Hugo 0.165+
date: 2026-10-06
description: >-
  Security hardening, a rewritten glob matcher, and a few smaller changes can
  break a Docsy site's build or silently change its output. Find the ones that
  apply to your site, each with its fix.
author: >-
  [Patrice Chalin](https://github.com/chalin) ([CNCF](https://www.cncf.io/)),
  for the [Docsy Steering Committee](/blog/2022/hello/#introducing-the-psc)
body_class: release-highlights
tags: [hugo, upgrade]
params:
  docsyReleaseVers: 0.18.1
  hugoSupportedVers: 0.166.0
  katexMinVers: 0.18.4 # what Hugo 0.166.0's bundled KaTeX needs
---

This post is a companion to the [Docsy 0.18 release post][0.18], whose [upgrade
section][0.18-upgrade] names the supported Hugo version.

## Upgrade summary

- **This guide is for you if** you're:
  - [Upgrading to Docsy 0.18][0.18-upgrade] from Hugo 0.164.x or older
  - Upgrading only Hugo, past 0.164.x
- Review {{% _param BADGE BREAKING warning %}} changes:
  <a id="breaking-changes"></a>
  - {{% _param BREAKING %}} [Security hardening](#security): Node tools,
    symlinked mounts, remote fetches, Org content
  - {{% _param BREAKING %}} [Glob matching rewritten](#globs)
  - {{% _param BREAKING %}} [KaTeX stylesheet floor](#katex)
  - {{% _param BREAKING %}} [URL and template changes](#urls-templates)
  - {{% _param BREAKING %}} [Tailwind allow-list (0.165.0)](#tailwind)
- Review **deprecations**: [Imaging config](#imaging)
- Where a step sets a [`security`][hugo-security] list, write the whole list:
  Hugo replaces a configured list rather than merging it with the default.
- {{% _param FAS rocket primary %}} Jump to
  [Upgrade to Hugo {{% param hugoSupportedVers %}}](#upgrade) once you're ready.

## {{% _param BREAKING %}} Security hardening (0.166.0) {#security}

Hugo 0.166.0 is mostly a hardening release: it drops symlinked mounts, confines
Node tools to allowed roots, checks the addresses that remote fetches resolve
to, and denies Org mode content by default. Each item can stop a site's build or
silently drop its files. For the details, see Hugo's [0.166.0][hugo-0.166.0]
release notes.

### Actions {#security-actions}

{{% _param BREAKING %}} **Applies if** your project has a symlink that resolves
outside it, under `node_modules` for example. Hugo 0.166.0 fails PostCSS and
other Node tools before running them when a symlink escapes the allowed roots. A
symlinked theme directory (`themes/docsy -> ../docsy`) counts when PostCSS runs
(Docsy runs it in production with a `postcss.config.*`, and for RTL languages).

- Set `security.node.permissions.allowRead` to the whole list with the link's
  target added, `['.', 'TARGET']`, where _`TARGET`_ is the path the link
  resolves to.

{{% _param BREAKING %}} **Applies if** a symlink sits on a mount's path,
wherever it points: a mount root such as `assets/` or a module mount's `source`
(dropped since 0.166.0), a directory inside one such as `assets/vendor/x`
(dropped since 0.165.0), or a relative `source` that passes through a link (a
symlinked theme directory still mounts). Docsy's own mounts read two
`node_modules` packages through three mounts, which pnpm and `npm link` install
as symlinks: the Bootstrap and Font Awesome Sass imports then fail with no
pointer to the cause, and the Font Awesome webfonts vanish from an otherwise
green build.

- Replace the link with the real directory (for pnpm, `node-linker=hoisted`), or
  mount the link's target by an absolute `source`, for every mount the link
  affects, and re-declare your project's own `assets` and `static` mounts: a
  project mount for a component [replaces Hugo's default mount][default-mounts]
  for it, silently.

{{% _param BREAKING %}} **Applies if** your build runs behind an `HTTP_PROXY` or
`HTTPS_PROXY`. Docsy itself fetches Mermaid, MarkMap, and KaTeX assets at build
time, so a proxied build is affected even if your templates fetch nothing: Hugo
0.166.0 ignores the proxy variables unless told to honor them.

- Set `security.http.proxyFromEnvironment` to `true`.

{{% _param BREAKING %}} **Applies if** your build fetches resources from a
private or internal host. Hugo 0.166.0 rejects loopback, private, link-local,
and CGNAT addresses under the default `security.http.urls` allowlist.

- Set `security.http.urls` to a list naming your hosts and the CDNs Docsy
  fetches from (`cdn.jsdelivr.net`, `unpkg.com`): the address check stands down
  for a customized list.

{{% _param BREAKING %}} **Applies if** your content includes Org mode files
(`.org`). Hugo 0.166.0 denies `text/org` by default, as it passes raw HTML
through.

- Opt back in by setting `security.allowContent` to the whole list without the
  `text/org` denial: `['! ^text/html$']`.

## {{% _param BREAKING %}} Glob matching rewritten (0.166.0) {#globs}

Hugo 0.166.0 replaced its glob-matching engine. Patterns that relied on the old
engine's bugs match differently; literal paths are unaffected.

- `**/` matches one or more directories; the old engine also let it match none:
  - `**/x` no longer matches a top-level `x`. Add `x` as a second pattern; the
    `{**/,}x` alternation matches nothing before 0.166.0.
  - `a/**/b` no longer matches `a/b`.
- `\` is an escape character.
- Malformed patterns fail the build.

### Actions {#globs-actions}

{{% _param BREAKING %}} **Applies if** your site uses glob patterns:

- In config: module mounts' `includeFiles`, `excludeFiles`, and `files`;
  `cascade` targets; `segments`; `deployment` targets' `include` and `exclude`;
  `noVendor`.
- In templates: `.Resources.Match`, `resources.Match`, and kin.

Then:

- Re-test each pattern against the files it should select.
- For a `!` exclusion, also check the built output for files that should be
  absent: a pattern that stops matching publishes them with no warning.

## {{% _param BREAKING %}} KaTeX stylesheet floor (0.166.0) {#katex}

Hugo 0.166.0's bundled KaTeX, the one behind `transform.ToMath` and Docsy's
`math` fences, emits markup that needs a KaTeX {{% param katexMinVers %}} or
later stylesheet; an older one misrenders some expressions. Docsy's default pin
has satisfied it since 0.17.0; for the 0.18 pin, see the [supported
versions][0.18-upgrade].

### Actions {#katex-actions}

{{% _param BREAKING %}} **Applies if** your site renders math and serves a KaTeX
stylesheet below {{% param katexMinVers %}}, through `params.katex.version` or
an overridden `scripts/katex.html`.

- Remove your pin to take Docsy's default, or update an overridden partial's
  stylesheet to the [supported version][0.18-upgrade]; for a custom pin, see
  [KaTeX version][katex-docs].

## Imaging config deprecations now warn (0.166.0) {#imaging}

Hugo 0.163.0 [deprecated](hugo-0.158.0+/#imaging) the global `imaging.quality`
and `imaging.compression` keys for per-format ones; 0.166.0 raises the notice to
a build `WARN`, which fails the update guide's [no-warnings check][check].

### Actions {#imaging-actions}

{{% _param CLEANUP %}} **Applies if** your site config still sets
`imaging.quality` or `imaging.compression`.

- Apply the Hugo 0.158+ guide's
  [Imaging actions](hugo-0.158.0+/#imaging-actions).

## {{% _param BREAKING %}} URL and template changes (0.166.0) {#urls-templates}

Two smaller 0.166.0 changes can move a page or truncate one: a title's `/` no
longer splits a title-derived URL into two segments, and a bare `return` now
works in every template, where it used to be ignored outside partials.

### Actions {#urls-templates-actions}

{{% _param BREAKING %}} **Applies if** your `permalinks` use `:title`, or
`:slug` on pages that set no `slug`, and a title contains a `/`. Hugo 0.166.0
derives one URL segment from the title (`watch-listen-to-this`) where it used to
nest two (`watch/listen-to-this`), so the page's URL moves without a redirect;
filename-based URLs, taxonomy pages, and term pages are unaffected.

- Add an `aliases` entry for the old URL. Under `:slug`, an explicit `slug`
  keeps it; under `:title`, it doesn't.

{{% _param BREAKING %}} **Applies if** your own templates use `return` outside a
partial. Hugo 0.166.0 honors it there: a bare `{{ return }}`, ignored before,
now ends the template's output; `return` with a value fails the build, as it did
before.

- Remove it, or move the logic into a partial.

## {{% _param BREAKING %}} Tailwind allow-list (0.165.0) {#tailwind}

Hugo 0.165.0 is a [feature release][hugo-0.165.0]; besides the symlink rule
above, its change for Docsy sites is that `tailwindcss` left the default
`security.exec.allow` list.

### Actions {#tailwind-actions}

{{% _param BREAKING %}} **Applies if** your site runs Tailwind through
`css.TailwindCSS`.

- Set the list with `tailwindcss` added back:

  ```yaml
  security:
    exec:
      allow:
        [
          '^(dart-)?sass$',
          '^go$',
          '^git$',
          '^node$',
          '^postcss$',
          '^tailwindcss$',
        ]
  ```

## {{% _param FAS rocket primary %}} Upgrade to Hugo {{% param hugoSupportedVers %}} {#upgrade}

After addressing the actions that apply to your site, [upgrade
Hugo][update-hugo] to [{{% param hugoSupportedVers %}}][hugo-supported-version].

### {{% _param FAS square-check primary %}} Sanity checks

Confirm that you've addressed [every action][] that applies to your site. Then:

- Upgrading as part of [Docsy 0.18][0.18]? Continue with its [upgrade
  section][0.18-upgrade].
- Otherwise, finish with the [generic site checks][check].

<!-- prettier-ignore-start -->
[check]: /docs/update/#check
[default-mounts]: https://gohugo.io/configuration/module/#default-mounts
[0.18]: <{{% param docsyReleaseVers %}}/>
[0.18-upgrade]: <{{% param docsyReleaseVers %}}/#upgrade>
[every action]: #upgrade-summary
[hugo-0.165.0]: https://github.com/gohugoio/hugo/releases/tag/v0.165.0
[hugo-0.166.0]: https://github.com/gohugoio/hugo/releases/tag/v0.166.0
[hugo-security]: https://gohugo.io/configuration/security/
[hugo-supported-version]: <https://github.com/gohugoio/hugo/releases/tag/v{{% param hugoSupportedVers %}}>
[katex-docs]: /docs/content/diagrams-and-formulae/#katex-version
[update-hugo]: /docs/update/#update-hugo
<!-- prettier-ignore-end -->
