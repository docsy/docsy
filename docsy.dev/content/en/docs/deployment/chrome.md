---
title: Chrome build modes
description: >-
  Choose how Docsy renders repeated navigation chrome: on every page, or shared
  across pages and restored client-side for smaller, faster-to-check output.
cSpell:ignore: pagelinks
---

A docs site repeats the same auto-generated _[chrome][]_ (the navbar, footer,
and left-nav) on _every_ page, even though those regions are usually identical
site-wide.

Use the `td.chrome` parameter to select one of two **build modes**:

- **`full`** (default) renders each page's chrome on the page itself, ready for
  any client. Any `td.chrome` value other than `shared` is treated as `full`, so
  a typo fails safe.
- **`shared`** renders each region on its [donor page][] only and restores it on
  the other pages in the browser with a small script. The output stays lean,
  while readers still get the full navigation once the page loads.

> [!NOTE] Web dev note
>
> `shared` mode is in the spirit of the [app-shell pattern][app-shell] but
> applied to page chrome, where a single region instance is fetched from its
> donor page and restored on the client, over an otherwise static [multi-page
> site][mpa].

The `shared` mode helps wherever a JavaScript-capable client or a link checker
consumes the output:

- **Faster link checking.** A checker reaches each unique chrome link once
  instead of once per page, and sees the lean output because it doesn't run the
  restore script.
- **Cleaner output diffs.** A change to a shared region shows up once instead of
  on every page, so a diff surfaces the content that actually changed.
- **Smaller output** for local development and deploy previews.

## Donor pages

A region's **donor page** is the page on which `shared` mode renders it; the
other pages carry a placeholder that the browser fills from the donor page.
Clients without JavaScript (some search crawlers included) see only the donor
pages' chrome. The donors:

- **Navbar and footer**: each language's **[root page][]** (the home page, or
  the `docs` section page on a doc-rooted site).
- **Left-nav**: the page's first section, that is, the docs section page; on a
  site whose home page has `type: docs` (the pre-0.15 shape), the home page,
  unless the page sets `toc_root: true`.

## What `shared` mode keeps reachable

The donor pages are chosen to keep chrome links reachable without JavaScript:

- **Navbar and footer**: their links are config-defined and identical across the
  language. The exceptions are the navbar's optional selectors:
  - A [version menu][version-menu] with `version_menu_pagelinks` renders
    per-page links, which the browser restores but a link checker reaches only
    on the root page.
  - The language selector links each page's own translation, which the
    destination language's left-nav already covers; only a full build reaches a
    translation hidden from the left-nav (`toc_hide`). For the restored
    selector, see the [known differences][].
- **Left-nav** (computed per page): the docs section page carries the full docs
  tree. `shared` mode currently targets the **docs** section; other sections
  (such as blog) aren't a validated target yet, so keep `full` for them.

## Known differences from a full build

> [!CAUTION]
>
> `shared` mode is [experimental][]: it rests on assumptions about how chrome
> repeats that may not hold for every site. Keep `full` for production, and run
> full-site link checks as well, even if less often.

The restore aims to match a full build, with these exceptions:

- The navbar's language selector is restored by swapping the language prefix of
  the current page's path ([#2689][]), so:
  - A page with no translation in a language gets a live link where a full build
    disables the item.
  - On a [doc-rooted site][doc-rooted], title-based slugs usually differ across
    languages, so the restored link misses.
- The restored navbar marks one entry active, the longest match for the current
  path, where a full build marks every entry whose page contains it ([#2689][]):
  - With nested menu entries, a parent entry loses its active state on pages
    under a child entry; on a [doc-rooted site][doc-rooted], the docs entry
    under any docs subsection with its own entry.
  - On a doc-rooted site, the docs entry is active on non-docs pages that no
    other entry covers, such as taxonomy and 404 pages (its URL, the language
    root, prefixes every path), where a full build marks none.
- A [scoped sidebar][sidebar-root] (`sidebar_root_for`) restores the right links
  and active state, but its re-rooted subtree differs structurally from a full
  build (an extra wrapper element, renumbered `ul` levels), which can show as
  one indentation level less under a non-foldable, non-compact nav.
- With `uglyURLs`, section URLs end in `index.html`, which the restore doesn't
  treat as a directory: the version and language selector links keep the donor
  page's `index.html`, no section menu entry is marked active on pages under it,
  the out-of-tree active path is empty, and a scoped sidebar's "up" link points
  at the directory ([#2689][]).
- With `sidebar_menu_compact: true` and `sidebar_menu_foldable: false`, the
  restored left-nav opens the current page's siblings and children only, where a
  full build also shows the siblings of every ancestor on the active path
  ([#2689][]).

## Setting the build mode

Set the `td.chrome` parameter to `shared` (the default is `full`):

{{< tabpane text=true >}} {{% tab header="hugo.yaml" lang="yaml" %}}

```yaml
params:
  td:
    chrome: shared
```

{{% /tab %}} {{% tab header="hugo.toml" lang="toml" %}}

```toml
[params.td]
chrome = "shared"
```

{{% /tab %}} {{< /tabpane >}}

For a link-checking or preview CI job, it's usually cleaner to set it through
the environment instead, leaving your committed config untouched:

```sh
HUGO_PARAMS_TD_CHROME=shared hugo
```

See Hugo's [configuration with environment variables][hugo-env-config]. Then run
your link checker against the generated `public/` output as usual: a `shared`
build needs no checker-specific configuration.

To keep one page's chrome in a `shared` build, set the parameter in its front
matter:

```yaml
td: { chrome: full }
```

Two limits of the per-page setting:

- It doesn't make the page complete without JavaScript on a large site: above
  [`sidebar_cache_limit`][sidebar-cache], the left-nav is the cached site-wide
  one, shipped hidden and revealed by script, on `full` pages too.
- Below `sidebar_cache_limit`, setting it on a left-nav donor page (a `docs`
  section page) leaves that page's own active state in the nav that other pages
  restore from it: the restored nav then marks both the donor and the current
  page active.

<!-- prettier-ignore-start -->
[#2689]: https://github.com/docsy/docsy/issues/2689
[app-shell]: https://developer.chrome.com/blog/app-shell
[chrome]: https://www.nngroup.com/articles/browser-and-gui-chrome/
[doc-rooted]: /docs/content/adding-content/#doc-rooted-sites
[donor page]: #donor-pages
[experimental]: /project/about/changelog/#experimental
[hugo-env-config]: https://gohugo.io/configuration/introduction/#environment-variables
[known differences]: #known-differences-from-a-full-build
[mpa]: https://web.dev/learn/pwa/architecture/
[root page]: /docs/content/adding-content/#how-it-works
[sidebar-cache]: /docs/content/navigation/#side-nav-options
[sidebar-root]: /docs/content/navigation/#sidebar-root
[version-menu]: /docs/content/versioning/#adding-a-version-drop-down-menu
<!-- prettier-ignore-end -->
