---
title: ScrollSpy patch
description:
  Runtime patch for Bootstrap ScrollSpy to handle invalid CSS selector IDs.
---

<span class="badge bg-info text-bg-info">As of Docsy 0.13.0</span>

> [!INFO] Summary
>
> Docsy 0.13.0 includes a **runtime patch** for Bootstrap [ScrollSpy][] that
> fixes a bug affecting pages with heading IDs that aren't valid CSS selectors.
> The patch ensures that [active TOC entry
> tracking][Active TOC entry tracking with ScrollSpy] works reliably for all
> pages.

## Problem

As of Bootstrap 5.3.8 (the version used by Docsy 0.13.0), [ScrollSpy][] fails if
a page contains a heading ID that is not also a valid CSS `#` selector. This can
happen, for example, if a heading ID starts with a digit. For technical details
about this bug, see [#2329][].

## Solution

Docsy 0.13.0 implements a runtime patch for [ScrollSpy][] that intercepts
ScrollSpy's initialization to properly handle heading IDs starting with digits
or containing other characters that form invalid CSS selectors. This allows
active TOC entry tracking to work correctly without altering the original
heading IDs, so links to headings continue to work as expected.

The patch is automatically applied when ScrollSpy is enabled (which is the
default). For implementation details, see [#2382][], [#2383][].

## Maintenance

CI/CD automatically keeps the patch up-to-date when Bootstrap is updated. The
`_test:full:pre` script extracts the method from Bootstrap, applies the patch,
and updates the runtime patch file. If the Bootstrap method code has changed to
a degree that the patch no longer works, CI will fail, indicating that the patch
file needs manual review and updates.

Until the [upstream ScrollSpy fix][] is released in a future Bootstrap version,
this patch ensures that active TOC entry tracking works reliably for all pages.

## References

- [Active TOC entry tracking with ScrollSpy][]
- [CI/CD `scrollspy-patch` details][]
- [Upstream ScrollSpy fix][] (Bootstrap PR #41726)
- [#2329][] — Technical details about the bug

[upstream ScrollSpy fix]: https://github.com/twbs/bootstrap/pull/41726
[#2329]: https://github.com/docsy/docsy/issues/2329
[#2382]: https://github.com/docsy/docsy/pull/2382
[#2383]: https://github.com/docsy/docsy/pull/2383
[Active TOC entry tracking with ScrollSpy]:
  /docs/content/navigation/#toc-entry-tracking
[CI/CD `scrollspy-patch` details]:
  https://github.com/docsy/docsy/blob/main/scripts/scrollspy-patch/README.md
[ScrollSpy]: https://getbootstrap.com/docs/5.3/components/scrollspy/
