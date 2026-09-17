# Get started

> Learn how to get started with Docsy, including the available options for installing and using the Docsy theme.

---

LLMS index: [llms.txt](/llms.txt)

---

As you saw in our introduction, Docsy is a [Hugo](https://gohugo.io) theme,
which means that if you want to use Docsy, you need to set up your website
source so that the Hugo static site generator can find and use the Docsy theme
files when building your site. The simplest way to do this is to copy and edit
our example site, though we also provide instructions for adding the Docsy theme
manually to new or existing sites.

If you want to build and test your site locally you also need to be able to run
Hugo itself, by installing it and any other required dependencies.

This page describes Docsy's installation options and helps you choose the
appropriate setup guide to get started.

## Installation options

Hugo offers multiple options for using themes, all of which are supported by
Docsy.

- **Adding the theme as an NPM package**: Docsy is published to the npm registry
  as [`@docsy/theme`](https://www.npmjs.com/package/@docsy/theme). If your
  project already uses npm, this option keeps the toolchain npm-only: you
  install and update the theme, and the required
  [Dart Sass compiler](/docs/get-started/docsy-as-module/installation-prerequisites/#install-dart-sass),
  like any other npm dependency. For instructions, see
  [Docsy as an NPM package](/docs/get-started/other-options/#option-3-docsy-as-an-npm-package).
- **Adding the theme as a Hugo Module**:
  [Hugo Modules](https://gohugo.io/hugo-modules/) are the simplest and latest
  way to use Hugo themes. Hugo uses the modules mechanism to pull in the theme
  files from the main Docsy repo at your chosen revision, and it's easy to keep
  the theme up to date in your site. Our
  [example site](https://github.com/docsy/docsy-example) uses Docsy as a Hugo
  Module.
- **Adding the theme as a Git submodule**: Adding the theme as a
  [Git submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules) also lets
  Hugo use the theme files from their own repo, though is more complicated to
  maintain than the Hugo modules approach. This is the approach used in older
  versions of the Docsy example site and is still supported.
- **Cloning the theme files**: If you don't want Hugo to have to get the theme
  files from an external repo (for example, if you want to customize and
  maintain your own copy of the theme directly, or your deployment choice
  requires you to include a copy of the theme in your repository), you can clone
  the files directly into your site source.

## Migration and backward compatibility

If you have an existing site that uses Docsy as a Git submodule, and you would
like to update it to use Hugo Modules, follow our
[migration guide](/docs/update/convert-site-to-module/). If you're not ready to
migrate yet, don't worry! Your site will continue to work as usual.

## Setup guides

Follow the setup guide for your chosen approach. If you're new to Docsy and not
sure which guide to follow, we recommend following the Use Docsy as a Hugo
Module guide as a simple and easily maintained option.

---

Section pages:

- [Use Docsy as a Hugo Module](/docs/get-started/docsy-as-module/): Learn how to get started with Docsy by using the theme as a Hugo Module.
- [Other setup options](/docs/get-started/other-options/): Install Docsy as a Git submodule, a clone, or the @docsy/theme npm package, for sites not using Hugo modules.
- [Basic site configuration](/docs/get-started/basic-configuration/): Basic configuration for new Docsy sites.
- [Troubleshooting and known issues](/docs/get-started/troubleshooting/): Build failures from missing dependencies and platform constraints
