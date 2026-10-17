// Doc-rooted sites (docs section published at the site root, home link-only;
// recipe: docsy.dev/content/en/docs/content/adding-content.md § Doc-rooted
// sites) have no rendered home, so llms.txt must come from the page that
// publishes the root (docsy/docsy#2834). Also pins the all-sites consequences:
// the Markdown versions' per-language llms.txt link, the head's describedby
// link and its root-page gate, section-kind rendering, and a site's own
// index.llms.txt override.

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './lib/build-site.mjs';

const frontMatter = (fields) =>
  `---\n${Object.entries(fields)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')}\n---\n`;
const leaf = (title, { llmsLink = true } = {}) =>
  frontMatter({ title }) +
  (llmsLink
    ? 'Leaf page; see [{{% _root-llms-txt-path %}}](<{{% _root-llms-txt-path %}}>).\n'
    : 'Leaf page\n');
const linkOnlyHome = (fields) =>
  frontMatter({ ...fields, build: '{ render: link }' });
const describedbyLinks = (html) =>
  html.split('</head>')[0].match(/<link rel="describedby" [^>]*>/g) ?? [];

// en describes only the link-only home; fr describes both home and landing
// page.
const docRootedFiles = (
  docsOutputs = '[HTML, RSS, markdown, LLMS]',
  leafOptions = {},
) => ({
  'content/_index.md': linkOnlyHome({
    title: 'Home',
    description: 'Fixture docs, doc-rooted',
  }),
  'content/_index.fr.md': linkOnlyHome({
    title: 'Accueil',
    description: 'Accueil du site',
  }),
  'content/docs/_index.md':
    frontMatter({ title: 'Docs', outputs: docsOutputs }) + 'Docs landing\n',
  'content/docs/_index.fr.md':
    frontMatter({
      title: 'Documentation',
      description: 'Documentation en français',
      outputs: docsOutputs,
    }) + 'Accueil docs\n',
  'content/docs/guide/_index.md': frontMatter({ title: 'Guide' }) + 'Guide\n',
  'content/docs/install.md': leaf('Install', leafOptions),
  'content/docs/install.fr.md': leaf('Installation', leafOptions),
});

const docRootedConfig = `permalinks:
  page:
    docs: /:sections[1:]/:slug/
  section:
    docs: /:sections[1:]
outputs:
  home: [HTML, markdown, LLMS]
  page: [HTML, markdown]
  section: [HTML, RSS, markdown]
languages:
  en: { weight: 1, label: English }
  fr: { weight: 2, label: Français }
`;

function build(name, files, extraConfig) {
  const r = buildSite(name, {
    files,
    extraConfig,
    args: ['--printPathWarnings'],
  });
  assert.equal(
    r.status,
    0,
    `fixture hugo build succeeds:\n${r.stdout}${r.stderr}`,
  );
  assert.ok(
    !/WARN/.test(r.stdout + r.stderr),
    `build is warning-free:\n${r.stdout}${r.stderr}`,
  );
  return r;
}

// The enabled fixture is read-only across its tests: build it once.
let docRootedBuild;
const docRooted = () =>
  (docRootedBuild ??= build(
    'llms-doc-rooted',
    docRootedFiles(),
    docRootedConfig,
  ));

test('doc-rooted site publishes llms.txt at each language root', () => {
  const b = docRooted();
  const en = b.publicFile('llms.txt');
  assert.ok(
    en.startsWith('# llms-doc-rooted fixture\n'),
    'en llms.txt opens with the site title',
  );
  assert.ok(
    en.includes('- [Home page](https://example.org/index.md)'),
    'en llms.txt links the root Markdown version as the home page',
  );
  assert.ok(
    en.includes('- [Guide](https://example.org/guide/index.md)'),
    'en llms.txt lists the docs subsection at its root-level Markdown version',
  );
  const fr = b.publicFile('fr/llms.txt');
  assert.ok(
    fr.includes('- [Home page](https://example.org/fr/index.md)'),
    'fr llms.txt links the fr root Markdown version as the home page',
  );
  for (const [lang, content] of [
    ['en', en],
    ['fr', fr],
  ]) {
    assert.ok(
      content.includes('- [English](https://example.org/index.md)') &&
        content.includes('- [Français](https://example.org/fr/index.md)'),
      `${lang} llms.txt lists both locales by their root Markdown version`,
    );
  }
});

test('doc-rooted llms.txt description comes from the root page, else the home', () => {
  const b = docRooted();
  assert.ok(
    b.publicFile('llms.txt').includes('\n> Fixture docs, doc-rooted\n'),
    'en llms.txt quotes the link-only home description',
  );
  assert.ok(
    b.publicFile('fr/llms.txt').includes('\n> Documentation en français\n'),
    'fr llms.txt quotes the landing page description',
  );
  assert.doesNotMatch(
    b.publicFile('fr/llms.txt'),
    /Accueil du site/,
    'fr llms.txt leaves the home description aside',
  );
});

test('doc-rooted pages carry the directive and describedby link, pointing at their language llms.txt', () => {
  const b = docRooted();
  for (const [page, llms] of [
    ['index.html', '/llms.txt'],
    ['install/index.html', '/llms.txt'],
    ['404.html', '/llms.txt'],
    ['fr/index.html', '/fr/llms.txt'],
    ['fr/installation/index.html', '/fr/llms.txt'],
    ['fr/404.html', '/fr/llms.txt'],
  ]) {
    const html = b.publicFile(page);
    assert.ok(
      html.includes(`For AI agents: the site's llms.txt is at ${llms}`),
      `${page} directive points at ${llms}`,
    );
    assert.deepEqual(
      describedbyLinks(html),
      [`<link rel="describedby" href="https://example.org${llms}">`],
      `${page} head links ${llms} as describedby, once`,
    );
  }
});

test('the _root-llms-txt-path shortcode resolves per language on a doc-rooted site', () => {
  const b = docRooted();
  assert.ok(
    b
      .publicFile('install/index.html')
      .includes('<a href="/llms.txt">/llms.txt</a>'),
    'en page links /llms.txt by path',
  );
  assert.ok(
    b
      .publicFile('fr/installation/index.html')
      .includes('<a href="/fr/llms.txt">/fr/llms.txt</a>'),
    'fr page links /fr/llms.txt by path',
  );
});

test('doc-rooted Markdown versions link their language llms.txt', () => {
  const b = docRooted();
  assert.ok(
    b.publicFile('index.md').includes('Site [llms.txt](/llms.txt)'),
    'root Markdown version links /llms.txt',
  );
  assert.ok(
    b.publicFile('fr/index.md').includes('Site [llms.txt](/fr/llms.txt)'),
    'fr root Markdown version links /fr/llms.txt',
  );
});

test('doc-rooted theme home links point at the language root', () => {
  const b = docRooted();
  for (const [page, root] of [
    ['install/index.html', '/'],
    ['fr/index.html', '/fr/'],
  ]) {
    assert.ok(
      b.publicFile(page).includes(`class="navbar-brand" href="${root}"`),
      `${page} navbar brand links ${root}`,
    );
  }
});

// LLMS configured for the home, which publishes nothing.
test('doc-rooted site whose landing page lacks LLMS publishes no llms.txt, directive, or link', () => {
  const b = build(
    'llms-doc-rooted-off',
    docRootedFiles('[HTML, RSS, markdown]', { llmsLink: false }),
    docRootedConfig,
  );
  for (const llms of ['llms.txt', 'fr/llms.txt']) {
    assert.throws(() => b.publicFile(llms), `${llms} stays unpublished`);
  }
  const html = b.publicFile('install/index.html');
  assert.ok(html.includes('td-navbar'), 'page renders');
  assert.ok(!html.includes('For AI agents'), 'page omits the directive');
  assert.ok(
    !html.includes('rel="describedby"'),
    'page omits the describedby link',
  );
  const md = b.publicFile('index.md');
  assert.doesNotMatch(
    md,
    /llms\.txt/,
    'root Markdown version omits the llms.txt link',
  );
  assert.ok(
    md.startsWith('# Docs\n\nDocs landing\n\n---\n\nSection pages:'),
    'root Markdown version keeps its section separators without the link',
  );
});

test('site without llms.txt omits the Markdown llms.txt link', () => {
  const b = build(
    'llms-md-link-off',
    {
      'content/_index.md': frontMatter({ title: 'Home' }) + 'Home body\n',
      'content/docs/install.md':
        frontMatter({ title: 'Install' }) + 'Leaf page\n',
      'content/docs/described.md':
        frontMatter({ title: 'Described', description: 'A summary' }) +
        'Body\n',
      'content/docs/bare.md': frontMatter({ title: 'Bare' }),
    },
    'outputs:\n  home: [HTML, markdown]\n  page: [HTML, markdown]\n',
  );
  assert.equal(
    b.publicFile('docs/bare/index.md'),
    '# Bare\n',
    'title-only Markdown version ends with one newline',
  );
  const md = b.publicFile('docs/install/index.md');
  assert.doesNotMatch(
    md,
    /llms\.txt/,
    'Markdown version omits the llms.txt link',
  );
  assert.ok(
    md.startsWith('# Install\n\nLeaf page'),
    'title and content stay separated without the link',
  );
  assert.ok(
    b
      .publicFile('docs/described/index.md')
      .startsWith('# Described\n\n> A summary\n\n---\n\nBody'),
    'description and content stay separated without the link',
  );
});

test('the _root-llms-txt-path shortcode fails the build on a site without llms.txt', () => {
  const r = buildSite('llms-shortcode-no-llms', {
    files: {
      'content/_index.md': frontMatter({ title: 'Home' }) + 'Home body\n',
      'content/docs/install.md': leaf('Install'),
    },
    extraConfig: 'outputs:\n  home: [HTML, markdown]\n',
  });
  assert.notEqual(r.status, 0, 'build fails');
  assert.match(
    r.stderr,
    /install\.md.*shortcode "_root-llms-txt-path": this site publishes no llms\.txt/,
    'error names the page and the shortcode',
  );
});

const sectionKindFiles = (leafOptions = {}) => ({
  'content/_index.md':
    frontMatter({ title: 'Home', description: 'Site summary' }) + 'Home body\n',
  'content/docs/_index.md':
    frontMatter({ title: 'Docs', description: 'Docs summary' }) +
    'Docs landing\n',
  'content/docs/install.md': leaf('Install', leafOptions),
});

test('a section-kind llms.txt is the site overview, with the root page summary', () => {
  const b = build(
    'llms-section-kind',
    sectionKindFiles(),
    'outputs:\n  home: [HTML, markdown, LLMS]\n  section: [HTML, markdown, LLMS]\n',
  );
  const root = b.publicFile('llms.txt');
  const section = b.publicFile('docs/llms.txt');
  assert.ok(
    root.includes('\n> Site summary\n'),
    'root llms.txt quotes the home',
  );
  assert.equal(section, root, 'section llms.txt matches the root one');
  for (const page of ['docs/index.html', 'docs/install/index.html']) {
    assert.deepEqual(
      describedbyLinks(b.publicFile(page)),
      ['<link rel="describedby" href="https://example.org/llms.txt">'],
      `${page} head links only the root llms.txt as describedby`,
    );
  }
});

test('section-only LLMS publishes section llms.txt but no directive or describedby link', () => {
  const b = build(
    'llms-section-only',
    sectionKindFiles({ llmsLink: false }),
    'outputs:\n  home: [HTML, markdown]\n  section: [HTML, markdown, LLMS]\n',
  );
  assert.ok(
    b.publicFile('docs/llms.txt').startsWith('# llms-section-only fixture\n'),
    'section llms.txt is published',
  );
  for (const page of [
    'index.html',
    'docs/index.html',
    'docs/install/index.html',
  ]) {
    const html = b.publicFile(page);
    assert.ok(
      !html.includes('rel="describedby"'),
      `${page} omits the describedby link`,
    );
    assert.ok(!html.includes('For AI agents'), `${page} omits the directive`);
  }
});

test("a site's layouts/index.llms.txt override still renders the home's llms.txt", () => {
  const b = build(
    'llms-home-override',
    {
      'content/_index.md': frontMatter({ title: 'Home' }) + 'Home body\n',
      'content/docs/install.md':
        frontMatter({ title: 'Install' }) + 'Leaf page\n',
      'layouts/index.llms.txt': 'SITE OVERRIDE for {{ .Site.Title }}\n',
    },
    'outputs:\n  home: [HTML, markdown, LLMS]\n',
  );
  assert.ok(
    b.publicFile('llms.txt').startsWith('SITE OVERRIDE for'),
    'home llms.txt renders from the site override',
  );
});

test('a non-doc-rooted site with multiple pages named docs builds', () => {
  const r = build(
    'llms-ambiguous-docs',
    {
      'content/_index.md': frontMatter({ title: 'Home' }) + 'Home body\n',
      'content/a/docs/_index.md':
        frontMatter({ title: 'A docs' }) + 'A docs body\n',
      'content/b/docs.md':
        frontMatter({ title: 'B docs' }) + 'B docs body\n',
    },
    'outputs:\n  home: [HTML, LLMS]\n',
  );
  assert.equal(
    r.status,
    0,
    `fixture hugo build succeeds:\n${r.stdout}${r.stderr}`,
  );
  assert.doesNotMatch(
    r.publicFile('llms.txt'),
    /Documentation index/,
    'pages named docs outside the site root are not listed as documentation',
  );
});
