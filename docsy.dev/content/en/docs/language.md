---
title: Multi-language Support
weight: 7
description: Support multiple languages in your site.
cSpell:ignore: rtlcss subdir operativsystem skyen Norsk
---

If you'd like to provide site content in multiple languages, the Docsy theme and
Hugo make it easy to both add your translated content and for your users to
navigate between language versions. For details about Hugo's multi-language
support, see the [Multilingual mode][].

## Content and configuration

To add content in multiple languages, you first need to define the available
languages in a `languages` section in your site configuration. Each language can
have its own language-specific configuration. For example, the [Docsy example][]
site config specifies that it provides content in English, Norwegian, and
Persian. The default language is English:

<!-- markdownlint-disable -->
<!-- prettier-ignore-start -->
{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
contentDir = "content/en"
defaultContentLanguage = "en"
defaultContentLanguageInSubdir = false
...
[languages]
[languages.en]
label ="English"
# Weight used for sorting.
weight = 1
[languages.en.params]
title = "Goldydocs"
description = "Docsy does docs"
[languages.no]
label ="Norsk"
contentDir = "content/no"
[languages.no.params]
title = "Goldydocs"
description = "Docsy er operativsystem for skyen"
time_format_default = "02.01.2006"
time_format_blog = "02.01.2006"
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
contentDir: content/en
defaultContentLanguage: en
defaultContentLanguageInSubdir: false
…
languages:
  en:
    label: English
    weight: 1 # used for sorting
    params:
      title: Docsy
      description: Docsy does docs
  'no':
    label: Norsk
    contentDir: content/no
    params:
      title: Docsy
      description: Docsy er operativsystem for skyen
      time_format_default: 02.01.2006
      time_format_blog: 02.01.2006
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "contentDir": "content/en",
  "defaultContentLanguage": "en",
  "defaultContentLanguageInSubdir": false,
  "languages": {
    "en": {
      "label": "English",
      "weight": 1,
      "params": {
        "title": "Docsy",
        "description": "Docsy does docs"
      }
  },
    "no": {
      "label": "Norsk",
      "contentDir": "content/no",
      "params": {
        "title": "Docsy",
        "description": "Docsy er operativsystem for skyen",
        "time_format_default": "02.01.2006",
        "time_format_blog": "02.01.2006"
      }
    }
  }
}
{{< /tab >}}
{{< /tabpane >}}
<!-- prettier-ignore-end -->
<!-- markdownlint-restore -->

Any setting not defined in a `[languages]` block will fall back to the global
value for that setting: so, for example, the content directory used for the site
above will be `content/en` unless the user selects the Norwegian language
option.

Once you've updated your site config, you create a content root directory for
each language version in your source repo, such as `content/en` for English
text, and add your [content](/docs/content/adding-content/) as usual. See the
[Hugo Docs](https://gohugo.io/content-management/multilingual) on multi-language
support for more information.

<!-- markdownlint-disable no-blanks-blockquote -->

> [!WARNING] Attention (only when using Docsy as hugo module)
>
> If you have a multi language installation, ensure that the section
> `[languages]` inside your
> [configuration file](https://gohugo.io/configuration/introduction/#configuration-file)
> is declared **before** the section `[module]` with the module imports.
> Otherwise you will run into trouble!

> [!TIP]
>
> If there's any possibility your site might be translated into other languages,
> consider creating your site with your content in a language-specific
> subdirectory, as it means you don't need to move it if you add another
> language.

For adding multiple language versions of other site elements such as button
text, see the [internationalization bundles](#internationalization-bundles)
section below.

<!-- markdownlint-disable heading-increment -->

### Right-to-left languages

<!-- markdownlint-restore -->

Docsy supports top-down Right-To-Left (RTL) languages such as Persian through
[Bootstrap's RTL feature][bs-rtl], which uses [RTLCSS][].

If your multilingual site includes an RTL language (configured with
`direction: rtl`), then Docsy transforms its stylesheet with [RTLCSS][] through
[PostCSS][]. Add the [`rtlcss`][rtlcss-npm] package and the PostCSS toolchain to
your dev dependencies:

```sh
npm install --save-dev rtlcss autoprefixer postcss-cli
```

npm also installs `postcss` itself as a peer dependency; for details, see
[Install PostCSS][install-postcss].

For an example of Docsy's RTL support, see the [Persian pages][] of the [Docsy
example].

[bs-rtl]: https://getbootstrap.com/docs/5.3/getting-started/rtl/
[install-postcss]:
  /docs/get-started/docsy-as-module/installation-prerequisites/#install-postcss
[PostCSS]: https://postcss.org/
[RTLCSS]: https://rtlcss.com/
[rtlcss-npm]: https://www.npmjs.com/package/rtlcss
[Persian pages]: https://example.docsy.dev/fa/

## Selecting a language from the language menu

If you configure more than one language in your
[configuration file](https://gohugo.io/configuration/introduction/#configuration-file),
the Docsy theme adds a language drop down to the navbar. Selecting a language
takes the user to the translated version of the current page, or the home page
for the given language. For details, see
[Adding a language menu](/docs/content/navigation/#language-menu).

## Internationalization bundles

All UI strings (text for buttons, repository links, etc.) are bundled inside
`/i18n` in the theme, with a `.yaml` file for each language.

If your chosen language isn't currently in the theme and you create your own
`.yaml` file for all the common UI strings (for example, if you translate the UI
text into Esperanto and create a copy of `en.yaml` called `eo.yaml`), we
recommend you do this **in the theme** rather than in your own project. You can
then open a [pull request][PR] to contribute your translation to the Docsy
community.

> [!TIP] Hugo Tip
>
> Run `hugo server --printI18nWarnings` when doing translation work, as it will
> give you warnings on what strings are missing.

### Create custom UI strings

If any of the Docsy theme UI strings in your chosen language aren't suitable for
your project, or if you need additional strings for your site, you can create
your own project-specific internationalization file in your project's `/i18n`
directory. For example, if you want to override any of Docsy's [English-language
strings][en.yaml], create your own `/i18n/en.yaml` with just your custom
strings. Any values you specify in this file will override the theme versions,
while the remaining strings will come from the theme's corresponding
internationalization bundle.

<!-- prettier-ignore-start -->
[Docsy example]: https://example.docsy.dev/
[en.yaml]: https://github.com/docsy/docsy/blob/main/theme/i18n/en.yaml
[Multilingual mode]: https://gohugo.io/content-management/multilingual/
[PR]: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request
<!-- prettier-ignore-end -->
