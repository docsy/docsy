// Cases: CCR-01 (td.chrome param), CCR-02 (kept chrome), CCR-21 (per-page full). See the CCR case registry in tests/fixture-site/README.md.
// Tests for the params.td.chrome gate (_partials/chrome-render.html), which
// drops repeated chrome so a link checker reaches each link once. See the
// chrome build modes guide:
// docsy.dev/content/en/docs/deployment/chrome.md

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './lib/build-site.mjs';
import { chrome } from './lib/fixtures.mjs';

const files = {
  'content/_index.md': '---\ntitle: Home\n---\nHome body\n',
  'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs landing\n',
  'content/docs/page-a/_index.md': '---\ntitle: Page A\n---\nDeep page\n',
};

const has = { ...chrome, sidebar: (h) => /id="td-section-nav"/.test(h) };

// Internal hrefs in the left-nav, for subtree-coverage checks.
const navLinks = (h) => {
  const m = h.match(/<nav class="td-sidebar-nav[\s\S]*?<\/nav>/);
  return m ? [...m[0].matchAll(/href="([^"]+)"/g)].map((x) => x[1]) : [];
};

test('full mode (default) keeps all chrome on every page', () => {
  const r = buildSite('ccr-off', { files });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stdout}${r.stderr}`);
  for (const rel of [
    'index.html',
    'docs/index.html',
    'docs/page-a/index.html',
  ]) {
    const h = r.publicFile(rel);
    assert.ok(has.navbar(h), `navbar present on ${rel}`);
    assert.ok(has.footer(h), `footer present on ${rel}`);
  }
  assert.ok(
    has.sidebar(r.publicFile('docs/index.html')),
    'sidebar present on docs landing',
  );
  assert.ok(
    has.sidebar(r.publicFile('docs/page-a/index.html')),
    'sidebar present on deep docs page',
  );
});

test('shared mode keeps one reference instance of each region', () => {
  const r = buildSite('ccr-on', {
    files,
    env: { HUGO_PARAMS_TD_CHROME: 'shared' },
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stdout}${r.stderr}`);

  const home = r.publicFile('index.html');
  assert.ok(has.navbar(home), 'navbar kept on the home page');
  assert.ok(has.footer(home), 'footer kept on the home page');

  const landing = r.publicFile('docs/index.html');
  assert.ok(has.sidebar(landing), 'left-nav kept on the docs landing');
  assert.ok(!has.navbar(landing), 'navbar absent on the docs landing');
  assert.ok(!has.footer(landing), 'footer absent on the docs landing');

  const deep = r.publicFile('docs/page-a/index.html');
  assert.ok(!has.sidebar(deep), 'left-nav absent on the deep docs page');
  assert.ok(!has.navbar(deep), 'navbar absent on the deep docs page');
  assert.ok(!has.footer(deep), 'footer absent on the deep docs page');

  // The 404 page has no html output format; its placeholder still bakes a path.
  assert.match(
    r.publicFile('404.html'),
    /data-canonical-path="\/404\.html"/,
    '404 page placeholder bakes its own URL as canonical path',
  );
});

// Setting the build mode explicitly to `full` (the default) keeps chrome on
// every page, the same as leaving td.chrome unset.
test('td.chrome="full" via the environment keeps all chrome', () => {
  const r = buildSite('ccr-env-full', {
    files,
    env: { HUGO_PARAMS_TD_CHROME: 'full' },
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stdout}${r.stderr}`);
  for (const rel of ['index.html', 'docs/page-a/index.html']) {
    const h = r.publicFile(rel);
    assert.ok(has.navbar(h), `navbar present on ${rel}`);
    assert.ok(has.footer(h), `footer present on ${rel}`);
  }
  assert.ok(
    has.sidebar(r.publicFile('docs/page-a/index.html')),
    'sidebar present on deep docs page',
  );
});

// Only the exact value `shared` enables shared mode; any other value (a typo
// or wrong case like "SHARED") safely falls back to full chrome.
test('td.chrome with an unrecognized value falls back to full chrome', () => {
  const r = buildSite('ccr-env-unknown', {
    files,
    env: { HUGO_PARAMS_TD_CHROME: 'SHARED' },
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stdout}${r.stderr}`);
  const landing = r.publicFile('docs/index.html');
  assert.ok(has.navbar(landing), 'navbar present on the docs landing');
  assert.ok(has.footer(landing), 'footer present on the docs landing');
});

// The documented config path (params.td.chrome) must work too, not just the
// HUGO_PARAMS_TD_CHROME environment override the other tests use.
test('shared mode can be set via site config', () => {
  const r = buildSite('ccr-config', {
    files,
    extraConfig: ['params:', '  td:', '    chrome: shared', ''].join('\n'),
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stdout}${r.stderr}`);
  const landing = r.publicFile('docs/index.html');
  assert.ok(has.sidebar(landing), 'left-nav kept on the docs landing');
  assert.ok(!has.navbar(landing), 'navbar absent on the docs landing');
  assert.ok(!has.footer(landing), 'footer absent on the docs landing');
});

test('a page with td.chrome full in front matter keeps its own chrome in a shared build', () => {
  const r = buildSite('ccr-page-full', {
    files: {
      ...files,
      'content/docs/static.md':
        '---\ntitle: Static\ntd: { chrome: full }\n---\nComplete without JS\n',
    },
    env: { HUGO_PARAMS_TD_CHROME: 'shared' },
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stdout}${r.stderr}`);
  const page = r.publicFile('docs/static/index.html');
  assert.ok(has.navbar(page), 'navbar rendered on the opted-out page');
  assert.ok(has.footer(page), 'footer rendered on the opted-out page');
  assert.ok(has.sidebar(page), 'left-nav rendered on the opted-out page');
  assert.ok(
    !/td-chrome-placeholder|td-sidebar-chrome-placeholder/.test(page),
    'opted-out page renders without placeholders',
  );
  assert.ok(
    !has.navbar(r.publicFile('docs/page-a/index.html')),
    'other pages stay shared',
  );
});

// Each language's left-nav links differ, so every language's docs section page is kept.
test('shared mode keeps the sidebar on every language docs section page', () => {
  const mlFiles = {
    ...files,
    'content/_index.ja.md': '---\ntitle: ホーム\n---\nHome body\n',
    'content/docs/_index.ja.md':
      '---\ntitle: ドキュメント\n---\nDocs landing\n',
    'content/docs/page-a/_index.ja.md': '---\ntitle: ページA\n---\nDeep page\n',
  };
  const r = buildSite('ccr-on-ml', {
    files: mlFiles,
    env: { HUGO_PARAMS_TD_CHROME: 'shared' },
    extraConfig: [
      'defaultContentLanguage: en',
      'languages:',
      '  en:',
      '    weight: 1',
      '  ja:',
      '    weight: 2',
      '',
    ].join('\n'),
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stdout}${r.stderr}`);

  for (const rel of ['index.html', 'ja/index.html']) {
    const h = r.publicFile(rel);
    assert.ok(has.navbar(h), `navbar kept on ${rel}`);
    assert.ok(has.footer(h), `footer kept on ${rel}`);
  }
  for (const rel of ['docs/index.html', 'ja/docs/index.html']) {
    assert.ok(has.sidebar(r.publicFile(rel)), `left-nav kept on ${rel}`);
  }
  for (const rel of ['docs/page-a/index.html', 'ja/docs/page-a/index.html']) {
    const h = r.publicFile(rel);
    assert.ok(!has.navbar(h), `navbar absent on ${rel}`);
    assert.ok(!has.footer(h), `footer absent on ${rel}`);
    assert.ok(!has.sidebar(h), `left-nav absent on ${rel}`);
  }
});

// Home-as-docs site: the home page itself typed `docs`, the pre-0.15 docs-only
// shape, still served by chrome-render.html's `Home.Type "docs"` sidebar branch.
// The current doc-rooted recipe is tested in `chrome-doc-rooted`.
test('shared mode on a home-as-docs site keeps chrome on the home landing only', () => {
  const r = buildSite('ccr-home-as-docs', {
    files: {
      'content/_index.md':
        '---\ntitle: Home\ntype: docs\ncascade: { type: docs }\n---\nDocs landing\n',
      'content/guide/_index.md': '---\ntitle: Guide\n---\nGuide\n',
      'content/guide/page-a.md': '---\ntitle: Page A\n---\nDeep page\n',
    },
    env: { HUGO_PARAMS_TD_CHROME: 'shared' },
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stdout}${r.stderr}`);

  const home = r.publicFile('index.html');
  assert.ok(has.navbar(home), 'navbar kept on the home landing');
  assert.ok(has.footer(home), 'footer kept on the home landing');
  assert.ok(has.sidebar(home), 'left-nav kept on the home landing');
  assert.ok(
    navLinks(home).includes('/guide/page-a/'),
    'home left-nav carries the full tree (links to the deep page)',
  );

  // The home is the left-nav donor for every section (the Home.Type branch), so
  // a section page carries a placeholder too.
  for (const rel of ['guide/index.html', 'guide/page-a/index.html']) {
    const h = r.publicFile(rel);
    assert.ok(!has.navbar(h), `navbar absent on ${rel}`);
    assert.ok(!has.footer(h), `footer absent on ${rel}`);
    assert.ok(!has.sidebar(h), `left-nav absent on ${rel}`);
    assert.match(
      h,
      /class="td-sidebar-chrome-placeholder" data-nav-donor="\/"/,
      `${rel} names the home landing as its left-nav donor`,
    );
  }
});

// Section-root scopes the left-nav to a subtree; shared mode keeps only the docs
// landing's full tree, which must already cover those scoped links.
test('shared mode keeps a docs-landing tree that covers section-rooted subsets', () => {
  const files = {
    'content/_index.md': '---\ntitle: Home\n---\nLanding\n',
    'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs landing\n',
    'content/docs/sub/_index.md':
      '---\ntitle: Sub\nsidebar_root_for: self\n---\nSub\n',
    'content/docs/sub/page-x.md': '---\ntitle: Page X\n---\nX\n',
    'content/docs/other.md': '---\ntitle: Other\n---\nOther\n',
  };
  const extraConfig = [
    'params:',
    '  ui:',
    '    sidebar_root_enabled: true',
    '',
  ].join('\n');

  const off = buildSite('ccr-section-root-off', { files, extraConfig });
  assert.equal(
    off.status,
    0,
    `hugo build succeeds:\n${off.stdout}${off.stderr}`,
  );
  const scoped = navLinks(off.publicFile('docs/sub/page-x/index.html'));
  assert.ok(scoped.length > 0, 'section-rooted page renders a scoped left-nav');

  const on = buildSite('ccr-section-root-on', {
    files,
    extraConfig,
    env: { HUGO_PARAMS_TD_CHROME: 'shared' },
  });
  assert.equal(on.status, 0, `hugo build succeeds:\n${on.stdout}${on.stderr}`);
  assert.ok(
    has.sidebar(on.publicFile('docs/index.html')),
    'left-nav kept on the docs landing',
  );
  assert.ok(
    !has.sidebar(on.publicFile('docs/sub/page-x/index.html')),
    'left-nav absent on the section-rooted page',
  );
  const full = navLinks(on.publicFile('docs/index.html'));
  for (const href of scoped) {
    assert.ok(full.includes(href), `docs-landing left-nav covers ${href}`);
  }
});

test('shared mode placeholders name the root page HTML render even when another format is permalinkable', () => {
  const r = buildSite('ccr-print-permalinkable', {
    files,
    extraConfig: [
      'outputFormats:',
      '  print:',
      '    { baseName: index, mediaType: text/html, path: _print, permalinkable: true }',
      'outputs:',
      '  home: [HTML, RSS, print]',
      '  section: [HTML, RSS, print]',
      '',
    ].join('\n'),
    env: { HUGO_PARAMS_TD_CHROME: 'shared' },
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stdout}${r.stderr}`);
  for (const [rel, canonical] of [
    ['_print/index.html', '/'],
    ['_print/docs/index.html', '/docs/'],
  ]) {
    const h = r.publicFile(rel);
    for (const region of ['navbar', 'footer']) {
      assert.ok(!has[region](h), `${region} absent on the print render ${rel}`);
      assert.ok(
        has.placeholder(h, region, '/'),
        `${rel} ${region} placeholder names the root page HTML render`,
      );
    }
    assert.match(
      h,
      new RegExp(`data-canonical-path="${canonical}"`),
      `${rel} bakes the page's HTML URL as its canonical path`,
    );
  }
  const home = r.publicFile('index.html');
  assert.ok(has.navbar(home), 'navbar kept on the home');
  assert.ok(has.footer(home), 'footer kept on the home');
});
