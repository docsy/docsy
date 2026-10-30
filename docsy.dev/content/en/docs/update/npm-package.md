---
title: Update your Docsy NPM package
linkTitle: NPM package
aliases: [/docs/updating/updating-npm-package/]
weight: 2
description: >-
  Update Docsy with `npm install`, for sites that use the `@docsy/theme`
  package.
---

Update the theme to the release you are targeting, named explicitly, by running
the following from your project root:

```sh
npm install --save-dev @docsy/theme@{{% param tdVersion.latest %}}
```

> [!NOTE]
>
> Prefer an exact version over the `latest` dist-tag: under npm's
> `min-release-age`, `@latest` silently resolves to the newest release that is
> old enough, so you can end up one release behind without any warning. An exact
> version fails visibly instead (`ETARGET`, though the error doesn't name the
> age gate as the cause). To install a release younger than your gate, wait out
> the window, or run the update under a one-off override, noting it in your
> update PR:
>
> ```sh
> NPM_CONFIG_MIN_RELEASE_AGE=RELEASE_AGE_DAYS npm install --save-dev @docsy/theme@VERSION
> ```
>
> where _`RELEASE_AGE_DAYS`_ is the release's age in whole days (set it no lower
> than needed) and _`VERSION`_ is the release you are installing.

To verify the resolved version of [`@docsy/theme`][npm-package-setup], run:

```sh
npm ls @docsy/theme --depth=0
```

If your site installs Docsy [from GitHub with npm][github-npm] (a mode reserved
for Docsy development and testing), update by re-running the install command
with the desired [revision selector][github-npm], then re-run the
`install:theme-deps` command as shown there.

After updating the theme, continue with the remaining update steps, starting
with [Review your theme overrides](/docs/update/#update-overrides).

<!-- prettier-ignore-start -->
[github-npm]: /docs/get-started/other-options/#development-versions-of-docsy
[npm-package-setup]: /docs/get-started/other-options/#option-3-docsy-as-an-npm-package
<!-- prettier-ignore-end -->
