---
title: Script loading
description: >-
  The plugin loop's shim contract, shape guards, build pipeline, and the
  security rules Docsy's own plugins follow
---

[`_partials/scripts/plugins.html`][plugins.html] implements
`params.docsy.plugins`. For the configuration reference and the plugin file
contract, see the [plugins guide][guide]; for the design rationale, the [design
notes][design]; for the tests that pin this contract, the [quality
notes][quality].

## Loop mechanics

The template's comments carry the mechanics and their rationale. The loop reads
the theme's schema through `hugo.Data`; the guide [renders the same
file][guide-config], so the entry contract has one home.

## Shims

For when to add or replace a shim, see the guide's [Adjust a plugin per
page][guide-shims]; this section is the contract.

The loop resolves a shim by registry name with the schema's reserved
`_docsy-shim` suffix and, when the partial exists, invokes it with
`(dict "Page" PAGE "Plugin" ENTRY)`: the page being rendered, and the merged,
normalized entry. The call comes after normalization, sorting, and name
validation, so a shim cannot reorder emission. It comes before the
required-field and `version` guards, the enable check, and asset lookup, so a
shim runs for a disabled entry too, and what it returns is what those two guards
test.

The partial must return the entry it received, adjusted with `merge` so the
fields it leaves alone keep their normalized values; anything but a map fails
the build.

A shim is also where a plugin gates itself: on a page that doesn't need the
plugin, it returns the entry with `enable` false ([Gating
decisions][design-gating]). When support for a deprecated parameter ends, remove
its mapping and warning from the shim and keep the rest.

## Shape guards

Enforcement is hand-coded in the loop against the schema; what each guard warns
about, ignores, or empties is the guide's [Warnings][guide-warnings] list. A
refused `version` skips the entry.

## Build and emission

The [file contract][guide-files] is the guide's; the pipeline adds one step
beyond it, minification in production ([why companions first][design-ordering]).

## Security constraints

Docsy's own plugins follow the guide's [rules for plugin
authors][guide-security]. In addition:

- Validate a configuration value against an allowlist before it reaches a fetch
  URL: the loop does this for every supplied entry `version`, so a companion
  only checks that its plugin provides a pin.
- Residual exposure, disclosed in the guide's [MarkMap version][guide-markmap]
  section: the autoloader's runtime libraries.
- Imported Hugo modules are trusted: their `params` merge into the site's, so a
  module can register or turn off plugins, and its layouts can shim them, as it
  already supplies layouts and assets.

<!-- prettier-ignore-start -->
[design]: /project/design/script-loading/
[design-ordering]: /project/design/script-loading/#ordering-decisions
[design-gating]: /project/design/script-loading/#gating-decisions
[guide-shims]: /docs/content/plugins/#adjust-a-plugin-per-page
[guide]: /docs/content/plugins/
[guide-config]: /docs/content/plugins/#configuration-reference
[guide-files]: /docs/content/plugins/#plugin-files
[guide-markmap]: /docs/content/diagrams-and-formulae/#markmap-version
[guide-security]: /docs/content/plugins/#security
[guide-warnings]: /docs/content/plugins/#warnings
[plugins.html]: https://github.com/google/docsy/blob/main/theme/layouts/_partials/scripts/plugins.html
[quality]: /project/quality/script-loading/
<!-- prettier-ignore-end -->
