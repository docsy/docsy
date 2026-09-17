---
title: Height full with td-below-navbar
linkTitle: Height full
type: home
layout: home
description: A Hugo theme for creating great technical documentation sites
---

{{% blocks/cover
  title="Welcome to Docsy!"
  height="full td-below-navbar"
%}}

<!-- prettier-ignore -->
{{% param description %}}
{.display-6}

<!-- prettier-ignore -->
<div class="td-cta-buttons my-5">
  <a {{% _param btn-lg primary %}}
    href='{{% siteGetPage "/docs/get-started" RelPermalink %}}'>
    Get started
  </a>
  <a {{% _param btn-lg secondary %}}
    href="/examples/">
    Explore examples
  </a>
</div>

{{% blocks/link-down color="info" %}}

{{% /blocks/cover %}}

{{% blocks/lead color="white" %}}

Docsy is a theme for the [Hugo][] static site generator that's specifically
designed for technical documentation sets. Our aim is to help you get a working
documentation site up and running as easily as possible, so you can concentrate
on creating great content for your users.

[![Deploys by Netlify][netlify-badge]][netlify]

[Hugo]: https://gohugo.io/
[netlify]: https://www.netlify.com/
[netlify-badge]:
  https://www.netlify.com/assets/badges/netlify-badge-color-accent.svg

{{% /blocks/lead %}}

{{% blocks/section color="primary" type="row" %}}

{{% blocks/feature icon="fa-lightbulb" title="See Docsy in action!" url="/examples/" %}}

As well as our example site, there's a growing number of projects using Docsy
for their doc sites.

{{% /blocks/feature %}}

{{% blocks/feature icon="fa-brands fa-github" title="Contributions welcome!" url="https://github.com/docsy/docsy" %}}

We do a [Pull Request](https://github.com/docsy/docsy/pulls) contributions
workflow on **GitHub**. New users are always welcome!

{{% /blocks/feature %}}

{{% blocks/feature icon="fa-brands fa-x-twitter" title="Follow us on Twitter!" url="https://twitter.com/docsydocs" %}}

Find out about new features and how our users are using Docsy.

{{% /blocks/feature %}}

{{% /blocks/section %}}
