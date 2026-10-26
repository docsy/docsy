// Cases: CCR-20 (doc-rooted donor page). See the CCR case registry in tests/fixture-site/README.md.
// The navbar and footer donor page on a doc-rooted site (lib/fixtures.mjs). The
// section page's outputs carry LLMS and print (see _partials/chrome-render.html).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCleanSite } from './lib/build-site.mjs';
import {
  chrome,
  docRootedConfig,
  docRootedHomes,
  frontMatter,
} from './lib/fixtures.mjs';

const files = {
  ...docRootedHomes(),
  'content/docs/_index.md': frontMatter({ title: 'Docs' }) + 'Docs landing\n',
  'content/docs/_index.fr.md':
    frontMatter({ title: 'Documentation' }) + 'Accueil docs\n',
  'content/docs/install.md': frontMatter({ title: 'Install' }) + 'Leaf\n',
  'content/docs/install.fr.md':
    frontMatter({ title: 'Installation' }) + 'Feuille\n',
};

test('shared mode keeps the navbar and footer on each language root of a doc-rooted site', () => {
  const r = buildCleanSite('ccr-doc-rooted-donor', {
    files,
    extraConfig:
      docRootedConfig +
      'outputs:\n  section: [HTML, RSS, print, markdown, LLMS]\n',
    env: { HUGO_PARAMS_TD_CHROME: 'shared' },
  });

  for (const [root, donor] of [
    ['index.html', '/'],
    ['fr/index.html', '/fr/'],
  ]) {
    const h = r.publicFile(root);
    assert.ok(chrome.navbar(h), `navbar kept on the root page ${root}`);
    assert.ok(chrome.footer(h), `footer kept on the root page ${root}`);
    assert.ok(
      !chrome.placeholder(h, 'navbar', donor) &&
        !chrome.placeholder(h, 'footer', donor),
      `root page ${root} renders its chrome directly`,
    );
  }

  for (const [inner, donor] of [
    ['install/index.html', '/'],
    ['fr/installation/index.html', '/fr/'],
    ['_print/index.html', '/'],
    ['fr/_print/index.html', '/fr/'],
  ]) {
    const h = r.publicFile(inner);
    assert.ok(!chrome.navbar(h), `navbar dropped on ${inner}`);
    assert.ok(!chrome.footer(h), `footer dropped on ${inner}`);
    assert.ok(
      chrome.placeholder(h, 'navbar', donor),
      `${inner} navbar placeholder names the root ${donor} as donor page`,
    );
    assert.ok(
      chrome.placeholder(h, 'footer', donor),
      `${inner} footer placeholder names the root ${donor} as donor page`,
    );
  }
});
