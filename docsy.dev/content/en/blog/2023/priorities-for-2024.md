---
title: Docsy priorities for 2024
linkTitle: 2024 Priorities
author: >
  [Patrice Chalin](https://github.com/chalin) ([CNCF](https://www.cncf.io/)),
  for the [Docsy Steering Committee](/blog/2022/hello/#introducing-the-psc)
date: 2023-11-28
# prettier-ignore
cSpell:ignore: opentelemetry namespacing customizability deprioritize
---

> **TL;DR** 1.4K projects use Docsy! The top user-project focused priorities for
> 2024 are: improving Docsy's stability, usability & customizability, and
> cohesiveness while performing feature consolidation.

## Docsy is a popular theme

The Hugo-Docsy tool combo is powerful and effective, as I've [blogged about
elsewhere]. It's maybe no surprise then, to see Docsy [used by 1.4K
projects][docsy-analytics][^0]. Why is Docsy popular? I can't say for sure, but
I use and recommend Docsy because it has the core features --- necessary for
publishing non-trivial tech-doc sites --- that projects seem to want and need,
including support for versioning, multiple languages, auto-generated site
navigation, and more. It's quick to set up, and it allows projects to focus on
delivering site content rather than writing site template code.

## User-project focused and long-term vision

[Steering committee][sc] members, including myself, are actively supporting
several projects at the CNCF and Google that rely on Docsy. Both as users and
contributors to Docsy, we share a vested interest in ensuring Docsy's long-term
health. Our envisioned priorities for Docsy are:

1.  **Stability** of Docsy's **core** through bug fixes and necessary upgrades
    --- the [migration from the end-of-life Bootstrap 4 to version
    5][bs5-migration] is one example of such an effort.
2.  Reducing **technical debt**.
3.  **Improving usability, customizability, and maintainability** by, in
    particular, working to more **clearly separate** and document "**API
    surfaces**" --- or configuration / customization surfaces.
4.  **Feature consolidation**, which I will explain next.

Google open sourced Docsy a little over five years ago, and thanks to community
contributions, it has grown in stability and its feature set. During that time,
Docsy also accumulated considerable technical debt, and it now suffers (IMHO)
from a mild case of software bloat/feature creep. So, in addition to investing
in Docsy's long-term stability and maintainability, we need to **reaffirm
Docsy's core features** and deprioritize the rest[^1] --- lest we suffer a [fate
similar to projects like `cross-env`][ce]. Consider Docsy on a feature diet.

Before tackling 2024 objectives, we plan on setting up a **test infrastructure**
with (a growing) suite of tests to help us ensure Docsy's integrity as it
evolves.

## Conclusion

This is a tall order for 2024 and beyond, but I believe that slow and steady
wins the day.

We're eager to hear from you, the Docsy community! [Share your thoughts][] on
our focus areas and how we can enhance Docsy. Take a look at our issue triage
into [quarterly milestones][] for a rough idea of what is targeted for upcoming
releases. Vote for or comment on issues that are important to you, and we'll do
our best to respond and adjust release targets within the boundaries of our set
priorities. Better yet, volunteer to work on the current quarter's tasks. As we
start the new year, we'll be especially interested in getting help with testing
and feature consolidation.

[^0]: According to [Docsy's GitHub analytics][docsy-analytics].

[^1]:
    Features outside the identified core could even be moved to a separate
    community-maintained repo. The steering committee is also considering a
    "plugin" architecture for some secondary features, such as (to mention just
    one) Mermaid support.

[blogged about elsewhere]:
  https://www.cncf.io/blog/2023/01/19/fast-and-effective-tools-for-cncf-and-open-source-project-websites/
[docsy-analytics]: https://github.com/docsy/docsy/network/dependents
[ce]: https://github.com/kentcdodds/cross-env/issues/257
[sc]: ../2022/hello/#introducing-the-psc
[bs5-migration]: bootstrap-5-migration/
[share your thoughts]: https://github.com/docsy/docsy/discussions
[quarterly milestones]: https://github.com/docsy/docsy/milestones
