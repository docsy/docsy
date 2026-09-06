---
title: Plugins
description:
  Turn Docsy's optional scripts on or off and load your own from site
  configuration, no layout overrides needed.
---

Docsy loads some of its optional JavaScript features, and any script you add, as
**plugins**: entries under `params.docsy.plugins` in your site configuration.

## Configure Docsy's plugins

| Plugin            | What it does                               | Default                                 | Loads on                                            | Docs                           |
| ----------------- | ------------------------------------------ | --------------------------------------- | --------------------------------------------------- | ------------------------------ |
| `click-to-copy`   | Adds a copy button to code blocks          | On (off under Prism, which has its own) | Every page                                          | [Copy to clipboard][]          |
| `tabpane-persist` | Remembers the selected tab across pages    | On                                      | Every page ([why](#page-flags-in-included-content)) | [`tabpane`][]                  |
| `markmap`         | Renders `markmap` code blocks as mind maps | Off                                     | Pages with a `markmap` code block                   | [Activating MarkMap support][] |

To turn a plugin off, set its entry to `false`:

<!-- markdownlint-disable no-shortcut-ref-link -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[params.docsy.plugins]
click-to-copy = false
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
params:
  docsy:
    plugins:
      click-to-copy: false
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "params": {
    "docsy": {
      "plugins": { "click-to-copy": false }
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
defaults][config-merge]). Each entry's fields, types, and defaults:

{{< readfile file="/data/docsy/schema/params/docsy.yaml" code="true" lang="yaml" >}}

- `{}` in place of an entry keeps every default.
- `enable` is off for `false`, `"false"`, and `0`, and on for any other value;
  `defer` is on for `true`, `"true"`, and `1`, and off for any other value. The
  string forms exist for [environment overrides][config-env].
- For an enabled entry's `version`, use an exact `X.Y.Z`; anything else warns or
  fails the build ([Warnings](#warnings)). For why Docsy pins, see [Pinned
  script-dependency versions][ug-pins].

### Warnings

Every registry shape warning carries the id `docsy-config` (to silence one, see
[Configuration § Configuration warnings][config-warnings]):

- An unknown field or a non-map `options` is ignored and the rest of the entry
  applies.
- A name the schema's pattern rejects or that ends in its reserved suffix, or a
  scalar entry other than a false spelling, drops the whole entry.
- A `params.docsy` or `params.docsy.plugins` that is not a map empties the
  registry, Docsy's own plugins and their deprecated aliases included.
  `plugins: {}` keeps them; a valueless `plugins:` is null and drops them.
- An enabled name with no script file ([Plugin files](#plugin-files)) is a
  different fault: it warns `docsy-plugin-missing`, gated or not (a disabled
  entry is never looked up).

An enabled entry's `version` has its own outcomes: a non-exact value such as
`latest` warns under _`NAME`_`-floating-version`, where _`NAME`_ is the entry's
name; a value with any character other than letters, digits, `.`, `+`, or `-`
fails the build and skips the entry, so it never reaches a fetch URL.

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
[params.docsy.plugins]
NAME = {}
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
params:
  docsy:
    plugins:
      NAME: {}
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "params": {
    "docsy": {
      "plugins": { "NAME": {} }
    }
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-enable no-shortcut-ref-link -->

### Plugin files

A plugin is one to three files. A project file shadows the theme's of the same
name, which is how you replace one of Docsy's plugins or its companions.

| File                                                | Contract                                                                                                                   |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `assets/js/plugins/`_`NAME`_`.js`                   | Required. Built on its own with [`js.Build`][]; `options` reach it as [`@params`][].                                       |
| `layouts/_partials/scripts/plugins/`_`NAME`_`.html` | Optional companion partial for vendored libraries, markup, or configuration; receives `(dict "Page" PAGE "Plugin" ENTRY)`. |
| `assets/scss/plugins/`_`NAME`_`.scss`               | Optional companion stylesheet, through the Sass pipeline.                                                                  |

Companions emit before the script ([why][design-ordering]). Script and
stylesheet tags carry [subresource integrity][SRI] in every environment. Entry
keys reach templates and plugin scripts lowercase: `.Plugin.pagegate`,
`params.apikey` ([Configuration § Key spelling][config-keys]).

### Security

- Never pipe `.Plugin.options` through `safeHTML`, `safeJS`, or `safeURL` in a
  companion partial: options are site-configured strings, and Hugo's contextual
  autoescaping is the defense.
- In a plugin script, options are values, not markup: set them through DOM and
  CSSOM properties, never by building HTML or stylesheet text around them (an
  option interpolated into a `<style>` can close the rule and open its own).
- Options, like anything reaching a module as `@params`, ship world-readable in
  the built JavaScript: never route secrets through them.
- Pin third-party dependencies on the entry's `version` (the loop validates it
  before your companion runs), never `latest`; vendor build-time fetches and
  serve them with SRI; and use no loader that pulls unpinned secondary code,
  which SRI on the loader can't cover.
- A plugin that loads remote code gets a `pageGate` (a flag your own render hook
  sets with `.Page.Store.Set`), so its code ships only where used.

## Page flags in included content

Some plugins load only on pages that need them: a `pageGate` names a page flag,
and Docsy's `markmap` render hook sets one whenever a page has a `markmap` code
block. A flag counts only when it lands on the page that ships.

- A **render hook** runs in the context of the page being rendered, so a
  `markmap` block in content pulled in through [`.RenderShortcodes`][] flags the
  page that includes it.
- A **shortcode** runs in the context of the page whose file contains it, so a
  shortcode in included content would flag the _included_ page, and the
  including page would never see the flag.
- Content pulled in through `.Content` flags the included page in both cases.

That is why Docsy ships `tabpane-persist` ungated, on every page: tabpanes come
from a shortcode. For MarkMap's authoring paths and how to clear its gate, see
[Activating MarkMap support][].

<!-- prettier-ignore-start -->
[`.RenderShortcodes`]: https://gohugo.io/methods/page/rendershortcodes/
[`tabpane`]: /docs/content/shortcodes/#tabpane
[Activating MarkMap support]: /docs/content/diagrams-and-formulae/#activating-markmap-support
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
[theme-defaults]: https://github.com/google/docsy/blob/main/theme/hugo.yaml
[SRI]: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
<!-- prettier-ignore-end -->
