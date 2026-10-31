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

const adapter =
  '{{ range slice "gen-a" "gen-b" }}\n' +
  '{{ $.AddPage (dict "path" . "title" "Generated" "content" (dict "mediaType" "text/markdown" "value" `' +
  tabs('Gen 1', 'Gen 2') +
  '`)) }}\n' +
  '{{ end }}\n';

const files = {
  'content/_index.md': '---\ntitle: Home\n---\nHome body\n',
  'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs body\n',
  'content/docs/_content.gotmpl': adapter,
  'content/docs/aaa.md':
    '---\ntitle: First\n---\n\n' +
    tabs('One', 'Two') +
    '\n' +
    tabs('Three', 'Four'),
  'content/docs/nested.md':
    '---\ntitle: Nested\n---\n\n' +
    tabs('Top A', 'Top B') +
    '\n' +
    alert(tabs('In A', 'In B') + '\n' + tabs('In C', 'In D')) +
    // Two tabpanes whose enclosing chains differ only at the outermost level.
    '\n' +
    alert(alert(alert(tabs('Deep A', 'Deep B')))) +
    '\n' +
    alert(alert(alert(tabs('Deeper A', 'Deeper B')))),
  'content/docs/zzz.md': '---\ntitle: Last\n---\n\n' + tabs('One', 'Two'),
  // Shared outer ancestor; only the intermediate shortcode's ordinal differs.
  'content/docs/tabs-in-tabs.md':
    '---\ntitle: Tabs in tabs\n---\n\n' +
    '{{< tabpane text=true >}}\n' +
    `{{% tab header="Linux" %}}\n${tabs('apt', 'dnf')}{{% /tab %}}\n` +
    `{{% tab header="macOS" %}}\n${tabs('brew', 'port')}{{% /tab %}}\n` +
    '{{< /tabpane >}}\n',
};

const ids = (html) =>
  [...html.matchAll(/ id="(tabs-[^"]+)"/g)].map((m) => m[1]);

const tabTargets = (html) =>
  new Map(
    [
      ...html.matchAll(
        / id="(tabs-[^"]+)"[^>]* data-bs-target="#(tabs-[^"]+)"[^>]* aria-controls="(tabs-[^"]+)"/g,
      ),
    ].map((m) => {
      assert.equal(m[3], m[2], `tab ${m[1]}: aria-controls names its target`);
      return [m[1], m[2]];
    }),
  );

const paneLabels = (html) =>
  new Map(
    [
      ...html.matchAll(
        / id="(tabs-[^"]+)"[^>]* role="tabpanel"[^>]* aria-labelledby="(tabs-[^"]+)"/g,
      ),
    ].map((m) => [m[1], m[2]]),
  );

function assertUniqueWiring(html, where, tabCount) {
  const all = ids(html);
  const dupes = all.filter((id, i) => all.indexOf(id) !== i);
  assert.deepEqual(dupes, [], `${where}: tabpane IDs are unique`);
  const targets = tabTargets(html);
  const panes = paneLabels(html);
  assert.equal(
    targets.size,
    tabCount,
    `${where}: every tab carries a target and aria-controls`,
  );
  assert.equal(panes.size, tabCount, `${where}: every pane carries a label`);
  for (const [tabId, paneId] of targets) {
    assert.equal(
      panes.get(paneId),
      tabId,
      `${where}: pane ${paneId} is labelled by its tab`,
    );
  }
  const panels = [...html.matchAll(/<[^>]* role="tabpanel"[^>]*>/g)];
  assert.equal(panels.length, tabCount, `${where}: every pane is checked`);
  for (const [tag] of panels) {
    assert.match(tag, / tabindex="0"[ >]/, `${where}: pane has tabindex="0"`);
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
  assert.doesNotMatch(r.stdout + r.stderr, /WARN/, 'build emits no warning');
});

test('a print page concatenating tabpane pages has unique tabpane IDs', () => {
  // aaa 2, zzz 1, adapters 2, nested 5, tabs-in-tabs 3: 13 tabpanes × 2 tabs.
  assertUniqueWiring(r.publicFile('_print/docs/index.html'), '_print/docs', 26);
});

test('tabpanes nested in other shortcodes get their own IDs', () => {
  const html = r.publicFile('docs/nested/index.html');
  assertUniqueWiring(html, 'docs/nested', 10);
});

test('tabpanes inside the tabs of a tabpane get their own IDs', () => {
  assertUniqueWiring(
    r.publicFile('docs/tabs-in-tabs/index.html'),
    'docs/tabs-in-tabs',
    6,
  );
});
