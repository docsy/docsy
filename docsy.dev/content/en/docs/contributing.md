---
title: Contribution guidelines
description: >-
  Contributor agreements, pull requests, and previews for theme and
  documentation changes
aliases: [contribution-guidelines]
weight: 9
---

> [!CAUTION] A note for **students** and **prospective mentees**
>
> We welcome your contributions but note that:
>
> - We cannot guarantee _when_ your [pull requests][pr] (PRs) will be reviewed.
> - Review does not guarantee acceptance or merging.
> - We may reject PRs with content (e.g., AI-generated) that does not meet our
>   quality standards.

<!-- markdownlint-disable-next-line no-blanks-blockquote -->

> [!NB] Maintainers, see [Maintainer notes](/project/about/maintainer-notes/).

## Before you start

- **Contributor License Agreement**: Docsy contributions require the [CNCF
  CLA][cncf-cla], enforced on every PR through [EasyCLA][].
- **Code of conduct**: this project follows the [LF Projects Code of Conduct][].
- **Code reviews**: all submissions, including those from project members, are
  reviewed as [pull requests][pr].

## Report a vulnerability

Report it privately, as the [security policy][] describes.

## Make a change

To request a feature or report a problem, [open an issue][issues]. For a page of
this guide, **Create documentation issue** at the top right opens one titled
after the page.

The Docsy repo is a [monorepo][], with the theme in `theme/` and this guide in
`docsy.dev/`. Fork it and open a pull request, as a draft when you're not ready
for review. For a page of this guide, **Edit this page** opens its source in
your fork, ready for a pull request.

Every pull request gets a Netlify deploy preview (the **Details** link of its
deploy-preview check). A theme can't be served on its own: locally, [build this
guide][local-build], which uses the repo's own theme, or test a theme change
through the example site [against your local Docsy][local-docsy].

Follow the [style guide][], and run the [checks][] before pushing.

<!-- prettier-ignore-start -->
[checks]: /project/build/ci-cd/#formatting-and-lint-checks
[cncf-cla]: https://github.com/cncf/cla
[EasyCLA]: https://docs.linuxfoundation.org/lfx/easycla/v2-current/contributors
[issues]: https://github.com/docsy/docsy/issues
[LF Projects Code of Conduct]: https://lfprojects.org/policies/code-of-conduct/
[local-build]: /project/build/git-repo/#local-build
[local-docsy]: https://github.com/docsy/docsy-example/blob/main/CONTRIBUTING.md#develop-against-a-local-docsy
[monorepo]: /project/build/git-repo/#monorepo
[pr]: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request
[security policy]: https://github.com/docsy/docsy/security/policy
[style guide]: /project/style-guide/
<!-- prettier-ignore-end -->
