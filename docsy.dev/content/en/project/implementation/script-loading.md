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

## Pre-registry parameters

A plugin whose behavior a parameter controlled before the registry ships a shim
partial, `_partials/scripts/plugins/`_`NAME`_`_docsy-shim.html` (the suffix the
schema reserves). The loop applies it to the plugin's merged entry before the
enable and gate checks, invoked with `(dict "Page" PAGE "Plugin" ENTRY)`. It
must return the entry it received, adjusted with `merge`, so the fields it
leaves alone keep their normalized values; anything but a map fails the build.
Parameter-specific behavior lives in the shim, and the shim is deleted when its
parameter's deprecation cycle ends.

## Shape guards

Enforcement is hand-coded in the loop against the schema; what each guard warns
about, ignores, or empties is the guide's [Warnings][guide-warnings] list. After
the shim, the required-field and `version` guards run, followed by the enable
check, asset lookup, and page gate; a refused version skips the entry.

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
  module can register, re-gate, or turn off plugins, as it already supplies
  layouts and assets.

<!-- prettier-ignore-start -->
[design]: /project/design/script-loading/
[design-ordering]: /project/design/script-loading/#ordering-decisions
[guide]: /docs/content/plugins/
[guide-config]: /docs/content/plugins/#configuration-reference
[guide-files]: /docs/content/plugins/#plugin-files
[guide-markmap]: /docs/content/diagrams-and-formulae/#markmap-version
[guide-security]: /docs/content/plugins/#security
[guide-warnings]: /docs/content/plugins/#warnings
[plugins.html]: https://github.com/google/docsy/blob/main/theme/layouts/_partials/scripts/plugins.html
[quality]: /project/quality/script-loading/
<!-- prettier-ignore-end -->
