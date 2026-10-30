// Cases: CCR-09 (version selector), CCR-10 (language selector). See the CCR case registry in tests/fixture-site/README.md.
// Client-side restore of the navbar's per-page selectors (version + language).
//
// In shared mode the navbar is dropped on inner pages and restored from the home
// donor, whose selector links point at the home page. The client re-derives the
// per-page links the donor can't supply:
//   - version links exactly — each is a version's base URL plus the page path,
//     so stripping the donor's path and appending this page's reproduces them;
//   - language links by prefix-swap — each points at the same page in another
//     locale, so swapping the current locale's home prefix for the target's
//     reproduces them when translations share slugs (the common case).
//
// Each test builds the same fixture full and shared mode, runs the real shipped client
// over the shared-mode inner page, and compares the restored selector links to the full
// build's.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { buildSite } from './lib/build-site.mjs';
import {
  inlineChrome,
  normalize,
} from '../site-equivalence/lib/equivalence.mjs';

const BASE = 'https://example.org';

// Run the client over a shared-mode page, resolving every donor (chrome and sidebar)
// from the shared build's own output.
async function inlinePage(ccr, page, url, html = ccr.publicFile(page)) {
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

// The raw href attributes of the links inside a selector's dropdown menu.
function selectorLinks(html, menuSelector) {
  const { document } = new JSDOM(html).window;
  return [...document.querySelectorAll(`${menuSelector} a[href]`)]
    .map((a) => a.getAttribute('href'))
    .sort();
}

const VERSION_MENU = '.td-version-menu .dropdown-menu';
const LANG_MENU = '.td-lang-menu .dropdown-menu';

test('shared mode restores per-page version-selector links to match the full build', async () => {
  const files = {
    'content/_index.md': '---\ntitle: Home\n---\nHome\n',
    'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs landing\n',
    'content/docs/guide/_index.md': '---\ntitle: Guide\n---\nGuide\n',
    'content/docs/guide/intro.md': '---\ntitle: Intro\n---\nIntro\n',
  };
  const extraConfig = `params:
  version: v2.0
  version_menu: Releases
  version_menu_pagelinks: true
  versions:
    - version: v2.0
      url: https://example.org
    - version: v1.0
      url: https://v1.example.org
`;
  const title = 'Docsy selector fixture';
  const full = buildSite('sel-version-full', { files, extraConfig, title });
  const ccr = buildSite('sel-version-ccr', {
    files,
    extraConfig,
    title,
    env: { HUGO_PARAMS_TD_CHROME: 'shared' },
  });
  assert.equal(full.status, 0, `full build succeeds:\n${full.stderr}`);
  assert.equal(ccr.status, 0, `CCR build succeeds:\n${ccr.stderr}`);

  const page = 'docs/guide/intro/index.html';
  const url = `${BASE}/docs/guide/intro/`;

  const want = selectorLinks(normalize(full.publicFile(page)), VERSION_MENU);
  // Precondition: the full build's version links really are per-page.
  assert.ok(
    want.some((h) => h.includes('/docs/guide/intro/')),
    'full version links are per-page',
  );

  const got = selectorLinks(await inlinePage(ccr, page, url), VERSION_MENU);
  assert.ok(got.length > 0, 'restored version menu carries links');
  assert.deepEqual(got, want, 'restored version links match the full build');
});

test('shared mode restores per-page language-selector links by prefix-swap', async () => {
  const files = {
    'content/_index.md': '---\ntitle: Home\n---\nHome\n',
    'content/_index.ja.md': '---\ntitle: ホーム\n---\nHome\n',
    'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs landing\n',
    'content/docs/_index.ja.md':
      '---\ntitle: ドキュメント\n---\nDocs landing\n',
    'content/docs/page-a.md': '---\ntitle: Page A\n---\nA\n',
    'content/docs/page-a.ja.md': '---\ntitle: ページA\n---\nA\n',
  };
  const extraConfig = `defaultContentLanguage: en
languages:
  en:
    weight: 1
  ja:
    weight: 2
`;
  const title = 'Docsy selector fixture';
  const full = buildSite('sel-lang-full', { files, extraConfig, title });
  const ccr = buildSite('sel-lang-ccr', {
    files,
    extraConfig,
    title,
    env: { HUGO_PARAMS_TD_CHROME: 'shared' },
  });
  assert.equal(full.status, 0, `full build succeeds:\n${full.stderr}`);
  assert.equal(ccr.status, 0, `CCR build succeeds:\n${ccr.stderr}`);

  const page = 'docs/page-a/index.html';
  const url = `${BASE}/docs/page-a/`;

  const want = selectorLinks(normalize(full.publicFile(page)), LANG_MENU);
  // Precondition: the full build's lang link targets this page's translation.
  assert.ok(
    want.includes('/ja/docs/page-a/'),
    "full lang link targets this page's translation",
  );

  const got = selectorLinks(await inlinePage(ccr, page, url), LANG_MENU);
  assert.ok(got.length > 0, 'restored language menu carries links');
  assert.deepEqual(got, want, 'restored language links match the full build');

  // A `//` right after the language prefix, bare or behind the site's own
  // host, with the hint absent (a navbar override); the guard is
  // sameOriginPath on the composed link.
  const jaPage = 'ja/docs/page-a/index.html';
  const hint = / data-canonical-path="[^"]*"/;
  const jaHtml = ccr.publicFile(jaPage);
  assert.match(jaHtml, hint, 'sanity: page carries the hint the probe strips');
  const stripped = jaHtml.replace(hint, '');
  for (const path of [
    '/ja//evil.example/docs/page-a/',
    '/ja//example.org//example.org//evil.example/docs/page-a/',
  ]) {
    const hostile = selectorLinks(
      await inlinePage(ccr, jaPage, BASE + path, stripped),
      LANG_MENU,
    );
    assert.ok(hostile.length > 0, `language menu carries links at ${path}`);
    assert.deepEqual(
      hostile,
      ['/'],
      `language links keep the donor's root at ${path}`,
    );
  }
});

test('shared mode language selector links a missing translation, diverging from a full build (known CCR-10 gap)', async () => {
  // `page-b` exists only in `en`; the home and `docs` landing exist in both
  // locales (so the donor home still renders a live `ja` link to swap from).
  const files = {
    'content/_index.md': '---\ntitle: Home\n---\nHome\n',
    'content/_index.ja.md': '---\ntitle: ホーム\n---\nHome\n',
    'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs landing\n',
    'content/docs/_index.ja.md':
      '---\ntitle: ドキュメント\n---\nDocs landing\n',
    'content/docs/page-b.md': '---\ntitle: Page B\n---\nB\n',
  };
  const extraConfig = `defaultContentLanguage: en
languages:
  en:
    weight: 1
  ja:
    weight: 2
`;
  const title = 'Docsy selector fixture';
  const full = buildSite('sel-lang-missing-full', {
    files,
    extraConfig,
    title,
  });
  const ccr = buildSite('sel-lang-missing-ccr', {
    files,
    extraConfig,
    title,
    env: { HUGO_PARAMS_TD_CHROME: 'shared' },
  });
  assert.equal(full.status, 0, `full build succeeds:\n${full.stderr}`);
  assert.equal(ccr.status, 0, `CCR build succeeds:\n${ccr.stderr}`);

  const page = 'docs/page-b/index.html';
  const url = `${BASE}/docs/page-b/`;

  // A full build renders the absent `ja` translation as a disabled <span>, so
  // its language menu carries no live link to the non-existent page.
  const want = selectorLinks(normalize(full.publicFile(page)), LANG_MENU);
  assert.ok(
    !want.includes('/ja/docs/page-b/'),
    'full build leaves the missing translation as a disabled item',
  );

  // Known limitation (CCR-10): shared mode prefix-swaps the donor's home links
  // unconditionally, so it restores a live link to the missing translation. This
  // pins the current divergence; the planned fix (bake each page's available
  // locales into the navbar placeholder and emit a disabled item for the rest)
  // will turn this into a parity assertion. See tests/fixture-site/README.md.
  const got = selectorLinks(await inlinePage(ccr, page, url), LANG_MENU);
  assert.ok(
    got.includes('/ja/docs/page-b/'),
    'shared mode currently links the missing translation (known CCR-10 gap)',
  );
});
