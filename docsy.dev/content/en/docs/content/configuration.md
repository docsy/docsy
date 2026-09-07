---
title: Configuration
description: >-
  The rules behind every Docsy setting, from how theme defaults merge with yours
  to case-insensitive keys, boolean values, environment overrides, and build
  warnings
---

Docsy's settings live under `params` in your site's Hugo configuration, each
documented with its feature. `params.docsy` is the namespace Docsy reserves for
its own settings; its [plugin registry][plugins] lives there, and older
parameters stay where they are.

## Theme defaults and your overrides

The defaults Docsy sets in configuration live in its own
[`hugo.yaml`][theme-defaults]. Under Hugo's default deep-merge strategy for
`params`, maps merge recursively, so you set only the leaves you change; a list
or a scalar replaces the theme's value rather than combining with it. Any Hugo
module you import contributes its `params` the same way, and your project's
values win. For the strategies, see Hugo's [configuration merge][hugo-merge];
setting `params._merge: shallow` discards the theme's entries under any key you
also define.

## Key spelling

Keys are case-insensitive: Hugo lowercases them, so `taxonomyCloud` and
`taxonomycloud` name the same key. Examples in these docs use camelCase.

## Boolean values

Write booleans unquoted: `enable: false`, not `enable: "false"`. A quoted value
is a string, and a non-empty string is true to a Hugo template whatever it says;
only parameters that spell out their accepted strings, such as the plugin
registry's ([Plugins § Configuration reference][plugins-config]), read `"false"`
as false.

## Environment variables

Any configuration key can be set from the environment, which suits CI jobs that
build a variant without touching the committed configuration: `HUGO_`, then the
key path in upper case with `_` between levels ([Hugo's environment
configuration][hugo-env]). For example, the [link-checking build][chrome-ci]
runs `HUGO_PARAMS_TD_CHROME=shared hugo`.

- **The character after `HUGO` is the delimiter**, and the only character split
  on. So `HUGO_` cannot name a key that itself contains an underscore; pick
  another delimiter for those: `HUGOxPARAMSxPRISM_SYNTAX_HIGHLIGHTING=true`.
  Hyphens pass through with any delimiter
  (`HUGO_PARAMS_DOCSY_PLUGINS_CLICK-TO-COPY_ENABLE=false`), but a name with a
  hyphen isn't a POSIX shell identifier: pass it with `env NAME=value hugo` or a
  CI `env:` block rather than `export`.
- **Values arrive as strings** for any key that only the theme declares, because
  Hugo applies the environment before the theme's configuration merges: `=false`
  lands as `"false"`. Whether that reads as false is the parameter's call, per
  [Boolean values](#boolean-values).

## Configuration warnings

Docsy reports a misconfiguration as a build warning that names its id and the
page to read; the build continues with what conforms. Fix the configuration when
you can. To silence a warning you've judged intentional, add the id it printed
to Hugo's [`ignoreLogs`][hugo-ignorelogs], replacing _`WARNING_ID`_:

```yaml
ignoreLogs: [WARNING_ID]
```

For the plugin registry's warnings and their ids, see [Plugins §
Warnings][plugins-warnings].

<!-- prettier-ignore-start -->
[chrome-ci]: /docs/deployment/chrome/
[hugo-env]: https://gohugo.io/configuration/introduction/#environment-variables
[hugo-ignorelogs]: https://gohugo.io/configuration/all/#ignorelogs
[hugo-merge]: https://gohugo.io/configuration/introduction/#merge-configuration-settings
[plugins]: /docs/content/plugins/
[plugins-config]: /docs/content/plugins/#configuration-reference
[plugins-warnings]: /docs/content/plugins/#warnings
[theme-defaults]: https://github.com/google/docsy/blob/main/theme/hugo.yaml
<!-- prettier-ignore-end -->
