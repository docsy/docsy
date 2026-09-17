---
title: 'Create a new site: start with a prepopulated site'
linkTitle: Start with a prepopulated site
description: >
  Clone the example site and adapt it: a ready-made site structure with a pinned
  toolchain.
weight: 2
---

The [Docsy example site](https://github.com/docsy/docsy-example) gives you a
skeleton structure for your site, with top-level and documentation sections and
templates that you can modify as necessary.

If you prefer to create a site from scratch, follow [Start a site from
scratch][start-from-scratch].

## TL;DR: Setup for the impatient expert

With the [prerequisites][] installed (on Windows, including Bash on your
`PATH`), run:

```bash
git clone --depth 1 --branch {{% param tdVersion.latest %}} https://github.com/docsy/docsy-example.git my-new-site
cd my-new-site
npm run install:safe
npm run serve
```

Preview at <http://localhost:1313/>. If the build fails, see
[Troubleshooting][].

## Detailed Setup instructions

### Clone the Docsy example site

There are two routes to get a local clone of the example site:

#### Option 1: Using the command line (local copy only)

For a local copy or a non-GitHub remote, clone the released example site, giving
your chosen local repo name (here: `my-new-site`) as the last parameter:

```bash
git clone --depth 1 --branch {{% param tdVersion.latest %}} https://github.com/docsy/docsy-example.git my-new-site
```

#### Option 2: Using the GitHub UI (local copy + associated GitHub repo)

The example site is a [template repository][], so you can generate your own
GitHub repository from it. Note that a template copies the example site's
default branch (`main`), which can be ahead of the latest release; for a
release-pinned start, use option 1.

1. Go to the repo of the
   [Docsy example site](https://github.com/docsy/docsy-example).

1. Click the button **Use this template** and select the option
   `Create a new repository` from the dropdown.

1. Choose a name for your new repository (e.g. `my-new-site`) and type it in the
   **Repository name** field. You can also add an optional **Description**.

1. Click **Create repository from template** to create your new repository.

1. Make a local copy of your newly created GitHub repository by using
   `git clone`, giving your repo's web URL as last parameter.

   ```bash
   git clone https://github.com/me-at-github/my-new-site.git
   ```

> [!NOTE]
>
> Depending on your environment you may need to tweak the
> [module top-level settings](https://gohugo.io/configuration/module/#top-level-settings)
> in your `hugo.yaml` slightly, for example by adding a proxy to use when
> downloading remote modules.

### Preview your site

To build and preview your site locally, switch to the root of your cloned
project, install the project dependencies, and serve the site:

```bash
cd my-new-site
npm run install:safe
npm run serve
```

Preview at <http://localhost:1313/>. Hugo reloads the preview as you edit. Press
`Ctrl + c` to stop the server. If the build fails, see [Troubleshooting][].

## What's next?

- Add some [basic configuration](/docs/get-started/basic-configuration/)
- [Edit existing content and add more pages](/docs/content/)
- [Customize your site](/docs/content/lookandfeel/)
- [Publish your site](/docs/deployment/).

<!-- prettier-ignore-start -->
[prerequisites]: /docs/get-started/docsy-as-module/installation-prerequisites/
[start-from-scratch]: /docs/get-started/docsy-as-module/start-from-scratch/
[template repository]: https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template
[Troubleshooting]: /docs/get-started/troubleshooting/
<!-- prettier-ignore-end -->
