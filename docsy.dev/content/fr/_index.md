---
title: Docsy
description: >-
  Un thème Hugo pour créer d'excellents sites de documentation technique
params:
  body_class: td-navbar-links-all-active
  ui: { navbar_theme: dark }
---

{{% blocks/cover
  title="Bienvenue sur Docsy !"
  height="full td-below-navbar"
%}}

<!-- prettier-ignore -->
{{% param description %}}
{.display-6}

<!-- prettier-ignore -->
<div class="td-cta-buttons my-5">
  <a {{% _param btn-lg primary %}} href="docs/get-started/">
    Commencer
  </a>
  <a {{% _param btn-lg secondary %}}
    href="examples/">
    Voir les exemples
  </a>
</div>

{{% blocks/link-down color="info" %}}

{{% /blocks/cover %}}

{{% blocks/lead color="white" %}}

Docsy est un thème pour le générateur de sites statiques [Hugo][] conçu pour la
documentation technique. Notre objectif est de vous aider à mettre en place un
site de documentation le plus simplement possible, pour que vous puissiez vous
concentrer sur la création de contenu pour vos utilisateurs.

[![Déploiements par Netlify][netlify-badge]][netlify]

[Hugo]: https://gohugo.io/
[netlify]: https://www.netlify.com/
[netlify-badge]:
  https://www.netlify.com/assets/badges/netlify-badge-color-accent.svg

{{% /blocks/lead %}}

{{% blocks/section color="primary" type="row" %}}

{{% blocks/feature icon="fa-lightbulb" title="Voir Docsy en action !" url="examples/" %}}

En plus de notre site d'exemple, un nombre croissant de projets utilisent Docsy
pour leurs sites de documentation.

{{% /blocks/feature %}}

{{% blocks/feature icon="fa-brands fa-github" title="Les contributions sont bienvenues !" url="https://github.com/docsy/docsy" %}}

Nous utilisons un workflow de
[Pull Request](https://github.com/docsy/docsy/pulls) sur **GitHub**. Les
nouveaux utilisateurs sont toujours les bienvenus !

{{% /blocks/feature %}}

{{% blocks/feature icon="fa-brands fa-x-twitter" title="Suivez-nous sur Twitter !" url="https://twitter.com/docsydocs" %}}

Découvrez les nouvelles fonctionnalités et comment nos utilisateurs utilisent
Docsy.

{{% /blocks/feature %}}

{{% /blocks/section %}}
