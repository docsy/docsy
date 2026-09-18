---
title: AI-agent support
linkTitle: Agent support
description: >-
  Opt-in features that help AI agents and automated tools discover and use your
  site content, including Markdown output, alternate links in HTML, and
  llms.txt.
cSpell:ignore: llmstxt
---

> [!NOTE] Early evaluation
>
> Features described in this page are [experimental][], and are useful for early
> adoption and evaluation. Output details and validation coverage may change in
> future releases. To track the phased evolution of the agent-support feature,
> see [Improve support for AI-agent doc consumption #2614][#2614].

[#2614]: https://github.com/docsy/docsy/issues/2614

## Features

When your site opts in, these are the user-facing and machine-readable behaviors
Docsy enables:

- **[Markdown output format](#markdown-output)** support. Your project's
  `outputs` configuration controls which page kinds publish Markdown.
- **[Discovery](#discovery)**: alternate links and a hidden in-body directive
  lead agents to each page's Markdown version and to `llms.txt`.
- **View Markdown**: page meta area includes a **View Markdown** link to the
  Markdown version of the page.
- **[`llms.txt`](#llms-txt)**: per-language site index of links to Markdown
  content.

The remainder of this page explains how to enable each feature, and discusses
[validation and metrics](#validation-and-metrics) supported with examples.

## Enable Markdown output {#markdown-output}

Hugo comes with several [built-in output formats][], including `markdown`. To
enable Markdown output, add `markdown` to the Hugo [outputs][] configuration for
the page kinds you want to support. For example:

{{< tabpane text=true persist=lang >}}
{{< tab header="Configuration file:" disabled=true />}}
{{% tab header="hugo.yaml" lang="yaml" %}}

```yaml
outputs:
  home: [HTML, markdown]
  page: [HTML, markdown]
  section: [HTML, RSS, print, markdown]
```

{{% /tab %}} {{% tab header="hugo.toml" lang="toml" %}}

```toml
[outputs]
home = [ "HTML", "markdown" ]
page = [ "HTML", "markdown" ]
section = [ "HTML", "RSS", "print", "markdown" ]
```

{{% /tab %}} {{% tab header="hugo.json" lang="json" %}}

```json
{
  "outputs": {
    "home": ["HTML", "markdown"],
    "page": ["HTML", "markdown"],
    "section": ["HTML", "RSS", "print", "markdown"]
  }
}
```

{{% /tab %}} {{< /tabpane >}}

### Opt pages out {#opt-pages-out}

> [!TIP]
>
> By default, Hugo’s `outputs` map (whether in multi-file site config or page
> front matter) is a **full replacement** for each page kind, not a merge [^1].
> When you add `markdown`, keep every format your site already relies on -- for
> example `RSS` and `print` on sections as is shown in the examples above.

[^1]:
    This is contrary to the documented Hugo behavior for front-matter
    configuration, but it is confirmed with our testing as of Hugo 0.158.0.

To opt pages out of Markdown output, set `outputs` in page front matter to
`HTML` only, or whatever your page's default output formats are while excluding
`markdown`. For example:

```yaml
---
title: HTML-only test page
outputs: [HTML]
---
...
```

## Enable `llms.txt` {#llms-txt}

The `llms.txt` format is a simple text format for listing machine-readable links
to site content. It is designed to be easy for agents to discover and parse, and
to complement the richer but more complex Markdown outputs. To learn more, see
[llmstxt.org][].

Docsy generates an `llms.txt` index at each language's site root, and includes
links to the home page, main menu pages, and Markdown alternates where they
exist. To enable it, add `LLMS` to the Hugo [outputs][] configuration for the
home page. For example:

```yaml
outputs:
  home: [HTML, markdown, LLMS]
  page: [HTML, markdown]
  section: [HTML, RSS, print, markdown]
```

For an example of the generated `llms.txt` for this site, see
[/llms.txt](/llms.txt).

## Discovery

Agents find your Markdown content through:

- **Alternate links**: page HTML headers include `rel="alternate"` links to the
  Markdown version of the page.
- **In-body directive**: when `llms.txt` is enabled, each page body opens with a
  visually-hidden directive pointing agents to the language's `llms.txt` index
  and, when the page has one, its Markdown version. Sites that override the
  theme's `baseof` templates need to call the `llms-directive.html` partial
  themselves.

## Customize output

Docsy renders Markdown output via [layouts/all.md][] and generates `llms.txt`
via `layouts/index.llms.txt`. You can override these defaults at several levels:

- **Per kind** — Add templates such as `home.md` or `_default/single.md` under
  `layouts/` in your project to tailor Markdown output for specific [Hugo
  kinds][].
- **Per shortcode** — Add [output-format-specific shortcode templates][sof] to
  project-local shortcodes so they render Markdown-friendly content when
  appropriate. For example, this site's [readfile.markdown.md][] is the
  Markdown-output variant of the theme's `readfile` shortcode.
- **Per page** — Provide page-specific content or structure for high-value pages
  that need a curated agent-facing view.

## Server-side support

While outside the scope of Docsy's support, sites can facilitate agent discovery
and access to Markdown content by implementing server-side content negotiation.
For example, honoring `Accept: text/markdown` on the same URL as HTML.

## Validation and metrics

We use [AFDocs][] to assess basic structural support for agent-facing content,
and to validate that generated outputs meet the configured checks. We also
encourage sites to implement their own monitoring and metrics on agent access
patterns—for example logging requests to Markdown URLs or `llms.txt`, and
collecting metrics on their use. For details, see
[Agent-support checks](/project/build/ci-cd/#agent-support-checks).

The `docsy.dev` project contains [AFDocs][] configuration and npm scripts so
maintainers can score a deployed URL against checks that overlap with Docsy’s
agent-support goals, including Markdown URLs, llms.txt, and related categories.

### Scorecard examples

For scorecard examples, see the [OpenTelemetry agent score][] online report and
the AFDocs scorecard for this site:

<details>
<summary><code>docsy.dev</code> scorecard</summary>

Known gaps in this scorecard are tracked under [#2614][].

{{< readfile file="afdocs-scorecard.txt" code="true" lang="text" >}}

</details>

For details on how these checks are configured, see
[Agent-support checks](/project/build/ci-cd/#agent-support-checks).

[afdocs]: https://afdocs.dev/
[built-in output formats]: https://gohugo.io/configuration/output-formats/
[experimental]: /project/about/changelog/#experimental
[Hugo kinds]: https://gohugo.io/templates/types/
[layouts/all.md]: https://github.com/docsy/docsy/blob/main/theme/layouts/all.md
[readfile.markdown.md]:
  https://github.com/docsy/docsy/blob/main/docsy.dev/layouts/_shortcodes/readfile.markdown.md
[llmstxt.org]: https://llmstxt.org/
[OpenTelemetry agent score]:
  https://buildwithfern.com/agent-score/company/opentelemetry
[outputs]: https://gohugo.io/configuration/outputs/
[sof]: https://gohugo.io/templates/shortcode/
