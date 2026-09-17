---
title: Look and Feel
# date: 2017-01-05
description: Customize colors, fonts, code highlighting, and more for your site.
params:
  BringYourOwnLightDarkModeMenuAlertTitle: >-
    <i class='fa-solid fa-exclamation-triangle pe-1'></i> Bring your own
    light/dark mode menu <span class='badge text-bg-warning fs-6
    float-end'>EXPERIMENTAL</span>
# prettier-ignore
cSpell:ignore: anotherclass autoprefixing lightdark monokai myclass onedark rgba wordmark FOUC
---

By default, a site using Docsy has the theme's default fonts, colors, and
general look and feel. However, if you want your own color scheme (and you
probably will!) you can very easily override the theme defaults with your own
project-specific values - Hugo will look in your project files first when
looking for information to build your site. And because [Docsy uses Bootstrap
5][] and SCSS for styling, you can override just single values (such as project
colors and fonts) in its special SCSS project variables file, or do more serious
customization by creating your own styles.

Docsy also provides options for styling your code blocks, using either Chroma or
Prism for highlighting.

[Docsy uses Bootstrap 5]: /blog/2023/bootstrap-5-migration/

## Project styles

### Project style files

To customize your project's look and feel, create your own version of the
following Docsy placeholder files (note the **`_project*.scss`** suffixes) and
place them inside your project's `assets/scss/` folder:

- **[`_variables_project.scss`][]** and<br>
  **[`_variables_project_after_bs.scss`][]** :

  Use these files to add project-specific definitions of theme variables as well
  as any additional Bootstrap variables you want to set or override. For
  details, including an explanation of which file to use, see
  [Site colors](#site-colors).

  For a list of Docsy's theme variables and their default values, see
  [`_variables.scss`][]. For information about other Bootstrap 5 variables, see
  [Variable defaults][] and [Bootstrap's `_variables.scss`][bs_var] file.

- **[`_styles_project.scss`][]** is where you can add your own custom SCSS
  styles, including overriding any of the styles in Docsy's theme SCSS files.

[`_styles_project.scss`]:
  https://github.com/docsy/docsy/blob/main/theme/assets/scss/_styles_project.scss
[`_variables.scss`]:
  https://github.com/docsy/docsy/blob/main/theme/assets/scss/td/_variables.scss
[`_variables_project.scss`]:
  https://github.com/docsy/docsy/blob/main/theme/assets/scss/_variables_project.scss
[`_variables_project_after_bs.scss`]:
  https://github.com/docsy/docsy/blob/main/theme/assets/scss/_variables_project_after_bs.scss
[bs_var]: https://github.com/twbs/bootstrap/blob/v5.3.3/scss/_variables.scss

> [!SUCCESS] Files you can customize (the rest are internal)
>
> The files listed above, and only these files, are supported for project
> customization. All other SCSS files under `assets/scss/` are internal to
> Docsy.

### Advanced style customization

The recommended way to define project-specific styles that override Docsy
defaults is via the `_styles_project.scss` file. This file is part of Docsy’s
public customization surface. For the complete list of files, see
[Project style files](#project-style-files).

However, some projects require visual designs that differ substantially from
Docsy’s base styling. In such cases, selectively overriding individual CSS rules
can become complex and brittle.

#### :warning: Resetting internal styles {#resetting-internal-styles}

Docsy’s internal SCSS files (in [`assets/scss/td/`][assets/scss/td]) are
organized by feature or function. For example, `_alerts.scss` contains the
styles for [Alerts][], while `_code.scss` and `_code-dark.scss` style
[code blocks](#code-blocks).

That said, if your project’s design diverges significantly from Docsy’s base
styles, you may choose to _intentionally reset_ some of these defaults by
shadowing selected internal SCSS files with empty files. That is, create an
empty SCSS file in your project with the same relative path (`assets/scss/td/`)
and filename as the Docsy file you want to reset.

> [!CAUTION]
>
> This technique relies on Docsy internals and is therefore not covered by
> semantic versioning stability expectations. Internal SCSS files may change in
> _any_ release, which may require reviewing and adjusting your project
> overrides when upgrading the theme. Use only if you accept the added
> maintenance cost.

After resetting selected internal SCSS files, define your project’s actual
styles in `_styles_project.scss`, as usual.

#### Extra styles {#extra-styles}

{{%_param BADGE EXPERIMENTAL info %}}

Docsy includes an optional [td/extra][] styles folder with [experimental][]
styles that projects can test. These styles may eventually be merged into the
core theme or change without notice.

To enable them, add the following to your project's `_styles_project.scss`:

```scss
@import 'td/extra';
```

If your project uses Bootstrap's default color theme (that is, you do not
override `$primary`, `$secondary`, etc.) then you can opt in to the extra
dark-mode style adjustments as follows:

```scss
@import 'td/extra/bs-defaults';
```

[td/extra]: https://github.com/docsy/docsy/tree/main/theme/assets/scss/td/extra
[assets/scss/td]: https://github.com/docsy/docsy/tree/main/theme/assets/scss/td
[Alerts]: /docs/content/adding-content/#alerts

## Colors and color themes

Docsy defaults to Bootstrap's [standard color scheme][]. This section explains
how to customize your site's colors and how to enable light/dark color themes.

[standard color scheme]: https://getbootstrap.com/docs/5.3/customize/color/

### Site colors

To customize your site's colors, add SCSS variable overrides to
**`assets/scss/_variables_project.scss`**. For example, you can set the primary
and secondary site colors as follows:

```scss
$primary: #390040;
$secondary: #a23b72;
```

Docsy has [Bootstrap][bs-docs] features such as gradient backgrounds
(`$enable-gradients`) and shadows (`$enable-shadows`) enabled by default. These
can also be toggled in your project variables file by setting the variables to
`false`.

To add colors to or modify Bootstrap's [color maps][], use
**`assets/scss/_variables_project_after_bs.scss`**. For example:

```scss
$custom-colors: (
  'my-favorite-color': purple,
  'my-other-color': pink,
);

$theme-colors: map-merge($theme-colors, $custom-colors);
```

To learn how to modify maps, see [Maps and loops][] and [Adding theme colors][].

[Adding theme colors]:
  https://getbootstrap.com/docs/5.3/customize/color-modes/#adding-theme-colors
[color maps]: https://getbootstrap.com/docs/5.3/customize/color/#color-sass-maps
[Maps and loops]:
  https://getbootstrap.com/docs/5.3/customize/sass/#maps-and-loops
[variable defaults]:
  https://getbootstrap.com/docs/5.3/customize/sass/#variable-defaults

### Light/dark color theme and mode support {#lightdark-color-feature}

Docsy supports light and dark color _themes_ and color mode selection through
Bootstrap's [color modes][] feature.

What is the difference between a color theme and a color mode as used in Docsy?

- A color _theme_ is a semantic color palette (primary, secondary, success,
  etc.) defined in SCSS and used by components and utilities.
- A color _mode_ is a switchable presentation of the site (light or dark) from
  the user's point of view, implemented through CSS variable overrides
  (activated via `data-bs-theme`).

The next section explains how to enable light/dark color themes and color mode
selection.

## Light/dark color modes

Docsy enables **light and dark** color mode selection, and the underlying color
theme support, through Bootstrap's [color modes][] feature. All sites are in
light mode by default, whether or not you choose to enable dark mode for your
project.

Docsy ships with dark mode support, offering a good user experience (UX) for
site visitors through the following features:

- **Complete CSS** styles for both light and dark themes _by default_, so your
  site can automatically switch between light and dark modes based on system
  settings or user preference.

- But, if you prefer, you can **disable** dark mode entirely, see
  [How to disable dark mode](#how-to-disable-dark-mode).

- **No dark-mode flashes**: By default, Docsy adds page header content (like
  meta tags, inline styles, and an early-loading script) to avoid or generally
  prevent _Flashes Of Unstyled Content_ ([FOUC][]) when pages load.[^FOUC-alt]

  [^FOUC-alt]:
      Also referred to as "Flash of incorrect theme" and, humorously, [_Flash of
      inAccurate coloR Theme_][FART] (FART).

  [FART]: https://css-tricks.com/flash-of-inaccurate-color-theme-fart/

- **Light/dark-mode menu**: Enable Docsy's
  [light/dark-mode menu](#lightdark-mode-menu) in the [navbar](#navbar) to allow
  your site users to switch between light and dark modes. Or create your own
  custom menu.

- **Dark-mode theme customization**: Docsy provides extra dark-mode styling that
  you can selectively include, such as:
  - **Code syntax highlighting**: if your site uses [Chroma for code
    highlighting][], see [Light/dark code styles][] to learn how to support
    [syntax highlighting][] in dark mode for your favorite code highlighting
    themes.

  - **Color-contrast adjustments**: if your site has custom theme colors, you
    will probably need to selectively tune your dark-mode theme colors to ensure
    that they have good color-contrast. Learn
    [how to pick colors with good color-contrast](#pick-good-color-contrast).

[FOUC]: https://en.wikipedia.org/wiki/Flash_of_unstyled_content

### Choosing themes or color modes for your site

To help you decide whether to support light, dark, or both themes on your site,
see:

- [The Designer’s Guide to Dark Mode Accessibility][], January 2026
- [Dark Mode vs Light Mode: The Complete UX Guide for 2025][], August 2025
- [Dark and Light Mode: A Simple Guide for Web Design and Development][], May
  2025

[The Designer’s Guide to Dark Mode Accessibility]:
  https://www.accessibilitychecker.org/blog/dark-mode-accessibility/
[Dark Mode vs Light Mode: The Complete UX Guide for 2025]:
  https://altersquare.io/dark-mode-vs-light-mode-the-complete-ux-guide-for-2025/
[Dark and Light Mode: A Simple Guide for Web Design and Development]:
  https://www.accessibilityfirst.at/posts/dark-and-light-mode-a-simple-guide-for-web-design-and-development

### How to disable dark mode

Docsy, like Bootstrap, ships with CSS support for light and dark [color modes][]
by default.

To [disable dark mode][] entirely:

- Set `params.ui.showLightDarkModeMenu` to `false` in your [site
  configuration][].

- Add the following variable in your project's [`_variables_project.scss`][]:

  ```scss
  $enable-dark-mode: false;
  ```

[disable dark mode]:
  https://getbootstrap.com/docs/5.3/customize/color-modes/#building-with-sass
[site configuration]: https://gohugo.io/configuration/introduction/

### How to pick colors with good color-contrast {#pick-good-color-contrast}

> [!CAUTION]
>
> This feature is [experimental][]. We invite projects to try it and share
> feedback.

Getting dark-mode theme colors to have proper contrast can be tricky. Docsy
provides [_color-adjustments-dark.scss][] as an example of theme color
customization by illustrating color-contrast adjustments for Bootstrap's default
[primary color][bs-theme-colors]

[bs-theme-colors]:
  https://getbootstrap.com/docs/5.3/customize/color/#theme-colors

To use this file, import it in your project's [`_styles_project.scss`][] file:

```scss
@import 'td/color-adjustments-dark';
```

We use `$lighten-amount-for-dark-color-variant` in that file to control how much
lighter the primary color should be in dark mode as a percentage of the original
primary color. To adjust this value for your project's `$primary` color, set
this SCSS variable in your project's [`_variables_project.scss`][] file, for
example:

```scss
$lighten-amount-for-dark-color-variant: 28% !default;
```

If the file settings are not working for your project, you can create your own
dark mode theme customization file and import it in your project's
[`_styles_project.scss`][].

[_color-adjustments-dark.scss]:
  https://github.com/docsy/docsy/blob/main/theme/assets/scss/td/_color-adjustments-dark.scss
[Chroma for code highlighting]: #code-highlighting-with-chroma
[Light/dark code styles]: #lightdark-code-styles

> [!NOTE]
>
> Light/dark color themes only affect documentation pages and white [`blocks/*`
> shortcodes][blocks]. Other block shortcodes with fixed text and background
> colors are not affected by light/dark color mode changes.
>
> [blocks]: shortcodes/#blocks

## Fonts

By default, Docsy uses Bootstrap's [native font stack][] for its typography.
However, Docsy also supports Google Fonts. To enable Google Fonts and use [Open
Sans] as your project's primary font, add the following variable to
`assets/scss/_variables_project.scss`:

```scss
$td-enable-google-fonts: true;
```

To configure another Google Font:

```scss
$td-google-font-name: 'Roboto';
$td-google-font-family: 'Roboto:300,300i,400,400i,700,700i';
```

[native font stack]:
  https://getbootstrap.com/docs/5.3/content/reboot/#native-font-stack
[Open Sans]: https://fonts.google.com/specimen/Open+Sans

## Semantic classes

Chrome components that have adopted Docsy's **semantic classes** render markup
carrying theme-owned `td-` classes, with component state keyed on semantic
attributes (such as `aria-current="page"`) rather than state classes. These
selectors are part of Docsy's [public customization surface][public]; how the
theme styles them is [private][] and can change in any release. Each such
component's own documentation describes the selectors it exposes: see, for
example, [breadcrumb navigation][breadcrumb-styling].

Selectors of components that haven't adopted semantic classes (a mix of
Bootstrap classes and pre-existing `td-` names) can change; [upgrade posts][]
announce selector changes per component.

For the design conventions behind semantic classes (naming, framework skins),
see [Semantic classes][semantic-classes-design].

[breadcrumb-styling]: /docs/content/navigation/#breadcrumb-styling
[private]: /project/about/changelog/#private
[public]: /project/about/changelog/#public
[semantic-classes-design]: /project/design/semantic-classes/
[upgrade posts]: /tags/upgrade/

## CSS utilities

For documentation of available CSS utility classes, see the [Bootstrap
documentation][bs-docs]. This theme adds very little on its own in this area.
However, we have added some color state CSS classes that can be useful in a
dynamic context:

- `.-bg-<color>`
- `.-text-<color>`

You can use these classes, for example, to style your text in an appropriate
color when you don't know if the `primary` color is dark or light, to ensure
proper color contrast. They are also useful when you receive the color code as a
[shortcode](/docs/content/shortcodes/) parameter.

The value of `<color>` can be any of the color names, `primary`, `white`,
`dark`, `warning`, `light`, `success`, `300`, `blue`, `orange` etc.

When you use `.-bg-<color>`, the text colors will be adjusted to get proper
contrast:

```html
<div class="-bg-primary p-3 display-6">Background: Primary</div>
<div class="-bg-200 p-3 display-6">Background: Gray 200</div>
```

<div class="-bg-primary p-3 display-6 w-75">Background: Primary</div>
<div class="-bg-200 p-3 display-6 mb-5 w-50 w-75">Background: Gray 200</div>

To only set the text color use `.-text-<color>`:

```html
<div class="-text-blue pt-3 display-6">Text: Blue</div>
```

<div class="-text-blue pt-3 display-6">Text: Blue</div>

## Code blocks

Docsy supports syntax highlighting of code blocks and other styling options
through two syntax highlighters, [Chroma](#code-highlighting-with-chroma) and
[Prism](#code-highlighting-with-prism).

### Code highlighting with Chroma

Hugo uses [Chroma](https://github.com/alecthomas/chroma) for syntax
highlighting, which provides highlight and color styles for fenced code blocks.
For details, see the [Syntax highlighting][].

#### Basic Chroma style configuration {#chroma-style-configuration}

> [!NOTE]
>
> If your project uses [light/dark color modes](#lightdark-color-modes), then
> skip to [Light/dark code styles](#lightdark-code-styles).

Hugo's default Chroma style is [monokai][]. To use another style, such as
[tango][], add the following to your project configuration.

<!-- markdownlint-disable no-shortcut-ref-link -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[markup]
  [markup.highlight]
      style = "tango"
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
markup:
  highlight:
    style: tango
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "markup": {
    "highlight": {
      "style": "tango"
    }
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-enable no-shortcut-ref-link -->

For the complete list of available styles, see [Chroma Style Gallery][].

[Chroma Style Gallery]: https://xyproto.github.io/splash/docs/
[monokai]: https://xyproto.github.io/splash/docs/monokai.html
[tango]: https://xyproto.github.io/splash/docs/tango.html

#### Light/dark code styles and more {#lightdark-code-styles}

To enable code styles that are compatible with light/dark color modes, you need
to complete the following setup steps:

1.  Ensure that `markup.highlight.noClasses` is `false` in your project config.
    For details about this option, see [noClasses][].

2.  Add the following import to your project's [`_styles_project.scss`][] file:

    ```scss
    @import 'td/code-dark';
    ```

Docsy's default Chroma styles for [light/dark modes][] are:

- [friendly][] for light mode
- [native][] for dark mode

If you would like to use other styles, save the [Hugo generated Chroma styles][]
to the appropriate file:

- [assets/scss/td/chroma/_light.scss][]
- [assets/scss/td/chroma/_dark.scss][]

Note that we tweak the [native][] style (in dark mode) so that the Generic
Output color looks less prominent, offering better contrasts with the
command-text color. For details, see [_code-dark.scss][].

##### Selecting console block content

In `console` code blocks that contain commands and command output, the command
prompt and command output are unselectable. This is useful when copying commands
to the clipboard. Give it a try:

```console
$ echo "Hello, world!"
Hello, world!
$ echo "Nice to meet you!"
Nice to meet you!
```

Clicking copy-code leaves this code in your clipboard:

```sh
echo "Hello, world!"
echo "Nice to meet you!"
```

For details, see [_code.scss][].

If you want the entire content of a console block to be selectable, use a
`console` language alias instead, such as `bash-session` or `shell-session`.
Give it a try:

```shell-session
$ echo "Hello, world!"
Hello, world!
$ echo "Nice to meet you!"
Nice to meet you!
```

[_code.scss]:
  https://github.com/docsy/docsy/blob/main/theme/assets/scss/td/_code.scss
[_code-dark.scss]:
  https://github.com/docsy/docsy/blob/main/theme/assets/scss/td/_code-dark.scss
[assets/scss/td/chroma/_dark.scss]:
  https://github.com/docsy/docsy/blob/main/theme/assets/scss/td/chroma/_dark.scss
[assets/scss/td/chroma/_light.scss]:
  https://github.com/docsy/docsy/blob/main/theme/assets/scss/td/chroma/_light.scss
[Hugo generated Chroma styles]:
  https://gohugo.io/commands/hugo_gen_chromastyles/
[light/dark modes]: #lightdark-color-modes
[friendly]: https://xyproto.github.io/splash/docs/friendly.html
[native]: https://xyproto.github.io/splash/docs/native.html

#### Code blocks without a specified language

By default, highlighting is not applied to code blocks without a specified
language. If you would like code highlighting to apply to _all_ code blocks,
even without a language, set `markup.highlight.guessSyntax` to `true` in your
project's configuration file.

#### Copy to clipboard

Code blocks show a "Copy to clipboard" button in the top right-hand corner. To
turn it off, see the
[`click-to-copy` plugin](/docs/content/plugins/#configure-docsys-plugins).
(Before 0.18 the parameter was `params.disable_click2copy_chroma`, deprecated
but still honored for this release cycle, with a build warning.)

### Code highlighting with Prism

Optionally, you can enable Prism syntax highlighting in your
`hugo.toml`/`hugo.yaml`/`hugo.json`:

{{< tabpane text=true persist=lang >}}
{{< tab header="Configuration file:" disabled=true />}}
{{% tab header="hugo.toml" lang="toml" %}}

```toml
[params]
prism_syntax_highlighting = true
```

{{% /tab %}} {{% tab header="hugo.yaml" lang="yaml" %}}

```yaml
params:
  prism_syntax_highlighting: true
```

{{% /tab %}} {{% tab header="hugo.json" lang="json" %}}

```json
{
  "params": {
    "prism_syntax_highlighting": true
  }
}
```

{{% /tab %}} {{< /tabpane >}}

When this option is enabled your site uses
[Prism](https://prismjs.com/index.html) instead of Chroma for code block
highlighting.

Prism is a popular open source syntax highlighter which supports over 200
[languages](https://prismjs.com/index.html#supported-languages) and various
[plugins](https://prismjs.com/index.html#plugins).

Docsy includes JavaScript and CSS files for a basic Prism configuration, which
supports:

- Code blocks styled with the Prism `Default` theme
- Copy to clipboard buttons on code blocks
- Syntax highlighting for a number of common languages, as specified in the
  following Prism download link, [Customize your download][prismjs-download+].

[prismjs-download+]:
  https://prismjs.com/download.html#themes=prism&languages=markup+css+clike+javascript+bash+c+csharp+cpp+go+java+markdown+python+scss+sql+toml+yaml&plugins=toolbar+copy-to-clipboard

#### Code blocks with no language

By default, Prism code highlighting styles are not applied to code blocks
without a specified language, instead you get Docsy's default style of grey with
black text. To apply Prism styling to code blocks with no language or a language
not supported by Prism, specify `none` as the language after your triple
backticks.

#### Extending Prism for additional languages or plugins

If the included Prism configuration is not sufficient for your requirements, and
you want to use additional languages or plugins you can replace the included
files with your own.

1. Download your own Prism JS and CSS files from
   <https://prismjs.com/download.html>
2. Replace the included Prism JS and CSS with the files you downloaded:
   - Copy the Javascript file to `static/js/prism.js`
   - Copy the CSS file to `static/css/prism.css`

## Navbar

By default, a Docsy site has a navbar that appears at the top of every page.

### Default look and feel

Docsy’s navbar styles are designed mobile-first.

#### On mobile

On **mobile**, the default navbar:

- Uses the page’s (light/dark) body text and background colors to ensure that
  navbar elements (like links, menus, and the search box) render correctly
  across [light/dark color modes](#lightdark-color-modes).
- Has an opaque background color.
- Scrolls with the page content.

#### On desktop

On **desktop** (`md` breakpoint and up), the default appearance is the same,
except that the navbar is fixed to the top of the viewport.

##### Translucent over cover images {#default-over-cover}

In addition, on desktop, when a page contains a [blocks/cover][] (typically used
for hero images on the home page), Docsy makes the navbar translucent while the
cover is visible by adding the classes `td-navbar-cover td-navbar-transparent`
to the navbar. For an example, see the [About Docsy][] page. This initial
translucent setting ensures that the hero image is maximally visible. Once the
user has scrolled past the cover (hero image), the navbar reverts to its default
(opaque) style.

[About Docsy]: /about/
[blocks/cover]: /docs/content/shortcodes/#blocks-cover

### Customizing the navbar {#navbar-customization}

#### Navbar height {#navbar-height}

{{%_param BADGE EXPERIMENTAL info %}}

To adjust the navbar height, override one or both of the [experimental][] SCSS
variables `$td-navbar-min-height` and `$td-navbar__main-min-height-mobile` in
your [project's variables file](#project-style-files).

The min height on mobile is the sum of `$td-navbar-min-height` and
`$td-navbar__main-min-height-mobile`, on desktop it is just
`$td-navbar-min-height`.

#### Background color/opacity {#navbar-background}

To change the navbar background color/opacity across your site, override the
SCSS variable `$td-navbar-bg-color` in your [project’s variables file][].

For example, to set the navbar background color to the primary color:

```scss
$td-navbar-bg-color: $primary;
```

> [!NOTE]- CSS variable implementation details
>
> Docsy uses the following CSS custom properties **internally** to style the
> navbar: `--td-navbar-bg-color`, `--td-navbar-backdrop-filter`, and
> `--td-navbar-border-bottom`. These can be overridden for advanced
> customization. For an example, see the User Guide's [project
> styles][ug-project-styles]. For the base styles, see [_nav.scss][].

To set the navbar background color to a slightly translucent primary color use:

```scss
$td-navbar-bg-color: rgba(var(--bs-body-bg-rgb), 0.85);
```

To also blur the background requires this more advanced styling:

```scss
.td-navbar {
  --td-navbar-bg-color: #{$td-navbar-bg-color};
  --td-navbar-backdrop-filter: blur(8px);
}
```

For more examples, see the User Guide's [project styles][ug-project-styles].

#### Setting the navbar light/dark color theme {#navbar-lightdark-theme}

Whether it is your chosen site design, or you want more contrast between the
navbar and the page background (especially over a cover image), you can set the
navbar theme to `dark` by adding `params.ui.navbar_theme: dark` to:

- Your site config to apply this **site-wide**
- Page [front matter `params`][] to apply this **per page**

```yaml
params:
  ui:
    navbar_theme: dark
```

[front matter `params`]:
  https://gohugo.io/content-management/front-matter/#parameters

Internally, this adds `data-bs-theme="dark"` to the navbar, triggering
Bootstrap's dark theme. This affects the default colors of navbar and all its
child elements such as links, menus, and the search box.

#### Translucent over cover images {#customize-over-cover}

When a page contains a [blocks/cover][], the navbar is styled with
`td-navbar-cover`. While the navbar is over the cover, it is styled with
`td-navbar-transparent` as well, which sets the background color to transparent
and applies a blur effect (once the user has scrolled past the cover, the
`td-navbar-transparent` class is removed).

This translucent effect can sometimes make the text of navbar items difficult to
read due to the lack of contrast. Adjusting the navbar background color/opacity
or blur can help. For an example, see the User Guide's [project
styles][ug-project-styles].

Alternatively, you can disable the “translucent over cover” behavior globally by
setting `params.ui.navbar_translucent_over_cover_disable` to `true` in your
[site configuration][].

[project’s variables file]: #project-style-files

### Styling your project logo and name

The default Docsy navbar (`.td-navbar`) displays your site identity, consisting
of the following:

1.  [Your logo][], which is included in the navbar as an inline SVG, styled by
    `.td-navbar .navbar-brand svg`. For the style details, see [_nav.scss][].

    To ensure your logo displays correctly, you may want to resize it and ensure
    that it doesn't have height and width attributes so that its size is fully
    responsive. [Override the default styling][project-styles] of
    `.td-navbar .navbar-brand svg` or (equivalently)
    `.td-navbar .navbar-brand__logo` as needed.

2.  Your project name, which is the site `title`. If you don't want your project
    name to appear (for example, because your logo is or contains a
    [wordmark][]), then add the following custom styling to your [project's
    styles][project-styles]:

    ```css
    .td-navbar .navbar-brand__name {
      display: none;
    }
    ```

[_nav.scss]:
  https://github.com/docsy/docsy/blob/main/theme/assets/scss/td/_nav.scss
[project-styles]: /docs/content/lookandfeel/#project-style-files
[wordmark]: https://en.wikipedia.org/wiki/Wordmark
[your logo]: /docs/content/iconsimages/#add-your-logo

### Light/dark-mode menu

If you enable this feature, Docsy adds a menu to your navbar that lets users
switch your site's documentation page display between a default "light" mode,
and a "dark" mode where the text is displayed in a light color on a dark
background. The menu also includes an "auto" option that follows the user's
system preference.

To enable the display of a light/[dark mode][] menu in the navbar, set
`params.ui.showLightDarkModeMenu` to `true` in your [site configuration][]. The
dropdown menu appears at the right, immediately before the [search box][], if
present.

{{< tabpane text=true persist=lang >}}
{{< tab header="Configuration file:" disabled=true />}}
{{% tab header="hugo.toml" lang="toml" %}}

```toml
[params]
[params.ui]
showLightDarkModeMenu = true
```

{{% /tab %}} {{% tab header="hugo.yaml" lang="yaml" %}}

```yaml
params:
  ui:
    showLightDarkModeMenu: true
```

{{% /tab %}} {{% tab header="hugo.json" lang="json" %}}

```json
{
  "params": {
    "ui": {
      "showLightDarkModeMenu": true
    }
  }
}
```

{{% /tab %}} {{< /tabpane >}}

> [!CAUTION] {{% _param BringYourOwnLightDarkModeMenuAlertTitle %}}
>
> If you would like to use your own light/dark mode menu implementation instead
> of Docsy's default implementation:
>
> 1. Set `params.ui.showLightDarkModeMenu` to `"enable-only (experimental)"`.
>    This will enable base dark-mode functionality (such as full CSS, no-flash
>    support) without Docsy's menu.
> 2. Add your menu code to in the [layouts/_partials/theme-toggler.html][]
>    partial file, thus overriding Docsy's default implementation.
>
> This feature is experimental. It may be removed and/or changed in
> backwards-incompatible ways in a future release.

[dark mode]: https://getbootstrap.com/docs/5.3/customize/color-modes/#dark-mode
[layouts/_partials/theme-toggler.html]:
  https://github.com/docsy/docsy/blob/main/theme/layouts/_partials/theme-toggler.html
[search box]: /docs/content/search/

## Footer copyright

Use the `params.copyright` config option to set the copyright notice shown in
the site footer. It can be a plain string, used as the copyright-holder text, or
a map with the following optional fields:

- `authors`:
  - Copyright holders, as a single Markdown paragraph.
  - Default: the site title followed by "Authors".
- `from_year`:
  - First year of publication.
  - When unset, or equal to `to_year`, the notice shows a single year.
- `to_year`:
  - Last year of publication.
  - Default: the year that the site was built.
  - Tip: a non-year string such as "present" also works, and stays accurate even
    when the site isn't rebuilt every year.

Set `from_year` to your site's launch year to get a notice that spans the launch
year through the build year. For example:

```yaml
params:
  copyright:
    authors: >-
      Docsy Authors | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0)
    from_year: 2018
```

With a build year of 2026, this renders as:

> © 2018–2026 Docsy Authors | [CC BY 4.0][]

A `from_year` later than `to_year` renders as configured; when both values are
years, the build also logs a warning.

If `params.copyright` is unset or empty, the [site `copyright`][] option is used
instead, rendered as HTML, with no year added.

[CC BY 4.0]: https://creativecommons.org/licenses/by/4.0
[site `copyright`]: https://gohugo.io/methods/site/copyright/

## Alerts

> [!NOTE] Coming soon: how to customize alerts
>
> - `alert-primary` is the default
> - `alert-<AlertType>` is used

To change the styling of an alert of type `abc`, override the CSS class
`.alert-abc` like so:

```scss
.alert-abc {
  @extend .alert-primary;
}
```

For example, to make alert headings `h3` (the default is `h4`), use:

```scss
.td-alert-heading {
  @extend .h3;
}
```

## Tables

Docsy applies the following styles to all tables, through the class `.td-table`:

- [Bootstrap table][] styles:
  - `.table`
  - `.table-striped`
  - `.table-responsive`
- `display: block`, which is necessary for tables to be responsive.

This styling configuration gives you responsive tables using Markdown only,
without the need to wrap the table in a `<div>`. It does, however, mean that all
your tables have `display` set to `block`. If you don't want this, you can
create your own custom styles for tables.

> [!NOTE]
>
> Our table styling goes against the [Bootstrap recommendation to _wrap_
> tables][wrap-tables] with `.table-responsive` &mdash; however, we think
> letting users create responsive tables with just Markdown table syntax is more
> convenient.

[wrap-tables]:
  https://getbootstrap.com/docs/5.3/content/tables/#responsive-tables

To render a table without Docsy styling, apply the `.td-initial` class to the
table. From the resulting `<table>` style base, it is easier to apply your own
custom styles (rather than trying to undo Docsy table styling), as is
illustrated in the following example:

<!-- prettier-ignore -->
```markdown
| Shape    | Number of sides |
| -------- | --------------- |
| Triangle | 3               |
| Square   | 4               |
{.td-initial .my-dark-table-style}
```

The example above uses [Markdown attribute][] syntax, and might render like
this:

<!-- markdownlint-disable table-pipe-style table-column-count -->
<!-- prettier-ignore-start -->
| Shape    | Number of sides |
| -------- | --------------- |
| Triangle | 3               |
| Square   | 4               |
{.td-initial .table .table-dark}
<!-- prettier-ignore-end -->

[Bootstrap table]: https://getbootstrap.com/docs/5.3/content/tables/
[Markdown attribute]: https://discourse.gohugo.io/t/markdown-attributes/41783

## Customizing templates

### Add code to head or before body end

If you need to add some code (CSS import, cookie consent, or similar) to the
`head` section on every page, add a [hooks/head-end.html][] partial to your
project (the theme version is an empty placeholder). The content of this partial
is automatically included just before the end of the theme partial
[head.html][].

Similarly, if you want to add some code right before the `body` end, create your
own version of [hooks/body-end.html][]. This partial is included automatically
at the end of the theme partial [scripts.html][]. For a script file, register a
[plugin][] instead.

Both [head.html][] and [scripts.html][] are included from [baseof.html][],
Docsy's [base template][].

<!-- prettier-ignore-start -->
[base template]: https://gohugo.io/templates/base/
[baseof.html]: https://github.com/docsy/docsy/blob/main/theme/layouts/baseof.html
[head.html]: https://github.com/docsy/docsy/blob/main/theme/layouts/_partials/head.html
[hooks/body-end.html]: https://github.com/docsy/docsy/blob/main/theme/layouts/_partials/hooks/body-end.html
[hooks/head-end.html]: https://github.com/docsy/docsy/blob/main/theme/layouts/_partials/hooks/head-end.html
[plugin]: /docs/content/plugins/#add-a-custom-script
[scripts.html]: https://github.com/docsy/docsy/blob/main/theme/layouts/_partials/scripts.html
<!-- prettier-ignore-end -->

### Adding a banner before page content {#before-page-content}

{{%_param BADGE EXPERIMENTAL info %}}

To have a banner or other similar content appear at the top of the pages in a
section, add the relevant HTML to a [_td-content-after-header.html][] file in
the section's page path under `layouts` -- such as
`layouts/blog/_td-content-after-header.html`. Add the file directly under
`layouts` to have the file processed for all docs, blog, and swagger pages. The
file's content will be included inside the `div.td-content` after `</header>`,
just before `.Content` is rendered.

[_td-content-after-header.html]:
  https://github.com/docsy/docsy/blob/main/theme/layouts/_td-content-after-header.html

## Adding custom class to the body element

By default, Docsy adds the `td-{{ .Kind }}` class, where the kind is the kind of
the page, like section, blog, and so on. For example:

<!-- prettier-ignore -->
```html
<body class="td-section">
```

Sometimes it's useful to assign custom classes to a page, or to an entire
section, for example, to apply custom styling. To do so, add the `body_class`
parameter to the front matter of your page. The value of the parameter will then
be added to the class attribute of your page's body element.

To add the classes `myclass` and `anotherclass`, add the following line to the
front matter of the page:

```yaml
body_class: myclass anotherclass
```

The page's opening body tag will look like this (assuming it is a section page):

<!-- prettier-ignore -->
```html
<body class="td-section myclass anotherclass">
```

To apply the custom class to every page of a section or a directory, use the
[Front Matter Cascade](https://gohugo.io/content-management/front-matter/#cascade-1)
feature of Hugo in your configuration file, or in the front matter of the
highest-level page you want to modify.

[bs-docs]: https://getbootstrap.com/docs/
[color modes]: https://getbootstrap.com/docs/5.3/customize/color-modes/
[experimental]: /project/about/changelog/#experimental
[noClasses]: https://gohugo.io/content-management/syntax-highlighting/#noclasses
[syntax highlighting]: https://gohugo.io/content-management/syntax-highlighting/
[ug-project-styles]:
  https://github.com/docsy/docsy/blob/main/docsy.dev/assets/scss/_styles_project.scss
