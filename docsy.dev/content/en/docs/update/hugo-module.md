---
title: Update your Docsy Hugo Module
linkTitle: Hugo module
aliases: [/docs/updating/updating-hugo-module/]
weight: 1
description: >-
  Update Docsy with `hugo mod get`, for sites that manage the theme as a Hugo
  Module.
---

At the command prompt, change to the root directory of your existing site.

```bash
cd /path/to/my-existing-site
```

Then invoke Hugo's module `get` subcommand with the update flag:

```bash
hugo mod get -u github.com/docsy/docsy/theme
```

Hugo automatically pulls in the latest theme version.

> [!TIP]
>
> To pin the theme to a specific version, specify its tag when updating, for
> example:
>
> ```bash
> hugo mod get github.com/docsy/docsy/theme@{{% param tdVersion.latest %}}
> ```
>
> Instead of a version tag, you can also specify a commit hash, replacing
> _`COMMIT_HASH`_:
>
> ```bash
> hugo mod get github.com/docsy/docsy/theme@COMMIT_HASH
> ```

After updating the theme, tidy your module files, refresh the generated [theme
npm dependencies][] workspace, and reinstall it:

```bash
hugo mod tidy
hugo mod npm pack
npm install
```

Hugo warns at build time when the generated workspace's dependency set has
drifted from the theme's. To verify the resolved version, run:

```sh
hugo mod graph
```

Confirm that it lists `github.com/docsy/docsy/theme` at the version you expect.

After updating the theme, continue with the remaining update steps, starting
with [Review your theme overrides](/docs/update/#update-overrides).

<!-- prettier-ignore-start -->
[theme npm dependencies]: /docs/get-started/docsy-as-module/start-from-scratch/#install-theme-npm-dependencies
<!-- prettier-ignore-end -->
