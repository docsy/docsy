---
title: Root page
description: >-
  How `llms.txt` and shared chrome find the page published at each language
  root: the home page, or a doc-rooted site's `docs` section page
---

## Selection rule

[`_partials/td/root-page.html`][partial] returns a site's [root page][]: it
takes a `Site` and returns the page at logical path `/docs` when the URL of its
`html` output format equals the home page's, otherwise the home. Consumers share
the result through `partialCached`, which caches per site.

## Consumers

- **`llms.txt` discovery**: the `rel="describedby"` link in every page head, the
  in-body agent directive, the Markdown versions' `llms.txt` link, and the
  Docsy-private `_root-llms-txt-path` shortcode all need the language's
  `llms.txt` URL, which exists when the root page has an `LLMS` output
  ([Discovery][]).
- **The `llms.txt` template** (`all.llms.txt`):
  - The home-page link targets the language's root page; the `Site locales` list
    links each language's root page.
  - The description is the root page's, falling back to the home page's.
  - The documentation index is a separate `/docs` lookup.
- **Shared chrome**: in the `shared` [chrome build mode][], the navbar and
  footer are kept on one [donor page][] per language, the root page, and
  restored from it elsewhere. The chrome applies the definition without the
  lookup: a page is the donor when its `html` URL equals the home page's. The
  placeholders carry `data-chrome-donor`, the home page's `html` URL, where the
  client fetches the chrome; the navbar's also carries `data-canonical-path`,
  the page's own `html` URL, which keys the client's active-state restore. The
  left-nav has a donor rule of its own ([donor pages][donor page]).

## Why this rule

- **Absolute logical path**, `site.GetPage "/docs"`: a bare `"docs"` would be
  wrong. When there is no `/docs` section, a `Site` lookup falls back to a
  site-wide lookup by name, which fails the build on two pages named `docs`
  (`page reference "docs" is ambiguous`) and silently returns the one such page
  otherwise ([#2875][]).
- **The URL comparison** keeps an ordinary `/docs/` section from being taken for
  the root.
- **The `html` output URL**, not the URL of the format being rendered: the
  cached result serves every render pass, and a permalinkable format can render
  before HTML.
- **The home page's `html` URL as the reference**: Hugo computes it under every
  URL setting (`baseURL` paths, language prefixes, multihost, site-wide
  `uglyURLs`, the site matrix's version dimension), which no
  configuration-derived root reproduces in full.

The `docs` name is the [doc-rooted recipe][doc-rooted site]'s own: the recipe
redefines that section's permalinks, and the `llms.txt` documentation index
lists its subsections. Two alternatives that avoided the name were set aside:

- Scanning `site.Sections` for a section at the home's URL depends on Hugo's
  listing rules: a section page with `build.list: never` publishes but is not
  listed.
- A configuration switch would duplicate what `permalinks` already states.

## Covered cases

The table records supported behavior; the **Evidence** column names the fixture
test (`tests/fixture-site/`) exercising the row. Chrome consequences assume
`shared` mode.

| Case                                                           | Root page and consequences                                                                                                                                                                                          | Evidence                                                                                           |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Ordinary site (home renders, docs under `/docs/`)              | The home. `llms.txt` at `/llms.txt` when `LLMS` is among the home outputs; the home is the donor page.                                                                                                              | `llms-directive`, `chrome-render`                                                                  |
| Doc-rooted site                                                | The `docs` section page, published at the home's URL. Publishes `llms.txt` when its outputs include `LLMS`; it is the donor page.                                                                                   | `llms-doc-rooted`, `chrome-doc-rooted`                                                             |
| No `/docs` section, pages named `docs` elsewhere (one or many) | The home; the build succeeds, and `llms.txt` has no documentation index.                                                                                                                                            | `root-page`                                                                                        |
| Multilingual project                                           | One root page per language (`/`, `/fr/`), each able to publish its own `llms.txt` and each its own donor page; `defaultContentLanguageInSubdir` only moves the URLs.                                                | `root-page`, `chrome-doc-rooted`                                                                   |
| `docs` section page without a translated `_index` file         | Hugo's auto-created section is still the root when published there; its outputs come from configuration or `cascade`, not from a file.                                                                              | `root-page`                                                                                        |
| `baseURL` with a subpath                                       | Both compared URLs include the subpath, so the selection is unchanged.                                                                                                                                              | `root-page`                                                                                        |
| Several output formats (HTML, Markdown, print, RSS, LLMS)      | Selection is unchanged whatever format renders first or carries `rel=canonical` (the rule compares `html` URLs). The donor is the root page's HTML render; its print render gets a placeholder like any other page. | `root-page`, `llms-doc-rooted`, `chrome-doc-rooted` (print), `chrome-render` (permalinkable print) |
| Site-wide `uglyURLs`                                           | Both compared URLs end in `index.html`, so the selection is unchanged; the donor is named as `/index.html`.                                                                                                         | `root-page`                                                                                        |
| Doc-rooted home with `LLMS` configured                         | The home publishes no file; root-level `llms.txt` and discovery require `LLMS` on the `docs` section page.                                                                                                          | `llms-doc-rooted`                                                                                  |
| Root page without `LLMS`                                       | No `describedby` link, directive, or Markdown link, even when another section publishes an `llms.txt`; the shortcode fails the build when invoked.                                                                  | `llms-directive`, `llms-doc-rooted`                                                                |
| `LLMS` on a non-root section                                   | Its `llms.txt` is the site overview, not a section index; discovery still depends on the root page's `LLMS` output.                                                                                                 | `llms-doc-rooted`                                                                                  |

## Limits

The design leaves these unresolved:

- A section other than `docs` remapped to the site root: the lookup keeps the
  home, so `llms.txt` discovery follows the home, while the chrome's self-test
  makes that section the donor; Hugo need not warn (a link-only home leaves no
  duplicate output).
- Two pages publishing the same root URL: a [path conflict][] of the site's own.
- A doc-rooted language without a `/docs` section: it has no root page, so
  `llms.txt` lists the language at an unpublished URL, and the site root that
  shared chrome names as donor serves nothing.
- A doc-rooted home whose output formats (site `outputs.home`, or its own front
  matter) don't start with `HTML`: a link-only page keeps only its first
  configured format, so the home has no `html` URL to compare with; the home
  stays the root page, no render is the donor, and the placeholders name an
  empty donor (the client fetches the page itself once); `llms.txt` discovery
  follows the home's kept formats, present only when `LLMS` is among them. The
  same holds for `build.render: never` and an empty `outputs.home`, where
  `llms.txt`'s home and locale links are empty too (the `docs` section page
  still publishes its `llms.txt`). Hugo's [`outputs` convention][outputs] is
  `HTML` first.
- A `docs` section page whose `outputs` leave out `HTML`: it is neither selected
  nor a donor.
- `uglyURLs` set for the `docs` section only (`uglyURLs: { docs: true }`): the
  section page publishes at `/index.html` while the home page, in no section,
  keeps `/`, so the URLs differ and the home stays the root page, with no
  discovery and no donor.
- `HTML` marked `notAlternative`: the donor page's other renders then carry the
  chrome too (the current-render test is "`HTML` is not among the
  alternatives"); the placeholders still name the site root, so the restore
  works.
- A paginated root page: each `/page/N/` continuation renders the chrome too.
  The theme's own layouts paginate only the blog list.

<!-- prettier-ignore-start -->
[#2875]: https://github.com/docsy/docsy/issues/2875
[chrome build mode]: /docs/deployment/chrome/
[Discovery]: /docs/content/agent-support/#discovery
[doc-rooted site]: /docs/content/adding-content/#doc-rooted-sites
[donor page]: /docs/deployment/chrome/#donor-pages
[outputs]: https://gohugo.io/configuration/outputs/
[path conflict]: /docs/content/adding-content/#check-for-path-conflicts
[partial]: https://github.com/docsy/docsy/blob/main/theme/layouts/_partials/td/root-page.html
[root page]: /docs/content/adding-content/#how-it-works
<!-- prettier-ignore-end -->
