// Pins tab persistence as a theme plugin gated on the tabpane shortcode
// (`.HasShortcode`, in the plugin's shim; why:
// https://www.docsy.dev/project/design/script-loading/#gating-decisions).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './lib/build-site.mjs';

const tabs =
  '{{< tabpane text=true >}}\n' +
  '{{< tab header="One" >}}one{{< /tab >}}\n' +
  '{{< tab header="Two" >}}two{{< /tab >}}\n' +
  '{{< /tabpane >}}\n';
const page = (title, body) => `---\ntitle: ${title}\n---\n\n${body}`;

const files = {
  'content/_index.md': page('Home', 'Home body\n'),
  'content/docs/_index.md': page('Docs', 'Docs body\n'),
  'content/docs/_includes/tabs.md':
    '---\ntitle: Tabs snippet\nbuild: { render: never, list: never }\n---\n\n' +
    'INCLUDED-TABS\n\n' +
    tabs,
  'content/docs/direct.md': page('Direct', tabs),
  'content/docs/included.md': page(
    'Included',
    '{{% include "/docs/_includes/tabs" %}}\n',
  ),
  'content/docs/dotcontent.md': page(
    'DotContent',
    '{{< contentof "/docs/_includes/tabs" >}}\n',
  ),
  'content/docs/plain.md': page('Plain', 'No tabs here\n'),
  // opentelemetry.io's include, simplified: shortcode -> partial ->
  // `.RenderShortcodes | safeHTML`, called with `{{% %}}`.
  'layouts/_shortcodes/include.html':
    '{{ partial "include.html" (dict "path" (.Get 0)) -}}\n',
  'layouts/_partials/include.html':
    '{{ with site.GetPage .path }}{{ .RenderShortcodes | safeHTML }}' +
    '{{ else }}{{ errorf "include: %q not found" .path }}{{ end -}}\n',
  'layouts/_shortcodes/contentof.html':
    '{{ with site.GetPage (.Get 0) }}{{ .Content }}{{ end -}}\n',
};
const scriptRe = /<script[^>]*src="\/(js\/plugins\/tabpane-persist[^"]*\.js)"/;

test('tab persistence ships where the tabpane shortcode renders, .RenderShortcodes includes included', () => {
  const r = buildSite('tabpane-persist-default', {
    files,
    title: 'Docsy tab-persistence fixture',
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  for (const p of ['included', 'dotcontent']) {
    const html = r.publicFile(`docs/${p}/index.html`);
    assert.match(html, /INCLUDED-TABS/, `${p}: snippet rendered`);
    assert.match(html, /data-td-tp-persist/, `${p}: tabpane rendered`);
  }
  for (const p of ['direct', 'included']) {
    const m = r.publicFile(`docs/${p}/index.html`).match(scriptRe);
    assert.ok(m, `${p}: tab persistence ships, fingerprinted`);
    assert.match(
      r.publicFile(m[1]),
      /td-tp-persist/,
      `${p}: emitted plugin is the persistence script`,
    );
  }
  // `.Content` carries neither shortcode names nor Store flags: the same hole
  // hook-gated plugins have.
  for (const p of [
    'index.html',
    'docs/plain/index.html',
    'docs/dotcontent/index.html',
  ]) {
    assert.doesNotMatch(
      r.publicFile(p),
      scriptRe,
      `${p}: tab persistence does not ship`,
    );
  }
});

test('a project plugin shadows the theme plugin of the same name', () => {
  // Union FS: the project file must win.
  const r = buildSite('tabpane-persist-shadow', {
    files: {
      ...files,
      'assets/js/plugins/tabpane-persist.js':
        "console.log('project-shadow-wins');\n",
    },
    title: 'Docsy shadowing fixture',
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const html = r.publicFile('docs/direct/index.html');
  const m = html.match(scriptRe);
  assert.ok(m, 'tabpane-persist plugin script tag is emitted');
  const js = r.publicFile(m[1]);
  assert.match(
    js,
    /project-shadow-wins/,
    'project file shadows the theme plugin',
  );
  assert.doesNotMatch(
    js,
    /td-tp-persist/,
    'theme implementation is fully replaced',
  );
});

test('persist="disabled" tabs carry no persistence attributes', () => {
  const r = buildSite('tabpane-persist-optout', {
    files: {
      'content/_index.md': page('Home', 'Home body\n'),
      'content/docs/off.md': page(
        'Off',
        '{{< tabpane text=true persist="disabled" >}}\n' +
          '{{< tab header="One" >}}one{{< /tab >}}\n{{< /tabpane >}}\n',
      ),
    },
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.doesNotMatch(
    r.publicFile('docs/off/index.html'),
    /data-td-tp-persist/,
    'opted-out tabs carry no persistence attributes',
  );
});
