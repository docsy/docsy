---
title: Script loading
description: >-
  Why body-end scripts load through a dispatcher and a config-merged plugin
  registry
---

Docsy loads its body-end JavaScript through
[`_partials/scripts.html`][scripts.html]: a small dispatcher over per-feature
sub-partials under [`_partials/scripts/`][scripts-dir]. (Head-side JS, such as
theme initialization and analytics, is emitted by `_partials/head.html` and is
out of scope here.)

## Loading mechanisms

Before 0.18, `scripts.html` mixed a few sub-partial dispatches (MarkMap,
Mermaid, KaTeX) with the other mechanisms' logic inline. The decomposition moved
every mechanism out of the dispatcher into sub-partials without changing the
default rendered output; the 0.18 plugin conversions then moved the first
integrations onto the [plugin loop](#plugin-loop):

- **Static theme scripts**, emitted as plain script tags: `deflate.js`
  (PlantUML), `prism.js`.
- **The main bundle**: Bootstrap plus the theme's core and feature scripts
  (search, PlantUML, draw.io; dark mode and ScrollSpy when enabled),
  concatenated into `main.js` (`scripts/main-bundle.html`), minified and
  fingerprinted in production. A site param picks which search script is
  bundled, `search.js` or `offline-search.js`.
- **Theme plugins**: MarkMap, tab persistence, and click-to-copy ride the plugin
  loop as theme-default registry entries, their legacy params aliased for a
  deprecation cycle ([implementation notes][impl]).
- **Pinned CDN tags with inline configuration**: Algolia DocSearch.
- **Build-time remote fetches**: KaTeX, whose CSS and fonts are copied and
  re-served as local assets; Mermaid, whose pinned version is validated at build
  time while the browser imports the module straight from the CDN; and the
  MarkMap autoloader, vendored at build time and served same-origin with SRI.

Gating lives at two levels. The dispatcher gates PlantUML (site param) and
Mermaid and KaTeX (`.Page.Store` flags); MarkMap's plugin shim carries the same
page-flag pattern (`hasMarkmap`), while the remaining sub-partials gate
internally (Algolia search configuration, Prism, search bundle choice, dark
mode, ScrollSpy). Tab persistence ships ungated ([why](#gating-decisions)).

## The dispatcher as a seam

The decomposition has two design consequences:

- **Independent overrides**: each sub-partial resolves through Hugo's union file
  system, so a site can replace one sub-partial by shadowing one file instead of
  copying all of `scripts.html`.
- **Plugin dispatch**: the dispatcher is where the [plugin loop](#plugin-loop)
  plugs in ([#2789][]).

### Override points

- Every sub-partial the dispatcher routes to under `_partials/scripts/`.
- `_partials/algolia/head.html` and `_partials/scripts/algolia.html`: real
  partials as of 0.18, replacing inline `define`s whose documented override
  paths did not work (the internal template names `algolia/head` and
  `algolia/scripts` no longer exist).
- Per plugin: the script asset `assets/js/plugins/NAME.js`, its companion
  partial, its companion stylesheet, and its shim ([file contract][ug-files]).

## The plugin loop {#plugin-loop}

[`scripts/plugins.html`][plugins.html] emits each eligible plugin registered in
`params.docsy.plugins`. For the configuration reference and plugin file
contract, see the [plugins guide][ug-plugins]; for the loop's mechanics, the
[implementation notes][impl].

### Registry shape: a map, layered by Hugo's config merge {#registry-shape}

The registry is a **map keyed by plugin name**, and the theme declares its own
plugins in `theme/hugo.yaml` under the same key. Hugo's theme-to-site
configuration merge is deep for maps ([Configuration § Theme
defaults][ug-config-merge]), so a site's map layers over the theme's:

- **Supersession and inheritance come free**: a site entry for a theme plugin
  merges field by field (`markmap: { enable: true }` keeps the theme's
  `version`).
- **Duplicates are impossible**: map keys are unique. The loop needs no
  deduplication, no first-wins rule, no supersession bookkeeping.
- **A plugin dependency's version pin is an entry field**, not an option and not
  a top-level `params.NAME.*` key:
  - Plugin settings share one key and one environment-override prefix.
  - Keeping the pin outside `options` keeps it out of the built JavaScript,
    which never reads it.
  - The loop validates the pin once, for every companion that builds a fetch URL
    from it.
- **The schema is data**: `data/docsy/schema/params/docsy.yaml` declares the
  entry contract once, for the loop and the docs alike. Enforcement stays
  hand-coded in the loop: Hugo offers no validation for `params`, and no
  surveyed theme validates site params (Hinode's data-driven `Args.html` covers
  shortcode arguments only).
- **The loop is generic**: it knows no plugin names. Theme defaults are
  configuration, not template code; plugin-specific behavior lives in the
  plugin's own files: its script, its companions, and its shim, which adjusts
  the entry per page ([shims][ug-shims]).
- **Plugins use site configuration**: language-specific site parameters apply;
  page front matter does not define registry entries.

Alternatives considered, and why not:

- **A list of entries** (the initial shape, superseded before release): lists
  are replaced, not merged, by Hugo's config merge, so theme defaults had to
  live in template code and every override, turn-off, or duplicate needed loop
  logic, which grew a name-keyed defaults table and plugin-specific branches
  inside the generic loop.
- **A per-plugin manifest file** next to the script: plugin-owned defaults, but
  a third artifact per plugin, and the theme still needs a configuration home
  for which plugins are on by default. Revisit if module-shipped plugins need
  self-describing metadata (module trust: [implementation § Security
  constraints][impl-security]).
- **Metadata partials** returning a defaults dict: pure Hugo, but metadata as
  template code is less inspectable than configuration.

Named collections in Hugo's own configuration (`outputFormats`, `mediaTypes`,
`languages`, `taxonomies`) are maps keyed by name; the registry follows that
idiom.

### Gating decisions

- **A theme default gates only on render-hook flags.** A shortcode's flag stays
  on the page whose file contains it, so included content loses it (the
  mechanics, for site authors: [Plugins § Page flags in included
  content][ug-flags]). MarkMap (hook-flagged) is gated by default; tab
  persistence (shortcode-produced) ships ungated on every page, as before 0.18:
  no flag is set for it.
- **Gating is the plugin's, not a registry field.** The plugin's hook sets a
  flag and its shim reads it, the pairing the dispatcher uses for `hasmermaid`
  and `hasMath`; a site widens a gate by setting the flag from
  `hooks/head-end.html` ([MarkMap guide][ug-markmap-render]). A gate field in
  configuration would be a flag name kept in sync with the hook by convention,
  and no site needs one; across static-site generators, per-page loading is the
  theme's call with no switch, and where a switch exists it is an enum, never a
  flag name.
- **Design of record for a switch**, should a second gated core plugin or a
  plugin author ask for one: `scope: site | page` on the entry, with the theme
  declaring each plugin's default. For an including page that needs a gated
  plugin, the shape is a per-page front-matter override instead.
- **The markmap render hook sets the flag and renders Hugo's default code
  block** (`transform.HighlightCodeBlock`), leaving the browser-side transform
  to the plugin script, so a disabled plugin leaves the fence exactly as Hugo
  would render it. Mermaid's hook keeps its library-shaped markup
  (`<pre class="mermaid">`) because the library reads it; whether Mermaid should
  move to the default-render shape is a queued question ([#2789][]).
- **Known limitation: section print.** The `print` output format for sections
  renders descendants' `.Content` under the section page, whose Store never
  receives the children's flags, so gated plugins don't ship in a printed
  section (Mermaid and KaTeX have had the same gap since their flags were
  introduced). Accepted for 0.18.

### Ordering decisions

- **Neutral weight group**: the [emission-order contract][ug-config] uses zero
  as the normal group, leaving room for earlier and later plugins without an
  `auto` mode or dependency graph. Sorting ties by name keeps output
  reproducible, but is an implementation detail, not a dependency guarantee.
- **Companions before the script**: a plugin's companion partial and stylesheet
  emit before its script tag, so a synchronous plugin script can rely on
  companion markup and styles being present.
- **Body-end CSS (interim placement)**: the companion stylesheet's `<link>` is
  emitted where the loop runs (at the end of `<body>`), not in `<head>`, because
  gating shims read `.Page.Store` flags that are only reliable after content
  render. Moving companion CSS into the head is a possible later refinement, and
  has to solve that constraint or gated CSS silently drops ([#2789][]).

## Related pages

- [Implementation: script loading][impl]
- [Quality notes][quality]: the test nets that pin this behavior

<!-- prettier-ignore-start -->
[#2789]: https://github.com/google/docsy/issues/2789
[impl]: /project/implementation/script-loading/
[impl-security]: /project/implementation/script-loading/#security-constraints
[plugins.html]: https://github.com/google/docsy/blob/main/theme/layouts/_partials/scripts/plugins.html
[quality]: /project/quality/script-loading/
[ug-config-merge]: /docs/content/configuration/#theme-defaults-and-your-overrides
[ug-config]: /docs/content/plugins/#configuration-reference
[ug-flags]: /docs/content/plugins/#page-flags-in-included-content
[ug-shims]: /docs/content/plugins/#adjust-a-plugin-per-page
[ug-markmap-render]: /docs/content/diagrams-and-formulae/#when-a-markmap-doesnt-render
[ug-files]: /docs/content/plugins/#plugin-files
[ug-plugins]: /docs/content/plugins/
[scripts-dir]: https://github.com/google/docsy/blob/main/theme/layouts/_partials/scripts/
[scripts.html]: https://github.com/google/docsy/blob/main/theme/layouts/_partials/scripts.html
<!-- prettier-ignore-end -->
