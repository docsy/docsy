---
title: 'Docsy 2024 Review: Adoptions and Enhancements'
linkTitle: '2024 Review: Adoptions and Enhancements'
date: 2024-12-12
author: >-
  [Patrice Chalin](https://github.com/chalin) ([CNCF](https://www.cncf.io/)),
  for the [Docsy Steering Committee](/blog/2022/hello/#introducing-the-psc)
description: >-
  Celebrating Docsy's 2024 growth in features and adoption, including a 57%
  usage increase, new features like dark mode, and improved internationalization
  support.
# prettier-ignore
cSpell:ignore: jaegertracing mentees opentelemetry toto upvoted kubernetes theupdateframework Dindi Dariksha Ansari
---

As we reflect on 2024, it’s exciting to see steady progress toward the goals
outlined in our [2024 priorities][]. This year, we focused on enhancing
stability, improving internationalization, and delivering long-anticipated
features like dark mode and continuous integration (CI) testing.

> <i class="fa-solid fa-chart-line"></i> Docsy’s use **increased by 57%** in
> 2024, from 1.4K to 2.2K projects! [^1]

Let’s dive into the development highlights from 2024 and take a peek at what
lies ahead.

[2024 priorities]: ../2023/priorities-for-2024/

## Release highlights

We published three releases this year, each focusing on stability while
introducing at least one major feature enhancement. Highlights include:

- **[0.9.0](0.9.0/)** added _long-awaited_:
  - **CI testing** via GitHub Actions to ensure quality and reliability across
    Linux and Windows.
  - **Footer customization** &mdash; Docsy's [longest-standing issue (#2)][#2]!
    &mdash; as well as improved repository links, and enhanced accessibility and
    look-and-feel.
- **[0.10.0](0.10.0/):**
  - Enabled [color themes and **dark mode**][dark mode] via Bootstrap 5.3
    upgrade, marking the completion of the [Bootstrap 5 migration][] started
    in 2021. Also made adjustments to shortcodes and styles for dark-mode
    compatibility.
  - Addressed breaking changes resulting from the major core upgrade to Hugo
    0.123.0.
- **[0.11.0](https://github.com/docsy/docsy/releases/tag/v0.11.0):**
  - Enhanced internationalization by reintroducing **Right-To-Left (RTL)
    language support** using Bootstrap's RTL capabilities.

[#2]: https://github.com/docsy/docsy/issues/2
[Bootstrap 5 migration]: https://github.com/docsy/docsy/issues/470

## Major feature enhancements {#enhancements}

In addition to CI testing, a key development feature contributing to Docsy's
stability, here are the major user-facing enhancements introduced in 2024.

### Dark mode support

[Dark mode][] support was the **_most upvoted_ Docsy enhancement** prior to its
debut in v0.10.0. Powered by Bootstrap 5.3 color themes, this Docsy feature
includes a built-in light/dark mode menu selector for easy implementation.

We plan on [enabling dark mode][] in the [Docsy example][], for even easier
adoption. Dark mode has already been adopted in notable projects like
OpenTelemetry ([opentelemetry.io#4023][]).

[enabling dark mode]: https://github.com/docsy/docsy-example/issues/285
[Docsy example]: https://github.com/docsy/docsy-example
[opentelemetry.io#4023]:
  https://github.com/open-telemetry/opentelemetry.io/issues/4023

### Right-To-Left (RTL) language support

[RTL language support (#1933)][#1933], reintroduced through Bootstrap's use of
the mature and well-vetted [RTLCSS][] framework, replaced Docsy's deprecated
custom RTL solution from 2023.

This enhancement meets longstanding multilingual documentation needs. Notably,
RTL support has been requested by major Docsy-based sites, including the two
2024 [top-velocity projects][] of the [CNCF][]:

- [Kubernetes][]:
  [right-to-left language support #22730](https://github.com/kubernetes/website/issues/22730)
  - [Localize website into Arabic (ar) #22726](https://github.com/kubernetes/website/issues/22726)
  - [Localize website into Persian (fa) #22727](https://github.com/kubernetes/website/issues/22727)
- [OpenTelemetry][]:
  - [Add Persian version of website pages #4990](https://github.com/open-telemetry/opentelemetry.io/issues/4990)

[#1933]: https://github.com/docsy/docsy/pull/1933
[CNCF]: https://www.cncf.io
[dark mode]: 0.10.0/#color-themes-and-dark-mode-support
[Kubernetes]: https://kubernetes.io
[OpenTelemetry]: https://opentelemetry.io
[top-velocity projects]:
  https://www.cncf.io/blog/2024/07/11/as-we-reach-mid-year-2024-a-look-at-cncf-linux-foundation-and-top-30-open-source-project-velocity/
[RTLCSS]: https://rtlcss.com/

## Adoptions and the Docsy Starter

One of the most exciting developments in 2024 has been Docsy's growing adoption.
GitHub analytics show a **57% increase in usage**, reaching **2.2K projects** as
of this writing.

Adoption among CNCF projects has also grown since our [2023 report][]. This
year, [Linux Foundation mentees][LFX] [Sandra Dindi][] and [Dariksha Ansari][]
used the [CNCF Docsy starter][] to migrate the following sites to Docsy:

- **[The Update Framework](https://theupdateframework.io)**
  ([theupdateframework.io#105][])
- **[in-toto](https://in-toto.io)** ([in-toto.io#76][])

Additionally, the [Kubernetes website][] is undergoing a significant Docsy
upgrade from v0.2, to align with the latest version and reduce technical debt:

- [Align with upstream Docsy kubernetes.io#41171](https://github.com/kubernetes/website/issues/41171)
- [Update Docsy step by step to the latest Docsy kubernetes.io#44002](https://github.com/kubernetes/website/issues/44002)

The upgrade is progressing well, as shown in the ongoing efforts documented in
the [0.3.x upgrade][] and [0.5.x upgrade][].

[0.3.x upgrade]: https://github.com/kubernetes/website/pull/48721
[0.5.x upgrade]: https://github.com/kubernetes/website/issues/48807
[theupdateframework.io#105]:
  https://github.com/theupdateframework/theupdateframework.io/pull/105
[CNCF Docsy starter]: https://github.com/chalin/docsy-starter
[LFX]:
  https://www.cncf.io/blog/2024/09/27/congratulations-to-45-cncf-term-1-2024-lfx-program-mentees/
[2023 report]:
  https://www.cncf.io/blog/2023/01/19/fast-and-effective-tools-for-cncf-and-open-source-project-websites/
[in-toto.io#76]: https://github.com/in-toto/in-toto.io/issues/76
[Kubernetes website]: https://github.com/kubernetes/website
[Dariksha Ansari]:
  https://mentorship.lfx.linuxfoundation.org/project/34314eb1-0fc3-4802-ab04-2265418c2e48
[Sandra Dindi]:
  https://mentorship.lfx.linuxfoundation.org/project/e35f28f9-f333-47a8-a76a-119567cf10ca

## What's ahead?

Looking ahead, we’re excited to continue supporting the Docsy upgrade and
adoption efforts by projects such as [gRPC (grpc.io#1389)][] and [Jaeger
(jaegertracing#746)].

For features tentatively planned for the first release of 2025, see [Release
0.12.0 preparation #2108]. The most upvoted enhancement requests are currently:
[^2]

- [Navigation indication on the right TOC #349](https://github.com/docsy/docsy/issues/349)
- [Repository / page-meta link fixes and improvements #1841](https://github.com/docsy/docsy/issues/1841),
  particularly for [GitLab](https://github.com/docsy/docsy/issues/375)
- [Drop jQuery #1436](https://github.com/docsy/docsy/issues/1436)

Thank you to all contributors and users who made 2024 a meaningful year for
Docsy. Wishing you a fantastic end to 2024 and a great start to 2025! Let’s
continue creating exceptional documentation together.

[^1]: Based on GitHub analytics [Docsy dependents][] as of the time of writing.

[^2]:
    Remember to
    [vote for your most-desired feature](https://github.com/docsy/docsy/issues).

[Docsy dependents]: https://github.com/docsy/docsy/network/dependents
[gRPC (grpc.io#1389)]: https://github.com/grpc/grpc.io/issues/1389
[Jaeger (jaegertracing#746)]:
  https://github.com/jaegertracing/documentation/issues/746
[Release 0.12.0 preparation #2108]: https://github.com/docsy/docsy/issues/2108
