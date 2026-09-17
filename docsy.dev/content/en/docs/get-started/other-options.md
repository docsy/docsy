---
title: Other setup options
description: >-
  Install Docsy as a Git submodule, a clone, or the @docsy/theme npm package,
  for sites not using Hugo modules.
date: 2021-12-08
cSpell:ignore: hugo myproject
weight: 2
---

<!-- markdownlint-disable no-blanks-blockquote -->

If [Docsy as a Hugo Module](/docs/get-started/docsy-as-module/) doesn't suit
your site -- for example, if you don't want to install Go -- choose from these
setup options:

- [Option 1: Docsy as a Git submodule](#option-1-docsy-as-a-git-submodule)
- [Option 2: Clone the Docsy theme](#option-2-clone-the-docsy-theme)
- [Option 3: Docsy as an NPM package](#option-3-docsy-as-an-npm-package)

## Prerequisites

### Install Hugo <a id="hugo-extended-npm"></a>

You need a recent **extended** version of [Hugo](https://gohugo.io/), version
{{% param "hugoMinVersion" %}} or later. For installation options, including the
npm-managed [hugo-extended][] package, see [Install Hugo][].

### Install Node.js

Install or upgrade to the active Node.js [LTS release][], as explained in
[Install Node.js][].

### Install Dart Sass

See [Install Dart Sass][], including its recommendation to run Hugo through [npm
scripts][], which have the `sass` CLI on their `PATH` automatically.

### Install PostCSS (optional) {#install-postcss}

See [Install PostCSS][].

## Option 1: Docsy as a Git submodule

If you are using Docsy as a
[Git submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules) but would
like to migrate to Hugo Modules, see our
[migration guide](/docs/update/convert-site-to-module/).

### For a new site

To create a **new site** and add the Docsy theme as a Git submodule, run the
following commands:

1.  Create the site:

    ```shell
    hugo new site myproject
    cd myproject
    git init
    ```

2.  Follow the instructions below for an existing site.

### For an existing site

To add the Docsy theme to an **existing site**, run the following commands from
your project's root directory:

1.  Install Docsy as a Git submodule:

    ```sh
    git submodule add https://github.com/docsy/docsy.git themes/docsy
    git -C themes/docsy checkout {{% param tdVersion.latest %}}
    ```

    To work from the development version of Docsy (_not recommended_), run the
    following command instead:

    ```sh
    git submodule add --depth 1 https://github.com/docsy/docsy.git themes/docsy
    ```

2.  Add Docsy as a theme, for example:

    ```sh
    echo 'theme: docsy/theme' >> hugo.yaml
    ```

3.  Get Docsy dependencies:

    ```sh
    (cd themes/docsy && npm run install:theme-deps)
    ```

    > [!NOTE]
    >
    > Run `npm run install:theme-deps`, not `npm install`: `install:theme-deps`
    > installs only the theme's runtime dependencies, lock-pinned and
    > script-free; a plain `npm install` inside `themes/docsy/` also pulls the
    > repository's maintainer workspaces, an install more than an order of
    > magnitude larger.

4.  (Optional but recommended) To avoid having to repeat the previous step every
    time you update Docsy, consider adding [NPM scripts][] like the following to
    your project's `package.json` file:

    ```json
    {
      "...": "...",
      "scripts": {
        "get:submodule": "git submodule update --init --depth 1",
        "_prepare:docsy": "cd themes/docsy && npm run install:theme-deps",
        "prepare": "npm run get:submodule && npm run _prepare:docsy",
        "...": "..."
      },
      "...": "..."
    }
    ```

    Every time you run `npm install` from your project root, the `prepare`
    script restores the submodule at its recorded revision and installs the
    theme's dependencies.

From this point on, build and serve your site with Hugo, run through [npm
scripts][] (see the [prerequisites](#install-dart-sass)), for example:

```sh
npm run hugo -- server
```

## Option 2: Clone the Docsy theme

If you don't want to use submodules (for example, if you want to customize and
maintain your own copy of the theme directly, or your deployment choice requires
you to include a copy of the theme in your repository), you can clone the theme
into your project's `themes` subdirectory.

To clone Docsy at {{% param tdVersion.latest %}} into your project's `themes`
folder, run the following commands from your project's root directory:

```sh
cd themes
git clone -b {{% param tdVersion.latest %}} https://github.com/docsy/docsy
cd docsy
npm run install:theme-deps
```

As with the [submodule option](#option-1-docsy-as-a-git-submodule), set
`theme: docsy/theme` in your site configuration. The note above about
`npm run install:theme-deps` versus `npm install` applies here as well.

To work from the development version of Docsy (not recommended unless, for
example, you plan to upstream changes to Docsy), omit the
`-b {{% param tdVersion.latest %}}` argument from the clone command above.

Then consider setting up an NPM [prepare][] script that installs the theme's
dependencies, like the `_prepare:docsy` script in Option 1's example (the
submodule step doesn't apply to a clone).

For more information, see
[Theme Components](https://gohugo.io/hugo-modules/theme-components/) on the
[Hugo](https://gohugo.io) site.

## Option 3: Docsy as an NPM package

Docsy is published to the npm registry as [`@docsy/theme`][]. To create a new
site that uses the Docsy NPM package:

1.  Create your site:

    ```sh
    hugo new site --format yaml myproject
    cd myproject
    ```

2.  Install Docsy along with the [Dart Sass](#install-dart-sass) compiler, at
    the version Docsy is tested with, and define an npm script for running Hugo:

    ```sh
    npm init -y
    npm install --save-dev @docsy/theme
    npm install --save-exact --save-dev sass-embedded@{{% sass-embedded-version %}}
    npm pkg set scripts.hugo=hugo
    ```

    > [!TIP] Hugo install tip
    >
    > To also install Hugo as an NPM package, see
    > [As an npm module](/docs/get-started/docsy-as-module/installation-prerequisites/#as-an-npm-module).

3.  Add Docsy as your site's theme by including the following in your project's
    `hugo.yaml`:

    ```yaml
    theme: '@docsy/theme'
    themesDir: node_modules
    ```

4.  Build or serve your new site with Hugo, run through [npm scripts][] (see the
    [prerequisites](#install-dart-sass)). For example, build your site as
    follows:

    ```console
    $ npm run hugo
    Start building sites …
    ...
    ```

To update Docsy later, see
[Update your Docsy NPM package](/docs/update/npm-package/).

### Development versions of Docsy

Use only [official Docsy releases][official-support] in production. For Docsy
development or testing, you can also install:

- A pre-release, when one is available, through the `next` [dist-tag][]:

  ```sh
  npm install --save-dev @docsy/theme@next
  ```

- Docsy directly from GitHub:

  ```sh
  npm install --save-dev docsy/docsy
  npm run install:theme-deps --prefix node_modules/docsy
  ```

  This installs the repository's default branch (`main`). To pin a tagged
  version:

  ```sh
  npm install --save-dev docsy/docsy#semver:{{% param tdVersion.latest %}}
  ```

  For other revision selectors, see [npm install][]. The GitHub package is named
  `docsy` and contains the theme files in a subfolder, so with this install form
  use `theme: docsy/theme` in your site configuration. Unlike the registry
  package, the GitHub package doesn't declare Bootstrap and Font Awesome as its
  own dependencies: the `install:theme-deps` command installs them, and must be
  rerun after every install or update of the package, so for `npm ci`
  environments wire it into your site's setup script. GitHub installs also
  resolve outside the npm registry, so registry release gates such as
  `min-release-age` don't apply: a cooldown-gated site can test a pre-release
  this way without touching its gate.

## Preview your site

To preview your site locally, run Hugo through an [npm script][npm scripts] (see
the [prerequisites](#install-dart-sass)):

```sh
cd myproject
npm run hugo -- server
```

By default, your site will be available at <http://localhost:1313>. For common
issues, see [Troubleshooting](/docs/get-started/troubleshooting/). If the build
fails with missing-parameter errors, add the required defaults per
[Basic site configuration](/docs/get-started/basic-configuration/).

## What's next?

- Add some [basic site configuration](/docs/get-started/basic-configuration/)
- [Add content and customize your site](/docs/content/)
- Get some ideas from our [Example Site](https://github.com/docsy/docsy-example)
  and other [Examples and templates](/examples/).
- [Publish your site](/docs/deployment/).

<!-- prettier-ignore-start -->
[`@docsy/theme`]: https://www.npmjs.com/package/@docsy/theme
[dist-tag]: https://docs.npmjs.com/cli/v11/commands/npm-dist-tag/
[hugo-extended]: https://www.npmjs.com/package/hugo-extended
[Install Dart Sass]: /docs/get-started/docsy-as-module/installation-prerequisites/#install-dart-sass
[Install Hugo]: /docs/get-started/docsy-as-module/installation-prerequisites/#install-hugo
[Install Node.js]: /docs/get-started/docsy-as-module/installation-prerequisites/#install-nodejs
[Install PostCSS]: /docs/get-started/docsy-as-module/installation-prerequisites/#install-postcss
[lts release]: https://nodejs.org/en/about/releases/
[npm install]: https://docs.npmjs.com/cli/v11/commands/npm-install#description
[npm scripts]: https://docs.npmjs.com/cli/v10/using-npm/scripts
[official-support]: /project/about/changelog/#official-support
[prepare]: https://docs.npmjs.com/cli/v10/using-npm/scripts#prepare-and-prepublish
<!-- prettier-ignore-end -->
