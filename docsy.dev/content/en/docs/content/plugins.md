---
title: Plugins
description:
  Turn Docsy's optional scripts on or off and load your own from site
  configuration, no layout overrides needed.
---

Docsy loads some of its optional JavaScript features, and any script you add, as
**plugins**: entries under `params.docsy.plugins` in your site configuration.

## Configure Docsy's plugins

| Plugin            | What it does (Default / Loads on)                                                           | Learn more                     |
| ----------------- | ------------------------------------------------------------------------------------------- | ------------------------------ |
| `click-to-copy`   | Adds a copy button to code blocks (On, but off under Prism, which has its own / Every page) | [Copy to clipboard][]          |
| `tabpane-persist` | Remembers the selected tab across pages (On / Pages with a [`tabpane`][] shortcode)         | [`tabpane`][]                  |
| `markmap`         | Renders `markmap` code blocks as mind maps (Off / Pages with a `markmap` code block)        | [Activating MarkMap support][] |

To turn a plugin off, set its `enable` field to `false`:

<!-- markdownlint-disable no-shortcut-ref-link -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[params.docsy.plugins.click-to-copy]
enable = false
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
params:
  docsy:
    plugins:
      click-to-copy:
        enable: false
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "params": {
    "docsy": {
      "plugins": { "click-to-copy": { "enable": false } }
    }
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-enable no-shortcut-ref-link -->

## Configuration reference

Docsy's own plugins are declared in the theme's [`hugo.yaml`][theme-defaults];
your entries merge over them by name and field ([Configuration § Theme
defaults][config-merge]). The schema defines each entry's keys, required fields,
types, defaults, and syntactic patterns:

{{< readfile file="/data/docsy/schema/params/docsy.yaml" code="true" lang="yaml" >}}

- Fields are optional unless marked `required: true`.
- `{}` for a theme plugin keeps every inherited field, including `enable`.
- `enable` is off for `false`, `"false"`, and `0`, and on for any other value;
  `defer` is on for `true`, `"true"`, and `1`, and off for any other value. The
  string forms exist for [environment overrides][config-env].
- `weight` controls emission order within the plugin registry:
  - Lower values emit first. Omitted weight and explicit `0` form the normal
    group; negative values precede it, positive values follow it.
  - Use distinct weights when order matters; equal-weight order is unspecified.
  - Weight does not override `defer` or wait for asynchronous initialization.
    Use the dependency's readiness mechanism when needed.

For guidance on using `version`, see
[Dependency versions](#dependency-versions).

### Warnings

Every registry shape warning carries the id `docsy-config` (to silence one, see
[Configuration § Configuration warnings][config-warnings]):

- An unknown field or a non-map `options` is ignored and the rest of the entry
  applies.
- A name the schema's pattern rejects or that ends in its reserved suffix, a
  scalar entry, or an entry missing a required field drops the whole entry.
- A `params.docsy` or `params.docsy.plugins` that is not a map empties the
  registry, Docsy's own plugins and their deprecated aliases included.
  `plugins: {}` keeps them; a valueless `plugins:` is null and drops them.
- An empty registry after configuration merging warns; a registry with all
  entries disabled is valid.
- An enabled name with no script file ([Plugin files](#plugin-files)) is a
  different fault: it warns `docsy-plugin-missing` (a disabled entry is never
  looked up).

`version` validation applies to entries not already dropped by the shape guards,
including disabled entries. An exact `X.Y.Z` passes without a version warning;
another value matching the schema's pattern, such as `latest`, warns under
_`NAME`_`-floating-version`, where _`NAME`_ is the entry's name. An empty or
malformed value fails the build and skips the entry before its companion runs.

For why Docsy pins versions, see [Pinned script-dependency versions][ug-pins].

## Add a custom script

For a script that should load at the end of every page, register it as a plugin;
for markup in `<head>`, inline snippets, or third-party tags, use the [head and
body hooks][] instead.

1. Save the script as `assets/js/plugins/`_`NAME`_`.js`, with _`NAME`_ in
   lowercase.
2. Register it under `params.docsy.plugins`
   ([configuration reference](#configuration-reference)):

<!-- markdownlint-disable no-shortcut-ref-link -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[params.docsy.plugins.NAME]
enable = true
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
params:
  docsy:
    plugins:
      NAME:
        enable: true
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "params": {
    "docsy": {
      "plugins": { "NAME": { "enable": true } }
    }
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-enable no-shortcut-ref-link -->

### Plugin files

A project file shadows the theme's of the same name, which is how you replace
one of Docsy's plugins, its companions, or its shim.

| File                                                           | Contract                                                                                                                   |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `assets/js/plugins/`_`NAME`_`.js`                              | Required. Built on its own with [`js.Build`][]; `options` reach it as [`@params`][].                                       |
| `layouts/_partials/scripts/plugins/`_`NAME`_`.html`            | Optional companion partial for vendored libraries, markup, or configuration; receives `(dict "Page" PAGE "Plugin" ENTRY)`. |
| `assets/scss/plugins/`_`NAME`_`.scss`                          | Optional companion stylesheet, through the Sass pipeline.                                                                  |
| `layouts/_partials/scripts/plugins/`_`NAME`_`_docsy-shim.html` | Optional shim partial; [adjust a plugin per page](#adjust-a-plugin-per-page).                                              |

Companions emit before the script ([why][design-ordering]). Script and
stylesheet tags carry [subresource integrity][SRI] in every environment. Entry
keys reach templates and plugin scripts lowercase: an option `apiKey` is
`params.apikey` in the script ([Configuration § Key spelling][config-keys]).

### Adjust a plugin per page

A **shim** adjusts a plugin's registry entry for each page before the plugin
loads. Add one for your own plugin, or for one of Docsy's. Each of Docsy's
plugins ships a shim: your file replaces it, gate, Prism guard, and
deprecated-parameter handling included, so start from a copy of the theme's
file, in [`scripts/plugins/`][theme-shims].

Create `layouts/_partials/scripts/plugins/`_`NAME`_`_docsy-shim.html`, with the
plugin's registry name as _`NAME`_ ([shim contract][impl-shim]):

```go-html-template
{{ $entry := .Plugin -}}
{{ if not (.Page.Store.Get "hasMyFeature") -}}
  {{ $entry = merge $entry (dict "enable" false) -}}
{{ end -}}
{{ return $entry -}}
```

That shim loads the plugin only on pages that use it: a render hook of yours
sets the flag with `.Page.Store.Set` where the feature's markup appears. When a
shortcode produces the markup, test for the shortcode instead of setting a flag
(Docsy's `tabpane-persist` shim: `.Page.HasShortcode "tabpane"`). Before relying
on either, read
[Page flags in included content](#page-flags-in-included-content).

### Dependency versions

The entry's `version` selects a plugin dependency version. The companion partial
determines which dependency it refers to. The field does not automatically
identify the version of the plugin script itself or the Docsy theme.

For a custom plugin with a configurable dependency, set `version` on its
registry entry and read `.Plugin.version` in the companion partial. Use that
value to select the dependency's code, for example in a build-time fetch URL.
Declaring `version` does not fetch code automatically. Omit the field if the
plugin has no dependency version to configure.

Unlike `options`, the entry's `version` is not passed to the plugin script
through `@params`. For a working example and instructions for overriding a
theme-provided pin, see [MarkMap version][markmap-version].

### Security

- Never pipe `.Plugin.options` through `safeHTML`, `safeJS`, or `safeURL` in a
  companion partial: options are site-configured strings, and Hugo's contextual
  autoescaping is the defense.
- In a plugin script, options are values, not markup: set them through DOM and
  CSSOM properties, never by building HTML or stylesheet text around them (an
  option interpolated into a `<style>` can close the rule and open its own).
- Options, like anything reaching a module as `@params`, ship world-readable in
  the built JavaScript: never route secrets through them.
- Pin third-party dependencies on the entry's `version`, never `latest`.
- Vendor build-time fetches and serve them with SRI.
- Use no loader that pulls unpinned secondary code, which SRI on the loader
  can't cover.
- Load remote code only on pages that use it:
  [gate the plugin with a shim](#adjust-a-plugin-per-page).

## Page flags in included content

A shim's per-page check counts only when it holds on the page whose output the
plugin is emitted into. What content reuse does to each kind of check:

- A **render hook** runs in the context of the page being rendered, so a
  `markmap` block in content pulled in through [`.RenderShortcodes`][] flags the
  page that includes it.
- A **shortcode** runs in the context of the page whose file contains it, so a
  flag a shortcode sets lands on the _included_ page, and the including page
  never sees it. [`.HasShortcode`][] does follow `.RenderShortcodes`: Hugo
  records the included page's shortcodes on the including page. That is why
  `tabpane-persist` gates on the `tabpane` shortcode, not on a flag.
- Content pulled in through `.Content` carries neither flags nor shortcodes to
  the including page.

For MarkMap's authoring paths and the remedy, see [When a MarkMap doesn't
render][]. Tabpanes pulled in through `.Content` render but don't persist;
include them through `.RenderShortcodes` instead.

<!-- prettier-ignore-start -->
[`.HasShortcode`]: https://gohugo.io/methods/page/hasshortcode/
[`.RenderShortcodes`]: https://gohugo.io/methods/page/rendershortcodes/
[`tabpane`]: /docs/content/shortcodes/#tabpane
[Activating MarkMap support]: /docs/content/diagrams-and-formulae/#activating-markmap-support
[When a MarkMap doesn't render]: /docs/content/diagrams-and-formulae/#when-a-markmap-doesnt-render
[Copy to clipboard]: /docs/content/lookandfeel/#copy-to-clipboard
[head and body hooks]: /docs/content/lookandfeel/#add-code-to-head-or-before-body-end
[`@params`]: https://gohugo.io/functions/js/build/#params
[`js.Build`]: https://gohugo.io/functions/js/build/
[config-env]: /docs/content/configuration/#environment-variables
[ug-pins]: /docs/content/diagrams-and-formulae/#script-dep-versions
[config-keys]: /docs/content/configuration/#key-spelling
[config-merge]: /docs/content/configuration/#theme-defaults-and-your-overrides
[config-warnings]: /docs/content/configuration/#configuration-warnings
[design-ordering]: /project/design/script-loading/#ordering-decisions
[markmap-version]: /docs/content/diagrams-and-formulae/#markmap-version
[impl-shim]: /project/implementation/script-loading/#shims
[theme-shims]: https://github.com/google/docsy/tree/main/theme/layouts/_partials/scripts/plugins
[theme-defaults]: https://github.com/google/docsy/blob/main/theme/hugo.yaml
[SRI]: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
<!-- prettier-ignore-end -->
