---
title: Adding Content
description: Add different types of content to your Docsy site.
params:
  alert-examples: |
    > [!TIP]
    >
    > Did you know that...

    > [!NOTE] Version note
    >
    > This feature is only available in version 2.0 and later.

    > [!WARNING] :warning: Blank line required!
    >
    > This site uses the [Prettier] formatter, and it requires an empty line
    > separating the alert tag/title from the alert body.

    > [!DANGER] Danger Will Robinson!
# prettier-ignore
cSpell:ignore: goldmark Riona MacNamara asciidoctor pandoc changefreq
---

So you've got a new Hugo website with Docsy, now it's time to add some content!
This page tells you how to use the theme to add and structure your site content.

## Content root directory

You add content for your site under the **content root directory** of your Hugo
site project - either `content/` or a [language-specific](/docs/language/) root
like `content/en/`. The main exception here is static files that you don't want
built into your site: you can find out more about where you add these below in
[Adding static content](#adding-static-content). The files in your content root
directory are typically grouped in subdirectories corresponding to your site's
sections and templates, which we'll look at in
[Content sections and templates](#content-sections-and-templates).

You can find out more about Hugo directory structure in
[Directory Structure Explained](https://gohugo.io/getting-started/directory-structure/).

## Content sections and templates

Hugo builds your site pages using the content files you provide plus any
templates provided by your site's theme. These templates (or _"layouts"_ in Hugo
terminology) include things like your page's headers, footers, navigation, and
links to stylesheets: essentially, everything except your page's specific
content. The templates in turn can be made up of _partials_: little reusable
snippets of HTML for page elements like headers, search boxes, and more.

Because most technical documentation sites have different sections for different
types of content, the Docsy theme comes with the
[following templates](https://github.com/docsy/docsy/tree/main/theme/layouts)
for top-level site sections that you might need:

- [`docs`](https://github.com/docsy/docsy/tree/main/theme/layouts/docs) is for
  pages in your site's Documentation section.
- [`blog`](https://github.com/docsy/docsy/tree/main/theme/layouts/blog) is for
  pages in your site's Blog.
- [`community`](https://github.com/docsy/docsy/tree/main/theme/layouts/community)
  is for your site's Community page.

It also provides a
[default "landing page" type of template](https://github.com/docsy/docsy/tree/main/theme/layouts/)
with the site header and footer, but no left nav, that you can use for any other
section. In this site and our example site it's used for the site [home page](/)
and the [About](/about/) page.

Each top-level **section** in your site corresponds to a **directory** in your
site content root. Hugo automatically applies the appropriate **template** for
that section, depending on which folder the content is in. For example, this
page is in the `docs` subdirectory of the site's content root directory
`content/en/`, so Hugo automatically applies the `docs` template. You can
override this by explicitly specifying a template or [content type][] for a
particular page.

If you've copied the example site, you already have appropriately named
top-level section directories for using Docsy's templates, each with an index
page (`_index.md` or `index.html`) for users to land on. These top-level
sections also appear in the example site's
[navbar](/docs/content/navigation/#site-navbar).

### Custom sections

If you've copied the example site and _don't_ want to use one of the provided
content sections, just delete the appropriate content subdirectory. Similarly,
if you want to add a top-level section, just add a new subdirectory, though
you'll need to specify the layout or content type explicitly in the
[front matter](#page-front-matter) of each page if you want to use any existing
Docsy template other than the default one. For example, if you create a new
directory `content/en/amazing` and want one or more pages in that custom section
to use Docsy's `docs` template, you add `type: docs` to the front matter of each
page:

<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Front matter:" disabled=true />}}
{{< tab header="toml" lang="toml" >}}
+++
title = "My amazing new section"
weight = 1
type = "docs"
description = '''
A special section with a docs layout.
'''
+++
{{< /tab >}}
{{< tab header="yaml" lang="yaml" >}}
---
title: "My amazing new section"
weight: 1
type: docs
description: >
  A special section with a docs layout.
---
{{< /tab >}}
{{< tab header="json" lang="json" >}}
{
  "title": "My amazing new section",
  "weight": 1,
  "type": "docs",
  "description": "A special section with a docs layout.\n"
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-restore -->

Alternatively, create your own page template for your new section in your
project's `layouts` directory based on one of the existing templates.

You can find out much more about how Hugo page layouts work in
[Hugo Templates](https://gohugo.io/templates/). The rest of this page tells you
about how to add content and use each of Docsy's templates.

## Doc-rooted sites <a id="alternative-site-structure"></a>

{{%_param BADGE EXPERIMENTAL info %}}

Docsy supports documentation-first websites through a **doc-rooted** site
structure, where:

- Documentation pages are published at the site root (`/`) rather than under the
  `/docs/` path prefix.
- Page files remain in the `docs` section directory, for example `content/docs/`
  or `content/en/docs/`.

As a consequence, the `docs` section landing page becomes the site home page. A
doc-rooted site has the following benefits:

- Produces simpler, documentation-focused URLs (no `/docs/` prefix).
- Avoids the need to create a custom home page using [blocks][] shortcodes or
  HTML.

To create a doc-rooted site, redefine the `docs` section [permalinks][] in your
[site configuration][] as follows (YAML format shown):

```yaml
permalinks:
  page:
    docs: /:sections[1:]/:slug/
  section:
    docs: /:sections[1:]
```

Because the docs section landing page now serves as the home page, you need to
add extra configuration to avoid "Duplicate target paths" warnings and avoid
render conflicts with the site-root index file.

Add the following front matter to each site root index file (one per language in
multilingual sites):

```yaml
build: { render: link }
```

For an example of a doc-rooted variant of this site, see the [Doc-rooted
example][] variant.

[Doc-rooted example]: https://doc-rooted--docsydocs.netlify.app

### Check for path conflicts

If your doc-rooted site has non-docs pages (such as blog or community pages),
check for possible root-level path conflicts between docs and non-docs pages. To
have Hugo report duplicate path warnings when building your site, use the
`--printPathWarnings` flag.

### Legacy _docs-only_ setup

Earlier versions of this page described a docs-only configuration that used a
front matter `cascade` to set page `type` values.

That approach is no longer supported and can produce incorrect behavior. If you
are migrating from that setup, remove the old `cascade` entries and use the
configuration described earlier in this section.

## Page front matter

Each page file in a Hugo site has metadata front matter that tells Hugo about
the page. You specify page front matter in TOML, YAML, or JSON (our example site
and this site use YAML). Use the front matter to specify the page title,
description, creation date, link title, template, menu weighting, and even any
resources such as images used by the page. You can see a complete list of
possible page front matter in
[Front Matter](https://gohugo.io/content-management/front-matter/).

For example:

<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Front matter:" disabled=true />}}
{{< tab header="toml" lang="toml" >}}
+++
title = "About Docsy"
linkTitle = "About"
description = "Docsy is ..."
+++
{{< /tab >}}
{{< tab header="yaml" lang="yaml" >}}
---
title: About Docsy
linkTitle: About
description: Docsy is ...
---
{{< /tab >}}
{{< tab header="json" lang="json" >}}
{
  "title": "About Docsy",
  "linkTitle": "About",
  "description": "Docsy is ..."
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-restore -->

The minimum front matter you need to provide is a title: everything else is up
to you! However, if you leave out the page weight, your
[navigation](/docs/content/navigation) may get a little disorganized. You may
also want to include `description` since Docsy uses that to generate the meta
`description` tag used by search engines. For details, see
[Search Engine Optimization (SEO) meta tags](/docs/content/feedback/#search-engine-optimization-meta-tags).

## Page content

Most often you create pages in a Docsy site as [Markdown or HTML files][formats]
with [page front matter](#page-front-matter). Hugo's default markup and markdown
renderer is [Goldmark][].

### Markdown

Markdown is Hugo’s default content format. Hugo renders Markdown to HTML using
[Goldmark][], which conforms to [CommonMark][] and [GitHub Flavored
Markdown][GFM] specifications and a few more extensions.

Hugo provides Markdown features including:

- [Attributes][] for adding custom IDs and classes to Markdown elements
- [Extensions][] such as tables, footnotes, task lists, etc.
- [Render hooks][] for customizing the HTML output of Markdown elements.

Docsy provides custom render hooks for the following Markdown elements:

- [Blockquote alerts](#alerts)
- Code blocks for Mermaid diagrams, math and chemical equations. For details,
  see [Diagrams and Formulae](/docs/content/diagrams-and-formulae/)

### Markup, shortcodes, and content features {#markup-and-content-features}

Hugo supports content formats and features including HTML, [Emojis][], and more.
For details, see [Content formats][formats].

In addition, you can call [shortcodes][] from your content. To learn more about
shortcodes in general, and how to use Docsy's provided shortcodes, see
[Shortcodes](/docs/content/shortcodes).

### Alerts

Docsy supports Hugo's blockquote syntax for [alerts][], specifically [GFM][]
base syntax for callouts, and Obsidian-style titles. For example:

```markdown
{{% _param alert-examples %}}
```

Which renders as:

{{% _param alert-examples %}}

In addition, Docsy supports alert types corresponding to the Bootstrap alerts
types missing from [GFM][], as well as `NB` -- short for _nota bene_.

Use `NB` for short single-line notes rendered without a label. For example:

```markdown
> [!NB] **Skip this section** if the package is already installed.
```

Which renders as:

> [!NB] **Skip this section** if the package is already installed.

As illustrated above, the alert type is used as a title when no title is
specified.

Learn how to customize alert appearance in the [Alert][LnF-Alert] section of
[Look and Feel][].

[LnF-Alert]: /docs/content/lookandfeel/#alerts

### Links

Hugo lets you specify links using normal Markdown syntax, though remember that
you need to specify links relative to your site's root URL, and that relative
URLs are left unchanged by Hugo in your site's generated HTML.

Alternatively you can use Hugo's helper
[`ref` and `relref` shortcodes](https://gohugo.io/functions/relref/) for
creating internal links that resolve to the correct URL. However, be aware this
means your links will not appear as links at all if a user views your page
outside your generated site, for example using the rendered Markdown feature in
GitHub's web UI.

You can find (or add!) tips and gotchas for working with Hugo links in
[Hugo Tips](/docs/best-practices/site-guidance).

### Content style

We don't mandate any particular style for your page contents. However, if you'd
like some guidance on how to write and format clear, concise technical
documentation, we recommend the
[Google Developer Documentation Style Guide](https://developers.google.com/style/),
particularly the
[Style Guide Highlights](https://developers.google.com/style/highlights).

## Page bundles

You can create site pages as standalone files in their section or subsection
directory, or as folders where the content is in the folder's index page.
Creating a folder for your page lets you
[bundle](https://gohugo.io/content-management/page-bundles/) images and other
resources together with the content.

You can see examples of both approaches in this and our example site. For
example, the source for this page is just a standalone file
`/content/en/docs/content/adding-content.md`. However the source for
[Docsy Shortcodes](shortcodes/) in this site lives in
`/content/en/docs/content/shortcodes/index.md`, with the image resource used by
the page in the same `shortcodes/` directory. In Hugo terminology, this is
called a _leaf bundle_ because it's a folder containing all the data for a
single site page without any child pages (and uses `index.md` without an
underscore).

You can find out much more about managing resources with Hugo bundles in
[Page bundles](https://gohugo.io/content-management/page-bundles/).

> [!IMPORTANT]
>
> For multilingual single-host sites, Hugo does not duplicate shared page
> resources (such as images) by default. You typically do not need to copy
> shared resources into each locale's bundle. For details, see [Page resources
> multilingual][pg-rsc-multilingual].

[pg-rsc-multilingual]:
  https://gohugo.io/content-management/page-resources/#multilingual

## Adding docs and blog posts

The template you'll probably use most often is the
[`docs` template](https://github.com/docsy/docsy/blob/main/theme/layouts/docs/baseof.html)
(as used in this page) or the very similar
[`blog` template](https://github.com/docsy/docsy/blob/main/theme/layouts/blog/baseof.html).
Both these templates include:

- a left nav
- GitHub links (populated from your site config) for readers to edit the page or
  create issues
- a page menu

as well as the common header and footer used by all your site's pages. Which
template is applied depends on whether you've added the content to the `blog` or
`docs` content directory. You can find out more about how the nav and page menu
are created in [Navigation and Search](/docs/content/navigation/).

### Organizing your documentation

While Docsy's top-level sections let you create site sections for different
types of content, you may also want to organize your docs content within your
`docs` section. For example, this site's `docs` section directory has multiple
subdirectories for **Getting Started**, **Content and Customization**, and so
on. Each subdirectory has an `_index.md` (it could also be an `_index.html`),
which acts as a section index page and tells Hugo that the relevant directory is
a subsection of your docs.

Docsy's `docs` layout gives you a left side navigation panel (side
nav)[^sidebar-note] with autogenerated nested entries based on your `docs` file
structure. Each standalone page or subsection `_index.md` or `_index.html` page
in the `docs/` directory appears as a side nav top-level entry, using the link
name and `weight` metadata from the page or index.

[^sidebar-note]: Also sometimes referred to as the sidebar.

To add docs to a subsection, just add your page files to the relevant
subdirectory. Any pages that you add to a subsection in addition to the
subsection index page will appear in a submenu (look to the left to see one in
action!), again ordered by page `weight`. Find out more about adding Docsy's
navigation metadata in [Navigation and Search](/docs/content/navigation/)

If you've copied the example site, you'll already have some suggested
subdirectories in your `docs` directory, with guidance for what types of content
to put in them and some example Markdown pages. You can find out more about
organizing your content with Docsy in
[Organizing Your Content](/docs/best-practices/organizing-content/).

#### Docs section landing pages

By default a docs section landing page (the `_index.md` or `_index.html` in the
section directory) uses a layout that adds a formatted list of links to the
pages in the section, with their front matter descriptions. The
[Content and Customization](/docs/content/) landing page in this site is a good
example.

To display a simple bulleted list of links to the section's pages instead,
specify `simple_list: true` in the landing page's front matter:

<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Front matter:" disabled=true />}}
{{< tab header="toml" lang="toml" >}}
+++
title = "Simple List Page"
simple_list = true
weight = 20
+++
{{< /tab >}}
{{< tab header="yaml" lang="yaml" >}}
---
title: "Simple List Page"
simple_list: true
weight: 20
---
{{< /tab >}}
{{< tab header="json" lang="json" >}}
{
  "title": "Simple List Page",
  "simple_list": true,
  "weight": 20
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-restore -->

To display no links at all, specify `no_list: true` in the landing page's front
matter:

<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Front matter:" disabled=true />}}
{{< tab header="toml" lang="toml" >}}
+++
title = "No List Page"
no_list = true
weight = 20
+++
{{< /tab >}}
{{< tab header="yaml" lang="yaml" >}}
---
title: "No List Page"
no_list: true
weight: 20
---
{{< /tab >}}
{{< tab header="json" lang="json" >}}
{
  "title": "No List Page",
  "no_list": true,
  "weight": 20
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-restore -->

### Organizing your blog posts

Docsy's `blog` layout also gives you a left nav menu (like the `docs` layout),
and a list-type index page for your blog that's applied to `/blog/_index.md` and
automatically displays snippets of all your recent posts in reverse
chronological order.

To create different blog categories to organize your posts, create subfolders in
`blog/`. For instance, in our
[example site](https://github.com/docsy/docsy-example/tree/main/content/en/blog)
we have `news` and `releases`. Each category needs to have its own `_index.md`
or `_index.html` landing page file specifying the category title for it to
appear properly in the left nav and top-level blog landing page. Here's the
index page for `releases`:

<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Front matter:" disabled=true />}}
{{< tab header="toml" lang="toml" >}}
+++
title = "New Releases"
linkTitle = "Releases"
weight = 20
+++
{{< /tab >}}
{{< tab header="yaml" lang="yaml" >}}
---
title: "New Releases"
linkTitle: "Releases"
weight: 20
---
{{< /tab >}}
{{< tab header="json" lang="json" >}}
{
  "title": "New Releases",
  "linkTitle": "Releases",
  "weight": 20
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-restore -->

To add author and date information to blog posts, add them to the page front
matter:

<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Front matter:" disabled=true />}}
{{< tab header="toml" lang="toml" >}}
+++
date = 2018-10-06T00:00:00.000Z
title = "Easy documentation with Docsy"
linkTitle = "Announcing Docsy"
description = "The Docsy Hugo theme lets project maintainers and contributors focus on content, not on reinventing a website infrastructure from scratch"
author = "Riona MacNamara"

[[resources]]
src = "**.{png,jpg}"
title = "Image #:counter"

  [resources.params]
  byline = "Photo: Riona MacNamara / CC-BY-CA"
+++
{{< /tab >}}
{{< tab header="yaml" lang="yaml" >}}
---
date: 2018-10-06
title: "Easy documentation with Docsy"
linkTitle: "Announcing Docsy"
description: "The Docsy Hugo theme lets project maintainers and contributors focus on content, not on reinventing a website infrastructure from scratch"
author: Riona MacNamara
resources:
  - src: "**.{png,jpg}"
    title: "Image #:counter"
    params:
    byline: "Photo: Riona MacNamara / CC-BY-CA"
---
{{< /tab >}}
{{< tab header="json" lang="json" >}}
{
  "date": "2018-10-06T00:00:00.000Z",
  "title": "Easy documentation with Docsy",
  "linkTitle": "Announcing Docsy",
  "description": "The Docsy Hugo theme lets project maintainers and contributors focus on content, not on reinventing a website infrastructure from scratch",
  "author": "Riona MacNamara",
  "resources": [
    {
      "src": "**.{png,jpg}",
      "title": "Image #:counter",
      "params": {
        "byline": "Photo: Riona MacNamara / CC-BY-CA"
      }
    }
  ]
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-restore -->

If you've copied the example site and you don't want a blog section, or want to
link to an external blog instead, just delete the `blog` subdirectory.

## Working with top-level landing pages

Docsy's
[default page template](https://github.com/docsy/docsy/blob/main/theme/layouts/docs/baseof.html)
has no left nav and is useful for creating a home page for your site or other
"landing" type pages.

### Customizing the example site pages

If you've copied the example site, you already have a simple site landing page
in `content/en/_index.html`. This is made up of Docsy's provided Hugo shortcode
[page blocks](/docs/content/shortcodes/#blocks).

To customize the large landing image, which is in a
[cover](/docs/content/shortcodes/#blocks-cover) block, replace the
`content/en/featured-background.jpg` file in your project with your own image
(it can be called whatever you like as long as it has `background` in the file
name). You can remove or add as many blocks as you like, as well as adding your
own custom content.

The example site also has an About page in `content/en/about/_index.html` using
the same Docsy template. Again, this is made up of
[page blocks](/docs/content/shortcodes/#blocks), including another background
image in `content/en/about/featured-background.jpg`. As with the site landing
page, you can replace the image, remove or add blocks, or just add your own
content.

### Building your own landing pages

If you've just used the theme, you can still use all Docsy's provided
[page blocks](/docs/content/shortcodes/#blocks) (or any other content you want)
to build your own landing pages in the same file locations.

## Adding a community page

The `community` landing page template has boilerplate content that's
automatically filled in with the project name and community links specified in
`hugo.toml`/`hugo.yaml`/`hugo.json`, providing your users with quick links to
resources that help them get involved in your project. The same links are also
added by default to your site footer.

{{< tabpane text=true persist=lang >}}
{{< tab header="Configuration file:" disabled=true />}}
{{% tab header="hugo.toml" lang="toml" %}}

```toml
[params.links]
# End user relevant links. These will show up on left side of footer and in the community page if you have one.
[[params.links.user]]
	name = "User mailing list"
	url = "https://example.org/mail"
	icon = "fa fa-envelope"
        desc = "Discussion and help from your fellow users"
[[params.links.user]]
	name ="Twitter"
	url = "https://example.org/twitter"
	icon = "fab fa-x-twitter"
        desc = "Follow us on Twitter to get the latest news!"
[[params.links.user]]
	name = "Stack Overflow"
	url = "https://example.org/stack"
	icon = "fab fa-stack-overflow"
        desc = "Practical questions and curated answers"
# Developer relevant links. These will show up on right side of footer and in the community page if you have one.
[[params.links.developer]]
	name = "GitHub"
	url = "https://github.com/docsy/docsy"
	icon = "fab fa-github"
        desc = "Development takes place here!"
[[params.links.developer]]
	name = "Slack"
	url = "https://example.org/slack"
	icon = "fab fa-slack"
        desc = "Chat with other project developers"
[[params.links.developer]]
	name = "Developer mailing list"
	url = "https://example.org/mail"
	icon = "fa fa-envelope"
        desc = "Discuss development issues around the project"
```

{{% /tab %}} {{% tab header="hugo.yaml" lang="yaml" %}}

```yaml
params:
  links:
    user:
      - name: User mailing list
        url: 'https://example.org/mail'
        icon: fa fa-envelope
        desc: Discussion and help from your fellow users
      - name: Twitter
        url: 'https://example.org/twitter'
        icon: fab fa-x-twitter
        desc: Follow us on Twitter to get the latest news!
      - name: Stack Overflow
        url: 'https://example.org/stack'
        icon: fab fa-stack-overflow
        desc: Practical questions and curated answers
    developer:
      - name: GitHub
        url: 'https://github.com/docsy/docsy'
        icon: fab fa-github
        desc: Development takes place here!
      - name: Slack
        url: 'https://example.org/slack'
        icon: fab fa-slack
        desc: Chat with other project developers
      - name: Developer mailing list
        url: 'https://example.org/mail'
        icon: fa fa-envelope
        desc: Discuss development issues around the project
```

{{% /tab %}} {{% tab header="hugo.json" lang="json" %}}

```json
{
  "params": {
    "links": {
      "user": [
        {
          "name": "User mailing list",
          "url": "https://example.org/mail",
          "icon": "fa fa-envelope",
          "desc": "Discussion and help from your fellow users"
        },
        {
          "name": "Twitter",
          "url": "https://example.org/twitter",
          "icon": "fa-brands fa-x-twitter",
          "desc": "Follow us on Twitter to get the latest news!"
        },
        {
          "name": "Stack Overflow",
          "url": "https://example.org/stack",
          "icon": "fa-brands fa-stack-overflow",
          "desc": "Practical questions and curated answers"
        }
      ],
      "developer": [
        {
          "name": "GitHub",
          "url": "https://github.com/docsy/docsy",
          "icon": "fa-brands fa-github",
          "desc": "Development takes place here!"
        },
        {
          "name": "Slack",
          "url": "https://example.org/slack",
          "icon": "fa-brands fa-slack",
          "desc": "Chat with other project developers"
        },
        {
          "name": "Developer mailing list",
          "url": "https://example.org/mail",
          "icon": "fa fa-envelope",
          "desc": "Discuss development issues around the project"
        }
      ]
    }
  }
}
```

{{% /tab %}} {{< /tabpane >}}

Each `params.links.user` and `params.links.developer` entry may include an
optional [`rel` attribute][]. For example (in YAML):

```yaml
params:
  links:
    user:
      - name: Mastodon
        url: https://fosstodon.org/@opentelemetry
        icon: fab fa-mastodon
        desc: Follow us on Mastodon to get the latest news!
        rel: me
```

Docsy applies it when rendering **footer** icon links; for `http` or `https`
URLs it merges in `noopener` as well.

[`rel` attribute]:
  https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel

If you're creating your own site and want to add a page using this template, add
a `/community/_index.md` file in your content root directory. If you've copied
the example site and _don't_ want a community page, just delete the
`/content/en/community/` directory in your project repo.

By default, Docsy layouts assume that your project's contributing page is found
at `<baseURL>/docs/contribution-guidelines`. To specify another URL, add it to
the front matter of `/community/_index.md` as illustrated next. The URL can be
an external URL or a local path:

```yaml
params:
  contributingUrl: docs/contributing/
```

## Adding static content

You may want to serve some non-Hugo-built content along with your site: for
example, if you have generated reference docs using Doxygen, Javadoc, or other
doc generation tools.

To add static content to be served "as-is", just add the content as a folder
and/or files in your site's `static` directory. When your site is deployed,
content in this directory is served at the site root path. So, for example, if
you have added content at `/static/reference/cpp/`, users can access that
content at `http://{server-url}/reference/cpp/` and you can link to pages in
this directory from other pages at `/reference/cpp/{file name}`.

You can also use this directory for other files used by your project, including
image files. You can find out more about serving static files, including
configuring multiple directories for
[static content](https://gohugo.io/getting-started/directory-structure/#static).

## RSS feeds

Hugo will, by default, create an RSS feed for the home page and any section. To
disable all RSS feeds, add the following to your
`hugo.toml`/`hugo.yaml`/`hugo.json`:

<!-- markdownlint-disable no-shortcut-ref-link -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
disableKinds = ["RSS"]
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
disableKinds: [RSS]
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "disableKinds": [
    "RSS"
  ]
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-enable no-shortcut-ref-link -->

{{% alert title=Note color=info %}}

If you have enabled our [print feature](/docs/content/print/) or otherwise
specified section-level output formats in `hugo.toml`/`hugo.yaml`/`hugo.json`,
make sure that `"RSS"` is listed as an output format, otherwise you won't get
section-level RSS feeds (and your blog section won't get a nice orange RSS
button). Your `hugo.toml`/`hugo.yaml`/`hugo.json` specification overrides the
Hugo default [output formats](https://gohugo.io/methods/page/outputformats/) for
sections, which are HTML and RSS.

<!-- markdownlint-disable no-shortcut-ref-link -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[outputs]
section = [ "HTML", "RSS", "print" ]
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
outputs:
  section:
    - HTML
    - RSS
    - print
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "outputs": {
    "section": [
      "HTML",
      "RSS",
      "print"
    ]
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-enable no-shortcut-ref-link -->

{{% /alert %}}

## Sitemap

Hugo creates a `sitemap.xml` file for your generated site by default: for
example, [here's the sitemap](/sitemap.xml) for this site.

You can configure the frequency with which your sitemap is updated, your sitemap
filename, and the default page priority in your
`hugo.toml`/`hugo.yaml`/`hugo.json`:

<!-- markdownlint-disable no-shortcut-ref-link -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[sitemap]
  changefreq = "monthly"
  filename = "sitemap.xml"
  priority = 0.5
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
sitemap:
  changefreq: monthly
  filename: sitemap.xml
  priority: 0.5
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "sitemap": {
    "changefreq": "monthly",
    "filename": "sitemap.xml",
    "priority": 0.5
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-enable no-shortcut-ref-link -->

To override any of these values for a given page, specify it in page front
matter:

<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Front matter:" disabled=true />}}
{{< tab header="toml" lang="toml" >}}
+++
title = "Adding Content"
linkTitle = "Adding Content"
weight = 1
description = '''
Add different types of content to your Docsy site.
'''
[sitemap]
priority = 1
+++
{{< /tab >}}
{{< tab header="yaml" lang="yaml" >}}
---
title: "Adding Content"
linkTitle: "Adding Content"
weight: 1
description: >
  Add different types of content to your Docsy site.
sitemap:
  priority: 1.0
---
{{< /tab >}}
{{< tab header="json" lang="json" >}}
{
  "title": "Adding Content",
  "linkTitle": "Adding Content",
  "weight": 1,
  "description": "Add different types of content to your Docsy site.\n",
  "sitemap": {
    "priority": 1
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-restore -->

To learn more about configuring sitemaps, see [Sitemap Templates][].

[alerts]: https://gohugo.io/render-hooks/blockquotes/#alerts
[attributes]: https://gohugo.io/content-management/markdown-attributes/
[blocks]: /docs/content/shortcodes/#blocks
[commonmark]: https://spec.commonmark.org/
[content type]: https://gohugo.io/quick-reference/glossary/#content-type
[Emojis]: https://gohugo.io/quick-reference/emojis/
[extensions]: https://gohugo.io/configuration/markup/#extensions
[formats]: https://gohugo.io/content-management/formats/
[GFM]: https://github.github.com/gfm/
[Goldmark]: https://github.com/yuin/goldmark
[Look and Feel]: /docs/content/lookandfeel/
[permalinks]: https://gohugo.io/configuration/permalinks/
[render hooks]: https://gohugo.io/render-hooks/introduction/
[shortcodes]: https://gohugo.io/content-management/shortcodes/
[site configuration]: https://gohugo.io/configuration/introduction/
[Sitemap Templates]: https://gohugo.io/templates/sitemap-template/
