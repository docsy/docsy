# Fixture-site tests

<!-- markdownlint-disable no-docsy-dev-external-urls -->
<!-- cSpell:ignore ccr doctree footgun greppable pagelinks -->

Tests in this directory build a real Hugo site against the checked-out theme
(`lib/build-site.mjs`; shared content and probes in `lib/fixtures.mjs`) and
assert over its rendered output. Only the site _inputs_ (content pages, config)
are synthetic; every golden under `goldens/` is theme-generated, written by
`npm run update:markup-goldens` and re-compared against a fresh build on every
test run; the refreshed golden's diff is the review artifact. The same fixture
feeds the visual suite (`../visual/`) and the rendered-output framework-class
net (`output-classes.test.mjs`; complementarity with the literal-token lint is
stated in its header).

## CCR case registry

**Client-side chrome restoration (CCR)** is the mechanism behind Docsy's
experimental `shared` chrome [build mode][chrome docs]: the build drops the
repeated navbar, footer, and left-nav from most pages and the browser restores
them from a donor. This is the **case registry** for the fixture-site tests in
this directory: every way a restored page can differ from a full build (each a
**case** with a stable `CCR-NN` ID) and where a test covers it.

- **Tracking issue:** [#2659][].
- Tests cite their case ID in a header comment, so the ID ↔ test link is
  greppable both ways (`grep -rn CCR-13 tests/`).

IDs are stable and append-only, never reused or renumbered. **Status** is
_restored_ (matches a full build), _partial_ (common case matches; a documented
case diverges), or _deferred_ (known, not yet handled). The **Tests** column
names fixture-site tests in this directory (drop the `.test.mjs` suffix); `—`
means no dedicated test yet.

| ID     | Case / wrinkle                                                              | Status   | Tests                                                  |
| ------ | --------------------------------------------------------------------------- | -------- | ------------------------------------------------------ |
| CCR-01 | `td.chrome` build-mode gate (`full` default, `shared` opt-in)               | restored | `chrome-render`                                        |
| CCR-02 | Kept reference instances (one navbar/footer/side-nav; donor)                | restored | `chrome-render`, `chrome-build`, `chrome-reachability` |
| CCR-03 | Navbar restore from the root-page donor                                     | partial  | `chrome-equivalence`                                   |
| CCR-04 | Footer restore (verbatim, page-invariant)                                   | restored | `chrome-equivalence`                                   |
| CCR-05 | Left side-nav restore from the section donor (+ cache)                      | restored | `chrome-nav`, `chrome-equivalence`                     |
| CCR-06 | Active state: active link + active-path + foldable reveal                   | restored | `chrome-nav`                                           |
| CCR-07 | Non-foldable reveal (`.show` on siblings/children)                          | partial  | —                                                      |
| CCR-08 | Cached/shared inline nav hydration (large sites, full mode too)             | restored | `chrome-nav`, `chrome-cached-sidebar`                  |
| CCR-09 | Navbar version selector per-page links (`version_menu_pagelinks`)           | partial  | `chrome-selectors`, `chrome-equivalence`               |
| CCR-10 | Navbar language selector per-page links (prefix-swap, best-effort)          | partial  | `chrome-selectors`                                     |
| CCR-11 | Navbar cover/theme per-page traits                                          | restored | `chrome-cover-theme`                                   |
| CCR-12 | Scoped sidebar re-root, functional (`sidebar_root_for`)                     | partial  | `chrome-scoped`                                        |
| CCR-13 | Scoped root markers (`data-sidebar-root-id`, up-icon)                       | restored | `chrome-scoped`                                        |
| CCR-14 | Scoped root structural residual (wrapper, `ul`-level renumber)              | deferred | —                                                      |
| CCR-15 | Print `_print/*` canonical URL                                              | restored | `chrome-canonical`                                     |
| CCR-16 | Paginated `/page/N/` canonical URL                                          | restored | `chrome-canonical`                                     |
| CCR-17 | Out-of-tree active-path (`toc_hide`)                                        | partial  | `chrome-out-of-tree`                                   |
| CCR-18 | `no-left-sidebar` layout (`body_class`)                                     | restored | `chrome-no-left-sidebar`                               |
| CCR-19 | Sidebar placeholder whitespace trim                                         | restored | —                                                      |
| CCR-20 | Navbar/footer donor page on a doc-rooted site (root page, HTML render)      | partial  | `chrome-doc-rooted`, `root-page`                       |
| CCR-21 | Per-page opt-out: `td.chrome: full` in front matter keeps the page's chrome | partial  | `chrome-render`, `chrome-donor-opt-out`                |

### Open items

- **CCR-10** (language-link exactness): _partial._ The prefix-swap is exact when
  translations share slugs and all exist (the common case on ordinary sites; a
  doc-rooted site's page slugs fall back to titles, so translations usually
  differ and the restored link 404s). When the current page has **no
  translation** in a locale, a full build renders that item disabled while
  shared mode restores a live link to the non-existent page. The divergence is
  pinned by a known-limitation test in `chrome-selectors`. **Planned next:**
  bake each page's available locales into the navbar placeholder and emit a
  disabled item for the rest, matching a full build (a differing-slug variant
  would also need this per-page hint).
- **CCR-03** (navbar active state): _partial._ The restore marks one entry, the
  longest match for the current path, where a full build marks every entry whose
  page contains it (`IsMenuCurrent`, `HasMenuCurrent`, `IsDescendant`). With
  nested menu entries a parent loses its active state on pages under a child
  entry, on ordinary and doc-rooted sites alike; and the prefix test compares
  paths without an origin check, so an external entry at an origin root
  (`https://example.com/`) is active on every page no other entry covers. Fix:
  bake the full build's menu-current state into the navbar placeholder as a
  per-page hint and key the restore on it ([#2689][]).
- **CCR-20** (doc-rooted donor page): _partial._ The donor renders and the
  restore works, but the docs menu entry's URL is the language root, so the
  longest-prefix active-link pass gets both directions wrong: the docs entry is
  active on the non-docs pages no other menu entry covers (pages without a menu
  entry, taxonomies, 404), where a full build's `IsDescendant` marks nothing,
  and it loses its active state under any docs subsection with its own entry
  (CCR-03). Same fix, with [#2689][].
- **CCR-21** (per-page opt-out): _partial._ Below `sidebar_cache_limit`, opting
  out a left-nav donor (a `docs` section page) leaves its own active state in
  the nav other pages restore from it, so their restored nav marks the donor
  active too (`chrome-donor-opt-out` pins it); above the limit the opted-out
  page's left-nav is the cached, script-revealed one, with no active state to
  leak. Fix: clear the donor's active state before applying the current page's
  ([#2689][]).
- **CCR-07** (non-foldable reveal): _partial._ A full build also shows the
  siblings of every ancestor on the active path (`sidebar-tree.html`,
  `IsDescendant $s.Parent`); the client opens only the current item's siblings
  and children, so under `sidebar_menu_compact: true` the restore hides items a
  full build shows. Fix: open the children of every ancestor on the active path
  ([#2689][]). No dedicated unit coverage.
- **`uglyURLs`** (CCR-03, CCR-09, CCR-10, CCR-12, CCR-17, CCR-20): _partial._
  Section URLs end in `index.html`, which `normalizePath` turns into
  `/…/index.html/`, so no child path has a section's path as prefix: the
  restored version and language links keep the donor's `index.html`, no section
  menu entry is active on child pages, the out-of-tree active path is empty, and
  the scoped sidebar's "up" link resolves to the directory. Fix with [#2689][].
- **CCR-14** (scoped-root structural residual) lacks dedicated unit coverage.
  The extra wrapper and `ul` renumbering can show in the rendered nav as one
  indentation level less under a non-foldable, non-compact nav; it gates
  reinstating the docsy.dev `sidebar_root_for` example; a JSON doctree that
  re-renders the subtree would close it.
- **CCR-19** (sidebar placeholder whitespace trim) has no dedicated test but is
  exercised indirectly: every `chrome-equivalence` / `chrome-nav` assertion
  would fail on a stray placeholder seam.
- **CCR-15 / CCR-16** (print / paginated canonical URL) are validated through
  the shared canonical-path mechanism in `chrome-canonical`, simulated via a
  print-style request URL; the print fixtures (`chrome-doc-rooted`,
  `chrome-render`, `root-page`) build real `_print/*` output but assert only its
  placeholders, and no `/page/N/` output is built yet. A real print/paginator
  canonical-path fixture is a follow-up.
- **Donor-fetch failures** in `chrome-nav.js` currently `console.warn` and leave
  the placeholder in place. A richer recovery (retry, visible fallback) is
  deferred while the mode stays experimental; revisit if it is promoted.
- **No end-to-end coverage** yet: a single real-browser smoke test (served
  shared-mode site, assert restored regions) would guard the jsdom-vs-browser
  gap.

[#2659]: https://github.com/docsy/docsy/issues/2659
[#2689]: https://github.com/docsy/docsy/issues/2689
[chrome docs]: https://www.docsy.dev/docs/deployment/chrome/
