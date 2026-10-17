---
title: Before you begin
date: 2021-12-08
weight: 1
description: >
  Hugo, Dart Sass, Go, Git, Node.js, and optional PostCSS requirements for Docsy
  sites
---

> [!NOTE]
>
> The [example site](example-site-as-template/)'s pinned npm dependencies, like
> the Docsy repo's own, provide Hugo and Dart Sass. For either, skip those
> sections: install only [Git](#install-git-vcs-client) and
> [Node.js](#install-nodejs), plus [Go](#install-go-language) for the example
> site. On Windows, also ensure that Bash is on your `PATH`: the npm scripts run
> under Bash, which ships with [Git for Windows](https://gitforwindows.org/).

## Install Hugo

You need a recent **extended** version of [Hugo](https://gohugo.io/), version
{{% param "hugoMinVersion" %}} or later, to build and preview sites that use
Docsy. Check your version, and ensure that the output mentions `extended`:

```bash
hugo version
```

To install or upgrade, see [Install Hugo](https://gohugo.io/installation/). If
you install from the [Hugo releases](https://github.com/gohugoio/hugo/releases)
page, pick an **extended** asset; you may need to scroll down the list of
releases to see it.

For the tool versions that Docsy officially supports, see
[Official support](/project/about/changelog/#official-support).

### As an `npm` module

You can conveniently install any Hugo version using [hugo-extended][] (replace
`latest` with the version you want to install):

```bash
npm install hugo-extended@latest --save-dev
```

## Install Dart Sass

This section applies to all [installation options](/docs/get-started/), not just
Hugo-module setups.

Hugo compiles Docsy's [SCSS][] using the [Dart Sass][] transpiler, which Hugo
looks up as the `sass` CLI on its `PATH`. For npm-based sites, install the
[`sass-embedded`][sass-embedded] package from your project root, at the version
Docsy is tested with:

```bash
npm install --save-exact --save-dev sass-embedded@{{% sass-embedded-version %}}
```

> [!NOTE]
>
> Installing `sass-embedded` also adds [`@parcel/watcher`][], an install-script
> package, to your lockfile: it arrives through the optional pure-JS fallback
> and is never installed or run on platforms with a prebuilt `sass-embedded`
> binary. Projects that review or gate install scripts can deny it.

The `sass` CLI is then on `PATH` for every npm-run script, so run Hugo through
[npm scripts][]. For example, with the following in your `package.json`:

```json
{
  "scripts": {
    "hugo": "hugo"
  }
}
```

run any Hugo command as `npm run hugo -- ARGS`, for example
`npm run hugo -- server` to serve your site locally.

For non-npm setups, see [Hugo's Dart Sass installation guide][hugo-dart-sass].
For the officially supported Dart Sass version, see
[Official support](/project/about/changelog/#official-support).

## Install Go language

Hugo's module management requires the [Go language](https://go.dev/), version
1.18 or later, per
[Hugo's requirements](https://gohugo.io/hugo-modules/use-modules/). Check your
version:

```console
$ go version
go version go1.25.6
```

To install or upgrade Go, use the [Go download page](https://go.dev/dl/).

## Install Git VCS client

Hugo's module management also requires the [Git](https://git-scm.com/) client.
Check your version:

```console
$ git version
git version 2.52.0
```

To install or upgrade Git, use the
[Git download page](https://git-scm.com/downloads).

## Install Node.js

Docsy sources its Bootstrap and Font Awesome assets from npm, so you need
[Node.js](https://nodejs.org/) (which provides `npm`, the Node package manager)
to install them. Install or upgrade to the active [long-term support (LTS)
release][node-lts] (consider using [nvm][] to install and manage Node versions),
then check your version:

```bash
node -v
```

## Install PostCSS (optional) {#install-postcss}

This section applies to all [installation options](/docs/get-started/), not just
Hugo-module setups.

Docsy builds its CSS without [PostCSS](https://postcss.org/) by default -- the
shipped CSS targets the [Browserslist `defaults`][browserslist-defaults]
browsers -- so most sites don't need it. Install PostCSS only if:

- Your site has a **[right-to-left (RTL)][rtl]** language, or
- You post-process your own CSS with a project-root
  `postcss.config.{js,mjs,cjs}` file.

If either applies, install PostCSS from your project root:

```bash
npm install --save-dev autoprefixer postcss-cli
```

> [!NOTE]
>
> npm also installs [postcss][] itself, as a peer dependency of the packages
> listed above. If you use a package manager that doesn't auto-install peer
> dependencies, such as Yarn, add `postcss` to the install command.

## What's next?

With all prerequisites installed, choose how to start off with your new Hugo
site

- [Start with a prepopulated site (for beginners)](example-site-as-template/)
- [Start site from scratch (for experts)](start-from-scratch/)

<!-- prettier-ignore-start -->
[`@parcel/watcher`]: https://www.npmjs.com/package/@parcel/watcher
[browserslist-defaults]: https://github.com/browserslist/browserslist
[dart sass]: https://sass-lang.com/dart-sass/
[hugo-dart-sass]: https://gohugo.io/functions/css/sass/#dart-sass
[hugo-extended]: https://www.npmjs.com/package/hugo-extended
[node-lts]: https://nodejs.org/en/about/releases/
[npm scripts]: https://docs.npmjs.com/cli/v11/using-npm/scripts
[nvm]: https://github.com/nvm-sh/nvm/blob/master/README.md#installing-and-updating
[postcss]: https://www.npmjs.com/package/postcss
[rtl]: /docs/language/#right-to-left-languages
[sass-embedded]: https://www.npmjs.com/package/sass-embedded
[SCSS]: https://sass-lang.com/documentation/file.SCSS_FOR_SASS_USERS.html
<!-- prettier-ignore-end -->
