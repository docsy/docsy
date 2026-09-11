// Regression guard for google/docsy#2638: the `_print` output format did not
// respect `relativeURLs = true`, so printable pages emitted absolute (root-
// relative) asset URLs while the rest of the site emitted relative ones. This
// broke offline/local viewing of `_print/*` (missing CSS, JS, and images) and
// local HTML-to-PDF conversion.
//
// Mechanism: Hugo only runs its relativeURLs search-and-replace pass on output
// formats classified as HTML (`isHTML: true`). The print format had `isHTML`
// left unset as a workaround for gohugoio/hugo#14381 (relative *alias*
// generation). That workaround is no longer needed: the print format sets
// `permalinkable: false`, and Hugo only generates the aliases #14381 concerned
// when both `isHTML` and `permalinkable` are true — so enabling `isHTML` never
// exercises that path here.
//
// TDD trace: red with `isHTML` unset on the print format, green with
// `isHTML: true` (theme/hugo.yaml). Verified on hugo-extended@0.161.1
// (theme min is 0.160.1).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './lib/build-site.mjs';

test('print output respects relativeURLs=true (no absolute asset URLs)', () => {
  const r = buildSite('print-relative-urls', {
    extraConfig: [
      'relativeURLs: true',
      'outputs:',
      '  section: [HTML, print]',
      '',
    ].join('\n'),
    files: {
      'content/docs/_index.md': '---\ntitle: Docs\n---\n\nSection landing.\n',
      'content/docs/page-one.md':
        '---\ntitle: Page One\n---\n\nContent of page one.\n',
    },
  });
  assert.equal(r.status, 0, `hugo build failed:\n${r.stdout}${r.stderr}`);

  const html = r.publicFile('_print/docs/index.html');

  // The bug: assets referenced with a leading-slash (absolute) URL. With the
  // fix these are rewritten relative to the print page, like the rest of the
  // site. The site CSS/JS are Hugo resource RelPermalinks — the same code path
  // that carries processed-image URLs — so this guards the image symptom too.
  assert.doesNotMatch(
    html,
    /(?:src|href)="\/[^"/][^"]*\.(?:css|js)"/,
    'print page must not emit absolute (leading-slash) asset URLs',
  );

  // Positive check: the main stylesheet is referenced with a page-relative URL.
  assert.match(
    html,
    /href="(?:\.\.\/)+scss\/main\.min\.[0-9a-f]+\.css"/,
    'print page must reference the site CSS with a relative URL',
  );
});
