---
title: Repository Links and other page information
linkTitle: Repo links and page info
description:
  Help your users interact with page source and view page-source information.
cSpell:ignore: lastmod
---

The Docsy
[docs and blog layouts](/docs/content/adding-content/#adding-docs-and-blog-posts)
include links for readers to edit the page or create issues for your docs or
project via your site's source repository. The current generated links for each
docs or blog page are:

- **View page source**: Brings the user to the page source in your docs repo.
- **Edit this page**: Brings the user to an editable version of the page content
  in their fork (if available) of your docs repo. If the user doesn't have a
  current fork of your docs repo, they are invited to create one before making
  their edit. The user can then create a pull request for your docs.
- **Create child page**: Brings the user to a create new file form in their fork
  of your docs repo. The new file will be located as a child of the page they
  clicked the link on. The form will be pre-populated with a template the user
  can edit to create their page. You can change this by adding
  `assets/stubs/new-page-template.md` to your own project.
- **Create documentation issue**: Brings the user to a new issue form in your
  docs repo with the name of the current page as the issue's title.
- **Create project issue** (optional): Brings the user to a new issue form in
  your project repo. This can be useful if you have separate project and docs
  repos and your users want to file issues against the project feature being
  discussed rather than your docs.

This page shows you how to configure these links.

Currently, Docsy supports only GitHub repository links "out of the box". Since
GitLab can handle the same link scheme, it should work as well. If you are using
another repository such as Bitbucket and would like generated repository links,
feel free to [add a feature request or update our theme](/docs/contributing/).

## Link configuration

There are four site variables you can configure in
`hugo.toml`/`hugo.yaml`/`hugo.json` to set up links, as well as one in your page
metadata.

### `github_repo`

The URL for your site's source repository. This is used to generate the **Edit
this page**, **Create child page**, and **Create documentation issue** links.

<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[params]
github_repo = "https://github.com/docsy/docsy"
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
params:
  github_repo: https://github.com/docsy/docsy
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "params": {
    "github_repo": "https://github.com/docsy/docsy"
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-restore -->

### `github_subdir` (optional)

Specify a value here if your content directory is not in your repo's root
directory. For example, this site is in the `docsy.dev` subdirectory of its
repo. Setting this value means that your edit links will go to the right page.

<!-- markdownlint-disable no-shortcut-ref-link -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[params]
github_subdir = "docsy.dev"
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
params:
  github_subdir: docsy.dev
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "params": {
    "github_subdir": "docsy.dev"
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-enable no-shortcut-ref-link -->

### `github_project_repo` (optional)

Specify a value here if you have a separate project repo and you'd like your
users to be able to create issues against your project from the relevant docs.
The **Create project issue** link appears only if this is set.

<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[params]
github_project_repo = "https://github.com/docsy/docsy"
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
params:
  github_project_repo: https://github.com/docsy/docsy
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "params": {
    "github_project_repo": "https://github.com/docsy/docsy"
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-restore -->

### `github_branch` (optional)

Specify a value here if you would like to reference a different branch for the
other github settings like **Edit this page** or **Create project issue**.

<!-- markdownlint-disable no-shortcut-ref-link -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[params]
github_branch = "production"
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
params:
  github_branch: production
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "params": {
    "github_branch": "production"
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-enable no-shortcut-ref-link -->

### `path_base_for_github_subdir` (optional)

Suppose that the source files for all of the pages under `content/some-section`
come from another repo, such as a [git submodule][]. Add settings like these to
the **section's index page** so that the repository links for all pages in that
section refer to the originating repo:

<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Front matter:" disabled=true />}}
{{< tab header="toml" lang="toml" >}}
+++
title = "Some super section"
[cascade]
github_repo = "https://github.com/some-username/another-repo/"
github_subdir = "docs"
path_base_for_github_subdir = "content/some-section"
…
+++
{{< /tab >}}
{{< tab header="yaml" lang="yaml" >}}
---
title: Some super section
cascade:
  github_repo: https://github.com/some-username/another-repo/
  github_subdir: docs
  path_base_for_github_subdir: content/some-section
…
---
{{< /tab >}}
{{< tab header="json" lang="json" >}}
{
  "title": "Some super section",
  "cascade": {
    "github_repo": "https://github.com/some-username/another-repo/",
    "github_subdir": "docs",
    "path_base_for_github_subdir": "content/some-section"
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-restore -->

As an example, consider a page at the path
`content/some-section/subpath/some-page.md` with `github_branch` globally set to
`main`. The index page settings above will generate the following edit link for
`some-page.md`:

```nocode
https://github.com/some-username/another-repo/edit/main/docs/subpath/some-page.md
```

If you only have a single page originating from another repo, then omit the
`cascade` key and write, at the top-level, the same settings as illustrated
above.

If you'd like users to create project issues in the originating repo as well,
then also set `github_project_repo`, something like this:

```yaml
---
---
cascade:
  github_repo: &repo https://github.com/some-username/another-repo/
  github_project_repo: *repo
---
```

<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Front matter:" disabled=true />}}
{{< tab header="toml" lang="toml" >}}
+++
…
[cascade]
github_repo = "https://github.com/some-username/another-repo/"
github_project_repo = "https://github.com/some-username/another-repo/"
…
+++
{{< /tab >}}
{{< tab header="yaml" lang="yaml" >}}
---
…
cascade:
  github_repo: &repo https://github.com/some-username/another-repo/
  github_project_repo: *repo
…
---
{{< /tab >}}
{{< tab header="json" lang="json" >}}
{
  "cascade": {
    "github_repo": "https://github.com/some-username/another-repo/",
    "github_project_repo": "https://github.com/some-username/another-repo/"
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-restore -->

> [!TIP]
>
> Notice that the YAML code fragment makes use of
> [Yaml anchor](https://support.atlassian.com/bitbucket-cloud/docs/yaml-anchors/).
> Use of Yaml anchors is optional, but it helps keep the settings
> [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself).

The `path_base_for_github_subdir` setting is a regular expression, so you can
use it even if you have a site with [multiple languages][] for example:

<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Front matter:" disabled=true />}}
{{< tab header="toml" lang="toml" >}}
+++
…
path_base_for_github_subdir = "content/\w+/some-section"
…
+++
{{< /tab >}}
{{< tab header="yaml" lang="yaml" >}}
---
…
path_base_for_github_subdir: content/\w+/some-section
…
---
{{< /tab >}}
{{< tab header="json" lang="json" >}}
{
…
  "path_base_for_github_subdir": "content/\w+/some-section"
…
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-restore -->

In situations where a page originates from a file under a different name, you
can specify `from` and `to` path-rename settings. Here's an example where an
index file is named `README.md` in the originating repo:

<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Front matter:" disabled=true />}}
{{< tab header="toml" lang="toml" >}}
+++
…
github_repo = "https://github.com/some-username/another-repo/"
github_subdir = "docs"

[path_base_for_github_subdir]
from = "content/some-section/(.*?)/_index.md"
to = "$1/README.md"
…
+++
{{< /tab >}}
{{< tab header="yaml" lang="yaml" >}}
---
…
github_repo: https://github.com/some-username/another-repo/
github_subdir: docs
path_base_for_github_subdir:
  from: content/some-section/(.*?)/_index.md
  to: $1/README.md
…
---
{{< /tab >}}
{{< tab header="json" lang="json" >}}
{
  …
  "github_repo": "https://github.com/some-username/another-repo/",
  "github_subdir": "docs",
  "path_base_for_github_subdir": {
    "from": "content/some-section/(.*?)/_index.md",
    "to": "$1/README.md"
  },
  …
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-restore -->

### `github_url` (optional)

> [!WARNING] Deprecation note
>
> This setting is deprecated. Use
> [path_base_for_github_subdir](#path_base_for_github_subdir-optional) instead.

Specify a value for this **in your page metadata** to set a specific edit URL
for this page, as in the following example:

<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Front matter:" disabled=true />}}
{{< tab header="toml" lang="toml" >}}
+++
title = "Some page"
github_url = "https://github.com/some-username/another-repo/edit/main/README.md"
…
+++
{{< /tab >}}
{{< tab header="yaml" lang="yaml" >}}
---
title: Some page
github_url: https://github.com/some-username/another-repo/edit/main/README.md
…
---
{{< /tab >}}
{{< tab header="json" lang="json" >}}
{
  "title": "Some page",
  "github_url": "https://github.com/some-username/another-repo/edit/main/README.md",
  …
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-restore -->

This can be useful if you have page source files in multiple Git repositories,
or require a non-GitHub URL. Pages using this value have **Edit this page**
links only.

### Disabling links

You can use CSS to selectively hide links. For example, add the following to
your [projects's `_styles_project.scss`][project-style-files] file to hide
**Create child page** links from all pages (optionally with a `!important`
modifier -- not shown):

```scss
.td-page-meta__child {
  display: none;
}
```

Each link kind has an associated unique class named `.td-page-meta__KIND`, as
defined by the following table:

| Link kind                  | Class name                     |
| -------------------------- | ------------------------------ |
| View page source           | `.td-page-meta__view`          |
| Edit this page             | `.td-page-meta__edit`          |
| Create child page          | `.td-page-meta__child`         |
| Create documentation issue | `.td-page-meta__issue`         |
| Create project issue       | `.td-page-meta__project-issue` |

Of course, you can also use these classes to give repository links unique styles
for your project.

> [!WARNING] Version note
>
> Class names using the `--KIND` suffix were deprecated as of [v0.9.0][].
>
> [v0.9.0]: /project/about/changelog/#v0.9.0

## Last-modified page metadata

To have page-source metadata displayed at the bottom of documentation pages and
blog posts, set the `GitInfo` configuration parameter to `true`, and ensure that
`params.github_repo` is defined.

A last-modified page note looks something like this:

> <div class="td-page-meta__lastmod"
>      style="margin-top: 0 !important; display: block !important;">
>
> Last modified November 29, 2023:
> [Release v0.8.0 preparation (#1756) (6bb4f99)](https://github.com/google/docsy/commit/6bb4f99d1eab4976fb80d1488c81ba12b1715c05)
>
> </div>
> {.border-0}

Once enabled site-wide, you can selectively hide last-modified notes in a page
or section by declaring the following style (optionally with a `!important`
modifier &mdash; not shown):

```scss
.td-page-meta__lastmod {
  display: none;
}
```

[git submodule]: https://git-scm.com/book/en/v2/Git-Tools-Submodules
[multiple languages]: ../language/
[project-style-files]: lookandfeel/#project-style-files
