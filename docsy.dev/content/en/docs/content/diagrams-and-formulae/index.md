---
title: Diagrams and Formulae
description:
  Write Mermaid, PlantUML, and MarkMap diagrams as code blocks, typeset KaTeX
  formulae, make Diagrams.net images editable in place, and configure their
  renderers.
cSpell:ignore: gatsby goldmark linenos markmap mhchem plantuml
---

## Pinned script-dependency versions {#script-dep-versions}

Docsy renders some rich content with scripts and stylesheets fetched from public
CDNs, at build time or in the browser: Mermaid, KaTeX's stylesheet and fonts,
markmap-autoloader, and Redoc (the [`redoc` shortcode][]). Each loads at a
version pinned in the theme's configuration and bumped with each Docsy release.
Pinning keeps builds reproducible and page rendering stable, and narrows
exposure to bad upstream publishes: a version alias such as `latest`, or a
partial version such as `11`, is re-resolved by the CDN on each request or
uncached build, so your site's rendering could change or break without any
change on your part (for example, when an upstream major ships).

To use a different version of Mermaid, KaTeX, or Redoc, set
`params.`_`PACKAGE`_`.version` in your configuration file, where _`PACKAGE`_ is
`mermaid`, `katex`, or `redoc`:

<!-- markdownlint-disable no-shortcut-ref-link -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[params.PACKAGE]
version = "X.Y.Z"
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
params:
  PACKAGE:
    version: X.Y.Z
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "params": {
    "PACKAGE": {
      "version": "X.Y.Z"
    }
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-enable no-shortcut-ref-link -->

For MarkMap's plugin pin and validation rules, see
[MarkMap version](#markmap-version) and [Plugins § Warnings][plugins-warnings].

Use an exact version (`X.Y.Z`): a non-exact version emits a build warning; if
intentional, suppress it by adding the id the warning prints (for example,
`katex-floating-version`) to your site's
[`ignoreLogs`](https://gohugo.io/configuration/all/#ignorelogs).

[`redoc` shortcode]: /docs/content/shortcodes/#redoc
[plugins-warnings]: /docs/content/plugins/#warnings

## LaTeX support with KaTeX

[\(\LaTeX\)](https://www.latex-project.org/) is a high-quality typesetting
system for the production of technical and scientific documentation. Due to its
excellent math typesetting capabilities, \(\TeX\) became the de facto standard
for the communication and publication of scientific documents, especially if
these documents contain a lot of mathematical formulae. Designed and mostly
written by Donald Knuth, the initial version was released in 1978. Dating back
that far, \(\LaTeX\) has `pdf` as its primary output target and is not
particularly well suited for producing HTML output for the Web. Fortunately,
with [\(\KaTeX\)](https://katex.org/) there exists a fast and easy-to-use
JavaScript library for \(\TeX\) math rendering on the web, which is embedded
into Hugo as of Hugo version v0.132.0.

With \(\KaTeX\) support [enabled](#activating-katex-support) in Docsy, you can
include complex mathematical formulae into your web page, either inline or
centred on its own line. Since Docsy theme exploits server side rendering of
formulae, the same output is produced, regardless of your browser or your
environment. Formulae can be shown either inline or in display mode:

### Inline formulae

The following code sample produces a text line with three inline formulae:

```tex
When \(a \ne 0\), there are two solutions to \(ax^2 + bx + c= 0\) and they are \(x = {-b \pm \sqrt{b^2-4ac} \over 2a}\).
```

When \(a \ne 0\), there are two solutions to \(ax^2 + bx + c= 0\) and they are
\(x = {-b \pm \sqrt{b^2-4ac} \over 2a}\).

### Formulae in display mode

The following code sample produces an introductory text line followed by a
formula numbered as `(1)` residing on its own line:

<!-- prettier-ignore-start -->
````markdown
The probability of getting \(k\) heads when flipping \(n\) coins is:
\[
\tag*{(1)} P(E) = {n \choose k} p^k (1-p)^{n-k}
\]
````
<!-- prettier-ignore-end -->

As an alternative to the standard syntax used above, formulae can also be
authored using a
[GLFM math block](https://docs.gitlab.com/user/markdown/#math-equations):

````markdown
The probability of getting \(k\) heads when flipping \(n\) coins is:

```math
\tag*{(1)} P(E) = {n \choose k} p^k (1-p)^{n-k}
```
````

Both standard syntax and `math` block render to the same formula:

The probability of getting \(k\) heads when flipping \(n\) coins is:

```math
\tag*{(1)}  P(E) = {n \choose k} p^k (1-p)^{n-k}
```

> [!TIP]
>
> This [wiki page](https://en.wikibooks.org/wiki/LaTeX/Mathematics) provides
> in-depth information about typesetting mathematical formulae using the
> \(\LaTeX\) typesetting system.

### Activating KaTeX support

As of Docsy version v0.12.0, the theme uses Hugo's embedded instance of the
KaTeX display engine to render mathematical markup to HTML at build time.\
To enable \(\LaTeX\) typesetting in Markdown, perform the two steps described
below:

#### Enable `passthrough` extension

First you have to enable and configure the goldmark `passthrough` extension
inside your `hugo.toml`/`hugo.yaml`/`hugo.json`. You can edit this definition to
meet your own needs. For details, see the official
[Hugo docs](https://gohugo.io/content-management/mathematics/#step-1).

{{< tabpane text=true persist=lang >}}
{{< tab header="Site configuration file:" disabled=true />}}
{{% tab header="hugo.toml" lang="toml" %}}

```toml
[markup]
  [markup.goldmark]
    [markup.goldmark.extensions]
      [markup.goldmark.extensions.passthrough]
        enable = true
        [markup.goldmark.extensions.passthrough.delimiters]
          block = [['\[', '\]'], ['$$', '$$']]
          inline = [['\(', '\)']]
```

{{% /tab %}} {{% tab header="hugo.yaml" lang="yaml" %}}

```yaml
markup:
  goldmark:
    extensions:
      passthrough:
        enable: true
        delimiters:
          block: [['\[', '\]'], ['$$', '$$']]
          inline: [['\(', '\)']]
```

{{% /tab %}} {{% tab header="hugo.json" lang="json" %}}

```json
{
  "markup": {
    "goldmark": {
      "extensions": {
        "passthrough": {
          "delimiters": {
            "block": [
              ["\\[", "\\]"],
              ["$$", "$$"]
            ],
            "inline": [["\\(", "\\)"]]
          },
          "enable": true
        }
      }
    }
  }
}
```

{{% /tab %}} {{< /tabpane >}}

#### Add `passthrough` render hook

Docsy uses Hugo's `render-passthrough`
[hook](https://gohugo.io/render-hooks/passthrough/) when generating math
equations at build-time. To enable this hook in your project, add a new local
hook file `layouts/_markup/render-passthrough.html` in your project site. The
content of this file has to be one single line only:

{{< card code=true header="layouts/_markup/render-passthrough.html" lang="go-html-template" >}}

{{ partial "scripts/math.html" . }}

{{< /card >}} <br>

With the `passthrough` extension enabled and the render hook in place, support
of \(\KaTeX\) is automatically enabled when you author a `math` code block on
your page or when you add a mathematical formula to your page using one of the
passthrough delimiter pairs defined above.

### KaTeX version

Docsy fetches the KaTeX stylesheet and fonts from the unpkg CDN at build time
and self-hosts them with your site. It fetches the
[pinned version](#script-dep-versions), currently {{% param katex.version %}};
to use a different one, set `params.katex.version`.

> [!NOTE] Passthrough for selected sections
>
> For very large sites, you might want to restrict the passthrough to selected
> sections. Do so by placing the passthrough hook in the section's `_markup`
> folder. For example:
>
> - `layouts/docs/_markup/render-passthrough.html` - hook is active for all docs
>   pages, but not for other sections such as the blog.
> - [layouts/docs/content/diagrams-and-formulae/_markup/render-passthrough.html][] -
>   hook is active for this page of the user guide only, which is how we
>   actually have it setup.

[layouts/docs/content/diagrams-and-formulae/_markup/render-passthrough.html]:
  https://github.com/google/docsy/blob/main/docsy.dev/layouts/docs/content/diagrams-and-formulae/_markup/render-passthrough.html

### Display of Chemical Equations and Physical Units

[mhchem](https://www.ctan.org/pkg/mhchem) is a \(\LaTeX\) package for
typesetting chemical molecular formulae and equations. Fortunately, \(\KaTeX\)
provides the `mhchem`
[extension](https://github.com/KaTeX/KaTeX/tree/main/contrib/mhchem) that makes
the `mhchem` package accessible when authoring content for the web. As of hugo
version v0.144.0, the `mhchem` extension is enabled in Hugo's embedded KaTeX
instance by default, therefore you can easily include chemical equations into
your page. An equation can be shown either inline or can reside on its own line.
The following code sample produces a text line including an inline chemical
equation:

```mhchem
*Precipitation of barium sulfate:* \(\ce{SO4^2- + Ba^2+ -> BaSO4 v}\)
```

_Precipitation of barium sulfate:_ \(\ce{SO4^2- + Ba^2+ -> BaSO4 v}\)

More complex equations can be displayed on their own line using the block
delimiters defined:

<!-- cSpell:ignore tetrahydroxozincate mchem -->
<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
````markdown
\[
\tag*{(2)} \ce{Zn^2+  <=>[+ 2OH-][+ 2H+]  $\underset{\text{amphoteric hydroxide}}{\ce{Zn(OH)2 v}}$  <=>[+ 2OH-][+ 2H+]  $\underset{\text{tetrahydroxozincate}}{\ce{[Zn(OH)4]^2-}}$}
\]
````
<!-- prettier-ignore-end -->

Alternatively, you can use a code block adorned with `chem` in order to render
the equation:

````markdown
```chem
\tag*{(2)} \ce{Zn^2+  <=>[+ 2OH-][+ 2H+]  $\underset{\text{amphoteric hydroxide}}{\ce{Zn(OH)2 v}}$  <=>[+ 2OH-][+ 2H+]  $\underset{\text{tetrahydroxozincate}}{\ce{[Zn(OH)4]^2-}}$}
```
````

Both standard syntax and `chem` blocks render to the same equation:

<!-- prettier-ignore-start -->
\[
\tag*{(2)} \ce{Zn^2+  <=>[+ 2OH-][+ 2H+]  $\underset{\text{amphoteric hydroxide}}{\ce{Zn(OH)2 v}}$  <=>[+ 2OH-][+ 2H+]  $\underset{\text{tetrahydroxozincate}}{\ce{[Zn(OH)4]^2-}}$}
\]
<!-- prettier-ignore-end -->
<!-- markdownlint-restore -->

> [!NOTE]
>
> The [manual](https://mhchem.github.io/MathJax-mhchem/) for mchem's input
> syntax provides in-depth information about typesetting chemical formulae and
> physical units using the `mhchem` tool.

Use of `mhchem` is not limited to the authoring of chemical equations. By using
the included `\pu` command, pretty looking physical units can be written with
ease, too. The following code sample produces two text lines with four numbers
plus their corresponding physical units:

```mhchem
* Scientific number notation: \(\pu{1.2e3 kJ}\) or \(\pu{1.2E3 kJ}\) \\
* Divisions: \(\pu{123 kJ/mol}\) or \(\pu{123 kJ//mol}\)
```

- Scientific number notation: \(\pu{1.2e3 kJ}\) or \(\pu{1.2E3 kJ}\)
- Divisions: \(\pu{123 kJ/mol}\) or \(\pu{123 kJ//mol}\)

For a complete list of options when authoring physical units, have a look at the
[section](https://mhchem.github.io/MathJax-mhchem/#pu) on physical units in the
`mhchem` documentation.

## Diagrams with Mermaid

[Mermaid](https://mermaid-js.github.io) is a Javascript library for rendering
simple text definitions to useful diagrams in the browser. It can generate a
variety of different diagram types, including flowcharts, sequence diagrams,
class diagrams, state diagrams, ER diagrams, user journey diagrams, Gantt charts
and pie charts.

Mermaid support is automatically enabled when you use a `mermaid` code block on
your page: the browser renders the text definition to a diagram as soon as the
page loads.

The great advantage of this is anyone who can edit the page can now edit the
diagram: no more hunting for the original tools and version to make a new edit.

For example, the following defines a sequence diagram:

<!-- cSpell:ignore autonumber -->

````markdown
```mermaid
sequenceDiagram
    autonumber
    Docsy user->>Discussion board: Ask question
    Discussion board->>Community member: read question
    loop Different strategies
    Community member->>Test instance: Investigate issue raised
    end
    Note right of Community member: After hours of investigation:
    Test instance-->>Community member: Come up with solution
    Community member-->>Discussion board: Propose solution
    Discussion board-->>Docsy user: check proposed solution
    Docsy user->>Discussion board: Mark question as resolved
    Docsy user->>Docsy user: Being happy
```
````

which is automatically rendered to:

```mermaid
sequenceDiagram
    autonumber
    Docsy user->>Discussion board: Ask question
    Discussion board->>Community member: read question
    loop Different strategies
    Community member->>Test instance: Investigate issue raised
    end
    Note right of Community member: After hours of investigation:
    Test instance-->>Community member: Come up with solution
    Community member-->>Discussion board: Propose solution
    Discussion board-->>Docsy user: check proposed solution
    Docsy user->>Discussion board: Mark question as resolved
    Docsy user->>Docsy user: Being happy
```

Docsy loads Mermaid from the jsDelivr CDN at page load, at the
[pinned version](#script-dep-versions), currently {{% param mermaid.version %}};
to use a different one, set `params.mermaid.version`.

If needed, you can define custom settings for your diagrams, such as themes,
padding in your `hugo.toml`/`hugo.yaml`/`hugo.json`.

<!-- markdownlint-disable no-shortcut-ref-link -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[params.mermaid]
theme = "neutral"

[params.mermaid.flowchart]
diagramPadding = 6
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
params:
  mermaid:
    theme: neutral
    flowchart:
      diagramPadding: 6
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "params": {
    "mermaid": {
      "theme": "neutral",
      "flowchart": {
        "diagramPadding": 6
      }
    }
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-enable no-shortcut-ref-link -->

See the
[Mermaid documentation](https://mermaid.js.org/config/configuration.html) for a
list of defaults that can be overridden.

Settings can also be overridden on a per-diagram basis by making use of a
[front matter config](https://mermaid.js.org/config/theming.html#customizing-themes-with-themevariables)
block at the start of the diagram definition.

## UML Diagrams with PlantUML

[PlantUML](https://plantuml.com/en/) is an alternative to Mermaid that lets you
quickly create UML diagrams, including sequence diagrams, use case diagrams, and
state diagrams. Unlike Mermaid diagrams, which are entirely rendered in the
browser, PlantUML uses a PlantUML server to create diagrams. You can use the
provided default demo server (not recommended for production use), or run a
server yourself. PlantUML offers a wider range of image types than Mermaid, so
may be a better choice for some use cases.

Diagrams are defined using a simple and intuitive language.
([see PlantUML Language Reference Guide](https://plantuml.com/en/guide)).

The following example shows a use case diagram:

````markdown
```plantuml
participant participant as Foo
actor       actor       as Foo1
boundary    boundary    as Foo2
control     control     as Foo3
entity      entity      as Foo4
database    database    as Foo5
collections collections as Foo6
queue       queue       as Foo7
Foo -> Foo1 : To actor
Foo -> Foo2 : To boundary
Foo -> Foo3 : To control
Foo -> Foo4 : To entity
Foo -> Foo5 : To database
Foo -> Foo6 : To collections
Foo -> Foo7: To queue
```
````

Automatically renders to:

```plantuml
participant participant as Foo
actor       actor       as Foo1
boundary    boundary    as Foo2
control     control     as Foo3
entity      entity      as Foo4
database    database    as Foo5
collections collections as Foo6
queue       queue       as Foo7
Foo -> Foo1 : To actor
Foo -> Foo2 : To boundary
Foo -> Foo3 : To control
Foo -> Foo4 : To entity
Foo -> Foo5 : To database
Foo -> Foo6 : To collections
Foo -> Foo7: To queue
```

To enable/disable PlantUML, update `hugo.toml`/`hugo.yaml`/`hugo.json`:

<!-- markdownlint-disable no-shortcut-ref-link -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[params.plantuml]
enable = true
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
params:
  plantuml:
    enable: true
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "params": {
    "plantuml": {
      "enable": true
    }
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-enable no-shortcut-ref-link -->

Other optional settings are:

<!-- markdownlint-disable no-bare-urls -->
<!-- markdownlint-capture -->
<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[params.plantuml]
enable = true
theme = "default"

# Set url to plantuml server
# default is http://www.plantuml.com/plantuml/svg/
svg_image_url = "https://www.plantuml.com/plantuml/svg/"

# By default the plantuml implementation uses <img /> tags to display UML diagrams.
# When svg is set to true, diagrams are displayed using <svg /> tags, maintaining functionality like links e.g.
# default = false
svg = true
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
params:
  plantuml:
    enable: true
    theme: default
    # Set url to plantuml server
    # default is http://www.plantuml.com/plantuml/svg/
    svg_image_url: 'https://www.plantuml.com/plantuml/svg/'
    # By default the plantuml implementation uses <img /> tags to display UML diagrams.
    # When svg is set to true, diagrams are displayed using <svg /> tags, maintaining functionality like links e.g.
    # default = false
    svg: true
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "params": {
    "plantuml": {
      "enable": true,
      "theme": "default",
      "svg_image_url": "https://www.plantuml.com/plantuml/svg/",
      "svg": true
    }
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-restore -->

## MindMap support with MarkMap

[MarkMap](https://markmap.js.org/) renders Markdown as an interactive mind map
in the browser.

For example, the following defines a simple MindMap:

<!-- markdownlint-disable code-fence-style -->
<!-- prettier-ignore -->
~~~~markdown
```markmap
# markmap

## Links

- <https://markmap.js.org/>
- [GitHub](https://github.com/gera2ld/markmap)

## Related

- [coc-markmap](https://github.com/gera2ld/coc-markmap)
- [gatsby-remark-markmap](https://github.com/gera2ld/gatsby-remark-markmap)

## Features

- links
- **inline** ~~text~~ *styles*
- multiline
  text
- `inline code`
-
    ```js
    console.log('code block');
    ```
- KaTeX - $x = {-b \pm \sqrt{b^2-4ac} \over 2a}$
```
~~~~

<!-- markdownlint-restore -->

With MarkMap enabled, Docsy renders it as:

````markmap
# markmap

## Links

- <https://markmap.js.org/>
- [GitHub](https://github.com/gera2ld/markmap)

## Related

- [coc-markmap](https://github.com/gera2ld/coc-markmap)
- [gatsby-remark-markmap](https://github.com/gera2ld/gatsby-remark-markmap)

## Features

- links
- **inline** ~~text~~ *styles*
- multiline
  text
- `inline code`
-
    ```js
    console.log('code block');
    ```
- KaTeX - $x = {-b \pm \sqrt{b^2-4ac} \over 2a}$
````

### Activating MarkMap support

To enable MarkMap, turn on its plugin in `hugo.toml`/`hugo.yaml`/`hugo.json`:

<!-- markdownlint-disable no-shortcut-ref-link -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[params.docsy.plugins.markmap]
enable = true
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
params:
  docsy:
    plugins:
      markmap:
        enable: true
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "params": {
    "docsy": {
      "plugins": { "markmap": { "enable": true } }
    }
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-enable no-shortcut-ref-link -->

Docsy renders `markmap` fences through its own code-block render hook,
`layouts/_markup/render-codeblock-markmap.html`; to change how they render,
shadow that file.

MarkMap scripts load only on pages containing a `markmap` code block. If you
produce MarkMap markup some other way (raw HTML, your own render hook, the `tab`
or `readfile code="true"` shortcodes with `lang=markmap`, a fence in content
pulled in with `.Content`, or a printed section), clear the entry's gate so the
scripts load site-wide ([why][page-flags]):

```yaml
params:
  docsy:
    plugins:
      markmap:
        enable: true
        pageGate: ''
```

The entry's `options` take a `height` for the rendered map, a [CSS length][].
The default is `300px`, which also applies when the value isn't a valid length:

```yaml
params:
  docsy:
    plugins:
      markmap:
        enable: true
        options: { height: 400px }
```

> [!NOTE]
>
> Before 0.18, MarkMap was configured under `params.markmap`: `enable` and the
> [`version`](#markmap-version) pin. Both are deprecated but still honored for
> this release cycle, with a build warning:
>
> - `enable: true` keeps its pre-0.18 behavior of loading MarkMap on every page.
> - A present `version` overrides the entry's, and an empty one fails the build.
>
> Move `enable` onto the registry entry, and `version` only if you had
> overridden the theme's pin; then remove `params.markmap`.

### MarkMap version

Normally, omit a `version` override in your MarkMap entry to inherit Docsy's pin
and its updates.

At build time, Docsy fetches the [pinned version](#script-dep-versions),
currently {{% param docsy.plugins.markmap.version %}}, of the
[markmap-autoloader][] package's entry file and serves it from your site with
subresource integrity.

If the effective pin is empty, check your version overrides, including the
deprecated `params.markmap.version`, and [theme configuration
merging][config-merge].

- To use a different version, set `version` on the entry:
  `markmap: { enable: true, version: "X.Y.Z" }`.
- Sites that restrict Hugo's remote fetches (`security.http`) must allow
  `cdn.jsdelivr.net`.
- To build without network access, override the plugin's companion partial,
  `layouts/_partials/scripts/plugins/markmap.html`, to serve a copy you host.
- The autoloader itself loads MarkMap's runtime libraries from a public CDN in
  the browser, at versions it pins but without subresource integrity.

[config-merge]: /docs/content/configuration/#theme-defaults-and-your-overrides
[CSS length]:
  https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length
[markmap-autoloader]: https://www.npmjs.com/package/markmap-autoloader
[page-flags]: /docs/content/plugins/#page-flags-in-included-content

## Diagrams with Diagrams.net

[Diagrams.net](https://diagrams.net/) (aka `draw.io`) provides a free and open
source diagram editor that can generate a wider range of diagrams than Mermaid
or PlantUML using a web or desktop editor.

SVG and PNG files exported with the tool contain the source code of the original
diagram by default, which allows the diagrams.net site to import those images
again for edit in the future. With `draw.io` enabled, Docsy will detect this and
automatically add an `Edit` button over any image that can be edited using the
online site.

Hover over the image below and click edit to instantly start working with it.
Clicking the `Save` button will cause the edited diagram to be exported using
the same filename and filetype, and downloaded to your browser.

> [!NOTE]
>
> If you're creating a new diagram, be sure to `File -> Export` in either `svg`
> or `png` format (`svg` is usually the best choice) and ensure the
> `Include a copy of my diagram` is selected so it can be edited again later.

As the diagram data is transported via the browser, the diagrams.net server does
not need to access the content on your Docsy server directly at all.

{{< figure src="docsy-diagrams.svg" caption="Mouse over the above image and click the `Edit` button!">}}

To enable detection of diagrams, update `hugo.toml`/`hugo.yaml`/`hugo.json`:

<!-- markdownlint-disable no-shortcut-ref-link -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[params.drawio]
enable = true
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
params:
  drawio:
    enable: true
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "params": {
    "drawio": {
      "enable": true
    }
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-enable no-shortcut-ref-link -->

You can also
[deploy and use your own server](https://github.com/jgraph/docker-drawio/blob/master/README.md)
for editing diagrams, in which case update the configuration to point to that
server:

<!-- markdownlint-disable no-shortcut-ref-link -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[params.drawio]
drawio_server = "https://app.mydrawioserver.example.com"
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
params:
  drawio:
    drawio_server: 'https://app.mydrawioserver.example.com'
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "params": {
    "drawio": {
      "drawio_server": "https://app.mydrawioserver.example.com"
    }
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-enable no-shortcut-ref-link -->
