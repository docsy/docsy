---
title: CI/CD
---

## Agent-support checks

The site has an [AFDocs][] configuration and npm script to generate a scorecard
locally:

- Config: [docsy.dev/agent-docs.config.yml][]
- Script: `_check:afdocs` in [docsy.dev/package.json][]

To generate a fresh scorecard, run each of these commands in separate terminals:

```sh
npm run serve
npm run check:afdocs:dev
```

The latter command saves the generated scorecard to
`docs/content/agent-support/afdocs-scorecard.txt` under `docsy.dev/content/en`,
which will be included in [Scorecard examples][] on the next build.

Note that the scorecard generation is not run as a part of the full CI/CD
pipeline. It needs to be run manually.

Read more: [AFDocs config file format][afdocs-config].

## Formatting and lint checks

[Prettier][] formats Docsy and the website files, and Markdownlint lints the
Markdown. To run the checks, or to apply automatic fixes:

```sh
npm run check
npm run fix
```

CI runs `npm run test:full`: these checks, then the website and repo [test
suites][].

### Hugo shortcodes

Prettier reformats the body of a paired Hugo shortcode, so wrap it:

```go-html-template
<!-- prettier-ignore-start -->
{{</* tabpane */>}}
...
{{</* /tabpane */>}}
<!-- prettier-ignore-end -->
```

### Workaround for `i18n` files

The translation files in the `i18n` directory are formatted using Prettier. But
Prettier removes the blank line before the `# Feedback` section heading. This
seems to be a known issue, for example see:

- [Bug: Inconsistent newline formatting in YAML when changing scopes
  #15528][#15528]
- [Bug: New Line before comments at end of YAML files are removed
  #15720][#15720]

We've worked around this bug, and avoided using `prettier-ignore` directives, by
formatting the preceding entry in the YAML file to be a block scalar, like this:

```yaml
community_guideline: >-
  Contribution Guidelines
```

This ensures that the blank line is preserved. Hopefully Prettier will be fixed
and we'll be able to remove this hack.

<!-- prettier-ignore-start -->
[#15528]: https://github.com/prettier/prettier/issues/15528
[#15720]: https://github.com/prettier/prettier/issues/15720
[AFDocs]: https://afdocs.dev/
[afdocs-config]: https://afdocs.dev/reference/config-file
[docsy.dev/agent-docs.config.yml]: https://github.com/docsy/docsy/blob/main/docsy.dev/agent-docs.config.yml
[docsy.dev/package.json]: https://github.com/docsy/docsy/blob/main/docsy.dev/package.json
[Prettier]: https://prettier.io
[Scorecard examples]: /docs/content/agent-support/#scorecard-examples
[test suites]: /project/about/maintainer-notes/#test-suites
<!-- prettier-ignore-end -->
