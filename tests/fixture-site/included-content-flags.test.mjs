// Pins where page flags land when content is reused, per flag kind (render
// hook vs shortcode) and reuse path (`.RenderShortcodes` vs `.Content`), and
// that `.HasShortcode` follows `.RenderShortcodes` (Hugo >= 0.123). The
// documented claims: https://www.docsy.dev/docs/content/plugins/#page-flags-in-included-content.
// One build per path: a page's Store is one object, so a second includer would
// muddy where a flag came from.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './lib/build-site.mjs';

const snippet =
  '---\ntitle: Snippet\nbuild: { render: never, list: never }\n---\n\n' +
  'SNIPPET-BODY\n\n' +
  '```markmap\n# root\n## leaf\n```\n\n' +
  '{{< flag >}}\n\n' +
  '{{< tabpane text=true >}}\n{{< tab header="One" >}}one{{< /tab >}}\n{{< /tabpane >}}\n';

const store = (who) =>
  `<span data-${who}-hasmarkmap="{{ .Store.Get "hasMarkmap" }}" ` +
  `data-${who}-hasflagshortcode="{{ .Store.Get "hasFlagShortcode" }}"></span>\n`;

const files = {
  'content/_index.md': '---\ntitle: Home\n---\nHome body\n',
  'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs body\n',
  'content/docs/snippet.md': snippet,
  // opentelemetry.io's include idiom; `{{% %}}` so the output parses as Markdown.
  'layouts/_shortcodes/include.html':
    '{{ with site.GetPage (.Get 0) }}{{ .RenderShortcodes }}{{ end }}',
  'layouts/_shortcodes/contentof.html':
    '{{ with site.GetPage (.Get 0) }}{{ .Content }}{{ end }}',
  // A shortcode-set flag (the shape tabpane had before 0.18).
  'layouts/_shortcodes/flag.html':
    '{{ .Page.Store.Set "hasFlagShortcode" true }}',
  // Offline: stub the autoloader fetch, as markmap-plugin.test.mjs does.
  'layouts/_partials/scripts/plugins/markmap.html':
    '<script data-vendor="markmap-autoloader"></script>\n',
  // Prints, after content rendered, the shipping page's Store and the
  // snippet's: where a flag the includer did not receive actually landed.
  'layouts/_partials/hooks/body-end.html':
    store('includer') +
    `{{ with site.GetPage "/docs/snippet" }}${store('snippet')}{{ end }}` +
    '<span data-includer-hasshortcode="{{ .HasShortcode "flag" }}"></span>\n',
};

const build = (name, includer) => {
  const r = buildSite(`included-content-flags-${name}`, {
    files: { ...files, 'content/docs/includer.md': includer },
    title: 'Docsy included-content flags fixture',
    extraConfig:
      'params:\n  docsy:\n    plugins:\n      markmap: { enable: true }\n',
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const html = r.publicFile('docs/includer/index.html');
  // Sanity: the snippet, its fence, and its tabpane actually rendered here.
  assert.match(html, /SNIPPET-BODY/, 'snippet body rendered on the includer');
  assert.match(html, /language-markmap/, 'markmap fence rendered');
  assert.match(html, /data-td-tp-persist/, 'tabpane rendered');
  return html;
};

const hasShortcode = (html) => {
  const m = html.match(/data-includer-hasshortcode="([^"]*)"/);
  assert.ok(m, 'includer HasShortcode is printed');
  return m[1] === 'true';
};

const storeOf = (html, who) => {
  const m = html.match(
    new RegExp(
      `data-${who}-hasmarkmap="([^"]*)" data-${who}-hasflagshortcode="([^"]*)"`,
    ),
  );
  assert.ok(m, `${who} Store is printed`);
  return { hasMarkmap: m[1] === 'true', hasFlagShortcode: m[2] === 'true' };
};

test('.RenderShortcodes: the hook flags the includer, the shortcode flags the snippet', () => {
  const html = build(
    'rendershortcodes',
    '---\ntitle: Includer\n---\n\n{{% include "/docs/snippet" %}}\n',
  );
  assert.deepEqual(
    storeOf(html, 'includer'),
    { hasMarkmap: true, hasFlagShortcode: false },
    'includer Store',
  );
  assert.deepEqual(
    storeOf(html, 'snippet'),
    { hasMarkmap: false, hasFlagShortcode: true },
    'snippet Store',
  );
  assert.match(
    html,
    /js\/plugins\/markmap/,
    'gated markmap plugin ships on the includer',
  );
  assert.equal(
    hasShortcode(html),
    true,
    'includer .HasShortcode sees the snippet shortcode',
  );
});

test('.Content: both flags land on the snippet, none on the includer', () => {
  const html = build(
    'dotcontent',
    '---\ntitle: Includer\n---\n\n{{< contentof "/docs/snippet" >}}\n',
  );
  assert.deepEqual(
    storeOf(html, 'includer'),
    { hasMarkmap: false, hasFlagShortcode: false },
    'includer Store',
  );
  assert.deepEqual(
    storeOf(html, 'snippet'),
    { hasMarkmap: true, hasFlagShortcode: true },
    'snippet Store',
  );
  assert.doesNotMatch(
    html,
    /js\/plugins\/markmap/,
    'gated markmap plugin does not ship on the includer',
  );
  assert.equal(
    hasShortcode(html),
    false,
    'includer .HasShortcode does not see the snippet shortcode',
  );
});
