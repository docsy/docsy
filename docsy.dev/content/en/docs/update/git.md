---
title: Update your Docsy Git submodule or clone
linkTitle: Git submodule or clone
aliases: [/docs/updating/updating-submodules/]
weight: 3
description: >-
  Choose the procedure matching how your project vendors Docsy under `themes/`:
  submodule or clone.
---

> [!TIP]
>
> To simplify future updates, consider switching to the
> [Docsy NPM package](/docs/get-started/other-options/#option-3-docsy-as-an-npm-package)
> or
> [converting your site to Hugo Modules](/docs/update/convert-site-to-module/).

## Update your Docsy submodule

If you are using the
[Docsy theme as a submodule](/docs/get-started/other-options/#option-1-docsy-as-a-git-submodule)
in your project, here's how you update the submodule to the latest release:

1. Navigate to the root of your local project, then update the submodule to the
   release tag that you are targeting, for example:

   ```sh
   git -C themes/docsy fetch --tags
   git -C themes/docsy checkout {{% param tdVersion.latest %}}
   ```

   Stage the update now, before any project tooling re-syncs submodules (the
   parent repo's staged gitlink is the durable pin; an unstaged checkout is
   reset to the old pin on the next `git submodule update`):

   ```sh
   git add themes/docsy
   ```

   If a pin file or other project tooling names the Docsy ref separately, update
   that source of truth too.

2. Reinstall the theme's runtime dependencies:

   ```sh
   npm run install:theme-deps --prefix themes/docsy
   ```

   Run `npm run install:theme-deps`, not `npm install`; for why, see the [setup
   note][theme-deps-note].

3. Commit the staged change to your project:

   ```sh
   git commit -m "Update Docsy theme to {{% param tdVersion.latest %}}"
   ```

4. Push the commit to your project repo.

## Update your Docsy clone

If you
[cloned the Docsy theme](/docs/get-started/other-options/#option-2-clone-the-docsy-theme)
into the `themes` folder in your project, update the clone to the release tag
that you are targeting:

1. Navigate to the root of your local project, then run:

   ```sh
   git -C themes/docsy fetch --tags
   git -C themes/docsy checkout {{% param tdVersion.latest %}}
   ```

   Ensure that `origin` is set to `https://github.com/docsy/docsy.git`
   (`git -C themes/docsy remote -v`).

2. Reinstall the theme's runtime dependencies:

   ```sh
   npm run install:theme-deps --prefix themes/docsy
   ```

   As in the submodule procedure, run `npm run install:theme-deps`, not
   `npm install`.

3. Persist the update to your project, the same way that your project already
   tracks the cloned theme: for example, commit the updated theme files to your
   project repository, or record the new tag where your build restores the clone
   from.

If you have local changes in the cloned theme, commit or stash them first:
checking out a tag fails on uncommitted changes, and detaches `HEAD` from any
local branch. After checking out the new tag, reapply your changes (for example,
`git stash pop`, or rebase your branch onto the tag), resolving any conflicts.

After updating the theme, continue with the remaining update steps, starting
with [Review your theme overrides](/docs/update/#update-overrides).

<!-- prettier-ignore-start -->
[theme-deps-note]: /docs/get-started/other-options/#for-an-existing-site
<!-- prettier-ignore-end -->
