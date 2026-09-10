---
title: Script loading
description:
  The golden, dispatch, loop-contract, acceptance, vendoring, and runtime nets,
  and how to refresh the goldens
---

Complementary test nets pin the script-loading subsystem ([design][],
[implementation][]). The fixture-site nets run in `npm run test:repo`; the
build-time vendoring and browser nets run in `npm run test:visual`.

## Golden net

[`scripts-golden.test.mjs`][golden-test] pins, across fixture configurations:

- the rendered **script region** of selected pages, and
- **every locally built script**, byte-exact.

Fixture builds, region extraction, and the comparison form live in
[`lib/scripts-goldens.mjs`][goldens-lib]. The net was committed and verified
green against untouched `main` before the `scripts.html` decomposition, so the
refactor's no-output-change claim is machine-checked, not asserted.

The goldens are committed. After a reviewed, intended output change, refresh
them with:

```sh
npm run update:scripts-goldens
```

## Dispatch net

[`scripts-dispatch.test.mjs`][dispatch-test] pins the dispatcher's page-flag
wiring: the `.Page.Store`-gated partials (Mermaid, KaTeX) are dispatched on
flagged pages only. The real partials fetch remote assets at build time, so
fixture marker overrides stand in for them; what's pinned is exactly the
gate-to-partial wiring, offline.

## Loop-contract tests

[`plugins.test.mjs`][loop-test] pins the plugin loop's registry contract:

- **Emission**: `enable`/`defer` handling, deterministic order, env-override
  booleans, companions and shims (a shim-gated plugin, and a head-end flag
  widening its gate), SRI in development builds.
- **Validation**: shape-guard warnings (the pre-release list shape and a site's
  own `params.docsy` included), name and field allowlisting (the `_docsy-shim`
  suffix refused, unknown fields warned), the `version` guard's [warning and
  error policy][guide-warnings].
- **Layering**: theme plugins through Hugo's config merge (inheritance,
  turn-off) and a site field over a schema default.

Three companion nets pin the conversions:

- [`tabpane-persist-plugin.test.mjs`][tabpane-test]: the ungated default,
  persistence opt-out, and theme-plugin shadowing.
- [`markmap-plugin.test.mjs`][markmap-test] and
  [`click-to-copy-plugin.test.mjs`][c2c-test]: the per-conversion contracts,
  click-to-copy's fixed deferred loading per configuration layer included. The
  markmap cases stub the vendoring companion with a marker to stay offline; the
  real vendor fetch is covered by the
  [build-time vendoring net](#build-time-vendoring).

## Acceptance test

[`plugins-acceptance.test.mjs`][acceptance-test] proves adoption end to end: a
project site drops `assets/js/plugins/hello.js` plus one registry entry and gets
its script loaded, with zero layout overrides asserted structurally (the fixture
contains no `layouts/` directory).

## Build-time vendoring

The MarkMap vendoring net in the [`tests/visual/` directory][visual-tests] uses
real build-time CDN fetches, without a browser. It compares bilingual MarkMap
builds with single-version controls to verify each language's published
autoloader bytes; distinct URLs alone cannot prove correct resource-cache
behavior.

## Runtime nets

Three browser nets under `tests/visual/`:

- [`js-runtime.test.mjs`][runtime-test] loads representative fixture pages in a
  real browser and asserts that no uncaught exception or in-scope console error
  fires, alongside behavior probes (search, diagrams, navbar, copy button, tab
  persistence). Markup and visual goldens can't see JS runtime breakage (a
  missing global, a botched conversion); this net can ([#1436][]).
  - Two fixture variants cover both search bundles: the main bundle
    (`scripts/main-bundle.html`) concatenates `offline-search.js` or `search.js`
    into `main.js`, never both.
  - Pages load their real CDN script dependencies, so the net needs network
    access. The console tally filters off-origin and non-code resource noise but
    keeps same-origin script and stylesheet load failures (a broken first-party
    bundle is a defect). Filtered breakage that throws (a dependent script's
    missing global) still surfaces as a page error; silent feature degradation
    is what the behavior probes catch.
- [`plugins-runtime.test.mjs`][plugin-runtime-test] proves an emitted plugin
  actually executes: its DOM effects land. A static-markup check can bless
  output whose runtime is broken (a botched build); this net can't.
- [`click-to-copy-runtime.test.mjs`][c2c-runtime-test] proves the copy button's
  [fixed deferred loading][guide-c2c-defer] beyond tags. Under a site's
  conflicting `defer: false`, real clicks copy the text of a block emitted
  before the plugin tag and of one the body-end hook emits after it, asserted on
  the clipboard, which headless Chrome keeps process-local. Offline.

## Red-proof rationale

A net that passes for the wrong reason (building nothing, matching an empty
region) is worse than a red one: it hides breakage behind green. The nets were
built red-first, and where a no-op could masquerade as success, a persistent
safeguard proves the signal:

- Zero-output cases are asserted against: a golden's script region must be
  non-empty.
- The plugin runtime net's red-proof doubles as an assertion: a deliberately
  broken plugin must be the error tally's only entry, so an empty tally from the
  healthy plugin is meaningful.
- The site runtime net carries a collector self-test: a page that deliberately
  throws and drops a same-origin script must have both reported, so a silent
  collector (wrong event names, races, a broken filter) can't masquerade as
  all-green.
- The copy net seeds the clipboard with a unique token before every click and
  waits for the contents to change, so a click that writes nothing can't pass on
  stale contents. Before the fix, the synchronous load left the hook block
  without a button.

<!-- prettier-ignore-start -->
[#1436]: https://github.com/google/docsy/issues/1436
[acceptance-test]: https://github.com/google/docsy/blob/main/tests/fixture-site/plugins-acceptance.test.mjs
[c2c-runtime-test]: https://github.com/google/docsy/blob/main/tests/visual/click-to-copy-runtime.test.mjs
[c2c-test]: https://github.com/google/docsy/blob/main/tests/fixture-site/click-to-copy-plugin.test.mjs
[design]: /project/design/script-loading/
[dispatch-test]: https://github.com/google/docsy/blob/main/tests/fixture-site/scripts-dispatch.test.mjs
[golden-test]: https://github.com/google/docsy/blob/main/tests/fixture-site/scripts-golden.test.mjs
[goldens-lib]: https://github.com/google/docsy/blob/main/tests/fixture-site/lib/scripts-goldens.mjs
[guide-c2c-defer]: /docs/content/plugins/#configuration-reference
[guide-warnings]: /docs/content/plugins/#warnings
[implementation]: /project/implementation/script-loading/
[loop-test]: https://github.com/google/docsy/blob/main/tests/fixture-site/plugins.test.mjs
[markmap-test]: https://github.com/google/docsy/blob/main/tests/fixture-site/markmap-plugin.test.mjs
[plugin-runtime-test]: https://github.com/google/docsy/blob/main/tests/visual/plugins-runtime.test.mjs
[runtime-test]: https://github.com/google/docsy/blob/main/tests/visual/js-runtime.test.mjs
[tabpane-test]: https://github.com/google/docsy/blob/main/tests/fixture-site/tabpane-persist-plugin.test.mjs
[visual-tests]: https://github.com/google/docsy/tree/main/tests/visual
<!-- prettier-ignore-end -->
