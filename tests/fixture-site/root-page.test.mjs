// Cases: CCR-20 (doc-rooted donor page and its variants). See the CCR case registry in tests/fixture-site/README.md.
// The root-page lookup (_partials/td/root-page.html, all.llms.txt) on the
// shapes that defeat a by-name lookup (docsy/docsy#2875) and on the recipe's
// variants. Case inventory: docsy.dev/content/en/project/design/root-page.md

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCleanSite } from './lib/build-site.mjs';
import {
  chrome,
  describedbyLinks,
  docRootedConfig,
  docRootedHomes,
  frontMatter,
  llmsOutputs,
} from './lib/fixtures.mjs';

const page = (title, body = title, extra = {}) =>
  frontMatter({ title, ...extra }) + `${body}\n`;

const home = {
  'content/_index.md': page('Home', 'Home body', {
    description: 'Site summary',
  }),
  'content/guides/_index.md': page('Guides', 'Guides landing'),
};
// A nested section named docs, with a subsection of its own (what llms.txt's
// documentation index would list if it mistook it for the docs section).
const nestedDocsSection = {
  'content/guides/docs/_index.md': page('Guides docs', 'Nested'),
  'content/guides/docs/sub/_index.md': page('Sub'),
};
const oneNestedDocs = { ...home, ...nestedDocsSection };
// Plus a nested leaf named docs: two candidates, no `/docs` section.
const twoNestedDocs = {
  ...oneNestedDocs,
  'content/reference/_index.md': page('Reference'),
  'content/reference/docs.md': page('Reference docs', 'Leaf'),
};

test('a site with no /docs section and two pages named docs builds, rooted at the home', () => {
  const b = buildCleanSite('root-page-two-docs', {
    files: twoNestedDocs,
    extraConfig: llmsOutputs,
  });
  for (const rel of [
    'index.html',
    'guides/docs/index.html',
    'reference/docs/index.html',
    '404.html',
  ]) {
    const html = b.publicFile(rel);
    assert.deepEqual(
      describedbyLinks(html),
      ['<link rel="describedby" href="https://example.org/llms.txt">'],
      `${rel} head links the home's llms.txt as describedby, once`,
    );
    assert.ok(
      html.includes("For AI agents: the site's llms.txt is at /llms.txt"),
      `${rel} directive points at the home's llms.txt`,
    );
  }
  const llms = b.publicFile('llms.txt');
  assert.ok(llms.includes('\n> Site summary\n'), 'llms.txt quotes the home');
  assert.ok(
    !llms.includes('## Documentation index'),
    'llms.txt omits the documentation index without a /docs section',
  );
});

test('a single nested section named docs is left out of the docs section lookup', () => {
  const b = buildCleanSite('root-page-one-docs', {
    files: oneNestedDocs,
    extraConfig: llmsOutputs,
  });
  const llms = b.publicFile('llms.txt');
  assert.ok(
    !llms.includes('## Documentation index'),
    'llms.txt omits the documentation index without a /docs section',
  );
  assert.ok(
    !llms.includes('guides/docs/sub'),
    'llms.txt leaves the nested docs section unindexed',
  );
});

// Doc-rooted, bilingual, with the French docs section page left to Hugo's
// auto-created section (no _index.fr.md): its outputs come from the cascade.
const docRootedFiles = {
  ...docRootedHomes(),
  'content/docs/_index.md': page('Docs', 'Docs landing', {
    description: 'Docs summary',
  }),
  'content/docs/install.md': page('Install', 'Leaf'),
  'content/docs/install.fr.md': page('Installation', 'Feuille'),
};
const landingOutputs = `cascade:
  - target: { path: /docs }
    outputs: [HTML, RSS, markdown, LLMS]
`;

const buildDocRooted = (name, args = [], extraConfig = '') =>
  buildCleanSite(name, {
    files: docRootedFiles,
    extraConfig: docRootedConfig + llmsOutputs + landingOutputs + extraConfig,
    env: { HUGO_PARAMS_TD_CHROME: 'shared' },
    args,
  });

test("an auto-created docs section page is the root page of its language; the default language's subdirectory only moves the URLs", () => {
  const b = buildDocRooted(
    'root-page-auto-landing',
    [],
    'defaultContentLanguageInSubdir: true\n',
  );
  assert.ok(
    chrome.navbar(b.publicFile('en/index.html')),
    'default language under its subdirectory keeps its own root page as donor',
  );
  assert.deepEqual(
    describedbyLinks(b.publicFile('en/install/index.html')),
    ['<link rel="describedby" href="https://example.org/en/llms.txt">'],
    'default-language page head links its subdirectory llms.txt as describedby, once',
  );
  assert.ok(
    b
      .publicFile('fr/llms.txt')
      .startsWith('# root-page-auto-landing fixture\n'),
    'fr publishes llms.txt from the cascade outputs of its auto-created section page',
  );
  assert.deepEqual(
    describedbyLinks(b.publicFile('fr/installation/index.html')),
    ['<link rel="describedby" href="https://example.org/fr/llms.txt">'],
    'fr page head links the fr llms.txt as describedby, once',
  );
  assert.ok(
    chrome.navbar(b.publicFile('fr/index.html')),
    'fr auto-created section page is the chrome donor',
  );
});

// Permalinkable print with a lower weight than HTML renders first (design page
// § Why).
test('a permalinkable format rendered before HTML leaves the root page selection unchanged', () => {
  const b = buildCleanSite('root-page-print-first', {
    files: docRootedFiles,
    extraConfig:
      docRootedConfig +
      llmsOutputs +
      [
        'outputFormats:',
        '  print:',
        '    { baseName: index, mediaType: text/html, path: _print, permalinkable: true, weight: 5 }',
        'cascade:',
        '  - target: { path: /docs }',
        '    outputs: [HTML, RSS, markdown, LLMS, print]',
        '',
      ].join('\n'),
    env: { HUGO_PARAMS_TD_CHROME: 'shared' },
  });
  assert.deepEqual(
    describedbyLinks(b.publicFile('index.html')),
    ['<link rel="describedby" href="https://example.org/llms.txt">'],
    'root page head links its llms.txt as describedby, once',
  );
  assert.ok(
    chrome.navbar(b.publicFile('index.html')),
    'root page is the chrome donor',
  );
  assert.ok(
    chrome.placeholder(b.publicFile('_print/index.html'), 'navbar', '/'),
    'root print render names the root HTML render as donor',
  );
});

test('moving rel=canonical to the print format leaves the root page and its donor unchanged', () => {
  const b = buildCleanSite('root-page-rel-moved', {
    files: docRootedFiles,
    extraConfig:
      docRootedConfig +
      llmsOutputs +
      [
        'outputFormats:',
        '  html: { rel: alternate }',
        '  print:',
        '    { baseName: index, mediaType: text/html, path: _print, permalinkable: true, weight: 5, rel: canonical }',
        'cascade:',
        '  - target: { path: /docs }',
        '    outputs: [HTML, RSS, markdown, LLMS, print]',
        '',
      ].join('\n'),
    env: { HUGO_PARAMS_TD_CHROME: 'shared' },
  });
  assert.ok(
    chrome.navbar(b.publicFile('index.html')),
    'root page HTML render is the chrome donor',
  );
  assert.ok(
    chrome.placeholder(b.publicFile('_print/index.html'), 'navbar', '/'),
    'root print render names the root HTML render as donor',
  );
  assert.ok(
    chrome.placeholder(b.publicFile('install/index.html'), 'navbar', '/'),
    'inner page names the root HTML render as donor',
  );
  assert.ok(
    chrome.placeholder(b.publicFile('install/index.html'), 'footer', '/'),
    'inner page footer placeholder names the root HTML render as donor',
  );
  assert.match(
    b.publicFile('_print/index.html'),
    /data-canonical-path="\/"/,
    'root print render bakes the root HTML URL as its canonical path',
  );
  assert.deepEqual(
    describedbyLinks(b.publicFile('install/index.html')),
    ['<link rel="describedby" href="https://example.org/llms.txt">'],
    'page head links the root llms.txt as describedby, once',
  );
});

test('a doc-rooted home listing LLMS before HTML keeps the home as root page (documented limit)', () => {
  const b = buildCleanSite('root-page-home-llms-first', {
    files: docRootedFiles,
    extraConfig:
      docRootedConfig +
      llmsOutputs.replace(
        'home: [HTML, markdown, LLMS]',
        'home: [LLMS, HTML]',
      ) +
      landingOutputs,
    env: { HUGO_PARAMS_TD_CHROME: 'shared' },
  });
  assert.ok(
    b
      .publicFile('llms.txt')
      .includes('- [Home page](https://example.org/llms.txt)'),
    'llms.txt links the home page by its only URL, the LLMS one',
  );
  assert.ok(
    chrome.placeholder(b.publicFile('index.html'), 'navbar', ''),
    'docs section page HTML render carries a placeholder with an empty donor',
  );
});

test('uglyURLs leaves the root page selection and its donor unchanged', () => {
  const b = buildDocRooted('root-page-ugly-urls', [], 'uglyURLs: true\n');
  assert.ok(
    chrome.navbar(b.publicFile('index.html')),
    'root page HTML render is the chrome donor',
  );
  assert.ok(
    chrome.placeholder(b.publicFile('install.html'), 'navbar', '/index.html'),
    'inner page names the root HTML document as donor',
  );
  assert.deepEqual(
    describedbyLinks(b.publicFile('install.html')),
    ['<link rel="describedby" href="https://example.org/llms.txt">'],
    'page head links the root llms.txt as describedby, once',
  );
});

test('a baseURL subpath moves every root-page URL together', () => {
  const b = buildDocRooted('root-page-subpath', [
    '--baseURL',
    'https://example.org/sub/',
  ]);
  assert.deepEqual(
    describedbyLinks(b.publicFile('install/index.html')),
    ['<link rel="describedby" href="https://example.org/sub/llms.txt">'],
    'page head links the subpath llms.txt as describedby, once',
  );
  assert.ok(
    b
      .publicFile('llms.txt')
      .includes('- [Home page](https://example.org/sub/index.md)'),
    'llms.txt links the root Markdown version under the subpath',
  );
  assert.ok(
    chrome.placeholder(b.publicFile('install/index.html'), 'navbar', '/sub/'),
    'inner page names the subpath root as chrome donor',
  );
  assert.ok(
    chrome.navbar(b.publicFile('index.html')),
    'root page under the subpath is the chrome donor',
  );
});
