# Docsy

[![npm version][npm-badge]][npm-package]

<!-- markdownlint-disable no-docsy-dev-external-urls -->

Docsy is a [Hugo](https://gohugo.io) theme for technical documentation sets,
providing simple navigation, site structure, and more.

This is not an officially supported Google product. This project is actively
being maintained.

> [!IMPORTANT] 🚧 IMPORTANT 🚧
>
> The `main` branch is under development and not officially supported; use
> official Docsy [releases][]. For full support details, see [Official support
> limits][official-support].

## Prerequisites

The following are basic prerequisites for using Docsy in your site:

- Install a recent release of the Hugo "extended" version. If you install from
  the [Hugo release page](https://github.com/gohugoio/hugo/releases), make sure
  you download the `extended` version.

- Provide the [Dart Sass](https://sass-lang.com/dart-sass/) compiler, which Hugo
  looks up as the `sass` CLI on its `PATH`. For instructions, see the **Install
  Dart Sass** section of the
  [installation prerequisites](https://www.docsy.dev/docs/get-started/docsy-as-module/installation-prerequisites/).

- Install `PostCSS` so that the site build can create the final CSS assets. You
  can install it locally by running the following commands from the root
  directory of your project:

  ```sh
  npm install --save-dev autoprefixer
  npm install --save-dev postcss-cli
  ```

  Starting in
  [version 8 of `postcss-cli`](https://github.com/postcss/postcss-cli/blob/master/CHANGELOG.md),
  you must also separately install `postcss`:

  ```sh
  npm install -D postcss
  ```

Any additional prerequisites depend on the
[installation option](https://www.docsy.dev/docs/get-started/#installation-options)
you choose. We recommend using Docsy as a Hugo module, which requires that you
have the Go language installed in addition to Hugo and PostCSS.

For complete prerequisites and instructions, see our
[Get started guides](https://www.docsy.dev/docs/get-started/).

## Example and usage

You can find an example project that uses Docsy in the
[Docsy Example Project repo](https://github.com/docsy/docsy-example).The Docsy
Example Project is hosted at [example.docsy.dev](https://example.docsy.dev). For
real-life examples of sites that use Docsy (and their source repos), see our
[Examples and templates](https://www.docsy.dev/examples/) page.

To use the Docsy theme for your own site:

- (Recommended) Use the
  [example project](https://github.com/docsy/docsy-example), which includes the
  Docsy theme as a Hugo module, as a template to create your project. You can
  customize this pre-configured basic site into your own Docsy themed site.
  [Learn more...](https://github.com/docsy/docsy-example)

- Add Docsy to your existing Hugo site. You can add Docsy as an NPM package, as
  a Hugo module, as a Git submodule, or clone the Docsy theme into your project.

See the [Get started guides](https://www.docsy.dev/docs/get-started/) for
details about the various usage options.

## Documentation

Docsy has its own user guide (using Docsy, of course!) with lots more
information about using the theme. It is hosted by [Netlify][] at
[docsy.dev](https://docsy.dev/).

**Maintainers**: you can access deploy logs, the [deploy preview of
`main`][main-preview], and more from the [Deploys][] section of the site's
Netlify dashboard.

Alternatively you can use Hugo to generate and serve a local copy of the guide
(also useful for testing local theme changes), making sure you have installed
all the prerequisites listed above:

```sh
git clone --depth 1 https://github.com/docsy/docsy.git
cd docsy
npm run install:safe
npm run serve
```

npm scripts in this repo run under Bash on every platform (`script-shell` pin in
`.npmrc`): on Windows, make sure Git Bash's `bash` is on your `PATH`.

## Contributing

For details on our [code of conduct][] and the process for submitting pull
requests, see [CONTRIBUTING.md][].

Please see the [Technical Charter][] for additional information on governance
and contribution guidelines.

Thank you to all past, present, and future [contributors][]!

## License

This project is licensed under the Apache License 2.0, see
[LICENSE](https://github.com/docsy/docsy/blob/main/LICENSE) for details.

[code of conduct]:
  https://github.com/google/.github/blob/master/CODE_OF_CONDUCT.md
[CONTRIBUTING.md]: https://github.com/docsy/docsy/blob/main/CONTRIBUTING.md
[contributors]: https://github.com/docsy/docsy/graphs/contributors
[deploys]: https://app.netlify.com/sites/docsydocs/deploys
[main-preview]: https://main--docsydocs.netlify.app/
[netlify]: https://netlify.com
[npm-badge]: https://img.shields.io/npm/v/%40docsy%2Ftheme
[npm-package]: https://www.npmjs.com/package/@docsy/theme
[official-support]:
  https://www.docsy.dev/project/about/changelog/#official-support
[releases]: https://github.com/docsy/docsy/releases
[Technical Charter]:
  https://github.com/docsy/docsy/blob/main/docsy-technical-charter.pdf

<!-- cSpell:ignore docsy -->
