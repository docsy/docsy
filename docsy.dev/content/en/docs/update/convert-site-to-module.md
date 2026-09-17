---
title: Migrate to Hugo Modules
aliases: [/docs/updating/convert-site-to-module/]
weight: 4
description: >-
  Move a submodule- or clone-based site to Hugo Modules and simplify future
  updates.
cSpell:ignore: findstr batchfile twbs
---

## TL;DR: Conversion for the impatient expert

Run:

{{< tabpane >}}
{{< tab header="CLI:" disabled=true />}}
{{< tab header="Unix shell" lang="Bash" >}}
cd /path/to/my-existing-site
hugo mod init github.com/me-at-github/my-existing-site
hugo mod get github.com/docsy/docsy/theme@{{% param tdVersion.latest %}}
[ -f config.toml ] && mv config.toml hugo.toml
sed -i.bak '/theme = \["docsy/d' hugo.toml && rm hugo.toml.bak
cat >> hugo.toml <<EOL
[module]
proxy = "direct"
[[module.imports]]
path = "github.com/docsy/docsy/theme"
EOL
npm install --save-exact --save-dev sass-embedded@{{% sass-embedded-version %}}
npm pkg set scripts.hugo=hugo
hugo mod npm pack
npm install
npm run hugo -- server
{{< /tab >}}
{{< tab header="Windows command line" lang="Batchfile" >}}
cd  my-existing-site
hugo mod init github.com/me-at-github/my-existing-site
hugo mod get github.com/docsy/docsy/theme@{{% param tdVersion.latest %}}
if exist config.toml ren config.toml hugo.toml
findstr /v /c:"theme = [\"docsy" hugo.toml > hugo.toml.tmp
move /y hugo.toml.tmp hugo.toml
(echo [module]^

proxy = "direct"^

[[module.imports]]^

path = "github.com/docsy/docsy/theme")>>hugo.toml
npm install --save-exact --save-dev sass-embedded@{{% sass-embedded-version %}}
npm pkg set scripts.hugo=hugo
hugo mod npm pack
npm install
npm run hugo -- server
{{< /tab >}}
{{< /tabpane >}}


## Detailed conversion instructions

### Import the Docsy theme module as a dependency of your site

Change to the root directory of your existing site:

```bash
cd /path/to/my-existing-site
```

Only sites that are Hugo Modules themselves can import other Hugo Modules. Turn your existing site into a Hugo Module by running the following command from your site directory, replacing `github.com/me-at-github/my-existing-site` with your site repository:

```bash
hugo mod init github.com/me-at-github/my-existing-site
```

This creates a `go.mod` file for your site's module definitions.

Next declare the Docsy theme module as a dependency for your site.

```bash
hugo mod get github.com/docsy/docsy/theme@{{% param tdVersion.latest %}}
```

This command adds the `docsy` theme module to your definition file `go.mod` and
records the module checksums in `go.sum`.

### Update your config file

If your site still uses a `config.toml` file, rename it to `hugo.toml` first.

In your `hugo.toml`/`hugo.yaml`/`hugo.json` file, update the theme setting to use Hugo Modules. Find the following line (`docsy/theme` if your site is on Docsy 0.16 or later, `docsy` otherwise):

{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
theme = ["docsy/theme"]
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
theme: docsy/theme
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
"theme": "docsy/theme"
{{< /tab >}}
{{< /tabpane >}}

Change this line to:

{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
theme = ["github.com/docsy/docsy/theme"]
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
theme:
  - github.com/docsy/docsy/theme
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
"theme": [
  "github.com/docsy/docsy/theme"
]
{{< /tab >}}
{{< /tabpane >}}

Alternatively, you can omit this line altogether and replace it with the settings given in the following snippet:

{{< tabpane >}}
{{< tab header="Configuration file:" disabled=true />}}
{{< tab header="hugo.toml" lang="toml" >}}
[module]
  proxy = "direct"
  # uncomment line below for temporary local development of module
  # replacements = "github.com/docsy/docsy/theme -> ../../docsy/theme"
  [module.hugoVersion]
    extended = true
    min = "{{% param "hugoMinVersion" %}}"
  [[module.imports]]
    path = "github.com/docsy/docsy/theme"
    disable = false
{{< /tab >}}
{{< tab header="hugo.yaml" lang="yaml" >}}
module:
  proxy: direct
  hugoVersion:
    extended: true
    min: {{% param "hugoMinVersion" %}}
  imports:
    - path: github.com/docsy/docsy/theme
      disable: false
{{< /tab >}}
{{< tab header="hugo.json" lang="json" >}}
{
  "module": {
    "proxy": "direct",
    "hugoVersion": {
      "extended": true,
      "min": "{{% param "hugoMinVersion" %}}"
    },
    "imports": [
      {
        "path": "github.com/docsy/docsy/theme",
        "disable": false
      }
    ]
  }
}
{{< /tab >}}
{{< /tabpane >}}

You can find details of what these configuration settings do in the [Hugo modules documentation](https://gohugo.io/configuration/module/#top-level-settings).
Depending on your environment you may need to tweak them slightly, for example by adding a proxy to use when downloading remote modules.

> [!CAUTION]
>
> If you have a multi-language installation, make sure that the section
> `[languages]` inside your `hugo.toml` is declared before the section
> `[module]` with the module imports. Otherwise you will run into trouble!

### Install theme npm dependencies

Follow [Install Dart Sass][install-dart-sass] so that Hugo runs with the `sass`
CLI on its `PATH`; for npm-based sites, that means installing the tested
[`sass-embedded`][] version and running Hugo through npm scripts:

```bash
npm install --save-exact --save-dev sass-embedded@{{% sass-embedded-version %}}
npm pkg set scripts.hugo=hugo
```

Docsy sources its Bootstrap and Font Awesome assets from npm. Generate the
theme's npm-dependency workspace (see Hugo's
[Node dependencies](https://gohugo.io/hugo-modules/nodejs-dependencies/)) and
install it:

```bash
hugo mod npm pack
npm install
```

Re-run `hugo mod npm pack` whenever you
[update Docsy](/docs/update/hugo-module/) or otherwise edit `package.json`;
Hugo warns when the dependency set drifts. For background, see
[Bootstrap and Font Awesome via npm][blog-npm-deps] in the 0.16.0
release notes.

### Check validity of your configuration settings

Run `hugo mod graph` and verify that it lists `github.com/docsy/docsy/theme`:

```bash
hugo mod graph
hugo: collected modules in 1092 ms
github.com/me-at-github/my-existing-site github.com/docsy/docsy/theme@{{% param tdVersion.latest %}}
```

> [!TIP]
>
> To clear the module cache:
>
> ```bash
> hugo mod clean
> hugo: collected modules in 995 ms
> hugo: cleaned module cache for "github.com/docsy/docsy/theme"
> ```

## Clean up your repository

Since your site now uses Hugo Modules, remove the `docsy` theme copy from your
project's `themes/` directory:

- For a theme **clone**:

  ```bash
  rm -rf themes/docsy
  ```

- For a theme **submodule**:

  ```bash
  git rm -rf themes/docsy
  ```

Then commit the change:

```bash
git commit -m "Removed docsy git submodule"
```

> [!CAUTION]
>
> Be careful when using the `rm -rf` command, make sure that you don't
> inadvertently delete any productive data files!

<!-- prettier-ignore-start -->
[blog-npm-deps]: /blog/2026/0.16.0/#npm-deps
[install-dart-sass]: /docs/get-started/docsy-as-module/installation-prerequisites/#install-dart-sass
[`sass-embedded`]: https://www.npmjs.com/package/sass-embedded
<!-- prettier-ignore-end -->
