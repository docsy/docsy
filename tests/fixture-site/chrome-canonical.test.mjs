// Cases: CCR-15 (print canonical URL), CCR-16 (paginated canonical URL) — both
// validated here through the shared canonical-path mechanism, simulated via a
// print-style request URL (no real print or paginator output is built). See the
// CCR case registry in tests/fixture-site/README.md.
// Equivalence test for the per-page canonical path. shared mode can run on a URL that
// isn't the page's canonical one — a print view (/_print/docs/…) or a paginator
// page (…/page/2/) — yet the full build derives the navbar active link, the
// per-page version-selector links, and the sidebar active state from the page's
// logical URL, not the request URL. The server bakes that logical URL as a
// data-canonical-path hint; the client must key its active-state restore to it
// rather than window.location (see assets/js/chrome-nav.js: currentPath).
//
// The fixture has no print/paginator output, so we simulate the mismatch: load
// the regular page's shared HTML (which bakes the canonical path) at a print-style
// URL, and assert the restored chrome still matches the full page. A real
// print/paginator fixture is a tracked follow-up (see the registry open items).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './lib/build-site.mjs';
import {
  inlineChrome,
  normalize,
  regionOf,
  navRegion,
} from '../site-equivalence/lib/equivalence.mjs';

const BASE = 'https://example.org';

const files = {
  'content/_index.md': '---\ntitle: Home\n---\nHome body\n',
  'content/about.md': '---\ntitle: About\n---\nAbout\n',
  'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs landing\n',
  'content/docs/guide/_index.md': '---\ntitle: Guide\n---\nGuide\n',
  'content/docs/guide/intro.md': '---\ntitle: Intro\n---\nIntro\n',
  'content/docs/guide/setup.md': '---\ntitle: Setup\n---\nSetup\n',
};

const extraConfig = `params:
  ui:
    sidebar_menu_foldable: true
  version: v2.0
  version_menu: Releases
  version_menu_pagelinks: true
  versions:
    - version: v2.0
      url: https://example.org
    - version: v1.0
      url: https://v1.example.org
menus:
  main:
    - name: Docs
      pageRef: /docs
      weight: 10
    - name: About
      pageRef: /about
      weight: 20
`;

const title = 'Docsy canonical fixture';
const full = buildSite('canon-full', { files, extraConfig, title });
const ccr = buildSite('canon-ccr', {
  files,
  extraConfig,
  title,
  env: { HUGO_PARAMS_TD_CHROME: 'shared' },
});

async function inlineAt(html, url) {
  return normalize(
    await inlineChrome(html, {
      url,
      resolveDonor: (pathname) => {
        const rel = pathname.replace(/^\/+/, '').replace(/\/$/, '');
        const file = rel ? `${rel}/index.html` : 'index.html';
        try {
          return ccr.publicFile(file);
        } catch {
          return null;
        }
      },
    }),
  );
}

test('the shared page bakes a data-canonical-path hint', () => {
  assert.equal(ccr.status, 0, `CCR build succeeds:\n${ccr.stderr}`);
  assert.match(
    ccr.publicFile('docs/guide/intro/index.html'),
    /data-canonical-path="\/docs\/guide\/intro\/"/,
    'the page advertises its logical path',
  );
});

test('shared mode keys active state to the canonical path, not the request URL', async () => {
  assert.equal(full.status, 0, `full build succeeds:\n${full.stderr}`);
  assert.equal(ccr.status, 0, `CCR build succeeds:\n${ccr.stderr}`);

  const page = 'docs/guide/intro/index.html';
  // A print-style request URL that differs from the page's canonical path.
  const requestUrl = `${BASE}/_print/docs/guide/intro/`;
  const canonicalUrl = `${BASE}/docs/guide/intro/`;

  const opts = { canonical: true };
  const inlined = await inlineAt(ccr.publicFile(page), requestUrl);
  const reference = normalize(full.publicFile(page));

  // The restored navbar (active link + per-page version selector) matches the
  // full page, even though the client ran at the print URL.
  assert.equal(
    regionOf(inlined, '.td-navbar', opts),
    regionOf(reference, '.td-navbar', opts),
    'restored navbar matches the full page at the canonical path',
  );

  // The restored left-nav marks the canonical page active, not nothing.
  assert.equal(
    navRegion(inlined, opts),
    navRegion(normalize(full.publicFile(page)), opts),
    'restored left-nav matches the full page at the canonical path',
  );
  assert.ok(
    canonicalUrl.endsWith('/docs/guide/intro/'),
    'sanity: canonical differs from the request URL',
  );
});

// Hints that aren't same-origin paths (another scheme, an origin-inheriting
// one, a foreign host however spelled, with or without the site's own host in
// front); the guard is sameOriginPath in chrome-nav.js.
test('shared mode ignores a canonical-path hint that is not a same-origin path', async () => {
  assert.equal(full.status, 0, `full build succeeds:\n${full.stderr}`);
  assert.equal(ccr.status, 0, `CCR build succeeds:\n${ccr.stderr}`);

  const page = 'docs/guide/intro/index.html';
  const html = ccr.publicFile(page);
  const hint = /data-canonical-path="\/docs\/guide\/intro\/"/;
  assert.match(html, hint, 'sanity: page carries the hint the probe replaces');

  const opts = { canonical: true };
  const reference = normalize(full.publicFile(page));
  // Every value carries another page's path, so a hint that got used would
  // show in the restored chrome.
  const hostile = [
    'javascript:alert(1)//',
    `blob:${BASE}/docs/guide/setup/`,
    'https://evil.example/docs/guide/setup/',
    '//evil.example/docs/guide/setup/',
    '/.//evil.example/docs/guide/setup/',
    '//example.org//example.org//evil.example/docs/guide/setup/',
  ];
  for (const value of hostile) {
    const tampered = html.replace(hint, `data-canonical-path="${value}"`);
    const inlined = await inlineAt(tampered, `${BASE}/docs/guide/intro/`);
    assert.equal(
      regionOf(inlined, '.td-navbar', opts),
      regionOf(reference, '.td-navbar', opts),
      `restored navbar matches the full page, hint ${value} ignored`,
    );
    assert.equal(
      navRegion(inlined, opts),
      navRegion(reference, opts),
      `restored left-nav matches the full page, hint ${value} ignored`,
    );
  }
});

// A navbar override can drop the hint; the guard is sameOriginPath.
test('shared mode validates the request-path fallback when the hint is absent', async () => {
  assert.equal(full.status, 0, `full build succeeds:\n${full.stderr}`);
  assert.equal(ccr.status, 0, `CCR build succeeds:\n${ccr.stderr}`);

  const page = 'docs/guide/intro/index.html';
  const html = ccr.publicFile(page);
  const hint = / data-canonical-path="[^"]*"/;
  assert.match(html, hint, 'sanity: page carries the hint the probe strips');
  const stripped = html.replace(hint, '');

  const opts = { canonical: true };
  const reference = normalize(full.publicFile(page));

  const atCanonical = await inlineAt(stripped, `${BASE}/docs/guide/intro/`);
  assert.equal(
    regionOf(atCanonical, '.td-navbar', opts),
    regionOf(reference, '.td-navbar', opts),
    'restored navbar matches the full page from the request path',
  );
  assert.equal(
    navRegion(atCanonical, opts),
    navRegion(reference, opts),
    'restored left-nav matches the full page from the request path',
  );

  const atHostile = await inlineAt(
    stripped,
    `${BASE}//evil.example/docs/guide/intro/`,
  );
  assert.equal(
    regionOf(atHostile, '.td-navbar', opts),
    regionOf(normalize(full.publicFile('index.html')), '.td-navbar', opts),
    'hostile request path restores the root page navbar',
  );
});
