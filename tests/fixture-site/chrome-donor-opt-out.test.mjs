// Cases: CCR-21 (per-page opt-out), its documented limit when the opted-out page
// is a left-nav donor. See the CCR case registry in tests/fixture-site/README.md
// and the chrome guide: docsy.dev/content/en/docs/deployment/chrome.md

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { buildSite } from './lib/build-site.mjs';
import { inlineChrome } from '../site-equivalence/lib/equivalence.mjs';

const BASE = 'https://example.org';

const files = {
  'content/_index.md': '---\ntitle: Home\n---\nHome body\n',
  'content/docs/_index.md':
    '---\ntitle: Docs\ntd: { chrome: full }\n---\nDocs landing\n',
  'content/docs/leaf.md': '---\ntitle: Leaf\n---\nLeaf body\n',
};

const site = buildSite('ccr-donor-opt-out', {
  files,
  env: { HUGO_PARAMS_TD_CHROME: 'shared' },
});

const activeLinks = (html) =>
  [
    ...new JSDOM(html).window.document.querySelectorAll(
      '#td-section-nav a.active',
    ),
  ].map((a) => a.getAttribute('href'));

test('an opted-out left-nav donor leaves its active state in the nav other pages restore (documented limit)', async () => {
  assert.equal(site.status, 0, `build succeeds:\n${site.stdout}${site.stderr}`);
  assert.deepEqual(
    activeLinks(site.publicFile('docs/index.html')),
    ['/docs/'],
    'donor page keeps its own left-nav with itself active',
  );
  const inlined = await inlineChrome(site.publicFile('docs/leaf/index.html'), {
    url: `${BASE}/docs/leaf/`,
    resolveDonor: (pathname) =>
      pathname === '/docs/' ? site.publicFile('docs/index.html') : null,
  });
  assert.deepEqual(
    activeLinks(inlined),
    ['/docs/', '/docs/leaf/'],
    'restored nav marks the donor and the current page active (the limit)',
  );
});
