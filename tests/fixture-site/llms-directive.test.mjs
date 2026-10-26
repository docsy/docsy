// Pins the llms-directive partial's contract (rationale and gating in
// theme/layouts/_partials/llms-directive.html): two fixture builds cover both
// gate sides; the enabled build also pins position (ahead of the navbar) and
// the per-page Markdown pointer. The head's rel="describedby" link shares that
// gate and is pinned alongside.

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './lib/build-site.mjs';
import { describedbyLinks, llmsOutputs } from './lib/fixtures.mjs';

const files = {
  'content/_index.md': '---\ntitle: Home\n---\nHome body\n',
  'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs landing\n',
  'content/docs/install.md': '---\ntitle: Install\n---\nLeaf page\n',
  'content/blog/_index.md': '---\ntitle: Blog\n---\nBlog landing\n',
  'content/blog/first.md':
    '---\ntitle: First\ndate: 2026-08-01\n---\nPost body\n',
  'content/docs/html-only.md':
    '---\ntitle: HTML only\noutputs: [HTML]\n---\nNo markdown output\n',
};

function build(name, extraConfig) {
  const r = buildSite(name, { files, extraConfig });
  assert.equal(
    r.status,
    0,
    `fixture hugo build succeeds:\n${r.stdout}${r.stderr}`,
  );
  return r;
}

test('llms.txt-enabled site carries the directive on every page kind', () => {
  const b = build('llms-directive-on', llmsOutputs);
  for (const page of [
    'index.html',
    'docs/index.html',
    'docs/install/index.html',
    'blog/first/index.html',
  ]) {
    const html = b.publicFile(page);
    const at = html.search(
      /<div class="visually-hidden" aria-hidden="true" data-pagefind-ignore>\s*For AI agents: the site's llms\.txt is at \/llms\.txt\./,
    );
    assert.ok(at > 0, `hidden directive is present in ${page}`);
    const nav = html.indexOf('td-navbar');
    assert.ok(at < nav, `directive precedes the navbar in ${page}`);
  }
});

test('llms.txt-enabled site links its llms.txt as rel="describedby" in every page head', () => {
  const b = build('llms-directive-on', llmsOutputs);
  const link = '<link rel="describedby" href="https://example.org/llms.txt">';
  for (const page of [
    'index.html',
    'docs/index.html',
    'docs/install/index.html',
    'docs/html-only/index.html',
    'blog/first/index.html',
    '404.html',
  ]) {
    assert.deepEqual(
      describedbyLinks(b.publicFile(page)),
      [link],
      `${page} head links llms.txt, once`,
    );
  }
});

test('directive names the page Markdown alternate when one exists', () => {
  const b = build('llms-directive-on', llmsOutputs);
  assert.ok(
    b
      .publicFile('docs/install/index.html')
      .includes('This page has a Markdown version at /docs/install/index.md'),
    'leaf page directive links its Markdown version',
  );
  const htmlOnly = b.publicFile('docs/html-only/index.html');
  assert.ok(
    htmlOnly.includes('For AI agents'),
    'HTML-only page still carries the directive',
  );
  assert.ok(
    !htmlOnly.includes('Markdown version at'),
    'HTML-only page directive omits the Markdown pointer',
  );
});

test('site without llms.txt emits no directive or describedby link', () => {
  const b = build('llms-directive-off');
  for (const page of ['index.html', 'docs/install/index.html']) {
    const html = b.publicFile(page);
    assert.ok(!html.includes('For AI agents'), `${page} omits the directive`);
    assert.ok(
      !html.includes('rel="describedby"'),
      `${page} omits the describedby link`,
    );
  }
});
