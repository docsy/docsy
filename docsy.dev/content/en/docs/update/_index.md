---
title: Update Docsy
description: Theme updates for every install mode, plus Node.js and Hugo
aliases: [/docs/updating/]
weight: 8
---

These pages apply to Docsy {{% param version %}} and compatible versions, and
**target release** refers to the Docsy version that you are updating your site
to. For what changed in a given release, and any release-specific upgrade
actions, see the [upgrade blog posts](/tags/upgrade/).

## Before you begin

- **Backup or safeguard your project's current state**: for example, work from a
  Git branch, merging only after [checking your site](#check), or back up your
  project files first. Rolling back is then a simple restore.
- **Updating across more than one release?** Apply each release's
  [upgrade post](/tags/upgrade/) in turn, oldest first: each post assumes you
  are coming from the release just before it, unless stated otherwise.

## Order of steps {#update-order}

Perform the update steps in the order given by this page:

1. [Node.js](#update-node), [Hugo](#update-hugo), and any other build
   prerequisite that your target release calls for
2. [The theme](#update-theme), by install mode
3. [Review your theme overrides](#update-overrides)
4. [Check your site](#check)

## Update Node.js {#update-node}

**Applies if** your target release names a newer Node.js version than your
project uses; its upgrade [blog post](/tags/upgrade/) says so. With [nvm][],
install and select that version, for example:

```sh
nvm install NODE_VERSION
```

Replace _`NODE_VERSION`_ with the version that the upgrade post names.

## Update Hugo

**Applies if** your site builds with a Hugo other than your target release's
supported version, the one its upgrade [blog post](/tags/upgrade/) names
([official support policy][]). For projects using the [hugo-extended NPM
package][hugo-extended], update the package version, for example:

```sh
npm install --save-exact --save-dev hugo-extended@HUGO_VERSION
```

Replace _`HUGO_VERSION`_ with the version that the upgrade post names.

After updating, also refresh any CI/CD cache keys so that builds don't reuse a
cached Hugo.

## Update the theme {#update-theme}

How you update the theme depends on the way that Docsy is installed in your
project. Follow the page matching your install mode:

- [Hugo module](hugo-module/)
- [NPM package](npm-package/)
- [Git submodule or clone](git/)

The remaining update steps apply to all install modes.

## Review your theme overrides {#update-overrides}

If your project [overrides theme files][hugo-override], then after updating,
diff each override against its new theme counterpart and port upstream changes
as needed. Look for overrides in your project's:

- `assets/`
- `data/`
- `i18n/`
- `layouts/`, the most common location
- `static/`, where a copy of a file that the release moved elsewhere keeps being
  published, unused and unwarned; the upgrade post names the moved files

Docsy's [project style files][lookandfeel] (`_variables_project.scss` and
friends) also work this way, but the theme's copies are placeholders that are
intentionally empty: there's nothing to diff, so they don't need this review.

If you override a `baseof.html` template, keep its `scripts.html` include as
`partial`, not `partialCached`: Docsy's per-page scripts (page-gated diagrams
and math, the `body-end` hook) depend on the partial rendering per page.

## Check your site {#check}

After updating, build or serve your site and check for errors and warnings. We
recommend building both development and production versions of your site, since
they can differ in their configuration, minification, etc.

Use this checklist as a guide to verify that your update succeeded:

- [ ] Build completes without warnings or deprecation notices
- [ ] Key pages load and have proper layout, for example the site home, a doc
      page, and a blog post. On each page:
  - [ ] Browser console shows no errors
  - [ ] Nav links resolve; breadcrumbs show current path; current section is
        highlighted
  - [ ] External links show expected styling (for example, icon)
  - [ ] [Heading self-links][] work and are styled correctly
  - [ ] On mobile or tablet: navigation is usable and there is no horizontal
        scroll
- [ ] Dark mode toggle works, if enabled
- [ ] Custom shortcodes render correctly, if used
- [ ] Search returns expected results, if used
- [ ] Print preview looks correct, if used

Also perform any release-specific checks listed in the release's
[upgrade blog post](/tags/upgrade/).

<!-- prettier-ignore-start -->
[Heading self-links]: /docs/content/navigation/#heading-self-links
[hugo-extended]: /docs/get-started/docsy-as-module/installation-prerequisites/#as-an-npm-module
[hugo-override]: https://gohugo.io/getting-started/directory-structure/#theme-skeleton
[lookandfeel]: /docs/content/lookandfeel/#project-style-files
[nvm]: https://github.com/nvm-sh/nvm/blob/master/README.md#installing-and-updating
[official support policy]: /project/about/changelog/#official-support
<!-- prettier-ignore-end -->
