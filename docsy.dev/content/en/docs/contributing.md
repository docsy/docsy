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
  Contributor License Agreement][cncf-cla], enforced on every PR through
  [EasyCLA][].
- **Code of conduct**: this project follows the [LF Projects Code of Conduct][].
- **Code reviews**: all submissions, including those from project members, are
  reviewed as [pull requests][pr].

## Making a change

To request a feature or report a problem, [open an issue][issues]; for a page of
this guide, **Create documentation issue** at the top right opens one titled
after the page.

The Docsy repo is a [monorepo][], with the theme in `theme/` and this guide in
`docsy.dev/`. Fork it and open a pull request, as a draft when you're not ready
for review. For a page of this guide, **Edit this page** at the top right opens
its source in your fork, ready for a pull request.

Every pull request gets a Netlify deploy preview (the check's **Details** link).
Locally, a theme can't be served on its own: test through the [example
site][dex] [against your local Docsy][dex-local], or [build this guide
locally][Local build], which uses the repo's own theme.

Before pushing, run the [checks][]; writing conventions are in the [style
guide][].

<!-- prettier-ignore-start -->
[checks]: /project/build/ci-cd/#formatting-and-lint-checks
[cncf-cla]: https://github.com/cncf/cla
[dex]: https://github.com/docsy/docsy-example
[dex-local]: https://github.com/docsy/docsy-example/blob/main/CONTRIBUTING.md#develop-against-a-local-docsy
[EasyCLA]: https://docs.linuxfoundation.org/lfx/easycla/v2-current/contributors
[issues]: https://github.com/docsy/docsy/issues
[LF Projects Code of Conduct]: https://lfprojects.org/policies/code-of-conduct/
[Local build]: /project/build/git-repo/#local-build
[monorepo]: /project/build/git-repo/#monorepo
[PR]: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request
[style guide]: /project/style-guide/
<!-- prettier-ignore-end -->
