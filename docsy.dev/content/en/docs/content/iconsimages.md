---
title: Logos and Images
# date: 2017-01-05
description: Add and customize logos, icons, and images in your project.
cSpell:ignore: lookandfeel imgproc
---

## Add your logo

By default, Docsy shows a site logo at the start of the navbar, that is, at the
extreme left. Place your project's SVG logo in `assets/icons/logo.svg`. This
overrides the default Docsy logo in the theme.

If you don't want a logo to appear in the navbar, then set site parameter
`navbar_logo` to `false` in your project's config:

<!-- markdownlint-disable no-shortcut-ref-link -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[params.ui]
navbar_logo = false
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
params:
  ui:
    navbar_logo: false
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}

{
  "params": {
    "ui": {
      "navbar_logo": false
    }
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-enable no-shortcut-ref-link -->

For information about styling your logo, see [Styling your project logo and
name][].

[Styling your project logo and name]:
  /docs/content/lookandfeel/#styling-your-project-logo-and-name

## Use icons

Docsy includes the free FontAwesome icons by default, including logos for sites
like GitHub and Stack Overflow. You can view all available icons in the
[FontAwesome documentation](https://fontawesome.com/icons/), including the
FontAwesome version when the icon was added and whether it is available for free
tier users. Check Docsy's [package.json][] and release notes for Docsy's
currently included version of FontAwesome.

You can add FontAwesome icons to your [navbar][], [side nav][], or anywhere in
your text.

## Add your favicons

The theme ships no favicon files, but it **discovers and links** a set of
conventionally named icons when you supply them:
[create your favicon files](#generate-favicons) and put them in your site
project's `static` directory so they publish at the site root (where browsers
probe for them). Docsy adds `<link>` elements inside each page's `<head>` for
whichever of these files it finds, in this order:

| File                       | Link                                             |
| -------------------------- | ------------------------------------------------ |
| `favicon.ico`              | `rel="icon"`[^ico-link]                          |
| `favicon.svg`              | `rel="icon"` with `type="image/svg+xml"`         |
| `favicon-NxN.png`          | `rel="icon"` with `type="image/png" sizes="NxN"` |
| `apple-touch-icon.png`     | `rel="apple-touch-icon"` (implicit size 180x180) |
| `apple-touch-icon-NxN.png` | `rel="apple-touch-icon"` with `sizes="NxN"`      |

If you have any square-size variants listed above, Docsy adds them in ascending
size order.

Docsy discovers these files _only_ at the **top level** of `static/`, not in
subdirectories.

[^ico-link]:
    The `.ico` link carries no `sizes`: the file is self-describing (browsers
    read the frame sizes it contains), so declaring sizes here would only risk
    drifting from the actual file. When you also supply a `favicon.svg`,
    browsers that support SVG favicons (most modern ones) prefer it, and the
    `.ico` serves as the fallback.

A modern `favicon.ico` plus an SVG and an `apple-touch-icon.png` covers common
browser and platform favicon needs. For anything beyond that:

- Add web app manifest `<link>` elements to [hooks/head-end.html][].
- If you need to customize the favicon links themselves, override
  [layouts/_partials/favicons.html][]. Make sure you use `relURL` so links stay
  correct when your site's `baseURL` includes a subpath.

### Generate favicons

Don't have a favicon yet? You can generate favicons from a single image with an
online tool such as [favicon.io](https://favicon.io) or
[RealFaviconGenerator][].

If you have a source SVG and [ImageMagick][] installed, Docsy also ships a
`gen-favicons` helper. Save your source SVG as `static/favicon.svg` -- the theme
links it directly -- then generate the raster icons alongside it. Run the
command from your site project root.

For an npm package install of Docsy:

```sh
npx --no -- gen-favicons static/favicon.svg static/
```

Otherwise, run:

```sh
node DOCSY_THEME_DIR/scripts/gen-favicons/cli.mjs static/favicon.svg static/
```

For a Git submodule install of Docsy, _`DOCSY_THEME_DIR`_ is
`themes/docsy/theme`. For a Hugo module install, it is the directory printed by
`go list -m -f '{{.Dir}}' github.com/docsy/docsy/theme`.

For the sizes and other options you can pass, run the command with `--help`.

## Add images

### Landing pages

Docsy's [`blocks/cover` shortcode](/docs/content/shortcodes/#blocks-cover) makes
it easy to add cover images (also known as hero images) to landing pages. The
shortcode looks for an image with the word "background" in the name within the
landing page's [page bundle](adding-content/#page-bundles).

For example, the example site's landing page `content/en/_index.md` uses the
image `content/en/featured-background.jpg`, which is in the same directory --
see the [content/en][] folder on GitHub.

Use the block's [`height` parameter][] to set the preferred display height of
the cover container (and therefore its image). For a full viewport height, use
`full`, along with the `td-below-navbar` helper class to position the cover
below the navbar:

```go-html-template
{{%/* blocks/cover
  title="Welcome to Docsy!"
  image_anchor="top"
  height="full td-below-navbar"
*/%}}
...
{{%/* /blocks/cover */%}}
```

For a shorter image, as in the [example site's About][] page, use one of `min`,
`med`, `max`, or `auto` (the image's natural height):

```go-html-template
{{%/* blocks/cover
  title="About the Docsy Example"
  image_anchor="bottom"
  height="min td-below-navbar"
*/%}}
...
{{%/* /blocks/cover */%}}
```

### Other pages

To add inline images to other pages, use the
[`imgproc` shortcode](/docs/content/shortcodes/#imgproc). Alternatively, if you
prefer, just use regular Markdown or HTML images and add your image files to
your project's `static` directory. You can find out more about using this
directory in
[Adding static content](/docs/content/adding-content/#adding-static-content).

<!-- prettier-ignore-start -->
[content/en]: https://github.com/docsy/docsy-example/tree/main/content/en
[example site's About]: <{{% param example_site_url %}}/about/>
[`height` parameter]: shortcodes/#blocks
[hooks/head-end.html]: https://github.com/docsy/docsy/blob/main/theme/layouts/_partials/hooks/head-end.html
[ImageMagick]: https://imagemagick.org
[layouts/_partials/favicons.html]: https://github.com/docsy/docsy/blob/main/theme/layouts/_partials/favicons.html
[navbar]: /docs/content/navigation/#adding-icons-to-the-navbar
[package.json]: https://github.com/docsy/docsy/blob/main/package.json
[RealFaviconGenerator]: https://realfavicongenerator.net
[side nav]: /docs/content/navigation/#adding-icons-to-the-side-nav
<!-- prettier-ignore-end -->
