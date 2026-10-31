// Guards the tabpane ID scheme (theme/layouts/_shortcodes/tabpane.html):
// unique IDs across the pages a print page concatenates (#2868) and within a
// page that nests a tabpane in another shortcode.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './lib/build-site.mjs';

const tabs = (a, b) =>
  '{{< tabpane text=true persist=header >}}\n' +
  `{{% tab header="${a}" %}}${a}{{% /tab %}}\n` +
  `{{% tab header="${b}" %}}${b}{{% /tab %}}\n` +
  '{{< /tabpane >}}\n';

const files = {
  'content/_index.md': '---\ntitle: Home\n---\nHome body\n',
  'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs body\n',
  'content/docs/aaa.md': '---\ntitle: First\n---\n\n' + tabs('One', 'Two'),
  'content/docs/nested.md':
    '---\ntitle: Nested\n---\n\n' +
    tabs('Top A', 'Top B') +
    '\n{{% alert title="Note" %}}\n' +
    tabs('In A', 'In B') +
    '{{% /alert %}}\n',
  'content/docs/zzz.md': '---\ntitle: Last\n---\n\n' + tabs('One', 'Two'),
};

const ids = (html) =>
  [...html.matchAll(/\bid="(tabs-[^"]+)"/g)].map((m) => m[1]);
const targets = (html) =>
  [...html.matchAll(/data-bs-target="#(tabs-[^"]+)"/g)].map((m) => m[1]);

function assertUniqueWiring(html, where) {
  const all = ids(html);
  const dupes = all.filter((id, i) => all.indexOf(id) !== i);
  assert.deepEqual(dupes, [], `${where}: tabpane IDs are unique`);
  for (const t of targets(html)) {
    assert.equal(
      all.filter((id) => id === t).length,
      1,
      `${where}: tab target #${t} resolves to exactly one pane`,
    );
  }
}

const r = buildSite('tabpane-ids', {
  files,
  extraConfig:
    'outputs:\n  section: [HTML, print]\n' +
    // The {{% alert %}} wrapper emits HTML through Goldmark.
    'markup:\n  goldmark:\n    renderer:\n      unsafe: true\n',
});

test('fixture builds', () => {
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stdout}${r.stderr}`);
});

test('a print page concatenating tabpane pages has unique tabpane IDs', () => {
  const html = r.publicFile('_print/docs/index.html');
  assert.ok(ids(html).length >= 12, 'print page renders the fixture tabpanes');
  assertUniqueWiring(html, '_print/docs');
});

test('a tabpane nested in another shortcode gets its own IDs', () => {
  const html = r.publicFile('docs/nested/index.html');
  assert.equal(ids(html).length, 12, 'two tabpanes emit six IDs each');
  assertUniqueWiring(html, 'docs/nested');
});

test('panes are labelled by their tabs', () => {
  const html = r.publicFile('docs/aaa/index.html');
  const labels = [...html.matchAll(/aria-labelledby="(tabs-[^"]+)"/g)].map(
    (m) => m[1],
  );
  assert.equal(labels.length, 2, 'each pane carries aria-labelledby');
  for (const l of labels) {
    assert.ok(ids(html).includes(l), `aria-labelledby ${l} names a tab ID`);
  }
});
