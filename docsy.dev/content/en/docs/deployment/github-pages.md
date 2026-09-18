---
title: Deployment on GitHub Pages
linkTitle: GitHub Pages
description: Deploying your Docsy site to GitHub Pages.
cSpell:ignore: peaceiris
---

If your repo is hosted on [GitHub](https://github.com), a simple option is to
serve your site with [GitHub Pages][]. GitHub Pages lets you create project,
user, and organization sites; for a project site, your site URL will be
`http(s)://<username>.github.io/<repository_name>`, custom domains are also
supported. GitHub Pages come with [continuous deployment][cd] using GitHub
actions, while the [marketplace for actions][] has useful tools for spell and
link checking, deploy previews, and more. Using your existing GitHub account,
you can start by using the free plan for publicly available repositories, with
premium tiers available for business use cases.

The Docsy example site repo provides a [workflow file][] that you can use when
deploying to GitHub Pages. If you used the [example site as template][] for your
new site you may already have this file in your repo, if not the instructions
below show you how to create your own workflow file.

Before deploying on GitHub Pages, make sure that you've pushed your site source
to your chosen GitHub repo, following any setup instructions in
[Using the theme](/docs/get-started/docsy-as-module), and that your site's
`package.json` declares `sass-embedded` and a `hugo` script, per
[Install Dart Sass](/docs/get-started/docsy-as-module/installation-prerequisites/#install-dart-sass).

> [!NOTE] Correct baseURL setting
>
> Make sure to correctly set your site's `baseURL`, either via hugo's
> `--baseURL '…'` command line parameter or inside your
> `hugo.toml`/`hugo.yaml`/`hugo.json` configuration file. When deploying to
> GitHub pages your `baseURL` needs to be set to
> `https://<USERNAME>.github.io/<repository_name>`, otherwise your site layout
> will be broken.

1. With GitHub Pages, a site is published to the branch `gh-pages` and served
   from there by default. You must create this branch first, either in the
   GitHub web interface or via command line (at the root of your local repo
   clone):

   ```console
   $ git checkout -b gh-pages
   Switched to a new branch 'gh-pages'
   ```

1. Push this local branch to your repo:

   ```console
   $ git push --set-upstream origin gh-pages
    details omitted …
    * [new branch]      new -> new
   branch 'gh-pages' set up to track 'origin/gh-pages'.
   ```

1. Switch back to the `main` (or `work`) branch of your repo:

   ```console
   $ git checkout main
   Switched to branch 'main'

   ```

1. Check if you already have the workflow file
   `.github/workflows/deploy-github-pages.yml` in your repo. If this file
   doesn't exist, do the following:
   1. Create a new empty workflow file from the root of your repo, as follows:

      ```console
      $ mkdir -p .github/workflows
      $ touch .github/workflows/deploy-github-pages.yml
      ```

   1. Open the file in an editor of your choice, paste in the code below, and
      save the file:

      ```yaml
      name: Deployment to GitHub Pages

      on:
        workflow_dispatch:
        push:
          branches:
            - main # <-- specify the branch you want to deploy from
        pull_request:

      env:
        REPO_NAME: ${{ github.event.repository.name }}
        REPO_OWNER: ${{ github.repository_owner }}

      jobs:
        deploy:
          runs-on: ubuntu-22.04
          concurrency:
            group: ${{ github.workflow }}-${{ github.ref }}
          steps:
            - uses: actions/checkout@v4
              with:
                fetch-depth: 0 # Fetch all history for .GitInfo and .Lastmod

            - name: Setup Hugo
              uses: peaceiris/actions-hugo@v3
              with:
                hugo-version: '{{% hugo-version %}}'
                extended: true

            - name: Setup Node
              uses: actions/setup-node@v4
              with:
                node-version: '24'
                cache: 'npm'
                cache-dependency-path: '**/package-lock.json'

            - run: npm ci
            - run: |
                npm run hugo -- --minify --baseURL "https://${REPO_OWNER}.github.io/${REPO_NAME}"

            - name: Deploy
              uses: peaceiris/actions-gh-pages@v4
              if: ${{ github.ref == 'refs/heads/main' }} # <-- specify same branch as above here
              with:
                github_token: ${{ secrets.GITHUB_TOKEN }}
      ```

   1. Add the file to the staging area, commit your change and push the change
      to your remote GitHub repo:

      ```console
      $ git add .github/workflows/deploy-github-pages.yml
      $ git commit -m "Adding workflow file for site deployment"
      $ git push origin
      ```

1. In your browser, make sure you are logged into your GitHub account. In your
   repo **Settings**, select **Pages**.
   1. Under **Build and deployment**, select **Deploy from a branch** in the
      **source** dropdown.

   2. From the **branch** dropdown, select **gh-pages** as branch where the site
      is built from.

   3. From the **folder** dropdown, select **/(root)** as root directory.

That's it! Your deployment workflow for your site is configured.

Any future push to the branch specified in your workflow file will now trigger
the action workflow defined in the workflow file. Additionally, you can trigger
the deployment manually by using GitHub web UI.

Once you push to your repo, you can see the progress of the triggered workflow
in the **Actions** tab of the GitHub web UI:

```
URL 'Repo actions': https://github.com/<username>/<repository_name>/actions
```

After the first successful deployment, a new environment `github-pages` is added
to your repo. This is shown at the right of your repo main view (below
**Releases** and **Packages**). When you click on this environment, a list of
deployments is displayed:

```
URL 'Repo deployments': https://github.com/<username>/<repository_name>/deployments/
```

You can find out more in
[Hosting on GitHub](https://gohugo.io/hosting-and-deployment/hosting-on-github/)
in the Hugo documentation.

For advanced use cases, the
[`hugo-action`](https://github.com/peaceiris/actions-hugo) used inside the
workflow file has more configuration options, which are well
[documented](https://github.com/marketplace/actions/hugo-setup).

[GitHub Pages]:
  https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages
[cd]:
  https://docs.github.com/en/actions/deployment/about-deployments/about-continuous-deployment
[marketplace for actions]:
  https://github.com/marketplace?link-check=no&type=actions
[workflow file]:
  https://github.com/docsy/docsy-example/blob/main/.github/workflows/deploy-github-pages.yml?link-check=no
[example site as template]:
  /docs/get-started/docsy-as-module/example-site-as-template/
