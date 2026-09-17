# @docsy/theme

[Docsy][] is a [Hugo][] theme for technical documentation sites.

This package contains the theme files and their npm dependencies, plus the
[gen-favicons][] helper.

## Usage

Add the theme to your Hugo site:

```sh
npm install --save-dev @docsy/theme
```

Then set the following in your site's `hugo.yaml`:

```yaml
theme: '@docsy/theme'
themesDir: node_modules
```

For prerequisites, project setup, and everything else, see the [Docsy
documentation][docsy].

[docsy]: https://www.docsy.dev
[gen-favicons]:
  https://github.com/docsy/docsy/tree/main/theme/scripts/gen-favicons#readme
[hugo]: https://gohugo.io
