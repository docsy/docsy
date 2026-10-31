// Guards tabpane ID uniqueness and tab-to-pane wiring
// (theme/layouts/_shortcodes/tabpane.html, #2868).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './lib/build-site.mjs';

const tabs = (a, b) =>
  '{{< tabpane text=true >}}\n' +
  `{{% tab header="${a}" %}}${a}{{% /tab %}}\n` +
  `{{% tab header="${b}" %}}${b}{{% /tab %}}\n` +
  '{{< /tabpane >}}\n';

const alert = (inner) => `{{% alert title="Note" %}}\n${inner}{{% /alert %}}\n`;

// Content-adapter pages share the adapter's .File; two of them collide under
// a file-keyed ID scheme. The shortcode calls are assembled from pieces so the
// adapter's own template parser doesn't see them.
const adapter =
  '{{ $o := "{{" }}{{ $c := "}}" }}\n' +
  '{{ range slice "gen-a" "gen-b" }}\n' +
  '{{ $md := printf "---\\ntitle: %s\\n---\\n\\n%s< tabpane text=true >%s\\n%s%% tab header=\\"Gen 1\\" %%%sGen 1%s%% /tab %%%s\\n%s%% tab header=\\"Gen 2\\" %%%sGen 2%s%% /tab %%%s\\n%s< /tabpane >%s\\n" . $o $c $o $c $o $c $o $c $o $c $o $c }}\n' +
  '{{ $.AddPage (dict "path" . "title" . "content" (dict "mediaType" "text/markdown" "value" $md)) }}\n' +
  '{{ end }}\n';

const files = {
  'content/_index.md': '---\ntitle: Home\n---\nHome body\n',
  'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs body\n',
  'content/docs/_content.gotmpl': adapter,
  'content/docs/aaa.md': '---\ntitle: First\n---\n\n' + tabs('One', 'Two'),
  'content/docs/nested.md':
    '---\ntitle: Nested\n---\n\n' +
    tabs('Top A', 'Top B') +
    '\n' +
    alert(tabs('In A', 'In B')) +
    // Two tabpanes whose lineages differ only above the immediate parent.
    '\n' +
    alert(alert(tabs('Deep A', 'Deep B'))) +
    '\n' +
    alert(alert(tabs('Deeper A', 'Deeper B'))),
  'content/docs/zzz.md': '---\ntitle: Last\n---\n\n' + tabs('One', 'Two'),
};

const ids = (html) =>
  [...html.matchAll(/\bid="(tabs-[^"]+)"/g)].map((m) => m[1]);

// Tab buttons: id → target pane id.
const tabTargets = (html) =>
  new Map(
    [
      ...html.matchAll(
        /\bid="(tabs-[^"]+)"[^>]*\bdata-bs-target="#(tabs-[^"]+)"[^>]*\baria-controls="(tabs-[^"]+)"/g,
      ),
    ].map((m) => {
      assert.equal(m[3], m[2], `tab ${m[1]}: aria-controls names its target`);
      return [m[1], m[2]];
    }),
  );

// Panes: id → aria-labelledby.
const paneLabels = (html) =>
  new Map(
    [
      ...html.matchAll(
        /\bid="(tabs-[^"]+)"[^>]*\brole="tabpanel"[^>]*\baria-labelledby="(tabs-[^"]+)"/g,
      ),
    ].map((m) => [m[1], m[2]]),
  );

function assertUniqueWiring(html, where, tabCount) {
  const all = ids(html);
  const dupes = all.filter((id, i) => all.indexOf(id) !== i);
  assert.deepEqual(dupes, [], `${where}: tabpane IDs are unique`);
  const tabs = tabTargets(html);
  const panes = paneLabels(html);
  assert.equal(tabs.size, tabCount, `${where}: every tab carries a target`);
  assert.equal(panes.size, tabCount, `${where}: every pane carries a label`);
  for (const [tabId, paneId] of tabs) {
    assert.equal(
      panes.get(paneId),
      tabId,
      `${where}: pane ${paneId} is labelled by its tab`,
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
  // aaa, zzz, two adapter pages, four on nested: 8 tabpanes × 2 tabs.
  assertUniqueWiring(r.publicFile('_print/docs/index.html'), '_print/docs', 16);
});

test('tabpanes nested in other shortcodes get their own IDs', () => {
  const html = r.publicFile('docs/nested/index.html');
  assert.equal(ids(html).length, 24, 'four tabpanes emit six IDs each');
  assertUniqueWiring(html, 'docs/nested', 8);
});
